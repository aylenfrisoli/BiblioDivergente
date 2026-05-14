pdfjsLib.GlobalWorkerOptions.workerSrc =
  'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';

async function extractPDFPages(file) {
  const buffer = await file.arrayBuffer();
  let pdf;
  try {
    pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  } catch (e) {
    if (e.name === 'PasswordException') throw Object.assign(new Error('password'), { type: 'password' });
    throw e;
  }
  const pages = [];
  let allBlank = true;
  for (let i = 1; i <= pdf.numPages; i++) {
    const content = await (await pdf.getPage(i)).getTextContent();
    const pageText = content.items.map(it => it.str).join(' ').trim();
    if (pageText) allBlank = false;
    pages.push(pageText);
  }
  if (allBlank) throw Object.assign(new Error('image-only'), { type: 'image-only' });
  return pages;
}

async function extractDocxText(file) {
  const { value } = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
  return value.trim();
}

function splitIntoPages(fullText, chunkSize = 1500) {
  const pages = [];
  let rem = fullText.trim();
  while (rem.length > chunkSize) {
    const cut = rem.lastIndexOf('.', chunkSize);
    const at = cut > 200 ? cut + 1 : chunkSize;
    pages.push(rem.slice(0, at).trim());
    rem = rem.slice(at).trim();
  }
  if (rem) pages.push(rem);
  return pages.length > 0 ? pages : [fullText.trim()];
}

function splitIntoSections(fullText) {
  let sections = fullText
    .split(/\n{2,}/)
    .map(p => p.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim())
    .filter(p => p.length > 20);

  if (sections.length >= 2) return sections;

  const SENTS = 5;
  const sentences = fullText.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0);
  const groups = [];
  for (let i = 0; i < sentences.length; i += SENTS)
    groups.push(sentences.slice(i, i + SENTS).join(' '));
  return groups.length > 0 ? groups : [fullText.trim()];
}

function getPageNumbers(total, current) {
  if (total <= 10) return Array.from({ length: total }, (_, i) => i);
  const set = new Set([0, total - 1, current]);
  if (current > 1) set.add(current - 1);
  if (current < total - 2) set.add(current + 1);
  const sorted = [...set].sort((a, b) => a - b);
  const result = [];
  let prev = -1;
  for (const p of sorted) {
    if (p - prev > 1) result.push('...');
    result.push(p);
    prev = p;
  }
  return result;
}

const EXT_CONNECTORS = ['pero','sin embargo','aunque','por lo tanto','además','porque','entonces','mientras','después','antes','finalmente','asimismo','no obstante','de hecho','por ejemplo'];
const RE_EXT_CONN = new RegExp(`(${EXT_CONNECTORS.map(c => c.replace(/ /g, '\\s+')).join('|')})`, 'gi');
function applyExtConnectors(text) {
  const parts = text.split(RE_EXT_CONN);
  return parts.map((p, i) =>
    i % 2 !== 0 && p ? <mark key={i} style={{background:'transparent',color:'var(--accent)',fontWeight:500}}>{p}</mark> : p
  );
}

function ConfirmModal({ onConfirm, onCancel }) {
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.45)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:'24px' }}>
      <div style={{ background:'var(--bg-card)', border:'1px solid var(--line)', padding:'32px', maxWidth:'400px', width:'100%', borderRadius:'4px' }}>
        <p style={{ fontFamily:'var(--font-body)', fontSize:'15px', lineHeight:1.55, color:'var(--ink)', marginBottom:'24px', maxWidth:'none' }}>
          Tenés un resultado activo. ¿Querés reemplazarlo?
        </p>
        <div style={{ display:'flex', gap:'12px', flexWrap:'wrap' }}>
          <button onClick={onConfirm} className="btn">Sí, procesar nuevo</button>
          <button onClick={onCancel} className="btn ghost">Cancelar</button>
        </div>
      </div>
    </div>
  );
}

