const CONNECTORS = ['pero','sin embargo','aunque','por lo tanto','además','porque','entonces','mientras','después','antes','finalmente','asimismo','no obstante','de hecho','por ejemplo'];
const RE_CONN = new RegExp(`(${CONNECTORS.map(c => c.replace(/ /g, '\\s+')).join('|')})`, 'gi');
function applyConnectors(text) {
  const parts = text.split(RE_CONN);
  return parts.map((p, i) =>
    i % 2 !== 0 && p ? <mark key={i} style={{background:'transparent',color:'var(--accent)',fontWeight:500}}>{p}</mark> : p
  );
}

const WOLF_TEXT = "Puesto que la lectura no es natural, no existe un gen específico para ella; por el contrario, para aprender a leer, cada cerebro debe aprender a realizar nuevas conexiones entre sus partes más antiguas, diseñadas originalmente para otros fines. En consecuencia, el cerebro de cada lector es ligeramente diferente. Para aquellos con mentes divergentes, este proceso de cableado sigue rutas distintas, lo que a menudo resulta en un acceso más rico a las imágenes y a los conceptos globales, a costa de la rapidez en la descodificación lineal.";

function Lab() {
  const [size,     setSize]     = useState(17);
  const [spacing,  setSpacing]  = useState(1.7);
  const [letter,   setLetter]   = useState(0);
  const [width,    setWidth]    = useState(80);
  const [contrast, setContrast] = useState("calm");
  const [chunked,  setChunked]  = useState(false);
  const [preset,   setPreset]   = useState("default");
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [seqRead,   setSeqRead]   = useState(false);
  const [seqIdx,    setSeqIdx]    = useState(0);
  const [pauseVis,  setPauseVis]  = useState(false);
  const [maxSpace,  setMaxSpace]  = useState(false);
  const [blockRead, setBlockRead] = useState(false);
  const [blockIdx,  setBlockIdx]  = useState(0);
  const [markConn,  setMarkConn]  = useState(false);

  const bg  = contrast === "high" ? "#FFFCF0" : contrast === "dim" ? "#E8DFC8" : "var(--bg-card)";
  const ink = contrast === "high" ? "#000"    : contrast === "dim" ? "#3F3527" : "var(--ink)";

  const effectiveLH = maxSpace ? 2.8 : spacing;
  const effectiveLS = maxSpace ? '0.04em' : `${letter}em`;

  const btnBase = "border-none bg-primary text-bg font-body text-[15px] px-7 py-4 cursor-pointer flex items-center gap-2 transition-colors duration-200 hover:bg-ink disabled:opacity-40 disabled:cursor-not-allowed";

  const paragraphs = [WOLF_TEXT];

  const visibleParagraphs = blockRead ? [paragraphs[blockIdx]] : paragraphs;

  let globalSentIdx = 0;
  const renderedParagraphs = visibleParagraphs.map((p, i) => {
    const sentences = p.split(/(?<=[.!?])\s+/).filter(Boolean);
    let sentenceNodes;

    if (seqRead) {
      sentenceNodes = sentences.map((s, j) => {
        const gIdx = globalSentIdx++;
        const isActive = gIdx === seqIdx;
        return (
          <span
            key={j}
            onClick={() => setSeqIdx(gIdx)}
            style={{
              display: 'block',
              marginBottom: chunked ? '0.6em' : '0.2em',
              opacity: isActive ? 1 : 0.3,
              cursor: 'pointer',
              transition: 'opacity 0.2s',
              outline: isActive ? '1px solid color-mix(in srgb, var(--accent) 40%, transparent)' : 'none',
              borderRadius: '2px',
              paddingLeft: '2px',
            }}>
            {markConn ? applyConnectors(s) : s}
          </span>
        );
      });
    } else if (chunked) {
      let sentIdx = 0;
      sentenceNodes = [];
      sentences.forEach((s, j) => {
        if (pauseVis && sentIdx > 0 && sentIdx % 3 === 0) {
          sentenceNodes.push(<hr key={`hr-${j}`} style={{border:'none',borderTop:'1px solid color-mix(in srgb, var(--line) 60%, transparent)',margin:'0.8em 0'}} />);
        }
        sentenceNodes.push(
          <span key={j} style={{ display: "block", marginBottom: j < sentences.length - 1 ? "0.6em" : 0 }}>
            {markConn ? applyConnectors(s) : s}
          </span>
        );
        sentIdx++;
      });
    } else {
      let sentIdx = 0;
      sentenceNodes = [];
      sentences.forEach((s, j) => {
        if (pauseVis && sentIdx > 0 && sentIdx % 3 === 0) {
          sentenceNodes.push(<hr key={`hr-${j}`} style={{border:'none',borderTop:'1px solid color-mix(in srgb, var(--line) 60%, transparent)',margin:'0.8em 0'}} />);
        }
        sentenceNodes.push(markConn
          ? <React.Fragment key={j}>{applyConnectors(s)}{j < sentences.length - 1 ? ' ' : ''}</React.Fragment>
          : <React.Fragment key={j}>{s}{j < sentences.length - 1 ? ' ' : ''}</React.Fragment>
        );
        sentIdx++;
      });
    }

    return (
      <p key={i} style={{ marginBottom: chunked ? "1.6em" : "1em" }}>
        {sentenceNodes}
      </p>
    );
  });

  const totalSentences = paragraphs.flatMap(p => p.split(/(?<=[.!?])\s+/).filter(Boolean)).length;

  return (
    <div className="container">
      <div className="text-center mb-16">
        <Eyebrow both>Laboratorio de lectura · Pruébalo</Eyebrow>
        <h2 className="max-w-[18ch] mx-auto mt-4 mb-3">Cambiá el texto, no la <span className="italic">persona.</span></h2>
        <p className="lead" style={{ margin: "0 auto" }}>Mové los controles. Probá un perfil. Sentí cómo el mismo párrafo se vuelve tuyo.</p>
      </div>
      <div className="grid grid-cols-[1fr_320px] gap-12 items-start bp-md:grid-cols-1 bp-md:gap-10">

        {/* ── Main card ─────────────────────────────────────────────────────────── */}
        <div className="bg-bg-card border border-line p-[56px_64px] transition-all duration-300 bp-sm:p-[32px_24px]"
             style={{ background: bg, color: ink }}>

          {/* Eyebrow + título + subtítulo */}
          <div style={{ marginBottom: '24px' }}>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.18em', color: 'var(--accent)', opacity: 0.6, display: 'block', marginBottom: '8px' }}>
              Texto de prueba
            </span>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: 'var(--primary)', margin: '0 0 8px', fontWeight: 400, lineHeight: 1.2 }}>
              Probá cómo leería tu mente este texto
            </h3>
            <p style={{ fontFamily: 'var(--font-body)', fontWeight: 300, fontSize: '14px', color: 'var(--ink-soft)', margin: 0, maxWidth: 'none' }}>
              Activá los filtros del panel y observá cómo cambia tu experiencia lectora
            </p>
          </div>

          {/* Bloque de cita */}
          <div
            className="lab-text-body font-body"
            aria-live="polite"
            tabIndex={seqRead ? 0 : undefined}
            onKeyDown={seqRead ? e => {
              if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); setSeqIdx(i => Math.min(i + 1, totalSentences - 1)); }
              if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   { e.preventDefault(); setSeqIdx(i => Math.max(i - 1, 0)); }
            } : undefined}
            style={{
              fontSize: `${size}px`,
              lineHeight: effectiveLH,
              letterSpacing: effectiveLS,
              maxWidth: `${width}ch`,
              width: '100%',
              padding: '24px 32px',
              borderLeft: '3px solid var(--accent)',
              borderRadius: '0 8px 8px 0',
              background: 'color-mix(in srgb, var(--accent) 5%, transparent)',
              color: 'inherit',
              fontFamily: 'var(--font-body)',
              transition: 'font-size 0.3s, line-height 0.3s, letter-spacing 0.3s',
              outline: 'none',
            }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '64px', color: 'var(--accent)', opacity: 0.3, display: 'block', lineHeight: 0.8, marginBottom: '8px' }}>"</span>
            {renderedParagraphs}
            <div style={{ marginTop: '20px', borderTop: '1px solid color-mix(in srgb, var(--accent) 20%, transparent)', marginBottom: '12px' }} />
            <p style={{ margin: 0, maxWidth: 'none' }}>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: '11px', fontWeight: 500, color: 'var(--ink-mute)' }}>Fuente: </span>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: '11px', fontStyle: 'italic', color: 'var(--ink-mute)' }}>
                Wolf, M. (2008). Cómo aprendemos a leer: Historia y ciencia del cerebro y la lectura. Ediciones B.
              </span>
            </p>
          </div>

          {/* Botones */}
          <button className={`${btnBase} lab-adapt-btn mt-6 w-full justify-center`}
            onClick={() => setDrawerOpen(true)}>
            Adapta tu texto →
          </button>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
            <a href="/laboratorio-extendido.html"
               className="lab-btn-ext"
               style={{ textDecoration: 'none' }}>
              Personalizá tu propio texto →
            </a>
          </div>
        </div>

        <TweaksDrawer
          isOpen={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          size={size} setSize={setSize}
          spacing={spacing} setSpacing={setSpacing}
          letter={letter} setLetter={setLetter}
          width={width} setWidth={setWidth}
          contrast={contrast} setContrast={setContrast}
          chunked={chunked} setChunked={setChunked}
          preset={preset} setPreset={setPreset}
          seqRead={seqRead} setSeqRead={setSeqRead}
          pauseVis={pauseVis} setPauseVis={setPauseVis}
          maxSpace={maxSpace} setMaxSpace={setMaxSpace}
          blockRead={blockRead} setBlockRead={setBlockRead}
          markConn={markConn} setMarkConn={setMarkConn}
        />
      </div>
    </div>
  );
}
