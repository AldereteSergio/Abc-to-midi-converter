/**
 * Convertidor ABC a MIDI - El corazón del sistema
 * 
 * Esta clase orquesta todo el proceso de conversión:
 * 1. Parsea la notación ABC
 * 2. Valida la estructura musical
 * 3. Genera el archivo MIDI
 * 4. Proporciona feedback detallado
 */

const ABCParser = require('./abcParser');
const MidiGenerator = require('./midiGenerator');

class ABCToMidiConverter {
    constructor() {
        this.parser = new ABCParser();
        this.generator = new MidiGenerator();
        this.conversionHistory = [];
    }

    /**
     * Convierte notación ABC a archivo MIDI
     * @param {string} abcString - La notación ABC
     * @param {Object} options - Opciones de conversión
     * @returns {Object} - Resultado de la conversión
     */
    convert(abcString, options = {}) {
        const startTime = Date.now();
        
        try {
            // Paso 1: Validar entrada
            const validation = this.validateInput(abcString);
            if (!validation.isValid) {
                return {
                    success: false,
                    error: 'Entrada inválida',
                    details: validation.errors,
                    timestamp: new Date().toISOString()
                };
            }

            // Paso 2: Parsear ABC
            const parsedMusic = this.parser.parse(abcString);
            
            // Paso 3: Validar estructura musical
            const musicValidation = this.validateMusicStructure(parsedMusic);
            if (!musicValidation.isValid) {
                return {
                    success: false,
                    error: 'Estructura musical inválida',
                    details: musicValidation.errors,
                    timestamp: new Date().toISOString()
                };
            }

            // Paso 4: Generar MIDI
            const midiBuffer = this.generator.generate(parsedMusic);
            
            // Paso 5: Optimizar si es necesario
            const optimizedMidi = options.optimize ? 
                this.generator.optimizeMidi(midiBuffer) : midiBuffer;

            // Paso 6: Registrar conversión exitosa
            const conversionResult = {
                success: true,
                midiBuffer: optimizedMidi,
                metadata: {
                    title: parsedMusic.header.title,
                    key: parsedMusic.header.key,
                    tempo: parsedMusic.header.tempo,
                    meter: parsedMusic.header.meter,
                    noteCount: parsedMusic.body.length,
                    duration: Date.now() - startTime
                },
                timestamp: new Date().toISOString()
            };

            this.conversionHistory.push(conversionResult);
            return conversionResult;

        } catch (error) {
            return {
                success: false,
                error: 'Error durante la conversión',
                details: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Convierte con múltiples instrumentos
     */
    convertMultiTrack(abcString, instruments = ['piano'], options = {}) {
        const parsedMusic = this.parser.parse(abcString);
        const midiBuffer = this.generator.generateMultiTrack(parsedMusic, instruments);
        
        return {
            success: true,
            midiBuffer,
            metadata: {
                instruments,
                trackCount: instruments.length,
                ...parsedMusic.header
            }
        };
    }

    /**
     * Convierte con efectos MIDI
     */
    convertWithEffects(abcString, effects = {}, options = {}) {
        const parsedMusic = this.parser.parse(abcString);
        const track = new (require('midi-writer-js')).Track();
        
        // Aplicar efectos
        this.generator.addEffects(track, effects);
        
        const midiBuffer = this.generator.generate(parsedMusic);
        
        return {
            success: true,
            midiBuffer,
            metadata: {
                effects,
                ...parsedMusic.header
            }
        };
    }

    /**
     * Valida la entrada ABC
     */
    validateInput(abcString) {
        if (!abcString || typeof abcString !== 'string') {
            return {
                isValid: false,
                errors: ['La entrada debe ser una cadena de texto válida']
            };
        }

        if (abcString.trim().length === 0) {
            return {
                isValid: false,
                errors: ['La entrada no puede estar vacía']
            };
        }

        // Validar sintaxis ABC básica
        const abcValidation = this.parser.validate(abcString);
        return abcValidation;
    }

    /**
     * Valida la estructura musical parseada
     */
    validateMusicStructure(parsedMusic) {
        const errors = [];

        // Verificar que tenemos header y body
        if (!parsedMusic.header) {
            errors.push('Falta el header de la música');
        }

        if (!parsedMusic.body || !Array.isArray(parsedMusic.body)) {
            errors.push('Falta el cuerpo de la música o no es válido');
        }

        // Verificar que tenemos al menos una nota
        if (parsedMusic.body && parsedMusic.body.length === 0) {
            errors.push('No se encontraron notas en la música');
        }

        // Validar notas MIDI
        if (parsedMusic.body && parsedMusic.body.length > 0) {
            const midiValidation = this.generator.validateMidiNotes(parsedMusic.body);
            if (!midiValidation.isValid) {
                errors.push(...midiValidation.errors);
            }
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Obtiene estadísticas de conversión
     */
    getConversionStats() {
        const total = this.conversionHistory.length;
        const successful = this.conversionHistory.filter(c => c.success).length;
        const failed = total - successful;
        
        const avgDuration = this.conversionHistory.length > 0 ?
            this.conversionHistory.reduce((sum, c) => sum + (c.metadata?.duration || 0), 0) / total : 0;

        return {
            totalConversions: total,
            successfulConversions: successful,
            failedConversions: failed,
            successRate: total > 0 ? (successful / total) * 100 : 0,
            averageDuration: avgDuration,
            lastConversion: this.conversionHistory[this.conversionHistory.length - 1]
        };
    }

    /**
     * Limpia el historial de conversiones
     */
    clearHistory() {
        this.conversionHistory = [];
    }

    /**
     * Exporta el historial de conversiones
     */
    exportHistory() {
        return JSON.stringify(this.conversionHistory, null, 2);
    }

    /**
     * Obtiene información detallada sobre una conversión
     */
    getConversionDetails(conversionIndex) {
        if (conversionIndex >= 0 && conversionIndex < this.conversionHistory.length) {
            return this.conversionHistory[conversionIndex];
        }
        return null;
    }

    /**
     * Convierte un archivo ABC desde una ruta
     */
    async convertFromFile(filePath) {
        try {
            const fs = require('fs').promises;
            const abcString = await fs.readFile(filePath, 'utf8');
            return this.convert(abcString);
        } catch (error) {
            return {
                success: false,
                error: 'Error al leer el archivo',
                details: error.message
            };
        }
    }

    /**
     * Guarda el MIDI generado en un archivo
     */
    async saveMidiToFile(midiBuffer, filePath) {
        try {
            const fs = require('fs').promises;
            await fs.writeFile(filePath, midiBuffer);
            return {
                success: true,
                filePath
            };
        } catch (error) {
            return {
                success: false,
                error: 'Error al guardar el archivo MIDI',
                details: error.message
            };
        }
    }
}

module.exports = ABCToMidiConverter; 