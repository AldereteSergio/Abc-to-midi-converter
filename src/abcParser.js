/**
 * Parser de notación ABC a estructura musical
 * 
 * La notación ABC es como el "código fuente" de la música.
 * Cada símbolo tiene un significado preciso que podemos interpretar
 * para reconstruir la música original.
 */

class ABCParser {
    constructor() {
        // Mapeo de notas a frecuencias MIDI (C4 = 60)
        this.noteToMidi = {
            'C': 60, 'D': 62, 'E': 64, 'F': 65, 'G': 67, 'A': 69, 'B': 71,
            'c': 72, 'd': 74, 'e': 76, 'f': 77, 'g': 79, 'a': 81, 'b': 83
        };
        
        // Accidentes
        this.accidentals = {
            '^': 1,  // sostenido
            '_': -1, // bemol
            '=': 0   // becuadro
        };
        
        // Valores de duración (fracciones de compás)
        this.durations = {
            '1': 4,    // redonda
            '2': 2,    // blanca
            '4': 1,    // negra
            '8': 0.5,  // corchea
            '16': 0.25 // semicorchea
        };
    }

    /**
     * Parsea una cadena ABC completa
     * @param {string} abcString - La notación ABC
     * @returns {Object} - Estructura musical parseada
     */
    parse(abcString) {
        const lines = abcString.trim().split('\n');
        const header = this.parseHeader(lines);
        const body = this.parseBody(lines.slice(header.lineCount));
        
        return {
            header,
            body,
            metadata: this.extractMetadata(abcString)
        };
    }

    /**
     * Extrae metadatos del header ABC
     */
    parseHeader(lines) {
        const header = {
            title: 'Untitled',
            key: 'C',
            meter: '4/4',
            tempo: 120,
            lineCount: 0
        };

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            if (line.startsWith('X:')) {
                header.number = parseInt(line.substring(2));
            } else if (line.startsWith('T:')) {
                header.title = line.substring(2);
            } else if (line.startsWith('K:')) {
                header.key = line.substring(2);
            } else if (line.startsWith('M:')) {
                header.meter = line.substring(2);
            } else if (line.startsWith('Q:')) {
                const tempo = line.substring(2);
                header.tempo = this.parseTempo(tempo);
            } else if (line.startsWith('L:')) {
                header.defaultLength = line.substring(2);
            } else if (line === '' || line.startsWith('V:') || line.startsWith('I:')) {
                // Continuar con el siguiente campo
                continue;
            } else {
                // Fin del header
                header.lineCount = i;
                break;
            }
        }

        return header;
    }

    /**
     * Parsea el cuerpo de la música (las notas)
     */
    parseBody(lines) {
        const notes = [];
        let currentOctave = 4;
        let currentAccidental = 0;
        
        const bodyText = lines.join(' ');
        
        // Expresión regular para capturar notas, duraciones y otros elementos
        const notePattern = /([A-Ga-g])([^,']*)([,']*)(\d*)/g;
        let match;
        
        while ((match = notePattern.exec(bodyText)) !== null) {
            const [, note, accidental, octave, duration] = match;
            
            // Procesar accidental
            let semitoneOffset = 0;
            if (accidental.includes('^')) semitoneOffset += 1;
            if (accidental.includes('_')) semitoneOffset -= 1;
            if (accidental.includes('=')) semitoneOffset = 0;
            
            // Procesar octava
            let octaveOffset = 0;
            if (octave.includes("'")) octaveOffset += octave.split("'").length - 1;
            if (octave.includes(',')) octaveOffset -= octave.split(',').length - 1;
            
            // Calcular nota MIDI
            const baseNote = this.noteToMidi[note] || 60;
            const midiNote = baseNote + semitoneOffset + (octaveOffset * 12);
            
            // Calcular duración
            const noteDuration = duration ? parseFloat(duration) : 1;
            
            notes.push({
                note: note.toUpperCase(),
                midiNote,
                duration: noteDuration,
                accidental: accidental,
                octave: currentOctave + octaveOffset
            });
        }
        
        return notes;
    }

    /**
     * Extrae metadatos adicionales
     */
    extractMetadata(abcString) {
        const metadata = {};
        
        // Buscar comentarios
        const comments = abcString.match(/%.*$/gm) || [];
        metadata.comments = comments.map(c => c.substring(1).trim());
        
        // Buscar información de compás
        const barLines = (abcString.match(/\|/g) || []).length;
        metadata.barCount = barLines;
        
        return metadata;
    }

    /**
     * Convierte tempo ABC a BPM
     */
    parseTempo(tempoString) {
        // Formato común: "1/4=120"
        const match = tempoString.match(/(\d+)\/(\d+)=(\d+)/);
        if (match) {
            return parseInt(match[3]);
        }
        
        // Solo número
        const num = parseInt(tempoString);
        return isNaN(num) ? 120 : num;
    }

    /**
     * Valida la sintaxis ABC
     */
    validate(abcString) {
        const errors = [];
        
        // Verificar que hay contenido
        if (!abcString || abcString.trim().length === 0) {
            errors.push('La notación ABC no puede estar vacía');
            return {
                isValid: false,
                errors
            };
        }
        
        // Verificar que hay al menos una nota
        const hasNotes = /[A-Ga-g]/.test(abcString);
        if (!hasNotes) {
            errors.push('No se encontraron notas válidas (A-G, a-g)');
        }
        
        // Verificar estructura básica (opcional)
        if (!abcString.includes('K:')) {
            errors.push('Falta la clave (K:)');
        }
        
        if (!abcString.includes('M:')) {
            errors.push('Falta el compás (M:)');
        }
        
        // Solo validar caracteres en la sección de notas (después del header)
        const lines = abcString.split('\n');
        const noteSection = lines.filter(line => 
            !line.startsWith('X:') && 
            !line.startsWith('T:') && 
            !line.startsWith('C:') && 
            !line.startsWith('M:') && 
            !line.startsWith('L:') && 
            !line.startsWith('K:') && 
            !line.startsWith('Q:') &&
            line.trim() !== ''
        ).join(' ');
        
        if (noteSection) {
            const invalidChars = noteSection.match(/[^A-Ga-g\s,.'^_=\d|\[\](){}]/g);
            if (invalidChars) {
                const uniqueInvalidChars = [...new Set(invalidChars)];
                errors.push(`Caracteres inválidos en las notas: ${uniqueInvalidChars.join(', ')}`);
            }
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }
}

module.exports = ABCParser; 