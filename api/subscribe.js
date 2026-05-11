export const maxDuration = 60;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, cohorte, prenom } = req.body;
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Email invalide' });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;

  console.log(`[SUBSCRIBE] ${new Date().toISOString()} | ${cohorte} | ${prenom} | ${email}`);

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.warn('Supabase non configuré — email loggé uniquement.');
    return res.status(200).json({ ok: true, mode: 'log-only' });
  }

  try {
    const supabaseRes = await fetch(`${SUPABASE_URL}/rest/v1/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        email: email,
        prenom: prenom || '',
        cohorte: cohorte || '',
      }),
    });

    if (!supabaseRes.ok) {
      const errBody = await supabaseRes.text();
      console.error('Supabase error:', supabaseRes.status, errBody);
      return res.status(200).json({ ok: true, mode: 'supabase-error' });
    }

    return res.status(200).json({ ok: true, mode: 'supabase' });

  } catch (err) {
    console.error('subscribe error:', err);
    return res.status(200).json({ ok: true, mode: 'error-fallback' });
  }
}
