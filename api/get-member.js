import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const { token } = req.query;
  if (!token) return res.status(400).json({ error: 'Token manquant' });

  // Chercher le token dans Supabase
  const { data, error } = await supabase
    .from('magic_tokens')
    .select('*')
    .eq('token', token)
    .eq('used', false)
    .gt('expires_at', new Date().toISOString())
    .single();

  if (error || !data) {
    return res.status(401).json({ error: 'Lien invalide ou expiré' });
  }

  // Marquer le token comme utilisé
  await supabase
    .from('magic_tokens')
    .update({ used: true })
    .eq('id', data.id);

  // Retourner l'email de l'utilisateur
  res.status(200).json({ email: data.email });
}
