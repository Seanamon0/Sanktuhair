import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { randomBytes } from 'crypto';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { email, cohorte, prenom } = req.body;
  if (!email) return res.status(400).json({ error: 'Email requis' });

  const { error: dbError } = await supabase
    .from('Users')
    .upsert({ email, cohorte, prenom }, { onConflict: 'email' });
  if (dbError) return res.status(500).json({ error: 'Erreur base de donnees' });

  await supabase
    .from('diagnostics')
    .update({ user_email: email })
    .eq('prenom', prenom)
    .neq('user_email', email);

  const token = randomBytes(32).toString('hex');
  const expires_at = new Date(Date.now() + 15 * 60 * 1000).toISOString();
  await supabase.from('magic_tokens').insert({ email, token, expires_at });

  const magicLink = process.env.SITE_URL + '/member.html?token=' + token;
  const nom = prenom || 'Reine';

  await resend.emails.send({
    from: 'Sankhtuhair <onboarding@resend.dev>',
    to: email,
    subject: nom + ', ton Sanctuaire t attend',
    html: '<div style="background:#0F2922;padding:40px 32px;font-family:Georgia,serif;max-width:520px;margin:0 auto;border-radius:12px">'
      + '<p style="font-size:11px;letter-spacing:.35em;text-transform:uppercase;color:#8a6e42;margin:0 0 20px">Sanctuaire Capillaire</p>'
      + '<h1 style="font-size:26px;font-weight:300;color:#e8dcc8;margin:0 0 16px">Maintenant que tu as revele ta couronne, rejoins ton Sanctuaire.</h1>'
      + '<p style="font-size:14px;color:#a89880;line-height:1.7;margin:0 0 28px">Consulte ton diagnostic et ton agenda de soin personnalise.</p>'
      + '<a href="' + magicLink + '" style="display:inline-block;padding:14px 32px;background:#c9a96e;color:#0F2922;text-decoration:none;border-radius:50px;font-size:13px;font-weight:500;letter-spacing:.15em;text-transform:uppercase">Acceder a mon Sanctuaire</a>'
      + '<p style="margin-top:32px;font-size:11px;color:#5a4e3e;font-style:italic">Ce lien expire dans 15 minutes.</p>'
      + '</div>'
  });

  res.status(200).json({ success: true });
}
