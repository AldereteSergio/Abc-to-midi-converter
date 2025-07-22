/**
 * JavaScript del frontend para el convertidor ABC a MIDI
 * 
 * Maneja toda la lógica de la interfaz de usuario y la comunicación
 * con el servidor backend.
 */

class ABCToMidiFrontend {
    constructor() {
        this.apiBase = '/api';
        this.currentMidiBase64 = null;
        this.init();
    }

    /**
     * Inicializa la aplicación
     */
    init() {
        this.setupEventListeners();
        this.setupExamples();
        this.setupFileUpload();
        console.log('🎵 ABC to MIDI Frontend inicializado');
    }

    /**
     * Configura los event listeners
     */
    setupEventListeners() {
        // Botón de conversión
        const convertBtn = document.getElementById('convertBtn');
        convertBtn.addEventListener('click', () => this.convertABC());

        // Botón de descarga
        const downloadBtn = document.getElementById('downloadBtn');
        downloadBtn.addEventListener('click', () => this.downloadMidi());

        // Área de upload
        const uploadArea = document.getElementById('uploadArea');
        uploadArea.addEventListener('click', () => document.getElementById('fileInput').click());

        // Drag and drop
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('focus');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('focus');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('focus');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleFileUpload(files[0]);
            }
        });

        // Input de archivo
        const fileInput = document.getElementById('fileInput');
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleFileUpload(e.target.files[0]);
            }
        });

        // Validación en tiempo real del editor
        const abcEditor = document.getElementById('abcEditor');
        abcEditor.addEventListener('input', () => {
            this.validateABC(abcEditor.value);
        });
    }

    /**
     * Configura los ejemplos
     */
    setupExamples() {
        const examples = {
            scale: `X:1
T:Escala Mayor
M:4/4
K:C
CDEFGABc`,
            folk: `X:2
T:Melodía Folk
M:6/8
K:G
G2G G2G | A2A A2A | B2B B2B | c2c c2c`,
            waltz: `X:3
T:Vals Simple
M:3/4
K:C
C2D | E2F | G2A | B2c`
        };

        document.querySelectorAll('.load-example-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const exampleType = e.target.closest('.example-item').dataset.example;
                const abcEditor = document.getElementById('abcEditor');
                abcEditor.value = examples[exampleType];
                this.validateABC(abcEditor.value);
                
                // Feedback visual
                btn.textContent = '¡Cargado!';
                btn.style.background = 'var(--success-color)';
                btn.style.color = 'white';
                
                setTimeout(() => {
                    btn.textContent = 'Cargar';
                    btn.style.background = '';
                    btn.style.color = '';
                }, 2000);
            });
        });
    }

    /**
     * Configura el upload de archivos
     */
    setupFileUpload() {
        // Ya configurado en setupEventListeners
    }

    /**
     * Maneja la subida de archivos
     */
    async handleFileUpload(file) {
        if (!file.name.endsWith('.abc') && !file.name.endsWith('.txt')) {
            this.showError('Solo se permiten archivos .abc o .txt');
            return;
        }

        try {
            const formData = new FormData();
            formData.append('file', file);

            this.showLoading(true);

            const response = await fetch(`${this.apiBase}/upload`, {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                // Mostrar el contenido en el editor
                const abcEditor = document.getElementById('abcEditor');
                abcEditor.value = await file.text();
                this.validateABC(abcEditor.value);
                
                // Procesar el resultado
                this.handleConversionResult(result);
            } else {
                this.showError(result.error || 'Error al procesar el archivo');
            }
        } catch (error) {
            this.showError('Error al subir el archivo: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * Convierte ABC a MIDI
     */
    async convertABC() {
        const abcEditor = document.getElementById('abcEditor');
        const abcString = abcEditor.value.trim();

        if (!abcString) {
            this.showError('Por favor, ingresa notación ABC');
            return;
        }

        // Validar ABC antes de enviar
        const validation = this.validateABC(abcString);
        if (!validation.isValid) {
            this.showError('Notación ABC inválida: ' + validation.errors.join(', '));
            return;
        }

        try {
            this.showLoading(true);

            const options = {
                optimize: document.getElementById('optimize').checked
            };

            const response = await fetch(`${this.apiBase}/convert`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    abcString,
                    options
                })
            });

            const result = await response.json();
            this.handleConversionResult(result);

        } catch (error) {
            this.showError('Error durante la conversión: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * Maneja el resultado de la conversión
     */
    handleConversionResult(result) {
        if (result.success) {
            this.currentMidiBase64 = result.midiBase64;
            this.displayMetadata(result.metadata);
            this.showOutputSection();
            this.showSuccess('Conversión exitosa!');
        } else {
            this.showError(result.error || 'Error en la conversión');
        }
    }

    /**
     * Muestra los metadatos
     */
    displayMetadata(metadata) {
        document.getElementById('title').textContent = metadata.title || 'Sin título';
        document.getElementById('key').textContent = metadata.key || 'C';
        document.getElementById('tempo').textContent = `${metadata.tempo || 120} BPM`;
        document.getElementById('noteCount').textContent = metadata.noteCount || 0;
    }

    /**
     * Muestra la sección de resultado
     */
    showOutputSection() {
        const outputSection = document.getElementById('outputSection');
        outputSection.style.display = 'block';
        outputSection.scrollIntoView({ behavior: 'smooth' });
    }

    /**
     * Descarga el archivo MIDI
     */
    async downloadMidi() {
        if (!this.currentMidiBase64) {
            this.showError('No hay archivo MIDI para descargar');
            return;
        }

        try {
            const filename = document.getElementById('filename').value || 'music.mid';
            
            const response = await fetch(`${this.apiBase}/download`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    midiBase64: this.currentMidiBase64,
                    filename
                })
            });

            const result = await response.json();

            if (result.success) {
                // Crear enlace de descarga
                const link = document.createElement('a');
                link.href = result.downloadUrl;
                link.download = filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                this.showSuccess('Descarga iniciada');
            } else {
                this.showError('Error al descargar el archivo');
            }
        } catch (error) {
            this.showError('Error durante la descarga: ' + error.message);
        }
    }

    /**
     * Valida la notación ABC
     */
    validateABC(abcString) {
        const errors = [];

        if (!abcString.trim()) {
            return { isValid: false, errors: ['La notación ABC no puede estar vacía'] };
        }

        // Verificar estructura básica
        if (!abcString.includes('K:')) {
            errors.push('Falta la clave (K:)');
        }

        if (!abcString.includes('M:')) {
            errors.push('Falta el compás (M:)');
        }

        // Verificar que hay notas
        const hasNotes = /[A-Ga-g]/.test(abcString);
        if (!hasNotes) {
            errors.push('No se encontraron notas válidas');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Muestra el overlay de carga
     */
    showLoading(show) {
        const overlay = document.getElementById('loadingOverlay');
        overlay.style.display = show ? 'flex' : 'none';
    }

    /**
     * Muestra un mensaje de error
     */
    showError(message) {
        const modal = document.getElementById('errorModal');
        const errorMessage = document.getElementById('errorMessage');
        errorMessage.textContent = message;
        modal.style.display = 'flex';
    }

    /**
     * Cierra el modal de error
     */
    closeErrorModal() {
        const modal = document.getElementById('errorModal');
        modal.style.display = 'none';
    }

    /**
     * Muestra un mensaje de éxito
     */
    showSuccess(message) {
        // Crear notificación temporal
        const notification = document.createElement('div');
        notification.className = 'notification success';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--success-color);
            color: white;
            padding: 1rem 1.5rem;
            border-radius: var(--border-radius);
            box-shadow: var(--shadow-lg);
            z-index: 1001;
            animation: slideIn 0.3s ease-out;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    /**
     * Obtiene estadísticas del servidor
     */
    async getStats() {
        try {
            const response = await fetch(`${this.apiBase}/stats`);
            const result = await response.json();
            
            if (result.success) {
                console.log('📊 Estadísticas:', result.stats);
                return result.stats;
            }
        } catch (error) {
            console.error('Error obteniendo estadísticas:', error);
        }
    }

    /**
     * Limpia el historial
     */
    async clearHistory() {
        try {
            const response = await fetch(`${this.apiBase}/history`, {
                method: 'DELETE'
            });
            const result = await response.json();
            
            if (result.success) {
                console.log('🗑️ Historial limpiado');
            }
        } catch (error) {
            console.error('Error limpiando historial:', error);
        }
    }
}

// Función global para cerrar el modal de error
function closeErrorModal() {
    window.abcConverter.closeErrorModal();
}

// Estilos adicionales para notificaciones
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.abcConverter = new ABCToMidiFrontend();
});

// Manejo de errores global
window.addEventListener('error', (event) => {
    console.error('Error global:', event.error);
    if (window.abcConverter) {
        window.abcConverter.showError('Error inesperado: ' + event.error.message);
    }
});

// Manejo de errores de promesas no capturadas
window.addEventListener('unhandledrejection', (event) => {
    console.error('Promesa rechazada:', event.reason);
    if (window.abcConverter) {
        window.abcConverter.showError('Error de promesa: ' + event.reason);
    }
}); 