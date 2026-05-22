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

    if (type === 'bet365_soccer') {
      const response = await fetch(
        'https://bet365data.p.rapidapi.com/prematch/soccer-leagues',
        {
          headers: {
            'x-rapidapi-key': process.env.RAPIDAPI_KEY,
            'x-rapidapi-host': 'bet365data.p.rapidapi.com',
          }
        }
      );
      const data = await response.json();
      return res.status(200).json(data);
    }

    if (type === 'bet365_markets') {
      const { fi } = body;
      const response = await fetch(
        `https://bet365data.p.rapidapi.com/prematch/event-markets?fi=${fi}`,
        {
          headers: {
            'x-rapidapi-key': process.env.RAPIDAPI_KEY,
            'x-rapidapi-host': 'bet365data.p.rapidapi.com',
          }
        }
      );
      const data = await response.json();
      return res.status(200).json(data);
    }

    if (type === 'bet365_tennis') {
      const response = await fetch(
        'https://bet365data.p.rapidapi.com/prematch/tennis-leagues',
        {
          headers: {
            'x-rapidapi-key': process.env.RAPIDAPI_KEY,
            'x-rapidapi-host': 'bet365data.p.rapidapi.com',
          }
        }
      );
      const data = await response.json();
      return res.status(200).json(data);
    }

    if (type === 'bet365_basketball') {
      const response = await fetch(
        'https://bet365data.p.rapidapi.com/prematch/basketball-leagues',
        {
          headers: {
            'x-rapidapi-key': process.env.RAPIDAPI_KEY,
            'x-rapidapi-host': 'bet365data.p.rapidapi.com',
          }
        }
      );
      const data = await response.json();
      return res.status(200).json(data);
    }

    if (type === 'fixtures_today') {
      const date = body.date || new Date().toISOString().split('T')[0];
      const sport = body.sport || 'football';
      const tournamentId = body.tournamentId;
      let url = `https://sportapi7.p.rapidapi.com/api/v1/sport/${sport}/scheduled-events/${date}`;
      if (tournamentId) {
        url = `https://sportapi7.p.rapidapi.com/api/v1/tournament/${tournamentId}/events/next/0`;
      }
      const
