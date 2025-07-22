/**
 * Punto de entrada principal del convertidor ABC a MIDI
 * 
 * Aquí es donde todo cobra vida. Iniciamos el servidor web
 * y proporcionamos ejemplos de cómo usar el convertidor.
 */

const ABCToMidiServer = require('./server');
const ABCToMidiConverter = require('./converter');

// Ejemplo de notación ABC para probar
const exampleABC = `X:1
T:Ejemplo de Melodía
C:Jaime Altozano
M:4/4
L:1/4
K:C
Q:1/4=120
CDEF | GABc | cBAG | FEDC |]`;

/**
 * Función principal que inicia el servidor
 */
async function main() {
    try {
        console.log('🎼 Iniciando convertidor ABC a MIDI...');
        
        // Crear e iniciar el servidor
        const server = new ABCToMidiServer(3001);
        await server.start();
        
        // Ejemplo de uso directo del convertidor
        console.log('\n🧪 Probando conversión directa...');
        const converter = new ABCToMidiConverter();
        const result = converter.convert(exampleABC);
        
        if (result.success) {
            console.log('✅ Conversión exitosa!');
            console.log(`📊 Metadatos: ${result.metadata.title} en ${result.metadata.key}`);
            console.log(`🎵 Notas procesadas: ${result.metadata.noteCount}`);
            console.log(`⏱️  Tiempo de conversión: ${result.metadata.duration}ms`);
        } else {
            console.log('❌ Error en conversión:', result.error);
        }
        
        console.log('\n🚀 Servidor listo! Visita http://localhost:3000');
        
    } catch (error) {
        console.error('💥 Error iniciando el servidor:', error);
        process.exit(1);
    }
}

/**
 * Función para probar el convertidor con diferentes ejemplos
 */
function runTests() {
    console.log('🧪 Ejecutando tests del convertidor...');
    
    const converter = new ABCToMidiConverter();
    
    // Test 1: Melodía simple
    const test1 = `X:1
T:Test Simple
M:4/4
K:C
CDEFGABc`;
    
    const result1 = converter.convert(test1);
    console.log('Test 1:', result1.success ? '✅' : '❌', result1.error || 'OK');
    
    // Test 2: Con accidentes
    const test2 = `X:2
T:Test con Accidentes
M:3/4
K:G
G^AB | cde | fga`;
    
    const result2 = converter.convert(test2);
    console.log('Test 2:', result2.success ? '✅' : '❌', result2.error || 'OK');
    
    // Test 3: Con duraciones
    const test3 = `X:3
T:Test con Duraciones
M:4/4
K:C
C2D2 | E4 | F2G2 | A4`;
    
    const result3 = converter.convert(test3);
    console.log('Test 3:', result3.success ? '✅' : '❌', result3.error || 'OK');
    
    // Mostrar estadísticas
    const stats = converter.getConversionStats();
    console.log('\n📊 Estadísticas de conversión:');
    console.log(`Total: ${stats.totalConversions}`);
    console.log(`Exitosas: ${stats.successfulConversions}`);
    console.log(`Fallidas: ${stats.failedConversions}`);
    console.log(`Tasa de éxito: ${stats.successRate.toFixed(1)}%`);
}

/**
 * Función para generar ejemplos de archivos MIDI
 */
async function generateExamples() {
    console.log('🎵 Generando ejemplos de archivos MIDI...');
    
    const converter = new ABCToMidiConverter();
    const fs = require('fs').promises;
    
    const examples = [
        {
            name: 'escala_mayor',
            abc: `X:1
T:Escala Mayor
M:4/4
K:C
CDEFGABc`
        },
        {
            name: 'melodia_folk',
            abc: `X:2
T:Melodía Folk
M:6/8
K:G
G2G G2G | A2A A2A | B2B B2B | c2c c2c`
        },
        {
            name: 'vals_simple',
            abc: `X:3
T:Vals Simple
M:3/4
K:C
C2D | E2F | G2A | B2c`
        }
    ];
    
    for (const example of examples) {
        const result = converter.convert(example.abc);
        if (result.success) {
            const filename = `examples/${example.name}.mid`;
            await fs.mkdir('examples', { recursive: true });
            await fs.writeFile(filename, result.midiBuffer);
            console.log(`✅ Generado: ${filename}`);
        }
    }
}

// Manejo de señales para cerrar limpiamente
process.on('SIGINT', () => {
    console.log('\n🛑 Cerrando servidor...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Cerrando servidor...');
    process.exit(0);
});

// Ejecutar función principal si este archivo se ejecuta directamente
if (require.main === module) {
    const args = process.argv.slice(2);
    
    if (args.includes('--test')) {
        runTests();
    } else if (args.includes('--examples')) {
        generateExamples();
    } else {
        main();
    }
}

module.exports = { main, runTests, generateExamples }; 