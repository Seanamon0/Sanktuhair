import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const { token } = req.query;
  if (!token) return res.status(400).json({ error: 'Token manquant' });

  // Valider le token
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

  // Récupérer le prénom depuis subscribers
  const { data: sub } = await supabase
    .from('subscribers')
    .select('prenom')
    .eq('email', data.email)
    .single();

  // Récupérer le dernier diagnostic
  const { data: diag } = await supabase
    .from('diagnostics')
    .select('diagnostic, created_at')
    .eq('email', data.email)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  res.status(200).json({
    email: data.email,
    prenom: sub?.prenom || null,
    diagnostic: diag?.diagnostic || null
  });
}
