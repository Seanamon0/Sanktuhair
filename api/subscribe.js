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
  const { email, cohorte, prenom } = req.body;
  if (!email) return res.status(400).json({ error: 'Email requis' });

  // 1. Sauvegarde en base
  const { error: dbError } = await supabase
    .from('subscribers')
    .upsert({ email, cohorte, prenom }, { onConflict: 'email' });
  if (dbError) return res.status(500).json({ error: 'Erreur base de données' });

  // 2. Rattacher le diagnostic au vrai email
  await supabase
    .from('diagnostics')
    .update({ user_email: email })
    .eq('prenom', prenom)
    .neq('user_email', email);

  // 3. Générer le magic link
  const token = crypto.randomBytes(32).toString('hex');
  const expires_at = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  await supabase
    .from('magic_tokens')
    .insert({ email, token, expires_at });

  const magicLink = `${process.env.SITE_URL}/member.html?token=${token}`;

  // 4. Envoyer le mail via Resend
  try {
    await resend.emails.send({
      from: 'Sankhtuhair <onboarding@re
