import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { email, cohorte, prenom } = req.body;
  if (!email) return res.status(400).json({ error: 'Email requis' });

  const { error } = await supabase
    .from('subscribers')
    .upsert({ email, cohorte, prenom }, { onConflict: 'email' });

  if (error) return res.status(500).json({ error: 'Erreur base de données' });

  res.status(200).json({ success: true });
}
