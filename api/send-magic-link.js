import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import crypto from 'crypto';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email requis' });

  // Générer un token unique
  const token = crypto.randomBytes(32).toString('hex');
  const expires_at = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  // Sauvegarder dans Supabase
  const { error } = await supabase
    .from('magic_tokens')
    .insert({ email, token, expires_at });

  if (error) return res.status(500).json({ error: 'Erreur base de données' });

  // Envoyer l'email
  const magicLink = `${process.env.SITE_URL}/member.html?token=${token}`;

  await resend.emails.send({
    from: 'Sankhtuhair <onboarding@resend.dev>',
    to: email,
    subject: '✨ Ton accès à ton espace membre',
    html: `
      <div style="font-family: Georgia, serif; max-width: 500px; margin: 0 auto; padding: 40px; background: #fdf9f4;">
        <h2 style="color: #3d2b1f;">Bienvenue dans ton sanctuaire 🌿</h2>
        <p>Clique sur le lien ci-dessous pour accéder à ton espace membre. Il expire dans <strong>15 minutes</strong>.</p>
        <a href="${magicLink}" style="display: inline-block; margin: 24px 0; padding: 14px 28px; background: #3d2b1f; color: white; text-decoration: none; border-radius: 8px;">
          Accéder à mon espace →
        </a>
        <p style="color: #888; font-size: 12px;">Si tu n'as pas demandé cet accès, ignore cet email.</p>
      </div>
    `
  });

  res.status(200).json({ success: true });
}
