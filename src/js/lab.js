function Lab() {
  const [size,     setSize]     = useState(17);
  const [spacing,  setSpacing]  = useState(1.7);
  const [letter,   setLetter]   = useState(0);
  const [width,    setWidth]    = useState(80);
  const [contrast, setContrast] = useState("calm");
  const [chunked,  setChunked]  = useState(false);
  const [preset,   setPreset]   = useState("default");
  const [userText, setUserText] = useState("");
  const [activeText, setActiveText] = useState(null);
  const textareaRef = useRef(null);
  const contentHeightRef = useRef(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (activeText !== null || !textareaRef.current) return;
    const ta = textareaRef.current;
    ta.style.height = contentHeightRef.current ? `${contentHeightRef.current}px` : 'auto';
    if (ta.scrollHeight > (contentHeightRef.current ?? 0)) {
      ta.style.height = ta.scrollHeight + 'px';
    }
  }, [activeText]);

  function applyPreset(p) {
    setPreset(p);
    if      (p === "tdah")     { setSize(18); setSpacing(2.0);  setLetter(0.02); setWidth(50); setContrast("calm"); setChunked(true);  }
    else if (p === "dislexia") { setSize(19); setSpacing(2.0);  setLetter(0.05); setWidth(58); setContrast("calm"); setChunked(false); }
    else if (p === "ansiedad") { setSize(17); setSpacing(1.85); setLetter(0.01); setWidth(54); setContrast("calm"); setChunked(true);  }
    else if (p === "hiper")    { setSize(16); setSpacing(1.7);  setLetter(0);    setWidth(60); setContrast("dim");  setChunked(false); }
    else                       { setSize(17); setSpacing(1.7);  setLetter(0);    setWidth(80); setContrast("calm"); setChunked(false); }
  }

  function handleChange(e) {
    const ta = e.target;
    setUserText(ta.value);
    ta.style.height = '1px';
    ta.style.height = ta.scrollHeight + 'px';
    contentHeightRef.current = ta.scrollHeight;
  }
  function handleTransform() {
    if (textareaRef.current) contentHeightRef.current = textareaRef.current.offsetHeight;
    setActiveText(userText);
  }
  function handleEdit() { setActiveText(null); }

  const bg  = contrast === "high" ? "#FFFCF0" : contrast === "dim" ? "#E8DFC8" : "var(--bg-card)";
  const ink = contrast === "high" ? "#000"    : contrast === "dim" ? "#3F3527" : "var(--ink)";
  const paragraphs = activeText ? activeText.split("\n\n") : [];

  const toggleCls = active =>
    `flex-1 py-2 px-2.5 border-none font-body text-xs cursor-pointer transition-all duration-150 border-r border-line last:border-r-0 ${active ? 'bg-primary text-bg' : 'bg-transparent text-ink-soft hover:bg-bg-soft'}`;

  const btnBase = "border-none bg-primary text-bg font-body text-[15px] px-7 py-4 cursor-pointer flex items-center gap-2 transition-colors duration-200 hover:bg-ink disabled:opacity-40 disabled:cursor-not-allowed";

  return (
    <div className="container">
      <div className="text-center mb-16">
        <Eyebrow both>Laboratorio de lectura · Pruébalo</Eyebrow>
        <h2 className="max-w-[18ch] mx-auto mt-4 mb-3">Cambiá el texto, no la <span className="italic">persona.</span></h2>
        <p className="lead" style={{ margin: "0 auto" }}>Mové los controles. Probá un perfil. Sentí cómo el mismo párrafo se vuelve tuyo.</p>
      </div>
      <div className="grid grid-cols-[1fr_320px] gap-12 items-stretch bp-md:grid-cols-1 bp-md:gap-10">

        {/* ── Main card ─────────────────────────────────────────────────────────── */}
        <div className="bg-bg-card border border-line p-[56px_64px] transition-all duration-300 bp-sm:p-[32px_24px] flex flex-col"
             style={{ background: bg, color: ink }}>

          {/* Label */}
          <label className="block font-body font-medium text-[12px] tracking-wider uppercase mb-4"
                 style={{ color: 'var(--accent)' }}>
            Tu texto
          </label>

          {/* Content area: textarea (estado A) ↔ output div (estado B) — nunca coexisten */}
          <div className="flex-1 flex flex-col">
          {(() => {
            const minH = contentHeightRef.current ?? 240;
            const boxStyle = {
              fontSize: `${size}px`,
              lineHeight: spacing,
              letterSpacing: `${letter}em`,
              maxWidth: `${width}ch`,
              width: '100%',
              padding: '20px',
              minHeight: `${minH}px`,
              border: '1px solid color-mix(in srgb, var(--accent) 40%, transparent)',
              borderRadius: '2px',
              background: 'transparent',
              color: 'inherit',
              fontFamily: 'var(--font-body)',
              transition: 'font-size 0.3s, line-height 0.3s, letter-spacing 0.3s',
            };
            if (activeText === null) {
              return (
                <textarea
                  ref={textareaRef}
                  className="lab-textarea font-body"
                  style={{ ...boxStyle, resize: 'none', outline: 'none', overflow: 'hidden' }}
                  placeholder="Pegá tu texto aquí y probá cómo lo leería tu mente con cada adaptación activada..."
                  maxLength={2000}
                  aria-label="Ingresá tu texto para transformar"
                  value={userText}
                  onChange={handleChange}
                />
              );
            }
            return (
              <div
                className="lab-text-body font-body"
                aria-live="polite"
                style={{ ...boxStyle, overflowY: 'auto' }}>
                {paragraphs.map((p, i) => (
                  <p key={i} style={{ marginBottom: chunked ? "1.6em" : "1em" }}>
                    {chunked
                      ? p.split(". ").map((s, j, arr) =>
                          <span key={j} style={{ display: "block", marginBottom: j < arr.length - 1 ? "0.6em" : 0 }}>
                            {s + (j < arr.length - 1 ? "." : "")}
                          </span>)
                      : p}
                  </p>
                ))}
              </div>
            );
          })()}
          </div>

          {/* Counter + Button row */}
          <div className="flex justify-between items-center mt-6 bp-sm:flex-col bp-sm:items-end bp-sm:gap-3">
            <span className="font-body text-[12px]" style={{ color: 'var(--ink-mute)', opacity: 0.5 }}>
              {(activeText !== null ? activeText : userText).length} / 2000
            </span>
            <button
              className={`${btnBase} lab-transform-btn bp-sm:w-full bp-sm:justify-center`}
              disabled={activeText === null && userText.length === 0}
              onClick={activeText !== null ? handleEdit : handleTransform}>
              {activeText !== null ? "Editar texto ✕" : "Transformar texto →"}
            </button>
          </div>
          <button className={`${btnBase} lab-adapt-btn mt-4 w-full justify-center`}
            onClick={() => setDrawerOpen(true)}>
            Adapta tu texto →
          </button>
        </div>

        {/* ── Controls aside ────────────────────────────────────────────────────── */}
        <aside className="lab-aside border border-line sticky top-[100px] bg-bg-card bp-md:static"
          data-open={drawerOpen ? '1' : '0'}>
          <div className="lab-drawer-hd">
            <span className="font-mono text-[11px] tracking-[0.12em] uppercase font-medium text-ink-mute">Adaptar lectura</span>
            <button className="twk-x" onClick={() => setDrawerOpen(false)}>✕</button>
          </div>
          <div className="lab-aside-body p-8">
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
            <div className="mb-6">
              <div className="flex justify-between items-baseline text-[13px] mb-2"><span>Fragmentar oraciones</span></div>
              <div className="flex border border-line rounded-sm overflow-hidden">
                <button className={toggleCls(!chunked)} onClick={() => { setChunked(false); setPreset("custom"); }}>No</button>
                <button className={toggleCls(chunked)}  onClick={() => { setChunked(true);  setPreset("custom"); }}>Sí</button>
              </div>
            </div>
          </div>
          <div className="lab-drawer-ft">
            <button className={`${btnBase} w-full justify-center`} onClick={() => setDrawerOpen(false)}>
              Comenzá a leer →
            </button>
          </div>
        </aside>
      </div>
      <div className="lab-backdrop" data-open={drawerOpen ? '1' : '0'} onClick={() => setDrawerOpen(false)} />
    </div>
  );
}
