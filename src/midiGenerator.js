/**
 * Generador de MIDI desde estructura musical
 * 
 * Aquí es donde la música cobra vida digital.
 * Convertimos las notas abstractas en eventos MIDI reales
 * que cualquier instrumento digital puede interpretar.
 */

const MidiWriter = require('midi-writer-js');

class MidiGenerator {
    constructor() {
        // Mapeo de duraciones ABC a ticks MIDI
        this.durationToTicks = {
            0.25: 'T32',  // semicorchea
            0.5: 'T16',   // corchea
            1: 'T8',      // negra
            2: 'T4',      // blanca
            4: 'T2',      // redonda
            8: 'T1'       // redonda doble
        };
        
        // Canales MIDI por instrumento
        this.instruments = {
            'piano': 0,
            'violin': 40,
            'flute': 73,
            'guitar': 24,
            'bass': 32
        };
    }

    /**
     * Genera un archivo MIDI desde la estructura musical parseada
     * @param {Object} parsedMusic - Estructura musical del parser
     * @returns {Buffer} - Archivo MIDI como buffer
     */
    generate(parsedMusic) {
        const { header, body } = parsedMusic;
        
        // Crear track principal
        const track = new MidiWriter.Track();
        
        // Configurar tempo
        track.setTempo(header.tempo || 120);
        
        // Configurar instrumento (piano por defecto)
        track.addEvent(new MidiWriter.ProgramChangeEvent({
            instrument: this.instruments.piano
        }));
        
        // Convertir notas a eventos MIDI
        const midiEvents = this.convertNotesToEvents(body, header);
        
        // Añadir eventos al track
        midiEvents.forEach(event => {
            track.addEvent(event);
        });
        
        // Crear el archivo MIDI
        const writer = new MidiWriter.Writer(track);
        return Buffer.from(writer.buildFile(), 'binary');
    }

    /**
     * Convierte las notas parseadas en eventos MIDI
     */
    convertNotesToEvents(notes, header) {
        const events = [];
        let currentTime = 0;
        
        notes.forEach(note => {
            // Crear evento de nota
            const noteEvent = new MidiWriter.NoteEvent({
                pitch: this.midiNoteToPitch(note.midiNote),
                duration: this.durationToTicks[note.duration] || 'T8',
                velocity: 100,
                channel: 0
            });
            
            events.push(noteEvent);
            
            // Actualizar tiempo
            currentTime += this.durationToTicks[note.duration] || 'T8';
        });
        
        return events;
    }

    /**
     * Convierte nota MIDI a formato de pitch para MidiWriter
     */
    midiNoteToPitch(midiNote) {
        const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const octave = Math.floor(midiNote / 12) - 1;
        const noteIndex = midiNote % 12;
        return noteNames[noteIndex] + octave;
    }

    /**
     * Genera MIDI con múltiples pistas (para diferentes instrumentos)
     */
    generateMultiTrack(parsedMusic, instruments = ['piano']) {
        const tracks = [];
        
        instruments.forEach((instrument, index) => {
            const track = new MidiWriter.Track();
            
            // Configurar instrumento
            track.addEvent(new MidiWriter.ProgramChangeEvent({
                instrument: this.instruments[instrument] || 0
            }));
            
            // Añadir notas (aquí podrías dividir las notas entre pistas)
            const midiEvents = this.convertNotesToEvents(parsedMusic.body, parsedMusic.header);
            midiEvents.forEach(event => {
                track.addEvent(event);
            });
            
            tracks.push(track);
        });
        
        const writer = new MidiWriter.Writer(tracks);
        return Buffer.from(writer.buildFile(), 'binary');
    }

    /**
     * Añade efectos MIDI (sustain, vibrato, etc.)
     */
    addEffects(track, effects = {}) {
        if (effects.sustain) {
            track.addEvent(new MidiWriter.ControllerChangeEvent({
                controller: 64, // Sustain pedal
                value: 127
            }));
        }
        
        if (effects.vibrato) {
            track.addEvent(new MidiWriter.ControllerChangeEvent({
                controller: 1, // Modulation wheel
                value: 64
            }));
        }
    }

    /**
     * Genera un archivo MIDI con metadatos
     */
    generateWithMetadata(parsedMusic, metadata = {}) {
        const track = new MidiWriter.Track();
        
        // Añadir metadatos si están disponibles
        if (metadata.title) {
            track.addEvent(new MidiWriter.TextEvent({
                text: metadata.title
            }));
        }
        
        if (metadata.composer) {
            track.addEvent(new MidiWriter.TextEvent({
                text: metadata.composer
            }));
        }
        
        // Continuar con la generación normal
        track.setTempo(parsedMusic.header.tempo || 120);
        track.addEvent(new MidiWriter.ProgramChangeEvent({
            instrument: this.instruments.piano
        }));
        
        const midiEvents = this.convertNotesToEvents(parsedMusic.body, parsedMusic.header);
        midiEvents.forEach(event => {
            track.addEvent(event);
        });
        
        const writer = new MidiWriter.Writer(track);
        return Buffer.from(writer.buildFile(), 'binary');
    }

    /**
     * Valida que las notas MIDI estén en rango válido
     */
    validateMidiNotes(notes) {
        const errors = [];
        
        notes.forEach((note, index) => {
            if (note.midiNote < 0 || note.midiNote > 127) {
                errors.push(`Nota ${index + 1}: MIDI note ${note.midiNote} fuera de rango (0-127)`);
            }
            
            if (note.duration <= 0) {
                errors.push(`Nota ${index + 1}: Duración inválida ${note.duration}`);
            }
        });
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Optimiza el archivo MIDI para mejor compatibilidad
     */
    optimizeMidi(midiBuffer) {
        // Aquí podrías implementar optimizaciones como:
        // - Eliminar eventos duplicados
        // - Ajustar timing para mejor precisión
        // - Comprimir datos
        return midiBuffer;
    }
}

module.exports = MidiGenerator; 