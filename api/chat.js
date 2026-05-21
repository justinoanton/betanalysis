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
      const sport = body.sport || 'football';
      const response = await fetch(
        `https://sportapi7.p.rapidapi.com/api/v1/sport/${sport}/scheduled-events/${date}`,
        {
          headers: {
            'x-rapidapi-key': process.env.RAPIDAPI_KEY,
            'x-rapidapi-host': 'sportapi7.p.rapidapi.com',
          }
        }
      );
      const data = await response.json();
      const matches = (data.events || []).map(e => ({
        match: `${e.homeTeam?.name || e.homeScore?.current} vs ${e.awayTeam?.name || e.awayScore?.current}`,
        league: e.tournament?.name || '',
        country: e.category?.name || '',
      })).filter(m => m.match && !m.match.includes('undefined'));
      return res.status(200).json({ matches });
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
