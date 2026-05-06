const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const SYSTEM_PROMPT = `Sos el bibliotecario de BiblioDivergente, una biblioteca digital para mentes neurodivergentes.
Dado el interés del usuario, recomendá 4 libros reales en español (o traducidos al español).

Para cada libro devolvé un objeto con exactamente estas claves:
- "title": título del libro
- "author": autor/a
- "year": año de publicación original como string corto (ej "1984", "2010")
- "why": una razón cálida y poética de máximo 22 palabras en español, explicando por qué este libro va bien con la búsqueda
- "fit": etiqueta breve de qué mente le va mejor (ej "Para mente TDAH", "Para lectura ansiosa", "Para procesamiento literal", "Para hipersensibilidad visual", "Para diversidad cultural", "Para dislexia")

Devolvé EXCLUSIVAMENTE un JSON válido con esta forma exacta:
{"books":[{"title":"...","author":"...","year":"...","why":"...","fit":"..."}]}

Sin texto extra. Sin markdown. Sin backticks. Solo el JSON.`;

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(204).set(CORS_HEADERS).end();
  }

  Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v));

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const API_KEY = process.env.GROQ_API_KEY;
  if (!API_KEY) {
    return res.status(500).json({ error: 'GROQ_API_KEY no configurada' });
  }

  const { query } = req.body ?? {};
  if (!query || typeof query !== 'string' || !query.trim()) {
    return res.status(400).json({ error: 'El campo query es requerido' });
  }

  let groqRes;
  try {
    groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `El lector busca: "${query.trim()}"` },
        ],
        temperature: 0.7,
        max_tokens: 2048,
      }),
    });
  } catch (err) {
    return res.status(500).json({ error: 'No se pudo contactar la API de Groq' });
  }

  if (!groqRes.ok) {
    const detail = await groqRes.text().catch(() => '');
    return res.status(500).json({ error: `Groq respondió ${groqRes.status}`, detail });
  }

  let payload;
  try {
    payload = await groqRes.json();
  } catch {
    return res.status(500).json({ error: 'Respuesta de Groq no es JSON válido' });
  }

  const rawText = payload?.choices?.[0]?.message?.content ?? '';

  let parsed;
  try {
    const clean = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    parsed = JSON.parse(clean);
  } catch {
    return res.status(500).json({ error: 'El modelo no devolvió JSON parseable', raw: rawText });
  }

  const books = (parsed?.books ?? []).map((b) => ({
    title:  b.title  ?? '',
    author: b.author ?? '',
    year:   b.year   ?? '',
    why:    b.why    ?? '',
    fit:    b.fit    ?? '',
  }));

  return res.status(200).json({ books });
}
