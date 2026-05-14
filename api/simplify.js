const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const SYSTEM_PROMPT = `Eres un experto en accesibilidad cognitiva para personas con TDAH y dislexia.
REGLAS ABSOLUTAS que debes cumplir:
- Máximo 10 palabras por oración
- Sin metáforas, sin lenguaje figurado
- Sin palabras complicadas o técnicas
- Usa verbos activos y directos
- Devuelve SOLO un JSON válido sin markdown:
{ "bullets": ["oración 1", "oración 2", "oración 3", "oración 4", "oración 5"] }
- Exactamente 5 bullets
- Cada bullet es una oración completa y directa sobre el libro`;

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

  const { sinopsis, titulo, texto } = req.body ?? {};

  let systemPrompt = SYSTEM_PROMPT;
  let userContent;

  if (texto && typeof texto === 'string' && texto.trim()) {
    systemPrompt = `Tomá el siguiente fragmento de texto y reescribilo en exactamente 5 oraciones simples y directas.
REGLAS ABSOLUTAS:
- Usá SOLO la información que está en el fragmento recibido
- No agregues información externa ni resumas globalmente
- Máximo 10 palabras por oración
- Sin metáforas, sin lenguaje figurado
- Verbos activos y directos
- Mantené el tema y los datos específicos del fragmento
- Solo JSON válido sin markdown:
{ "bullets": ["...", "...", "...", "...", "..."] }`;
    userContent = `Simplificá este fragmento de texto: ${texto.trim()}`;
  } else {
    if (!sinopsis || typeof sinopsis !== 'string' || !sinopsis.trim()) {
      return res.status(400).json({ error: 'El campo sinopsis es requerido' });
    }
    if (!titulo || typeof titulo !== 'string' || !titulo.trim()) {
      return res.status(400).json({ error: 'El campo titulo es requerido' });
    }
    userContent = `Simplificá esta sinopsis del libro '${titulo.trim()}': ${sinopsis.trim()}`;
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
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent },
        ],
        temperature: 0.2,
        max_tokens: 512,
      }),
    });
  } catch {
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

  const bullets = Array.isArray(parsed?.bullets) ? parsed.bullets : [];

  return res.status(200).json({ bullets });
}
