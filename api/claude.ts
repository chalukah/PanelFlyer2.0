import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { apiKey, messages, model, max_tokens } = req.body || {};

  if (!apiKey || typeof apiKey !== 'string') {
    return res.status(401).json({ error: 'Missing or invalid API key' });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: model || 'claude-sonnet-4-20250514',
        max_tokens: max_tokens || 1024,
        messages: messages || [],
      }),
    });

    const data = await response.json();

    if (response.status === 401) {
      return res.status(401).json({ error: 'Invalid API key', details: data });
    }
    if (response.status === 429) {
      return res.status(429).json({ error: 'Rate limited', details: data });
    }
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Anthropic API error', details: data });
    }

    return res.status(200).json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return res.status(500).json({ error: 'Server error', message });
  }
}
