const ABCToMidiConverter = require('./src/converter');

const converter = new ABCToMidiConverter();

// Test simple
const testABC = 'X:1\nT:Test Simple\nM:4/4\nK:C\nCDEFGABc';

console.log('ABC de prueba:');
console.log(testABC);
console.log('\n---');

// Validar
const validation = converter.validateInput(testABC);
console.log('Validación:', validation);

if (validation.isValid) {
    // Parsear
    const parsed = converter.parser.parse(testABC);
    console.log('Parseado:', JSON.stringify(parsed, null, 2));
    
    // Convertir
    const result = converter.convert(testABC);
    console.log('Resultado:', result.success ? '✅ Éxito' : '❌ Error');
    if (!result.success) {
        console.log('Error:', result.error);
        console.log('Detalles:', result.details);
    }
} else {
    console.log('Errores de validación:', validation.errors);
} 