const { useState, useEffect, useCallback, useRef } = React;

// ── Data ──────────────────────────────────────────────────────────────────────

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

// ── TweaksPanel ───────────────────────────────────────────────────────────────

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "palette":       "default",
  "displayFont":   "dmserif",
  "highContrast":  false,
  "conditionsView":"grid"
}/*EDITMODE-END*/;

function useTweaks(defaults) {
  const [values, setValues] = useState(defaults);
  const setTweak = useCallback((keyOrEdits, val) => {
    const edits = typeof keyOrEdits === 'object' && keyOrEdits !== null
      ? keyOrEdits : { [keyOrEdits]: val };
    setValues(prev => ({ ...prev, ...edits }));
    window.parent.postMessage({ type: '__edit_mode_set_keys', edits }, '*');
  }, []);
  return [values, setTweak];
}

function TweaksPanel({ title = 'Tweaks', children }) {
  const [open, setOpen] = useState(false);
  const dragRef   = useRef(null);
  const offsetRef = useRef({ x: 16, y: 16 });
  const PAD = 16;

  const clampToViewport = useCallback(() => {
    const panel = dragRef.current;
    if (!panel) return;
    const maxRight  = Math.max(PAD, window.innerWidth  - panel.offsetWidth  - PAD);
    const maxBottom = Math.max(PAD, window.innerHeight - panel.offsetHeight - PAD);
    offsetRef.current = {
      x: Math.min(maxRight,  Math.max(PAD, offsetRef.current.x)),
      y: Math.min(maxBottom, Math.max(PAD, offsetRef.current.y)),
    };
    panel.style.right  = offsetRef.current.x + 'px';
    panel.style.bottom = offsetRef.current.y + 'px';
  }, []);

  useEffect(() => {
    if (!open) return;
    clampToViewport();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(clampToViewport) : null;
    if (ro) { ro.observe(document.documentElement); return () => ro.disconnect(); }
    window.addEventListener('resize', clampToViewport);
    return () => window.removeEventListener('resize', clampToViewport);
  }, [open, clampToViewport]);

  useEffect(() => {
    const onMsg = e => {
      const t = e?.data?.type;
      if (t === '__activate_edit_mode')   setOpen(true);
      if (t === '__deactivate_edit_mode') setOpen(false);
    };
    window.addEventListener('message', onMsg);
    window.parent.postMessage({ type: '__edit_mode_available' }, '*');
    return () => window.removeEventListener('message', onMsg);
  }, []);

  const dismiss = () => {
    setOpen(false);
    window.parent.postMessage({ type: '__edit_mode_dismissed' }, '*');
  };

  const onDragStart = e => {
    const panel = dragRef.current;
    if (!panel) return;
    const r = panel.getBoundingClientRect();
    const startRight  = window.innerWidth  - r.right;
    const startBottom = window.innerHeight - r.bottom;
    const sx = e.clientX, sy = e.clientY;
    const move = ev => {
      offsetRef.current = { x: startRight - (ev.clientX - sx), y: startBottom - (ev.clientY - sy) };
      clampToViewport();
    };
    const up = () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };

  if (!open) return null;
  return (
    <div ref={dragRef} className="twk-panel" style={{ right: offsetRef.current.x, bottom: offsetRef.current.y }}>
      <div className="twk-hd" onMouseDown={onDragStart}>
        <b>{title}</b>
        <button className="twk-x" onMouseDown={e => e.stopPropagation()} onClick={dismiss}>✕</button>
      </div>
      <div className="twk-body">{children}</div>
    </div>
  );
}

function TweakSection({ label }) {
  return <div className="twk-sect">{label}</div>;
}

