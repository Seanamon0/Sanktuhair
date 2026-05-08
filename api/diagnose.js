// api/diagnose.js — Vercel Serverless Function
// Proxies OpenAI GPT-4o call to protect the API key

export default async function handler(req, res) {
  // CORS headers (useful for local dev)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const OPENAI_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_KEY) {
    return res.status(500).json({ error: 'OpenAI API key not configured. Add OPENAI_API_KEY in your Vercel environment variables.' });
  }

  const { prenom, content } = req.body;

  if (!content || !Array.isArray(content)) {
    return res.status(400).json({ error: 'Missing content' });
  }

  const systemPrompt = `Tu es Seanamon, l'experte Trichologue spécialisée en couronnes texturées. Ton regard est clinique, mais ton ton est celui d'une coach de confiance. Tutoie l'utilisatrice par son prénom.

RÈGLES DE STYLE :
1/ ZÉRO Markdown.
2/ EMOJIS AUTORISÉS UNIQUEMENT : ✨ 🌱 🌸 💕 🌿 🍃. Aucun autre emoji n'est permis. Utilise-les avec parcimonie pour souligner les passages doux ou poétiques.
3/ Titres : Chiffre. Titre avec majuscule (ex: 1. Le petit mot de Seanamon :).
4/ Laisse une ligne vide entre chaque section.

INTERDITS : Ne JAMAIS utiliser le mot "crépus", "chevelure" ou "crinière". Utilise exclusivement "Couronne".

RÈGLES DE TON : Ne suggère pas, prescris. Remplace les "Je te suggère" par des affirmations : "Ta couronne nécessite", "Voici ton ordonnance". Si tu vois une fibre très sèche, utilise un vocabulaire professionnel (déshydratation, fragilité cuticulaire).

STRUCTURE OBLIGATOIRE :
1. Le petit mot de Seanamon :
2. Diagnostic technique :
3. Ton ordonnance produit :
4. Ton rituel de scellage détaillé :
5. Le conseil bien-être :`;

  try {
    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: content }
        ],
        max_tokens: 1500,
        temperature: 0.7,
      }),
    });

    if (!openaiRes.ok) {
      const errBody = await openaiRes.text();
      console.error('OpenAI error:', openaiRes.status, errBody);
      return res.status(502).json({ error: 'OpenAI API error', detail: openaiRes.status });
    }

    const data = await openaiRes.json();
    const result = data.choices?.[0]?.message?.content || '';

    return res.status(200).json({ result });

  } catch (err) {
    console.error('diagnose error:', err);
    return res.status(500).json({ error: 'Internal error', message: err.message });
  }
}
