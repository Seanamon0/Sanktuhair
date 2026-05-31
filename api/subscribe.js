import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { email, cohorte, prenom } = req.body;
  if (!email) return res.status(400).json({ error: 'Email requis' });

  // 1. Sauvegarde en base
  const { error: dbError } = await supabase
    .from('subscribers')
    .upsert({ email, cohorte, prenom }, { onConflict: 'email' });

  if (dbError) return res.status(500).json({ error: 'Erreur base de données' });

  // 2. Envoi du mail de bienvenue via Brevo
  try {
    await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': process.env.BREVO_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: 'Sankhtuhair', email: 'sanktuhair@gmail.com' },
        to: [{ email }],
        subject: '👑 Ta couronne est enregistrée, ' + (prenom || 'Reine') + '.',
        htmlContent: `
          <div style="background:#0F2922;padding:40px 32px;font-family:Georgia,serif;max-width:520px;margin:0 auto;border-radius:12px">
            <p style="font-size:11px;letter-spacing:.35em;text-transform:uppercase;color:#8a6e42;margin:0 0 20px">Sanctuaire Capillaire · IA</p>
            <h1 style="font-size:28px;font-weight:300;color:#e8dcc8;margin:0 0 8px">
              Bienvenue, <em style="color:#c9a96e;font-style:italic">${prenom || 'Reine'}</em>.
            </h1>
            <p style="font-size:15px;color:#a89880;font-style:italic;margin:0 0 28px">Ta couronne est maintenant enregistrée dans le Sanctuaire.</p>
            <hr style="border:none;border-top:1px solid #2a4a38;margin:0 0 28px">
            <p style="font-size:14px;color:#a89880;line-height:1.7;margin:0 0 12px">
              Tu fais partie des <strong style="color:#c9a96e">150 Pionniers</strong> qui auront accès en avant-première à l'agenda de soin personnalisé Sankhtuhair.
            </p>
            <p style="font-size:14px;color:#a89880;line-height:1.7;margin:0 0 28px">
              Cohorte : <strong style="color:#e8dcc8">${cohorte || 'Fondateur·rice'}</strong>
            </p>
            <hr style="border:none;border-top:1px solid #2a4a38;margin:0 0 24px">
            <p style="font-size:12px;color:#5a4e3e;font-style:italic;margin:0">
              « Va chercher dans ton passé ce qui te rendra plus forte demain »<br>
              <span style="color:#6a6a6a">— Seanamon, Sankhtuhair</span>
            </p>
          </div>
        `,
      }),
    });
  } catch (mailError) {
    console.error('Erreur envoi mail:', mailError);
  }

  res.status(200).json({ success: true });
}
