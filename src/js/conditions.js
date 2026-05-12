// ── ConditionsDemo ────────────────────────────────────────────────────────────

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

// ── ConditionsGrid ────────────────────────────────────────────────────────────

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

// ── ConditionsIsland ──────────────────────────────────────────────────────────

function ConditionsIsland() {
  const [view, setView] = useState(TWEAK_DEFAULTS.conditionsView);
  useEffect(() => {
    const handler = e => setView(e.detail.conditionsView);
    window.addEventListener('tweaks:update', handler);
    return () => window.removeEventListener('tweaks:update', handler);
  }, []);
  return <ConditionsGrid view={view} />;
}
