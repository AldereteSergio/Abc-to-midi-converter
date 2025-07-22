/**
 * Servidor web para el convertidor ABC a MIDI
 * 
 * Proporciona una API REST elegante y una interfaz web moderna
 * para convertir notación ABC a archivos MIDI.
 */

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const ABCToMidiConverter = require('./converter');

class ABCToMidiServer {
    constructor(port = 3000) {
        this.app = express();
        this.port = port;
        this.converter = new ABCToMidiConverter();
        this.uploadDir = path.join(__dirname, '../uploads');
        this.downloadDir = path.join(__dirname, '../downloads');
        
        this.setupMiddleware();
        this.setupRoutes();
        this.ensureDirectories();
    }

    /**
     * Configura middleware de Express
     */
    setupMiddleware() {
        // CORS para permitir peticiones desde el frontend
        this.app.use(cors());
        
        // Parsear JSON
        this.app.use(express.json({ limit: '10mb' }));
        
        // Parsear formularios
        this.app.use(express.urlencoded({ extended: true }));
        
        // Servir archivos estáticos
        this.app.use(express.static(path.join(__dirname, '../public')));
        
        // Logging de peticiones
        this.app.use((req, res, next) => {
            console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
            next();
        });
    }

    /**
     * Configura las rutas de la API
     */
    setupRoutes() {
        // Ruta principal - interfaz web
        this.app.get('/', (req, res) => {
            res.sendFile(path.join(__dirname, '../public/index.html'));
        });

        // API: Convertir ABC a MIDI
        this.app.post('/api/convert', async (req, res) => {
            try {
                const { abcString, options = {} } = req.body;
                
                if (!abcString) {
                    return res.status(400).json({
                        success: false,
                        error: 'Se requiere notación ABC'
                    });
                }

                const result = this.converter.convert(abcString, options);
                
                if (result.success) {
                    // Convertir buffer a base64 para enviar por JSON
                    result.midiBase64 = result.midiBuffer.toString('base64');
                    delete result.midiBuffer; // No enviar el buffer completo
                }

                res.json(result);
                
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: 'Error interno del servidor',
                    details: error.message
                });
            }
        });

        // API: Convertir con múltiples instrumentos
        this.app.post('/api/convert-multitrack', async (req, res) => {
            try {
                const { abcString, instruments = ['piano'], options = {} } = req.body;
                
                const result = this.converter.convertMultiTrack(abcString, instruments, options);
                
                if (result.success) {
                    result.midiBase64 = result.midiBuffer.toString('base64');
                    delete result.midiBuffer;
                }

                res.json(result);
                
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: 'Error en conversión multitrack',
                    details: error.message
                });
            }
        });

        // API: Convertir con efectos
        this.app.post('/api/convert-with-effects', async (req, res) => {
            try {
                const { abcString, effects = {}, options = {} } = req.body;
                
                const result = this.converter.convertWithEffects(abcString, effects, options);
                
                if (result.success) {
                    result.midiBase64 = result.midiBuffer.toString('base64');
                    delete result.midiBuffer;
                }

                res.json(result);
                
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: 'Error en conversión con efectos',
                    details: error.message
                });
            }
        });

        // API: Descargar archivo MIDI
        this.app.post('/api/download', async (req, res) => {
            try {
                const { midiBase64, filename = 'music.mid' } = req.body;
                
                if (!midiBase64) {
                    return res.status(400).json({
                        success: false,
                        error: 'Se requiere archivo MIDI'
                    });
                }

                const midiBuffer = Buffer.from(midiBase64, 'base64');
                const filePath = path.join(this.downloadDir, filename);
                
                await fs.writeFile(filePath, midiBuffer);
                
                res.json({
                    success: true,
                    downloadUrl: `/downloads/${filename}`,
                    filePath
                });
                
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: 'Error al guardar archivo',
                    details: error.message
                });
            }
        });

        // API: Subir archivo ABC
        this.app.post('/api/upload', multer({ 
            dest: this.uploadDir,
            fileFilter: (req, file, cb) => {
                if (file.mimetype === 'text/plain' || file.originalname.endsWith('.abc')) {
                    cb(null, true);
                } else {
                    cb(new Error('Solo se permiten archivos .abc o .txt'));
                }
            }
        }).single('file'), async (req, res) => {
            try {
                if (!req.file) {
                    return res.status(400).json({
                        success: false,
                        error: 'No se subió ningún archivo'
                    });
                }

                const abcString = await fs.readFile(req.file.path, 'utf8');
                const result = this.converter.convert(abcString);
                
                // Limpiar archivo temporal
                await fs.unlink(req.file.path);
                
                if (result.success) {
                    result.midiBase64 = result.midiBuffer.toString('base64');
                    delete result.midiBuffer;
                }

                res.json(result);
                
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: 'Error al procesar archivo',
                    details: error.message
                });
            }
        });

        // API: Obtener estadísticas
        this.app.get('/api/stats', (req, res) => {
            const stats = this.converter.getConversionStats();
            res.json({
                success: true,
                stats
            });
        });

        // API: Limpiar historial
        this.app.delete('/api/history', (req, res) => {
            this.converter.clearHistory();
            res.json({
                success: true,
                message: 'Historial limpiado'
            });
        });

        // Servir archivos de descarga
        this.app.use('/downloads', express.static(this.downloadDir));

        // Ruta para descargar archivos MIDI
        this.app.get('/downloads/:filename', (req, res) => {
            const filePath = path.join(this.downloadDir, req.params.filename);
            res.download(filePath, (err) => {
                if (err) {
                    res.status(404).json({
                        success: false,
                        error: 'Archivo no encontrado'
                    });
                }
            });
        });

        // Manejo de errores 404
        this.app.use((req, res) => {
            res.status(404).json({
                success: false,
                error: 'Ruta no encontrada'
            });
        });

        // Manejo de errores global
        this.app.use((error, req, res, next) => {
            console.error('Error:', error);
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor',
                details: error.message
            });
        });
    }

    /**
     * Asegura que existan los directorios necesarios
     */
    async ensureDirectories() {
        try {
            await fs.mkdir(this.uploadDir, { recursive: true });
            await fs.mkdir(this.downloadDir, { recursive: true });
        } catch (error) {
            console.error('Error creando directorios:', error);
        }
    }

    /**
     * Inicia el servidor
     */
    start() {
        return new Promise((resolve) => {
            this.server = this.app.listen(this.port, () => {
                console.log(`🎵 Servidor ABC to MIDI iniciado en puerto ${this.port}`);
                console.log(`🌐 Interfaz web: http://localhost:${this.port}`);
                console.log(`📡 API disponible en: http://localhost:${this.port}/api`);
                resolve();
            });
        });
    }

    /**
     * Detiene el servidor
     */
    stop() {
        if (this.server) {
            this.server.close();
            console.log('🛑 Servidor detenido');
        }
    }
}

module.exports = ABCToMidiServer; 