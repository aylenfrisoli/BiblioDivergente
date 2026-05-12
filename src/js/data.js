const SUGGESTIONS = [
  "novelas cortas para mente inquieta",
  "ensayos en lenguaje claro",
  "ficción que abrace lo distinto",
  "poesía con espacios para respirar",
  "libros para leer sin presión",
];

const COVER_BG = ['bg-primary', 'bg-accent', 'bg-ink', 'bg-primary-soft', 'bg-[#6B4423]'];

const CONDITIONS = [
  { letter: "T", name: "TDAH",                desc: "Dificultad para sostener la atención lectora. Necesita textos cortos, estructurados y sin distractores visuales.", detail: "Fragmentación · Foco" },
  { letter: "D", name: "Dislexia",            desc: "Procesamiento diferente de los símbolos escritos. Mejora con tipografías especializadas, espaciado y contraste adecuado.", detail: "Lexend · Espaciado" },
  { letter: "A", name: "TEA",                 desc: "Literalidad y procesamiento concreto. Prefiere lenguaje directo, sin metáforas ni ambigüedades.", detail: "Lenguaje claro" },
  { letter: "H", name: "Hipersensibilidad visual", desc: "Fatiga ante contrastes altos y tipografías pequeñas. Paleta crema y Lexend reducen el esfuerzo visual.", detail: "Paleta crema" },
  { letter: "C", name: "Diversidad cultural", desc: "Distintos marcos de referencia lectora. La IA adapta recomendaciones a contextos y bagajes culturales variados.", detail: "Curaduría plural" },
  { letter: "A", name: "Ansiedad lectora",    desc: "Bloqueo ante textos largos o densos. Se beneficia de avances progresivos y fragmentación del contenido.", detail: "Avance progresivo" },
];

const SAMPLE_TEXT = `El verano de 1923 fue distinto. Mariana llegó al pueblo con una valija de cuero y un cuaderno de tapas blandas. Nadie la esperaba en la estación, pero ella tampoco esperaba que nadie la esperara.

Caminó por la calle principal, donde el polvo se levantaba con cada paso, y se detuvo frente a la biblioteca. La puerta estaba abierta. Adentro, una mujer mayor, con anteojos redondos y manos pequeñas, ordenaba libros sobre una mesa larga.

—Buenas tardes —dijo Mariana, sin saber bien por qué había entrado.

La bibliotecaria levantó la vista. Sonrió, sin apuro. Como si supiera que las palabras llegarían cuando tuvieran que llegar.`;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "palette":       "default",
  "displayFont":   "dmserif",
  "highContrast":  false,
  "conditionsView":"grid"
}/*EDITMODE-END*/;

// Shared React hooks — declared once here with var so all Babel script files
// that share the global scope can reference them without re-declaring.
var useState    = React.useState;
var useEffect   = React.useEffect;
var useCallback = React.useCallback;
var useRef      = React.useRef;
