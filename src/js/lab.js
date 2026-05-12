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
