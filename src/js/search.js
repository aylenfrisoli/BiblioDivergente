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
    } catch {
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