function LabExtendido() {
  const [tab, setTab]               = useState('upload');
  const [file, setFile]             = useState(null);
  const [pasted, setPasted]         = useState('');
  const [status, setStatus]         = useState('idle');
  const [errorMsg, setErrorMsg]     = useState('');
  const [pages, setPages]           = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const [confirmOpen, setConfirmOpen]     = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [asideOpen, setAsideOpen]         = useState(false);
  const [textBoxMode, setTextBoxMode]     = useState('empty'); // 'empty' | 'editing' | 'preview'
  const fileInputRef = useRef(null);
  const outputRef    = useRef(null);
  const asideRef     = useRef(null);

  // Tweaks
  const [size,     setSize]     = useState(17);
  const [spacing,  setSpacing]  = useState(1.7);
  const [letter,   setLetter]   = useState(0);
  const [width,    setWidth]    = useState(80);
  const [contrast, setContrast] = useState('calm');
  const [chunked,  setChunked]  = useState(false);
  const [preset,   setPreset]   = useState('default');
  const [seqRead,   setSeqRead]   = useState(false);
  const [seqIdx,    setSeqIdx]    = useState(0);
  const [pauseVis,  setPauseVis]  = useState(false);
  const [maxSpace,  setMaxSpace]  = useState(false);
  const [blockRead, setBlockRead] = useState(false);
  const [blockIdx,  setBlockIdx]  = useState(0);
  const [markConn,  setMarkConn]  = useState(false);

  const effectiveLH = maxSpace ? 2.8 : spacing;
  const effectiveLS = maxSpace ? '0.04em' : `${letter}em`;

  function withConfirm(action) {
    if (pages.length > 0) {
      setPendingAction(() => action);
      setConfirmOpen(true);
    } else {
      action();
    }
  }

  function resetPages() {
    setPages([]);
    setCurrentPage(0);
  }

  function validateAndSetFile(f) {
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) {
      setErrorMsg('El archivo supera 5 MB. Subí un archivo más chico.');
      return;
    }
    const ext = f.name.split('.').pop().toLowerCase();
    if (!['pdf', 'docx', 'doc'].includes(ext)) {
      setErrorMsg('Formato no soportado. Usá PDF (.pdf) o Word (.docx, .doc).');
      return;
    }
    setFile(f);
    setErrorMsg('');
    resetPages();
  }

  function handleFileSelect(f) {
    withConfirm(() => validateAndSetFile(f));
  }

  function removeFile() {
    withConfirm(() => { setFile(null); resetPages(); setErrorMsg(''); if (fileInputRef.current) fileInputRef.current.value = ''; });
  }

  function handleCustomize() {
    if (window.innerWidth <= 639) {
      setAsideOpen(true);
    } else {
      asideRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  function handleTextBlur() {
    if (pasted.trim()) setTextBoxMode('preview');
    else setTextBoxMode('empty');
  }

  function handleEditarTexto() {
    resetPages();
    setStatus('idle');
    setTextBoxMode('editing');
  }

  function navigateToPage(n) {
    setCurrentPage(n);
    setSeqIdx(0);
    setBlockIdx(0);
    if (tab === 'upload' && outputRef.current) outputRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function handleProcess() {
    setStatus('extracting');
    resetPages();
    setErrorMsg('');
    setSeqIdx(0);
    setBlockIdx(0);
    try {
      let extractedPages = [];
      if (tab === 'upload' && file) {
        const ext = file.name.split('.').pop().toLowerCase();
        if (ext === 'pdf') {
          extractedPages = await extractPDFPages(file);
        } else {
          const text = await extractDocxText(file);
          if (!text) throw new Error('No se encontró texto para procesar.');
          extractedPages = splitIntoPages(text);
        }
      } else {
        const text = pasted.trim();
        if (!text) throw new Error('No se encontró texto para procesar.');
        extractedPages = splitIntoPages(text);
      }
      if (!extractedPages.length) throw new Error('No se encontró texto para procesar.');
      setPages(extractedPages);
      setStatus('done');
    } catch (e) {
      setStatus('error');
      setErrorMsg(
        e.type === 'image-only' ? 'Este PDF contiene solo imágenes escaneadas. Necesitás un PDF con texto seleccionable.' :
        e.type === 'password'   ? 'Este PDF está protegido con contraseña. Guardalo sin contraseña para procesarlo.' :
        e.message || 'Error al procesar el documento.'
      );
    }
  }

  function handleDownload() {
    const name = file ? file.name.replace(/\.[^.]+$/, '') : 'documento';
    const content = pages.map((p, i) => `--- Página ${i + 1} ---\n${p}`).join('\n\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(blob),
      download: `bibliodivergente-${name}.txt`,
    });
    a.click();
    URL.revokeObjectURL(a.href);
  }

  const bg  = contrast === 'high' ? '#FFFCF0' : contrast === 'dim' ? '#E8DFC8' : 'var(--bg-card)';
  const ink = contrast === 'high' ? '#000'    : contrast === 'dim' ? '#3F3527' : 'var(--ink)';

  const toggleCls = active =>
    `flex-1 py-2 px-2.5 border-none font-body text-xs cursor-pointer transition-all duration-150 border-r border-line last:border-r-0 ${active ? 'bg-primary text-bg' : 'bg-transparent text-ink-soft hover:bg-bg-soft'}`;
  const btnBase = "border-none bg-primary text-bg font-body text-[15px] px-7 py-4 cursor-pointer flex items-center gap-2 transition-colors duration-200 hover:bg-ink disabled:opacity-40 disabled:cursor-not-allowed";

  const navBtnStyle = disabled => ({
    fontFamily: 'var(--font-body)', fontSize: '13px',
    padding: '8px 16px',
    border: '1px solid color-mix(in srgb, var(--accent) 40%, transparent)',
    color: 'var(--accent)', background: 'transparent',
    cursor: disabled ? 'not-allowed' : 'pointer',
    borderRadius: '2px', opacity: disabled ? 0.4 : 1,
    transition: 'border-color 0.15s',
  });

  const pageNumStyle = active => ({
    fontFamily: 'var(--font-mono)', fontSize: '12px',
    minWidth: '28px', height: '28px', padding: '0 6px',
    border: `1px solid ${active ? 'var(--accent)' : 'color-mix(in srgb, var(--accent) 40%, transparent)'}`,
    background: active ? 'var(--accent)' : 'transparent',
    color: active ? 'var(--bg)' : 'var(--ink-soft)',
    cursor: 'pointer', borderRadius: '2px',
    transition: 'border-color 0.15s, background 0.15s',
  });

  const isProcessing = status === 'extracting' || status === 'processing';
  const canProcess = !isProcessing && (tab === 'upload' ? file !== null : pasted.trim().length > 0);

  const boxStyle = {
    fontSize: `${size}px`,
    lineHeight: effectiveLH,
    letterSpacing: effectiveLS,
    maxWidth: `${width}ch`,
    width: '100%',
    padding: '20px',
    minHeight: '240px',
    border: '1px solid color-mix(in srgb, var(--accent) 40%, transparent)',
    borderRadius: '2px',
    background: 'transparent',
    color: 'inherit',
    fontFamily: 'var(--font-body)',
    transition: 'font-size 0.3s, line-height 0.3s, letter-spacing 0.3s',
  };

  // totalSentences at component scope so both the outer onKeyDown and renderPage can use it
  const currentPageText = pages.length > 0 ? (pages[currentPage] || '') : '';
  const currentSections = pages.length > 0 ? splitIntoSections(currentPageText) : [];
  const totalSentences  = currentSections.reduce((acc, b) => acc + b.split(/(?<=[.!?])\s+/).filter(Boolean).length, 0);

  const textBoxStyle = {
    ...boxStyle,
    height: 'auto',
    overflow: 'visible',
    padding: 0,
    position: 'relative',
    cursor: (!pages.length && tab === 'text' && textBoxMode === 'empty') ? 'text' : 'default',
    background: (pages.length > 0 && tab === 'text') ? bg : 'transparent',
    color:      (pages.length > 0 && tab === 'text') ? ink : 'inherit',
  };

  function renderPage({ bare = false } = {}) {
    if (!pages.length) return null;
    const pageText = pages[currentPage] || '';

    if (pageText.trim().length < 5) {
      const emptyMsg = (
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--ink-mute)', textAlign: 'center', lineHeight: 1.6, margin: 0, maxWidth: '36ch' }}>
          Esta página no contiene texto seleccionable.<br />
          Puede ser una imagen, gráfico o página en blanco en el documento original.
        </p>
      );
      if (bare) return (
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'160px' }}>
          {emptyMsg}
        </div>
      );
      return (
        <div className="lab-text-body font-body" style={{ ...boxStyle, overflowY: 'auto', outline: 'none', background: bg, color: ink, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {emptyMsg}
        </div>
      );
    }

    const sections = splitIntoSections(pageText);

    const paragraphs = sections.map((b, i) => {
      const sentences = b.split(/(?<=[.!?])\s+/).filter(Boolean);
      if (!sentences.length) sentences.push(b);

      if (seqRead) {
        return (
          <p key={i} style={{ marginBottom: chunked ? '1.6em' : '1em' }}>
            {sentences.map((s, j) => {
              const gIdx = sections.slice(0, i).reduce((acc, b2) => acc + b2.split(/(?<=[.!?])\s+/).filter(Boolean).length, 0) + j;
              return (
                <span key={j} onClick={() => setSeqIdx(gIdx)} style={{
                  display: 'block', marginBottom: '0.2em',
                  opacity: gIdx === seqIdx ? 1 : 0.3,
                  cursor: 'pointer', transition: 'opacity 0.2s',
                  outline: gIdx === seqIdx ? '1px solid color-mix(in srgb, var(--accent) 40%, transparent)' : 'none',
                  borderRadius: '2px', paddingLeft: '2px',
                }}>
                  {markConn ? applyExtConnectors(s) : s}
                </span>
              );
            })}
          </p>
        );
      }

      let sentIdx = 0;
      const nodes = [];
      sentences.forEach((s, j) => {
        if (pauseVis && sentIdx > 0 && sentIdx % 3 === 0) {
          nodes.push(<hr key={`hr-${i}-${j}`} style={{border:'none',borderTop:'1px solid color-mix(in srgb, var(--line) 60%, transparent)',margin:'0.8em 0'}} />);
        }
        if (chunked) {
          nodes.push(
            <span key={j} style={{ display: 'block', marginBottom: j < sentences.length - 1 ? '0.6em' : 0 }}>
              {markConn ? applyExtConnectors(s) : s}
            </span>
          );
        } else {
          nodes.push(
            markConn
              ? <React.Fragment key={j}>{applyExtConnectors(s)}{j < sentences.length - 1 ? ' ' : ''}</React.Fragment>
              : <React.Fragment key={j}>{s}{j < sentences.length - 1 ? ' ' : ''}</React.Fragment>
          );
        }
        sentIdx++;
      });

      return <p key={i} style={{ marginBottom: chunked ? '1.6em' : '1em' }}>{nodes}</p>;
    });

    const visibleParagraphs = blockRead ? [paragraphs[blockIdx]] : paragraphs;

    const innerContent = (
      <>
        {visibleParagraphs}
        {blockRead && blockIdx < sections.length - 1 && (
          <button
            onClick={() => setBlockIdx(i => i + 1)}
            style={{ marginTop: '1.2em', fontFamily: 'var(--font-body)', fontSize: '13px', padding: '8px 16px', border: '1px solid var(--accent)', color: 'var(--accent)', background: 'transparent', cursor: 'pointer', borderRadius: '2px' }}>
            Siguiente →
          </button>
        )}
      </>
    );

    if (bare) return innerContent;

    return (
      <div
        className="lab-text-body font-body"
        aria-live="polite"
        tabIndex={seqRead ? 0 : undefined}
        onKeyDown={seqRead ? e => {
          if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); setSeqIdx(i => Math.min(i + 1, totalSentences - 1)); }
          if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   { e.preventDefault(); setSeqIdx(i => Math.max(i - 1, 0)); }
        } : undefined}
        style={{ ...boxStyle, overflowY: 'auto', outline: 'none', background: bg, color: ink }}>
        {innerContent}
      </div>
    );
  }

  return (
    <>
      {confirmOpen && (
        <ConfirmModal
          onConfirm={() => { pendingAction?.(); setConfirmOpen(false); }}
          onCancel={() => setConfirmOpen(false)}
        />
      )}

      <div className="grid grid-cols-[1fr_300px] gap-12 items-start bp-md:grid-cols-1 bp-md:gap-10">

        {/* ── Columna izquierda: input + output ─────────────────────────────────── */}
        <div>

          {/* Tabs */}
          <div className="flex border border-line rounded-sm overflow-hidden mb-6" style={{ maxWidth: '360px' }}>
            {[['upload','Subir documento'],['text','Pegar texto']].map(([k, l]) => (
              <button key={k} className={toggleCls(tab === k)} onClick={() => setTab(k)} style={{ flex:1, padding:'10px 16px', fontSize:'13px' }}>{l}</button>
            ))}
          </div>

          {/* Tab: Subir documento */}
          {tab === 'upload' && (
            <div className="mb-6">
              {!file ? (
                <div
                  className="lab-dropzone"
                  data-dragover={isDragOver ? '1' : '0'}
                  onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={e => { e.preventDefault(); setIsDragOver(false); handleFileSelect(e.dataTransfer.files[0]); }}
                  onClick={() => fileInputRef.current?.click()}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 16px', opacity: 0.5, display: 'block', color: 'var(--accent)' }}>
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                    <polyline points="10 9 9 9 8 9"/>
                  </svg>
                  <p style={{ fontFamily:'var(--font-body)', fontSize:'15px', color:'var(--ink)', marginBottom:'6px', maxWidth:'none' }}>
                    Arrastrá tu archivo aquí
                  </p>
                  <p style={{ fontFamily:'var(--font-body)', fontSize:'13px', color:'var(--ink-mute)', marginBottom:'16px', maxWidth:'none' }}>
                    PDF o Word · Máximo 5 MB
                  </p>
                  <span style={{ fontFamily:'var(--font-body)', fontSize:'13px', color:'var(--accent)', borderBottom:'1px solid color-mix(in srgb, var(--accent) 50%, transparent)' }}>
                    o elegí un archivo
                  </span>
                  <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx" style={{ display:'none' }} onChange={e => handleFileSelect(e.target.files[0])} />
                </div>
              ) : (
                <div style={{ display:'flex', alignItems:'center', gap:'12px', padding:'14px 16px', border:'1px solid var(--line)', borderRadius:'4px', background:'var(--bg-card)' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                  </svg>
                  <span style={{ fontFamily:'var(--font-body)', fontSize:'14px', flex:1, color:'var(--ink)' }}>
                    {file.name} <span style={{ color:'var(--ink-mute)', fontSize:'12px' }}>· {(file.size / 1024 / 1024).toFixed(2)} MB</span>
                  </span>
                  <button onClick={removeFile} style={{ fontFamily:'var(--font-body)', fontSize:'12px', color:'var(--ink-mute)', background:'none', border:'none', cursor:'pointer', padding:'4px' }}>✕ Quitar</button>
                </div>
              )}
            </div>
          )}

          {/* Tab: Pegar texto — cuadro único con tres estados */}
          {tab === 'text' && (
            <div className="mb-2">

              {/* ── Cuadro único ── */}
              <div
                style={textBoxStyle}
                aria-live={pages.length > 0 ? 'polite' : undefined}
                tabIndex={seqRead && pages.length > 0 ? 0 : undefined}
                onKeyDown={seqRead && pages.length > 0 ? e => {
                  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); setSeqIdx(i => Math.min(i + 1, totalSentences - 1)); }
                  if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   { e.preventDefault(); setSeqIdx(i => Math.max(i - 1, 0)); }
                } : undefined}
                onDoubleClick={() => {
                  if (!pages.length && textBoxMode !== 'editing') setTextBoxMode('editing');
                }}
              >
                {/* Estado 1: vacío */}
                {!pages.length && textBoxMode === 'empty' && (
                  <div style={{ display:'flex', minHeight:'200px', alignItems:'center', justifyContent:'center', padding:'20px' }}>
                    <p style={{ fontFamily:'var(--font-body)', fontWeight:300, fontStyle:'italic', color:'var(--ink-mute)', textAlign:'center', maxWidth:'32ch', margin:0, fontSize:'16px' }}>
                      Hacé doble clic para pegar o escribir tu texto
                    </p>
                  </div>
                )}

                {/* Estado 2: editando */}
                {!pages.length && textBoxMode === 'editing' && (
                  <textarea
                    autoFocus
                    className="font-body"
                    style={{
                      width:'100%', height:'auto', resize:'none',
                      border:'none', background:'transparent', outline:'none',
                      fontFamily:'var(--font-body)', fontSize:`${size}px`,
                      lineHeight:effectiveLH, letterSpacing:effectiveLS,
                      color:'inherit', padding:'20px', boxSizing:'border-box',
                      display:'block',
                    }}
                    maxLength={8000}
                    value={pasted}
                    onChange={e => {
                      setPasted(e.target.value);
                      e.target.style.height = 'auto';
                      e.target.style.height = e.target.scrollHeight + 'px';
                    }}
                    onBlur={handleTextBlur}
                  />
                )}

                {/* Estado 2 preview: texto ingresado, no transformado */}
                {!pages.length && textBoxMode === 'preview' && (
                  <div
                    style={{
                      whiteSpace:'pre-wrap',
                      wordBreak:'break-word', padding:'20px', boxSizing:'border-box',
                      fontFamily:'var(--font-body)', fontSize:`${size}px`,
                      lineHeight:effectiveLH, letterSpacing:effectiveLS,
                    }}
                    onDoubleClick={() => setTextBoxMode('editing')}
                  >
                    {pasted}
                  </div>
                )}

                {/* Estado 3: resultado transformado */}
                {pages.length > 0 && (
                  <div style={{ padding:'20px', boxSizing:'border-box' }}>
                    {renderPage({ bare: true })}
                  </div>
                )}
              </div>

              {/* Contador debajo del cuadro */}
              <div style={{ fontFamily:'var(--font-body)', fontSize:'12px', color:'var(--ink-mute)', marginTop:'6px', textAlign:'right', opacity:0.7 }}>
                {pages.length > 0
                  ? `${(pages[currentPage]||'').length.toLocaleString('es-AR')} caracteres · Página ${currentPage + 1} de ${pages.length}`
                  : `${pasted.length} / 8000`}
              </div>

              {/* Paginación debajo del contador — solo Estado 3 con más de 1 página */}
              {pages.length > 1 && (
                <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'6px', marginTop:'16px', flexWrap:'wrap' }}>
                  <button
                    onClick={() => navigateToPage(currentPage - 1)}
                    disabled={currentPage === 0}
                    style={navBtnStyle(currentPage === 0)}>
                    ← Anterior
                  </button>
                  {getPageNumbers(pages.length, currentPage).map((item, i) =>
                    item === '...'
                      ? <span key={`e${i}`} style={{ color:'var(--ink-mute)', fontSize:'12px', padding:'0 2px' }}>…</span>
                      : <button key={item} onClick={() => navigateToPage(item)} style={pageNumStyle(item === currentPage)}>{item + 1}</button>
                  )}
                  <button
                    onClick={() => navigateToPage(currentPage + 1)}
                    disabled={currentPage === pages.length - 1}
                    style={navBtnStyle(currentPage === pages.length - 1)}>
                    Siguiente →
                  </button>
                </div>
              )}

            </div>
          )}

          {/* Error */}
          {errorMsg && (
            <p style={{ fontFamily:'var(--font-body)', fontSize:'13px', color:'var(--accent)', marginBottom:'16px', maxWidth:'none' }}>
              {errorMsg}
            </p>
          )}

          {/* Botón procesar / editar + Personalizar lectura */}
          <div className="lab-action-row mb-8">
            {tab === 'text' && pages.length > 0 ? (
              <button className={btnBase} onClick={handleEditarTexto}>
                Editar texto ✕
              </button>
            ) : (
              <button
                className={btnBase}
                disabled={!canProcess}
                onClick={handleProcess}>
                {isProcessing ? (
                  status === 'extracting' ? 'Extrayendo texto...' : 'Procesando...'
                ) : 'Transformar documento →'}
              </button>
            )}
            {status === 'done' && pages.length > 0 && (
              <button onClick={handleCustomize} className="lab-btn-ext lab-customize-btn">
                Personalizar lectura
              </button>
            )}
          </div>

          {/* Output — solo para tab "Subir documento" */}
          {tab === 'upload' && pages.length > 0 && (
            <div ref={outputRef}>
              <hr style={{ border:'none', borderTop:'1px solid var(--line)', margin:'0 0 32px' }} />

              {/* Encabezado: título */}
              <div style={{ marginBottom:'8px' }}>
                <h3 style={{ fontFamily:'var(--font-display)', fontStyle:'italic', color:'var(--accent)', fontSize:'clamp(18px,2vw,24px)', margin:0 }}>
                  {file ? file.name.replace(/\.[^.]+$/, '') : 'Resultado'}
                </h3>
              </div>

              {/* Indicador de página */}
              <div style={{ textAlign:'right', fontFamily:'var(--font-mono)', fontSize:'11px', letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--ink-mute)', marginBottom:'12px' }}>
                Página {currentPage + 1} de {pages.length} · {(pages[currentPage] || '').length.toLocaleString('es-AR')} caracteres
              </div>

              {/* Texto de la página */}
              {renderPage()}

              {/* Navegación de páginas */}
              {pages.length > 1 && (
                <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'6px', marginTop:'24px', flexWrap:'wrap' }}>
                  <button
                    onClick={() => navigateToPage(currentPage - 1)}
                    disabled={currentPage === 0}
                    style={navBtnStyle(currentPage === 0)}>
                    ← Anterior
                  </button>

                  {getPageNumbers(pages.length, currentPage).map((item, i) =>
                    item === '...'
                      ? <span key={`e${i}`} style={{ color:'var(--ink-mute)', fontSize:'12px', padding:'0 2px' }}>…</span>
                      : <button key={item} onClick={() => navigateToPage(item)} style={pageNumStyle(item === currentPage)}>{item + 1}</button>
                  )}

                  <button
                    onClick={() => navigateToPage(currentPage + 1)}
                    disabled={currentPage === pages.length - 1}
                    style={navBtnStyle(currentPage === pages.length - 1)}>
                    Siguiente →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <TweaksDrawer
          isOpen={asideOpen}
          onClose={() => setAsideOpen(false)}
          sidebarRef={asideRef}
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
    </>
  );
}

function AppTweaksExt() {
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);
  useEffect(() => {
    const fontMap = { fraunces:"'Fraunces',Georgia,serif", dmserif:"'DM Serif Display',Georgia,serif", cormorant:"'Cormorant Garamond',Georgia,serif" };
    document.documentElement.setAttribute('data-palette',  tweaks.palette === 'default' ? '' : tweaks.palette);
    document.documentElement.setAttribute('data-contrast', tweaks.highContrast ? 'high' : '');
    document.documentElement.style.setProperty('--font-display', fontMap[tweaks.displayFont] || fontMap.dmserif);
    window.dispatchEvent(new CustomEvent('tweaks:update', { detail: tweaks }));
  }, [tweaks]);
  return (
    <TweaksPanel title="Tweaks · BiblioDivergente">
      <TweakSection label="Paleta" />
      <TweakRadio label="Color" value={tweaks.palette} onChange={v => setTweak("palette", v)}
        options={[{value:"default",label:"Bosque"},{value:"salvia",label:"Salvia"},{value:"borgo",label:"Borgoña"}]} />
      <TweakSection label="Tipografía" />
      <TweakRadio label="Títulos" value={tweaks.displayFont} onChange={v => setTweak("displayFont", v)}
        options={[{value:"dmserif",label:"DM Serif"},{value:"fraunces",label:"Fraunces"},{value:"cormorant",label:"Cormorant"}]} />
      <TweakSection label="Accesibilidad" />
      <TweakToggle label="Alto contraste" value={tweaks.highContrast} onChange={v => setTweak("highContrast", v)} />
    </TweaksPanel>
  );
}

ReactDOM.createRoot(document.getElementById('lab-extendido')).render(<LabExtendido />);
ReactDOM.createRoot(document.getElementById('root-tweaks')).render(<AppTweaksExt />);
