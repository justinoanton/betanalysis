export const config = { maxDuration: 30 };

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { type, ...body } = req.body;

    if (type === 'fixtures_today') {
      const rapidKey = process.env.RAPIDAPI_KEY;
      if (!rapidKey) return res.status(500).json({ error: true, message: 'RAPIDAPI_KEY no configurada' });

      const date = body.date || new Date().toISOString().split('T')[0];
      try {
        const response = await fetch(
          `https://sportapi7.p.rapidapi.com/api/v1/sport/football/scheduled-events/${date}`,
          {
            headers: {
              'x-rapidapi-key': rapidKey,
              'x-rapidapi-host': 'sportapi7.p.rapidapi.com',
            }
          }
        );
        if (!response.ok) throw new Error(`SportAPI error: ${response.status}`);
        const data = await response.json();
        const events = data.events || [];
        const matches = events
          .filter(e => e.homeTeam?.name && e.awayTeam?.name)
          .map(e => ({
            id: String(e.id || ''),
            match: `${e.homeTeam.name} vs ${e.awayTeam.name}`,
            league: e.tournament?.name || '',
            // Campos nuevos para clasificación robusta
            country: e.tournament?.category?.country?.name || e.tournament?.category?.name || '',
            category: e.tournament?.category?.name || '',
            tournamentName: e.tournament?.name || '',
            uniqueTournamentName: e.tournament?.uniqueTournament?.name || '',
            homeTeam: e.homeTeam.name,
            awayTeam: e.awayTeam.name,
            startTime: e.startTimestamp ? new Date(e.startTimestamp * 1000).toISOString() : null,
            sport: 'football',
          }));
        return res.status(200).json({ matches, error: false });
      } catch (err) {
        return res.status(200).json({ matches: [], error: true, message: `No se pudieron cargar los partidos: ${err.message}` });
      }
    }

    if (type === 'bet365_markets') {
      const rapidKey = process.env.RAPIDAPI_KEY;
      if (!rapidKey) return res.status(500).json({ error: true, message: 'RAPIDAPI_KEY no configurada' });
      const { fi } = body;
      if (!fi) return res.status(400).json({ error: true, message: 'Falta el parámetro fi' });
      try {
        const response = await fetch(
          `https://bet365data.p.rapidapi.com/prematch/event-markets?fi=${fi}`,
          {
            headers: {
              'x-rapidapi-key': rapidKey,
              'x-rapidapi-host': 'bet365data.p.rapidapi.com',
            }
          }
        );
        if (!response.ok) throw new Error(`Bet365Data error: ${response.status}`);
        const data = await response.json();
        return res.status(200).json({ ...data, error: false });
      } catch (err) {
        return res.status(200).json({ error: true, message: `No se pudieron cargar las cuotas: ${err.message}` });
      }
    }

    const apiKey = process.env.REACT_APP_ANTHROPIC_KEY;
    if (!apiKey) return res.status(500).json({ error: true, message: 'REACT_APP_ANTHROPIC_KEY no configurada' });

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
    if (!response.ok) {
      return res.status(response.status).json({ error: true, message: data.error?.message || 'Error de Anthropic', ...data });
    }
    return res.status(200).json(data);

  } catch (err) {
    return res.status(500).json({ error: true, message: err.message });
  }
}
