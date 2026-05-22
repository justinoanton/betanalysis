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
      const date = body.date || new Date().toISOString().split('T')[0];
      const sport = body.sport || 'football';
      const tournamentId = body.tournamentId;

      let url = `https://sportapi7.p.rapidapi.com/api/v1/sport/${sport}/scheduled-events/${date}`;
      if (tournamentId) {
        url = `https://sportapi7.p.rapidapi.com/api/v1/tournament/${tournamentId}/events/next/0`;
      }

      const response = await fetch(url, {
        headers: {
          'x-rapidapi-key': process.env.RAPIDAPI_KEY,
          'x-rapidapi-host': 'sportapi7.p.rapidapi.com',
        }
      });
      const data = await response.json();
      const events = data.events || data.tournamentTeamEvents || [];
      const matches = events.map(e => ({
        match: `${e.homeTeam?.name} vs ${e.awayTeam?.name}`,
        league: e.tournament?.name || '',
        country: e.category?.name || '',
        time: e.startTimestamp ? new Date(e.startTimestamp * 1000).toISOString() : null,
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
