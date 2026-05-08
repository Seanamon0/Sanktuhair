// api/subscribe.js — Vercel Serverless Function
// Saves subscriber emails to Airtable with cohorte tagging
// Required env vars: AIRTABLE_API_KEY, AIRTABLE_BASE_ID, AIRTABLE_TABLE_NAME

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, cohorte, prenom } = req.body;

  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Invalid email' });
  }

  const AIRTABLE_KEY   = process.env.AIRTABLE_API_KEY;
  const AIRTABLE_BASE  = process.env.AIRTABLE_BASE_ID;
  const AIRTABLE_TABLE = process.env.AIRTABLE_TABLE_NAME || 'Pionniers';

  // Console log as fallback (visible in Vercel logs)
  console.log(`[SUBSCRIBE] ${new Date().toISOString()} | ${cohorte} | ${prenom} | ${email}`);

  if (!AIRTABLE_KEY || !AIRTABLE_BASE) {
    // Graceful degradation: log only, return success to not block UX
    console.warn('Airtable not configured — email logged only.');
    return res.status(200).json({ ok: true, mode: 'log-only' });
  }

  try {
    const airtableRes = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE}/${encodeURIComponent(AIRTABLE_TABLE)}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AIRTABLE_KEY}`,
        },
        body: JSON.stringify({
          fields: {
            Email:    email,
            Prénom:   prenom || '',
            Cohorte:  cohorte || '',
            Date:     new Date().toISOString().split('T')[0],
          },
        }),
      }
    );

    if (!airtableRes.ok) {
      const errBody = await airtableRes.text();
      console.error('Airtable error:', airtableRes.status, errBody);
      // Return success anyway — subscriber UX > tracking
      return res.status(200).json({ ok: true, mode: 'airtable-error' });
    }

    return res.status(200).json({ ok: true, mode: 'airtable' });

  } catch (err) {
    console.error('subscribe error:', err);
    return res.status(200).json({ ok: true, mode: 'error-fallback' });
  }
}
