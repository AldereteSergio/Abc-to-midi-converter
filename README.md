# 🎵 ABC to MIDI Converter

Un convertidor elegante y moderno de notación ABC a archivos MIDI, creado con pasión por la música y la tecnología.

## 🌟 Características

- **Conversión precisa**: Parsea notación ABC y genera archivos MIDI de alta calidad
- **Interfaz web moderna**: Diseño elegante y responsive con drag & drop
- **Múltiples instrumentos**: Soporte para piano, violín, flauta, guitarra y bajo
- **Validación en tiempo real**: Detecta errores mientras escribes
- **Ejemplos incluidos**: Melodías de ejemplo para empezar
- **API REST completa**: Para integración con otras aplicaciones
- **Tests E2E con Puppeteer**: Verificación completa de funcionalidad

## 🚀 Instalación

### Prerrequisitos

- Node.js 16 o superior
- npm o yarn

### Pasos de instalación

```bash
# Clonar el repositorio
git clone <url-del-repositorio>
cd AbctoMidiTest

# Instalar dependencias
npm install

# Iniciar el servidor
npm start
```

El servidor estará disponible en `http://localhost:3000`

## 📖 Uso

### Interfaz Web

1. Abre tu navegador en `http://localhost:3000`
2. Escribe o pega tu notación ABC en el editor
3. Selecciona el instrumento deseado
4. Haz clic en "Convertir a MIDI"
5. Descarga el archivo MIDI generado

### Ejemplo de notación ABC

```abc
X:1
T:Mi Melodía
C:Compositor
M:4/4
L:1/4
K:C
Q:1/4=120
CDEF | GABc | cBAG | FEDC |]
```

### API REST

#### Convertir ABC a MIDI

```bash
curl -X POST http://localhost:3000/api/convert \
  -H "Content-Type: application/json" \
  -d '{
    "abcString": "X:1\nT:Test\nM:4/4\nK:C\nCDEF",
    "options": {
      "optimize": true
    }
  }'
```

#### Convertir con múltiples instrumentos

```bash
curl -X POST http://localhost:3000/api/convert-multitrack \
  -H "Content-Type: application/json" \
  -d '{
    "abcString": "X:1\nT:Test\nM:4/4\nK:C\nCDEF",
    "instruments": ["piano", "violin"]
  }'
```

#### Subir archivo ABC

```bash
curl -X POST http://localhost:3000/api/upload \
  -F "file=@mi-melodia.abc"
```

## 🧪 Tests

### Tests unitarios

```bash
npm test
```

### Tests end-to-end

```bash
npm run test:e2e
```

### Generar ejemplos

```bash
npm run examples
```

## 🏗️ Arquitectura

### Estructura del proyecto

```
AbctoMidiTest/
├── src/
│   ├── abcParser.js      # Parser de notación ABC
│   ├── midiGenerator.js  # Generador de archivos MIDI
│   ├── converter.js      # Convertidor principal
│   ├── server.js         # Servidor web
│   └── index.js          # Punto de entrada
├── public/
│   ├── index.html        # Interfaz web
│   ├── styles.css        # Estilos CSS
│   └── script.js         # JavaScript del frontend
├── tests/
│   ├── e2e.test.js       # Tests end-to-end
│   └── setup.js          # Configuración de tests
├── uploads/              # Archivos subidos temporalmente
├── downloads/            # Archivos MIDI generados
└── examples/             # Ejemplos generados
```

### Componentes principales

#### ABCParser
- Parsea notación ABC a estructura de datos musical
- Valida sintaxis y estructura
- Extrae metadatos (título, clave, tempo, etc.)

#### MidiGenerator
- Convierte estructura musical a archivos MIDI
- Soporta múltiples instrumentos
- Aplica efectos MIDI (sustain, vibrato)

#### ABCToMidiConverter
- Orquesta el proceso completo de conversión
- Maneja errores y validaciones
- Proporciona estadísticas de conversión

## 🎼 Notación ABC

### Sintaxis básica

| Campo | Descripción | Ejemplo |
|-------|-------------|---------|
| `X:` | Número de referencia | `X:1` |
| `T:` | Título | `T:Mi Melodía` |
| `C:` | Compositor | `C:Compositor` |
| `M:` | Compás | `M:4/4`, `M:3/4` |
| `L:` | Longitud por defecto | `L:1/4` |
| `K:` | Clave | `K:C`, `K:G`, `K:F` |
| `Q:` | Tempo | `Q:1/4=120` |

### Notas

- **Notas básicas**: C, D, E, F, G, A, B
- **Octavas**: `'` sube una octava, `,` baja una octava
- **Accidentes**: `^` sostenido, `_` bemol, `=` becuadro
- **Duración**: Números después de la nota (1=redonda, 2=blanca, 4=negra, etc.)

### Ejemplos

```abc
# Escala mayor
CDEFGABc

# Con accidentes
C^DEF^GABc

# Con duraciones
C2D2E4F2G2

# Con octavas
C'D'E'F'G'A'B'c
```

## 🔧 Desarrollo

### Scripts disponibles

```bash
npm start          # Inicia el servidor
npm run dev        # Modo desarrollo con nodemon
npm test           # Ejecuta tests unitarios
npm run test:e2e   # Ejecuta tests end-to-end
npm run examples   # Genera archivos de ejemplo
npm run build      # Construye para producción
```

### Configuración de desarrollo

1. Instala las dependencias de desarrollo
2. Configura tu editor para usar ESLint y Prettier
3. Ejecuta `npm run dev` para desarrollo con recarga automática

### Contribuir

1. Fork el repositorio
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -am 'Añade nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crea un Pull Request

## 📚 Recursos adicionales

### Documentación ABC
- [ABC Notation Standard](http://abcnotation.com/)
- [ABC Tutorial](http://abcnotation.com/tutorial)

### MIDI
- [MIDI Specification](https://www.midi.org/specifications)
- [MIDI File Format](https://www.midi.org/specifications-old/item/standard-midi-files-smf)

### Herramientas relacionadas
- [ABCjs](https://abcjs.net/) - Librería JavaScript para ABC
- [MidiWriter.js](https://www.npmjs.com/package/midi-writer-js) - Generador de MIDI

## 🤝 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 🙏 Agradecimientos

- A la comunidad de música digital por mantener viva la notación ABC
- A los desarrolladores de las librerías utilizadas
- A todos los músicos que inspiran este proyecto

---

**"La música es el lenguaje universal que trasciende todas las barreras. ¡Aprende a escucharlo, a entenderlo y a sentirlo con todo tu ser!"** - Jaime Altozano

---

¿Tienes preguntas o sugerencias? ¡Abre un issue o únete a la discusión! 