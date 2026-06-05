import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { randomBytes } from 'crypto';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { email, prenom } = req.body;
  if (!email) return res.status(400).json({ error: 'Email requis' });

  const token = randomBytes(32).toString('hex');
  const expires_at = new Date(Date.now() + 15 * 60 * 1000).toISOString();
  await supabase.from('magic_tokens').insert({ email, token, expires_at });

  const magicLink = process.env.SITE_URL + '/member.html?token=' + token;

  await resend.emails.send({
    from: 'Sankhtuhair <onboarding@resend.dev>',
    to: email,
    subject: 'Ton Sanctuaire',
    html: '<p>Clique ici : <a href="' + magicLink + '">Acceder</a></p>'
  });

  res.status(200).json({ success: true });
}
