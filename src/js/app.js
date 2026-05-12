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

// ── Mount islands ─────────────────────────────────────────────────────────────

ReactDOM.createRoot(document.getElementById('buscador')).render(<Searcher />);
ReactDOM.createRoot(document.getElementById('mentes')).render(<ConditionsIsland />);
ReactDOM.createRoot(document.getElementById('laboratorio')).render(<Lab />);
ReactDOM.createRoot(document.getElementById('root-tweaks')).render(<AppTweaks />);
