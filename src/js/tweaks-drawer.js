function TweaksDrawer({
  isOpen, onClose, sidebarRef,
  variant = 'drawer',
  size, setSize,
  spacing, setSpacing,
  letter, setLetter,
  width, setWidth,
  contrast, setContrast,
  chunked, setChunked,
  preset, setPreset,
  seqRead, setSeqRead,
  pauseVis, setPauseVis,
  maxSpace, setMaxSpace,
  blockRead, setBlockRead,
  markConn, setMarkConn,
}) {
  const scrollY = React.useRef(0);
  React.useEffect(() => {
    if (variant !== 'drawer') return;
    if (isOpen) {
      scrollY.current = window.scrollY;
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      window.scrollTo(0, scrollY.current);
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen, variant]);
  const toggleCls = active =>
    `flex-1 py-2 px-2.5 border-none font-body text-xs cursor-pointer transition-all duration-150 border-r border-line last:border-r-0 ${active ? 'bg-primary text-bg' : 'bg-transparent text-ink-soft hover:bg-bg-soft'}`;

  const btnBase = "border-none bg-primary text-bg font-body text-[15px] px-7 py-4 cursor-pointer flex items-center gap-2 transition-colors duration-200 hover:bg-ink";

  function applyPreset(p) {
    setPreset(p);
    if      (p === 'tdah')     { setSize(18); setSpacing(2.0);  setLetter(0.02); setWidth(50); setContrast('calm'); setChunked(true);  }
    else if (p === 'dislexia') { setSize(19); setSpacing(2.0);  setLetter(0.05); setWidth(58); setContrast('calm'); setChunked(false); }
    else if (p === 'ansiedad') { setSize(17); setSpacing(1.85); setLetter(0.01); setWidth(54); setContrast('calm'); setChunked(true);  }
    else if (p === 'hiper')    { setSize(16); setSpacing(1.7);  setLetter(0);    setWidth(60); setContrast('dim');  setChunked(false); }
    else                       { setSize(17); setSpacing(1.7);  setLetter(0);    setWidth(80); setContrast('calm'); setChunked(false); }
  }

  const body = (
    <div className="lab-aside-body p-8">
      <h4 className="font-mono text-[11px] tracking-[0.18em] uppercase text-ink-mute font-medium mb-6 border-b border-line pb-3">Perfiles de lectura</h4>

      <div className="flex flex-wrap gap-1.5 mb-3">
        {[["default","Estándar"],["tdah","TDAH"],["dislexia","Dislexia"],["ansiedad","Ansiedad"],["hiper","Hipersensible"]].map(([k, l]) => (
          <button key={k}
            className={`font-mono text-[10px] tracking-[0.12em] uppercase py-1.5 px-2.5 border cursor-pointer transition-all duration-150 ${preset === k ? 'bg-accent text-bg border-accent' : 'border-line bg-transparent text-ink-soft hover:border-accent hover:text-accent'}`}
            onClick={() => applyPreset(k)}>{l}</button>
        ))}
      </div>

      <div className="flex flex-wrap gap-1.5 mb-6">
        {[
          [seqRead,   setSeqRead,   "Secuencial",    "Resalta una oración a la vez. El resto se atenúa."],
          [pauseVis,  setPauseVis,  "Pausas",         "Separador visual cada 3 oraciones."],
          [maxSpace,  setMaxSpace,  "Máx. espaciado", "Line-height 2.8 y letter-spacing 0.04em."],
          [blockRead, setBlockRead, "Bloques",        "Un párrafo por vez con botón Siguiente."],
          [markConn,  setMarkConn,  "Conectores",     "Resalta 'pero, sin embargo, aunque...'"],
        ].map(([active, setter, label, tooltip]) => (
          <div key={label} className="lab-tweak-tooltip-wrap">
            <button
              className={`font-mono text-[10px] tracking-[0.12em] uppercase py-1.5 px-2.5 border cursor-pointer transition-all duration-150 ${active ? 'bg-accent text-bg border-accent' : 'border-line bg-transparent text-ink-soft hover:border-accent hover:text-accent'}`}
              onClick={() => { setter(v => !v); setPreset("custom"); }}>
              {label}
            </button>
            <span className="lab-tweak-tooltip">{tooltip}</span>
          </div>
        ))}
      </div>

      <h4 className="font-mono text-[11px] tracking-[0.18em] uppercase text-ink-mute font-medium mb-6 border-b border-line pb-3">Tipografía</h4>
      {[
        ["Tamaño",              size,    v => { setSize(+v);    setPreset("custom"); }, { min:14,  max:24,  step:1     }, `${size}px`],
        ["Interlineado",        spacing, v => { setSpacing(+v); setPreset("custom"); }, { min:1.4, max:2.4, step:0.05  }, spacing.toFixed(2)],
        ["Espacio entre letras",letter,  v => { setLetter(+v);  setPreset("custom"); }, { min:0,   max:0.1, step:0.005 }, `${letter.toFixed(2)}em`],
        ["Ancho de columna",    width,   v => { setWidth(+v);   setPreset("custom"); }, { min:32,  max:80,  step:1     }, `${width} car.`],
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
  );

  if (variant === 'aside') {
    return (
      <aside ref={sidebarRef} className="lab-aside border border-line bg-bg-card">
        {body}
      </aside>
    );
  }

  return (
    <>
      <aside ref={sidebarRef} className="lab-aside border border-line bg-bg-card bp-md:static" data-open={isOpen ? '1' : '0'}>
        <div className="lab-drawer-hd">
          <span className="font-mono text-[11px] tracking-[0.12em] uppercase font-medium text-ink-mute">Adaptar lectura</span>
          <button className="twk-x" onClick={onClose} aria-label="Cerrar">✕</button>
        </div>
        {body}
        <div className="lab-drawer-ft">
          <button className={`${btnBase} w-full justify-center`} onClick={onClose}>Comenzá a leer →</button>
        </div>
      </aside>
      <div className="lab-backdrop" data-open={isOpen ? '1' : '0'} onClick={onClose} />
    </>
  );
}
