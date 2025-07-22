/**
 * Configuración de tests para el convertidor ABC a MIDI
 */

// Configurar timeouts más largos para tests E2E
jest.setTimeout(30000);

// Configurar variables de entorno para testing
process.env.NODE_ENV = 'test';
process.env.PORT = '3001';

// Configurar logging para tests
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

beforeAll(() => {
    // Silenciar logs durante los tests
    console.log = jest.fn();
    console.error = jest.fn();
});

afterAll(() => {
    // Restaurar logs
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
});

// Configurar manejo de errores no capturados
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
}); 