export const maxDuration = 60;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const OPENAI_KEY = process.env.OPENAI_API_KEY;
  
  // DEBUG — on log la clé (masquée)
  console.log('Clé présente:', !!OPENAI_KEY);
  console.log('Début clé:', OPENAI_KEY ? OPENAI_KEY.substring(0, 10) : 'ABSENTE');

  if (!OPENAI_KEY) {
    return res.status(500).json({ error: 'Clé OpenAI manquante' });
  }

  const { prenom, content } = req.body;
  const systemPrompt = `Tu es Seanamon, l'experte Trichologue spécialisée en couronnes texturées. Ton regard est clinique, mais ton ton est celui d'une coach de confiance. Tutoie l'utilisatrice par son prénom. RÈGLES DE STYLE : 1/ ZÉRO Markdown. 2/ EMOJIS AUTORISÉS UNIQUEMENT : ✨ 🌱 🌸 💕 🌿 🍃. 3/ Titres : Chiffre. Titre avec majuscule. 4/ Laisse une ligne vide entre chaque section. INTERDITS : Ne JAMAIS utiliser crépus, chevelure ou crinière. Utilise exclusivement Couronne. STRUCTURE OBLIGATOIRE : 1. Le petit mot de Seanamon : 2. Diagnostic technique : 3. Ton ordonnance produit : 4. Ton rituel de scellage détaillé : 5. Le conseil bien-être :`;

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

    console.log('OpenAI status:', openaiRes.status);

    if (!openaiRes.ok) {
      const errBody = await openaiRes.text();
      console.error('OpenAI error:', errBody);
      return res.status(502).json({ error: 'OpenAI error', detail: errBody });
    }

    const data = await openaiRes.json();
    const result = data.choices?.[0]?.message?.content || '';
    return res.status(200).json({ result });

  } catch (err) {
    console.error('Catch error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
