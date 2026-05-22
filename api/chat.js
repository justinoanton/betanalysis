export const config = { maxDuration: 60 };

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const apiKey = process.env.REACT_APP_ANTHROPIC_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API key no encontrada' });

  try {
    const { type, ...body } = req.body;

    if (type === 'bet365_soccer') {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      try {
        const response = await fetch(
          'https://bet365data.p.rapidapi.com/prematch/soccer-leagues',
          {
            signal: controller.signal,
            headers: {
              'x-rapidapi-key': process.env.RAPIDAPI_KEY,
              'x-rapidapi-host': 'bet365data.p.rapidapi.com',
            }
          }
        );
        clearTimeout(timeout);
        const data = await response.json();
        // Devolver solo las primeras 15 ligas para reducir tamaño
        const limited = { ...data, leagues: (data.leagues || []).slice(0, 15) };
        return res.status(200).json(limited);
      } catch (e) {
        clearTimeout(timeout);
