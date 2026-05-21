export const config = { maxDuration: 30 };

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

    if (type === 'fixtures_today') {
      const date = new Date().toISOString().split('T')[0];
      const response = await fetch(
        `https://api-football-v1.p.rapidapi.com/v3/fixtures?date=${date}`,
        {
          headers: {
            'x-rapidapi-key': process.env.RAPIDAPI_KEY,
            'x-rapidapi-host': 'api-football-v1.p.rapidapi.com',
          }
        }
      );
      const data = await response.json();
      const matches = (data.response || []).map(f => ({
        match: `${f.teams.home.name} vs ${f.teams.away.name}`,
        league: f.league.name,
        country: f.league.country,
        time: f.fixture.date,
      }));
      return res.status(200).json({ matches });
    }

    if (type === 'rapidapi') {
      const { url, params } = body;
      const fullUrl = new URL(url);
      Object.entries(params || {}).forEach(([k, v]) => fullUrl.searchParams.append(k, v));
      const response = await fetch(fullUrl.toString(), {
        headers: {
          'x-rapidapi-key': process.env.RAPIDAPI_KEY,
          'x-rapidapi-host': fullUrl.hostname,
        }
      });
      const data = await response.json();
      return res.status(200).json(data);
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