function TweakRadio({ label, value, options, onChange }) {
  const trackRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const opts = options.map(o => typeof o === 'object' ? o : { value: o, label: o });
  const idx  = Math.max(0, opts.findIndex(o => o.value === value));
  const n    = opts.length;
  const valueRef = useRef(value);
  valueRef.current = value;

  const segAt = clientX => {
    const r = trackRef.current.getBoundingClientRect();
    const i = Math.floor(((clientX - r.left - 2) / (r.width - 4)) * n);
    return opts[Math.max(0, Math.min(n - 1, i))].value;
  };

  const onPointerDown = e => {
    setDragging(true);
    const v0 = segAt(e.clientX);
    if (v0 !== valueRef.current) onChange(v0);
    const move = ev => { if (!trackRef.current) return; const v = segAt(ev.clientX); if (v !== valueRef.current) onChange(v); };
    const up   = () => { setDragging(false); window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  return (
    <div className="twk-row">
      <div className="twk-lbl"><span>{label}</span></div>
      <div ref={trackRef} role="radiogroup" onPointerDown={onPointerDown} className={dragging ? 'twk-seg dragging' : 'twk-seg'}>
        <div className="twk-seg-thumb" style={{ left: `calc(2px + ${idx} * (100% - 4px) / ${n})`, width: `calc((100% - 4px) / ${n})` }} />
        {opts.map(o => <button key={o.value} type="button" role="radio" aria-checked={o.value === value}>{o.label}</button>)}
      </div>
    </div>
  );
}

function TweakToggle({ label, value, onChange }) {
  return (
    <div className="twk-row twk-row-h">
      <div className="twk-lbl"><span>{label}</span></div>
      <button type="button" className="twk-toggle" data-on={value ? '1' : '0'} role="switch" aria-checked={!!value} onClick={() => onChange(!value)}><i /></button>
    </div>
  );
}

// ── Shared ────────────────────────────────────────────────────────────────────

function Eyebrow({ children, className = "", both = false, noLine = false }) {
  return (
    <span className={`eyebrow font-body text-[11px] font-medium tracking-[0.22em] uppercase text-ink-soft inline-flex items-center gap-3 ${both ? "both" : ""} ${noLine ? "no-line" : ""} ${className}`.trim()}>
      {children}
    </span>
  );
}

// ── Searcher ──────────────────────────────────────────────────────────────────

function Searcher() {
  const [query,   setQuery]   = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error,   setError]   = useState(null);

  async function search(q) {
    if (!q.trim()) return;
    setLoading(true); setError(null); setResults(null);
    try {
      const res = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q.trim() }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Error ${res.status}`);
      }
      const data = await res.json();
      setResults(data.books || []);
    } catch (e) {
      console.error(e);
      setError("La biblioteca está descansando. Probá de nuevo en un momento.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container narrow">
      <Eyebrow both>Buscador · Inteligencia artificial</Eyebrow>
      <h2 className="mt-6 mx-auto mb-4 max-w-[16ch]">Encontrá tu <span className="italic text-primary">próximo libro.</span></h2>
      <p className="lead mx-auto text-accent font-normal">Describí lo que buscás. La IA hace el resto.</p>
      <p className="text-sm text-ink-mute mt-3 mx-auto max-w-[52ch]">Este buscador no busca en una base de datos: la IA analiza tu descripción y te recomienda títulos según tus intereses y necesidades lectoras.</p>

      <form className="search-box mt-12 mx-auto max-w-[720px] flex items-stretch bg-bg-card border-[1.5px] border-primary rounded-[4px] overflow-hidden transition-all duration-200"
            onSubmit={e => { e.preventDefault(); search(query); }}>
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="ej. novelas cortas, sin metáforas, finales tranquilos..."
          aria-label="Buscar libros"
          className="flex-1 border-none bg-transparent py-5 px-6 font-body text-[17px] text-ink outline-none placeholder:text-ink-mute"
        />
        <button type="submit" disabled={loading}
                className="border-none bg-primary text-bg font-body text-[15px] px-7 cursor-pointer flex items-center gap-2 transition-colors duration-200 hover:bg-ink disabled:opacity-60 disabled:cursor-wait">
          {loading ? "Pensando…" : "Buscar →"}
        </button>
      </form>

      <div className="mt-5 flex flex-wrap gap-2 justify-center">
        {SUGGESTIONS.map(s => (
          <button key={s} type="button"
                  className="font-body text-[13px] py-1.5 px-3.5 border border-line rounded-full bg-transparent text-ink-soft cursor-pointer transition-all duration-150 hover:border-accent hover:text-accent"
                  onClick={() => { setQuery(s); search(s); }}>{s}</button>
        ))}
      </div>

      <div className="mt-8 font-body text-[11px] tracking-[0.15em] uppercase text-ink-mute flex items-center justify-center gap-3.5">
        <span className="w-2 h-2 rounded-full bg-primary-soft animate-pulse-soft"></span>
        <span>Búsqueda sin juicio · Resultados a tu ritmo</span>
      </div>

      {loading && (
        <div className="search-loading mt-14 mx-auto max-w-[720px] text-center font-mono text-xs tracking-[0.18em] uppercase text-ink-mute">
          <div>La biblioteca está leyendo entre líneas</div>
          <div className="dots mt-3">
            <span className="inline-block w-1.5 h-1.5 bg-accent rounded-full mx-[3px] animate-bounce-dot"></span>
            <span className="inline-block w-1.5 h-1.5 bg-accent rounded-full mx-[3px] animate-bounce-dot"></span>
            <span className="inline-block w-1.5 h-1.5 bg-accent rounded-full mx-[3px] animate-bounce-dot"></span>
          </div>
        </div>
      )}

      {error && (
        <div className="search-loading mt-14 mx-auto max-w-[720px] text-center font-mono text-xs tracking-[0.18em] uppercase text-accent">{error}</div>
      )}

      {results && results.length > 0 && (
        <div className="mt-14 mx-auto max-w-[880px] text-left">
          <div className="flex items-baseline justify-between border-b border-line pb-4 mb-8">
            <h3 className="text-[22px] font-normal">Para vos, <span className="italic text-primary">elegimos {results.length}.</span></h3>
            <Eyebrow noLine>Curaduría IA</Eyebrow>
          </div>
          {results.map((b, i) => (
            <article key={i}
                     className="search-result grid grid-cols-[80px_1fr_auto] gap-7 items-start py-6 border-b border-dotted border-line last:border-b-0 animate-fade-up bp-sm:grid-cols-[60px_1fr]"
                     style={{ animationDelay: `${i * 0.08}s` }}>
              <div className={`book-cover ${COVER_BG[i % 5]} aspect-[2/3] text-bg p-[10px_8px] font-display italic text-[11px] leading-[1.2] flex items-end border border-line relative overflow-hidden`}>
                <span>{b.title}</span>
              </div>
              <div>
                <div className="font-mono text-[10px] tracking-[0.15em] uppercase text-ink-mute mb-2">{b.year || "—"} · Recomendación {String(i + 1).padStart(2, "0")}</div>
                <h4 className="font-display text-[22px] leading-[1.2] mb-1">{b.title}</h4>
                <div className="italic text-ink-soft text-sm mb-3">por {b.author}</div>
                <p className="text-sm leading-[1.6] text-ink-soft max-w-[56ch]">{b.why}</p>
              </div>
              <div className="book-fit font-bold text-[10px] tracking-[0.15em] uppercase text-accent whitespace-nowrap">{b.fit}</div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

// ── ConditionsGrid ────────────────────────────────────────────────────────────

function ConditionsDemo() {
  const [active, setActive] = useState(0);
  const c = CONDITIONS[active];
  const samples = [
    { style: { fontSize: 17, lineHeight: 1.8, letterSpacing: "0.01em" },
      content: <><p><strong>Una idea por línea.</strong></p><p>Sin distractores.</p><p>Sin párrafos largos.</p><p>El texto te da <em>pausas</em>.</p><p>Y vos elegís cuándo seguir.</p></> },
    { style: { fontSize: 18, lineHeight: 1.9, letterSpacing: "0.04em", wordSpacing: "0.1em" },
      content: <p>Tipografía Lexend. Letras espaciadas. Palabras espaciadas. El ojo encuentra cada símbolo sin esfuerzo extra.</p> },
    { style: { fontSize: 17, lineHeight: 1.7 },
      content: <><p>El protagonista entra a la habitación.</p><p>La habitación está en silencio.</p><p>Hay una silla junto a la ventana.</p><p style={{ color: "var(--ink-mute)", fontSize: 13, marginTop: 16 }}>↳ Sin metáforas. Lenguaje literal.</p></> },
    { style: { fontSize: 17, lineHeight: 1.75 },
      content: <><p>Leés <strong>50 palabras</strong>. Después podés parar.</p><p style={{ color: "var(--accent)", fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.1em" }}>▰▰▰▰▱▱▱▱▱▱ 40% — Continuar cuando quieras</p></> },
    { style: { fontSize: 17, lineHeight: 1.7, color: "#3F3527" },
      content: <p>Fondo crema. Tinta cálida. Sin negros puros ni blancos puros. Tu vista <em>respira.</em></p> },
    { style: { fontSize: 17, lineHeight: 1.7 },
      content: <><p>Las recomendaciones vienen del <em>Río de la Plata,</em> de los Andes, del Caribe, del África afro-hispana.</p><p style={{ color: "var(--ink-mute)", fontSize: 13, marginTop: 16 }}>↳ La biblioteca se adapta a tu marco cultural.</p></> },
  ];
  return (
    <div className="grid grid-cols-[280px_1fr] gap-12 items-start py-12 bp-md:grid-cols-1">
      <div className="border-r border-line pr-8 bp-md:border-r-0 bp-md:border-b bp-md:pr-0 bp-md:pb-4">
        {CONDITIONS.map((cd, i) => (
          <div key={cd.name}
               className={`py-3.5 border-b border-dotted border-line cursor-pointer transition-colors duration-150 ${active === i ? 'text-primary' : 'hover:text-accent'}`}
               onClick={() => setActive(i)}>
            <span className="font-mono text-[10px] tracking-[0.15em] text-ink-mute mr-3">№{String(i + 1).padStart(2, "0")}</span>
            <span className="font-display text-[18px] italic">{cd.name}</span>
          </div>
        ))}
      </div>
      <div className="bg-bg-card border border-line p-10 min-h-[360px]">
        <div className="font-mono text-[10.5px] tracking-[0.18em] uppercase text-ink-mute mb-5 flex justify-between">
          <span>Vista: {c.name}</span><span>Adaptación activa</span>
        </div>
        <div className="font-body text-ink" style={samples[active].style}>{samples[active].content}</div>
      </div>
    </div>
  );
}

function ConditionsGrid({ view }) {
  const [active, setActive] = useState(null);
  return (
    <div className="container">
      <div className="grid grid-cols-2 gap-16 items-end mb-[72px] bp-md:grid-cols-1 bp-md:gap-10">
        <div>
          <Eyebrow>Diferentes mentes · Diferentes maneras</Eyebrow>
          <h2 className="max-w-[14ch]" style={{ marginTop: 24 }}>Las barreras son de <span className="italic text-primary">diseño,</span> no de las personas.</h2>
        </div>
        <p className="lead">Cada mente procesa de manera única. Acá explicamos cómo BiblioDivergente atiende a seis formas de leer que la web estándar suele ignorar.</p>
      </div>

      {view === "grid" && (
        <div className="conditions-grid grid grid-cols-3 border border-line bp-md:grid-cols-2 bp-sm:grid-cols-1">
          {CONDITIONS.map((c, i) => (
            <div key={c.name}
                 className={`condition-card border-r border-b border-line p-[36px_32px_32px] relative transition-colors duration-[250ms] cursor-pointer flex flex-col ${active === i ? 'active bg-primary text-bg' : 'bg-bg-card hover:bg-bg'}`}
                 onMouseEnter={() => setActive(i)}
                 onMouseLeave={() => setActive(null)}>
              <div className="condition-num font-mono text-[10.5px] tracking-[0.18em] mb-6 text-ink-mute">— {String(i + 1).padStart(2, "0")} / 06</div>
              <div className={`font-display text-[72px] leading-none mb-6 italic ${active === i ? 'text-accent' : 'text-primary'}`}>{c.letter}</div>
              <h3 className={`font-display text-2xl tracking-[-0.01em] mb-3 ${active === i ? 'text-bg' : ''}`}>{c.name}</h3>
              <p className={`text-[14.5px] leading-[1.6] ${active === i ? '' : 'text-ink-soft'}`}>{c.desc}</p>
              <div className="condition-detail mt-auto pt-4 font-bold text-[10.5px] tracking-[0.15em] uppercase text-accent flex items-center gap-2.5"><span>↳</span> {c.detail}</div>
            </div>
          ))}
        </div>
      )}

      {view === "list" && (
        <div style={{ borderTop: "1px solid var(--ink)" }}>
          {CONDITIONS.map((c, i) => (
            <div key={c.name} style={{ display: "grid", gridTemplateColumns: "60px 80px 1fr 1fr 200px", gap: 32, alignItems: "center", padding: "32px 0", borderBottom: "1px solid var(--line)" }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.15em", color: "var(--ink-mute)" }}>№ {String(i + 1).padStart(2, "0")}</div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 56, fontStyle: "italic", lineHeight: 1, color: "var(--primary)" }}>{c.letter}</div>
              <h3 style={{ fontSize: 26 }}>{c.name}</h3>
              <p style={{ fontSize: 14.5, color: "var(--ink)", lineHeight: 1.55 }}>{c.desc}</p>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--accent)", textAlign: "right" }}>{c.detail}</div>
            </div>
          ))}
        </div>
      )}

      {view === "demo" && <ConditionsDemo />}
    </div>
  );
}

// ── Lab ───────────────────────────────────────────────────────────────────────

function Lab() {
  const [size,           setSize]           = useState(17);
  const [spacing,        setSpacing]        = useState(1.7);
  const [letter,         setLetter]         = useState(0);
  const [width,          setWidth]          = useState(60);
  const [contrast,       setContrast]       = useState("calm");
  const [chunked,        setChunked]        = useState(false);
  const [highlightVerbs, setHighlightVerbs] = useState(false);
  const [preset,         setPreset]         = useState("default");

  function applyPreset(p) {
    setPreset(p);
    if      (p === "tdah")     { setSize(18); setSpacing(2.0);  setLetter(0.02); setWidth(50); setContrast("calm"); setChunked(true);  setHighlightVerbs(true);  }
    else if (p === "dislexia") { setSize(19); setSpacing(2.0);  setLetter(0.05); setWidth(58); setContrast("calm"); setChunked(false); setHighlightVerbs(false); }
    else if (p === "ansiedad") { setSize(17); setSpacing(1.85); setLetter(0.01); setWidth(54); setContrast("calm"); setChunked(true);  setHighlightVerbs(false); }
    else if (p === "hiper")    { setSize(16); setSpacing(1.7);  setLetter(0);    setWidth(60); setContrast("dim");  setChunked(false); setHighlightVerbs(false); }
    else                       { setSize(17); setSpacing(1.7);  setLetter(0);    setWidth(60); setContrast("calm"); setChunked(false); setHighlightVerbs(false); }
  }

  const bg  = contrast === "high" ? "#FFFCF0" : contrast === "dim" ? "#E8DFC8" : "var(--bg-card)";
  const ink = contrast === "high" ? "#000"    : contrast === "dim" ? "#3F3527" : "var(--ink)";
  const paragraphs = SAMPLE_TEXT.split("\n\n");

  function renderText(text) {
    if (!highlightVerbs) return text;
    const verbs = ["llegó","caminó","detuvo","ordenaba","dijo","levantó","sonrió","supiera","llegarían"];
    const re = new RegExp(`\\b(${verbs.join("|")})\\b`, "gi");
    return text.split(re).map((p, i) => verbs.includes(p.toLowerCase()) ? <strong key={i}>{p}</strong> : <span key={i}>{p}</span>);
  }

  const toggleCls = active =>
    `flex-1 py-2 px-2.5 border-none font-body text-xs cursor-pointer transition-all duration-150 border-r border-line last:border-r-0 ${active ? 'bg-primary text-bg' : 'bg-transparent text-ink-soft hover:bg-bg-soft'}`;

  const presetLabel = { default: "Estándar", tdah: "TDAH", dislexia: "Dislexia", ansiedad: "Ansiedad", hiper: "Hipersensibilidad" };

  return (
    <div className="container">
      <div className="text-center mb-16">
        <Eyebrow both>Laboratorio de lectura · Pruébalo</Eyebrow>
        <h2 className="max-w-[18ch] mx-auto mt-4 mb-3">Cambiá el texto, no la <span className="italic">persona.</span></h2>
        <p className="lead" style={{ margin: "0 auto" }}>Mové los controles. Probá un perfil. Sentí cómo el mismo párrafo se vuelve tuyo.</p>
      </div>
      <div className="grid grid-cols-[1fr_320px] gap-12 items-start bp-md:grid-cols-1 bp-md:gap-10">
        <div className="bg-bg-card border border-line p-[56px_64px] min-h-[480px] relative transition-all duration-300 bp-sm:p-[32px_24px]" style={{ background: bg, color: ink }}>
          <div className="font-mono text-[10.5px] tracking-[0.18em] uppercase text-ink-mute mb-8 flex justify-between border-b border-line pb-4">
            <span>Mariana, 1923 · Capítulo I</span>
            <span>Perfil: {presetLabel[preset] || preset}</span>
          </div>
          <div className="lab-text-body font-body text-ink transition-all duration-300"
               style={{ fontSize: `${size}px`, lineHeight: spacing, letterSpacing: `${letter}em`, maxWidth: `${width}ch` }}>
            {paragraphs.map((p, i) => (
              <p key={i} style={{ marginBottom: chunked ? "1.6em" : "1em" }}>
                {chunked
                  ? p.split(". ").map((s, j, arr) =>
                      <span key={j} style={{ display: "block", marginBottom: j < arr.length - 1 ? "0.6em" : 0 }}>
                        {renderText(s + (j < arr.length - 1 ? "." : ""))}
                      </span>)
                  : renderText(p)}
              </p>
            ))}
          </div>
        </div>

        <aside className="bg-bg-card border border-line p-8 sticky top-[100px] bp-md:static">
          <h4 className="font-mono text-[11px] tracking-[0.18em] uppercase text-ink-mute font-medium mb-6 border-b border-line pb-3">Perfiles</h4>
          <div className="flex flex-wrap gap-1.5 mb-6">
            {[["default","Estándar"],["tdah","TDAH"],["dislexia","Dislexia"],["ansiedad","Ansiedad"],["hiper","Hipersensible"]].map(([k, l]) => (
              <button key={k}
                      className={`font-mono text-[10px] tracking-[0.12em] uppercase py-1.5 px-2.5 border cursor-pointer transition-all duration-150 ${preset === k ? 'bg-accent text-bg border-accent' : 'border-line bg-transparent text-ink-soft hover:border-accent hover:text-accent'}`}
                      onClick={() => applyPreset(k)}>{l}</button>
            ))}
          </div>

          <h4 className="font-mono text-[11px] tracking-[0.18em] uppercase text-ink-mute font-medium mb-6 border-b border-line pb-3">Tipografía</h4>
          {[
            ["Tamaño",             size,    v => { setSize(+v);    setPreset("custom"); }, { min: 14,   max: 24,  step: 1    }, `${size}px`],
            ["Interlineado",       spacing, v => { setSpacing(+v); setPreset("custom"); }, { min: 1.4,  max: 2.4, step: 0.05 }, spacing.toFixed(2)],
            ["Espacio entre letras",letter, v => { setLetter(+v);  setPreset("custom"); }, { min: 0,    max: 0.1, step: 0.005}, `${letter.toFixed(2)}em`],
            ["Ancho de columna",   width,   v => { setWidth(+v);   setPreset("custom"); }, { min: 32,   max: 80,  step: 1    }, `${width} car.`],
          ].map(([lbl, val, onChange, attrs, display]) => (
            <div key={lbl} className="mb-6">
              <div className="flex justify-between items-baseline text-[13px] mb-2">
                <span>{lbl}</span><span className="font-mono text-[11px] text-accent">{display}</span>
              </div>
              <input type="range" className="lab-slider" value={val} onChange={e => onChange(e.target.value)} {...attrs} />
            </div>
          ))}

          <h4 className="font-mono text-[11px] tracking-[0.18em] uppercase text-ink-mute font-medium mb-6 border-b border-line pb-3 mt-6">Ambiente</h4>
          <div className="mb-6">
            <div className="flex justify-between items-baseline text-[13px] mb-2"><span>Contraste</span></div>
            <div className="flex border border-line rounded-sm overflow-hidden">
              {[["dim","Suave"],["calm","Calmo"],["high","Alto"]].map(([k, l]) => (
                <button key={k} className={toggleCls(contrast === k)} onClick={() => { setContrast(k); setPreset("custom"); }}>{l}</button>
              ))}
            </div>
          </div>
          {[
            ["Fragmentar oraciones", chunked,        v => { setChunked(v);        setPreset("custom"); }],
            ["Resaltar verbos",      highlightVerbs,  v => { setHighlightVerbs(v); setPreset("custom"); }],
          ].map(([lbl, val, onChange]) => (
            <div key={lbl} className="mb-6">
              <div className="flex justify-between items-baseline text-[13px] mb-2"><span>{lbl}</span></div>
              <div className="flex border border-line rounded-sm overflow-hidden">
                <button className={toggleCls(!val)} onClick={() => onChange(false)}>No</button>
                <button className={toggleCls(val)}  onClick={() => onChange(true)}>Sí</button>
              </div>
            </div>
          ))}
        </aside>
      </div>

      <div className="mt-14 pt-10 border-t border-line flex flex-col items-center gap-4 text-center">
        <button disabled className="inline-flex items-center gap-2.5 px-6 py-3 border border-line rounded-sm font-bold text-[11px] tracking-[0.2em] uppercase text-ink-mute bg-bg-soft cursor-not-allowed opacity-80 select-none">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
          Agrega tu propio texto
        </button>
        <p className="font-body text-[13px] tracking-[0.08em] text-ink-mute max-w-[46ch] leading-relaxed">
          Muy pronto habilitaremos una sección donde podrás traer tus archivos de texto y usar nuestro laboratorio para adaptarlo a tus gustos y necesidades.
        </p>
      </div>
    </div>
  );
}

// ── App orchestrator ──────────────────────────────────────────────────────────

function AppTweaks() {
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);

  useEffect(() => {
    const fontMap = {
      fraunces:  "'Fraunces', Georgia, serif",
      dmserif:   "'DM Serif Display', Georgia, serif",
      cormorant: "'Cormorant Garamond', Georgia, serif",
    };
    document.documentElement.setAttribute('data-palette',  tweaks.palette === 'default' ? '' : tweaks.palette);
    document.documentElement.setAttribute('data-contrast', tweaks.highContrast ? 'high' : '');
    document.documentElement.style.setProperty('--font-display', fontMap[tweaks.displayFont] || fontMap.dmserif);
    window.dispatchEvent(new CustomEvent('tweaks:update', { detail: tweaks }));
  }, [tweaks]);

  return (
    <TweaksPanel title="Tweaks · BiblioDivergente">
      <TweakSection label="Paleta" />
      <TweakRadio label="Color" value={tweaks.palette} onChange={v => setTweak("palette", v)}
        options={[{ value: "default", label: "Bosque" }, { value: "salvia", label: "Salvia" }, { value: "borgo", label: "Borgoña" }]} />
      <TweakSection label="Tipografía" />
      <TweakRadio label="Títulos" value={tweaks.displayFont} onChange={v => setTweak("displayFont", v)}
        options={[{ value: "dmserif", label: "DM Serif" }, { value: "fraunces", label: "Fraunces" }, { value: "cormorant", label: "Cormorant" }]} />
      <TweakSection label="Mentes — vista" />
      <TweakRadio label="Layout" value={tweaks.conditionsView} onChange={v => setTweak("conditionsView", v)}
        options={[{ value: "grid", label: "Grid" }, { value: "list", label: "Lista" }, { value: "demo", label: "Demo" }]} />
      <TweakSection label="Accesibilidad" />
      <TweakToggle label="Alto contraste" value={tweaks.highContrast} onChange={v => setTweak("highContrast", v)} />
    </TweaksPanel>
  );
}

function ConditionsIsland() {
  const [view, setView] = useState(TWEAK_DEFAULTS.conditionsView);
  useEffect(() => {
    const handler = e => setView(e.detail.conditionsView);
    window.addEventListener('tweaks:update', handler);
    return () => window.removeEventListener('tweaks:update', handler);
  }, []);
  return <ConditionsGrid view={view} />;
}

// ── Mount islands ─────────────────────────────────────────────────────────────

ReactDOM.createRoot(document.getElementById('buscador')).render(<Searcher />);
ReactDOM.createRoot(document.getElementById('mentes')).render(<ConditionsIsland />);
ReactDOM.createRoot(document.getElementById('laboratorio')).render(<Lab />);
ReactDOM.createRoot(document.getElementById('root-tweaks')).render(<AppTweaks />);
