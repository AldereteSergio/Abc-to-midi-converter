/**
 * Tests end-to-end para el convertidor ABC a MIDI
 * 
 * Utiliza Puppeteer para probar la funcionalidad completa
 * desde la interfaz web hasta la generación de archivos MIDI.
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs').promises;

describe('ABC to MIDI Converter E2E Tests', () => {
    let browser;
    let page;
    let server;

    beforeAll(async () => {
        // Iniciar el servidor
        const ABCToMidiServer = require('../src/server');
        server = new ABCToMidiServer(3001);
        await server.start();

        // Iniciar Puppeteer
        browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        page = await browser.newPage();
    });

    afterAll(async () => {
        await browser.close();
        if (server) {
            server.stop();
        }
    });

    beforeEach(async () => {
        await page.goto('http://localhost:3001');
        await page.waitForSelector('.header');
    });

    describe('Interfaz de Usuario', () => {
        test('debe cargar la página principal correctamente', async () => {
            const title = await page.$eval('.title', el => el.textContent);
            expect(title).toContain('ABC to MIDI Converter');

            const subtitle = await page.$eval('.subtitle', el => el.textContent);
            expect(subtitle).toContain('Convierte notación ABC en archivos MIDI');
        });

        test('debe mostrar el editor ABC', async () => {
            const editor = await page.$('#abcEditor');
            expect(editor).toBeTruthy();

            const placeholder = await page.$eval('#abcEditor', el => el.placeholder);
            expect(placeholder).toContain('Pega tu notación ABC aquí');
        });

        test('debe mostrar el área de upload', async () => {
            const uploadArea = await page.$('#uploadArea');
            expect(uploadArea).toBeTruthy();

            const uploadText = await page.$eval('#uploadArea p', el => el.textContent);
            expect(uploadText).toContain('Arrastra un archivo .abc aquí');
        });

        test('debe mostrar los ejemplos', async () => {
            const examples = await page.$$('.example-item');
            expect(examples.length).toBeGreaterThan(0);

            const exampleTitles = await page.$$eval('.example-item h4', 
                elements => elements.map(el => el.textContent)
            );
            expect(exampleTitles).toContain('Escala Mayor');
        });
    });

    describe('Conversión ABC a MIDI', () => {
        test('debe convertir una escala simple correctamente', async () => {
            // Escribir notación ABC
            await page.type('#abcEditor', `X:1
T:Test Escala
M:4/4
K:C
CDEFGABc`);

            // Hacer clic en convertir
            await page.click('#convertBtn');

            // Esperar a que aparezca la sección de resultado
            await page.waitForSelector('#outputSection', { visible: true });

            // Verificar metadatos
            const title = await page.$eval('#title', el => el.textContent);
            expect(title).toBe('Test Escala');

            const key = await page.$eval('#key', el => el.textContent);
            expect(key).toBe('C');

            const noteCount = await page.$eval('#noteCount', el => el.textContent);
            expect(parseInt(noteCount)).toBe(8);
        });

        test('debe mostrar error con ABC inválido', async () => {
            // Escribir ABC inválido
            await page.type('#abcEditor', 'ABC inválido sin estructura');

            // Hacer clic en convertir
            await page.click('#convertBtn');

            // Esperar a que aparezca el modal de error
            await page.waitForSelector('#errorModal', { visible: true });

            const errorMessage = await page.$eval('#errorMessage', el => el.textContent);
            expect(errorMessage).toContain('Notación ABC inválida');
        });

        test('debe cargar ejemplos correctamente', async () => {
            // Hacer clic en el primer ejemplo
            await page.click('.example-item:first-child .load-example-btn');

            // Verificar que se cargó el contenido
            const editorContent = await page.$eval('#abcEditor', el => el.value);
            expect(editorContent).toContain('X:1');
            expect(editorContent).toContain('Escala Mayor');
        });
    });

    describe('Upload de Archivos', () => {
        test('debe manejar drag and drop de archivos', async () => {
            // Crear archivo temporal
            const testFile = path.join(__dirname, 'test.abc');
            await fs.writeFile(testFile, `X:1
T:Test File
M:4/4
K:C
CDEF`);

            // Simular drag and drop
            await page.evaluateHandle('document.querySelector("#uploadArea")');
            await page.evaluate((filePath) => {
                const dataTransfer = new DataTransfer();
                const file = new File(['test content'], 'test.abc', { type: 'text/plain' });
                dataTransfer.items.add(file);
                
                const uploadArea = document.querySelector('#uploadArea');
                const dropEvent = new Event('drop', { bubbles: true });
                dropEvent.dataTransfer = dataTransfer;
                uploadArea.dispatchEvent(dropEvent);
            });

            // Limpiar archivo temporal
            await fs.unlink(testFile);
        });
    });

    describe('Descarga de Archivos MIDI', () => {
        test('debe generar y permitir descarga de archivo MIDI', async () => {
            // Configurar interceptación de descargas
            await page._client.send('Page.setDownloadBehavior', {
                behavior: 'allow',
                downloadPath: path.join(__dirname, 'downloads')
            });

            // Escribir ABC válido
            await page.type('#abcEditor', `X:1
T:Test Download
M:4/4
K:C
CDEF`);

            // Convertir
            await page.click('#convertBtn');
            await page.waitForSelector('#outputSection', { visible: true });

            // Cambiar nombre del archivo
            await page.type('#filename', 'test-download.mid');

            // Descargar
            const downloadPromise = page.waitForEvent('download');
            await page.click('#downloadBtn');
            const download = await downloadPromise;

            expect(download.filename()).toBe('test-download.mid');
        });
    });

    describe('Validación en Tiempo Real', () => {
        test('debe validar ABC mientras se escribe', async () => {
            // Escribir ABC válido
            await page.type('#abcEditor', 'X:1\nT:Test\nM:4/4\nK:C\nC');

            // Verificar que no hay errores
            const errorModal = await page.$('#errorModal');
            expect(errorModal).toBeFalsy();

            // Escribir ABC inválido
            await page.evaluate(() => {
                document.getElementById('abcEditor').value = 'ABC inválido';
            });

            // Intentar convertir
            await page.click('#convertBtn');

            // Verificar que aparece error
            await page.waitForSelector('#errorModal', { visible: true });
        });
    });

    describe('Opciones de Conversión', () => {
        test('debe cambiar instrumento correctamente', async () => {
            // Seleccionar violín
            await page.select('#instrument', 'violin');

            // Verificar que se seleccionó
            const selectedValue = await page.$eval('#instrument', el => el.value);
            expect(selectedValue).toBe('violin');
        });

        test('debe activar optimización MIDI', async () => {
            // Activar checkbox de optimización
            await page.click('#optimize');

            // Verificar que está activado
            const isChecked = await page.$eval('#optimize', el => el.checked);
            expect(isChecked).toBe(true);
        });
    });

    describe('Responsive Design', () => {
        test('debe funcionar en dispositivos móviles', async () => {
            // Cambiar a vista móvil
            await page.setViewport({ width: 375, height: 667 });

            // Verificar que los elementos son visibles
            const title = await page.$('.title');
            expect(title).toBeTruthy();

            const editor = await page.$('#abcEditor');
            expect(editor).toBeTruthy();

            const convertBtn = await page.$('#convertBtn');
            expect(convertBtn).toBeTruthy();
        });
    });

    describe('Manejo de Errores', () => {
        test('debe manejar errores de red', async () => {
            // Simular error de red
            await page.setOfflineMode(true);

            // Intentar convertir
            await page.type('#abcEditor', `X:1
T:Test
M:4/4
K:C
C`);
            await page.click('#convertBtn');

            // Verificar que aparece error
            await page.waitForSelector('#errorModal', { visible: true });

            // Restaurar conexión
            await page.setOfflineMode(false);
        });

        test('debe cerrar modal de error', async () => {
            // Generar error
            await page.type('#abcEditor', 'ABC inválido');
            await page.click('#convertBtn');
            await page.waitForSelector('#errorModal', { visible: true });

            // Cerrar modal
            await page.click('.modal-btn');

            // Verificar que se cerró
            const modal = await page.$('#errorModal');
            expect(modal).toBeFalsy();
        });
    });

    describe('Performance', () => {
        test('debe convertir ABC complejo en tiempo razonable', async () => {
            const complexABC = `X:1
T:Melodía Compleja
M:4/4
K:C
Q:1/4=120
CDEF | GABc | cBAG | FEDC | CDEF | GABc | cBAG | FEDC |]`;

            const startTime = Date.now();

            await page.type('#abcEditor', complexABC);
            await page.click('#convertBtn');
            await page.waitForSelector('#outputSection', { visible: true });

            const endTime = Date.now();
            const conversionTime = endTime - startTime;

            // La conversión debe tomar menos de 5 segundos
            expect(conversionTime).toBeLessThan(5000);
        });
    });

    describe('Accesibilidad', () => {
        test('debe tener elementos accesibles', async () => {
            // Verificar que los botones tienen texto descriptivo
            const convertBtn = await page.$eval('#convertBtn', el => el.textContent);
            expect(convertBtn).toContain('Convertir a MIDI');

            const downloadBtn = await page.$eval('#downloadBtn', el => el.textContent);
            expect(downloadBtn).toContain('Descargar MIDI');

            // Verificar que los inputs tienen labels
            const filenameLabel = await page.$eval('.filename-input label', el => el.textContent);
            expect(filenameLabel).toContain('Nombre del archivo');
        });
    });
}); 