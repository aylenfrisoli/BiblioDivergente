// ── Eyebrow ───────────────────────────────────────────────────────────────────

function Eyebrow({ children, className = "", both = false, noLine = false }) {
  return (
    <span className={`eyebrow font-body text-[11px] font-medium tracking-[0.22em] uppercase text-ink-soft inline-flex items-center gap-3 ${both ? "both" : ""} ${noLine ? "no-line" : ""} ${className}`.trim()}>
      {children}
    </span>
  );
}

// ── useTweaks ─────────────────────────────────────────────────────────────────

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

// ── TweaksPanel ───────────────────────────────────────────────────────────────

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

// ── TweakSection ──────────────────────────────────────────────────────────────

function TweakSection({ label }) {
  return <div className="twk-sect">{label}</div>;
}

// ── TweakRadio ────────────────────────────────────────────────────────────────

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

// ── TweakToggle ───────────────────────────────────────────────────────────────

function TweakToggle({ label, value, onChange }) {
  return (
    <div className="twk-row twk-row-h">
      <div className="twk-lbl"><span>{label}</span></div>
      <button type="button" className="twk-toggle" data-on={value ? '1' : '0'} role="switch" aria-checked={!!value} onClick={() => onChange(!value)}><i /></button>
    </div>
  );
}
