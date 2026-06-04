import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { prenom, content, imgs, email, description } = req.body;

  // Construire le message utilisateur
  let userContent = [];

  // Texte descriptif d'abord
  const textBlock = content?.find(b => b.type === 'text');
  if (textBlock) {
    userContent.push({ type: 'text', text: textBlock.text });
  } else if (description) {
    userContent.push({ type: 'text', text: description });
  }

  // Photos ensuite — envoyées comme données brutes sans mention "photo de personne"
  if (imgs) {
    for (const key of Object.keys(imgs)) {
      if (imgs[key]) {
        userContent.push({
          type: 'image_url',
          image_url: { url: imgs[key], detail: 'high' }
        });
      }
    }
  }

  const systemPrompt = `Tu es Seanamon, experte en trichologie et en soins capillaires afro, bouclés et texturés.

Ton rôle : analyser le profil capillaire décrit et les images de cheveux fournies, puis délivrer un diagnostic précis et une ordonnance capillaire personnalisée.

Les images montrent uniquement des cheveux et un cuir chevelu. Concentre-toi exclusivement sur :
- La texture et le type de cheveu (1a à 4c)
- L'état des cuticules et la porosité
- La densité et l'épaisseur
- L'état du cuir chevelu
- Les dommages visibles (casse, fourches, sécheresse)

Réponds TOUJOURS en français. Sois directe, précise et bienveillante.

Structure ta réponse EXACTEMENT ainsi :

1. Identité de ta Couronne :
[Type exact avec sous-type, porosité estimée, densité, état des cuticules]

2. État actuel du Cuir Chevelu :
[Diagnostic précis]

3. Problématiques Identifiées :
[Chaque problème avec explication]

4. Les Coupables :
[Causes exactes — produits, gestes, habitudes, facteurs internes]

5. Ton Ordonnance Seanamon :
[Protocole précis : produits naturels, gestes, fréquences, ordre d'application]

6. Rituels Ancestraux Recommandés :
[Pratiques traditionnelles pan-africaines adaptées]

7. Ce que tu dois arrêter immédiatement :
[Liste noire personnalisée]`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent.length > 0 ? userContent : 'Analyse mon profil capillaire.' }
      ],
      max_tokens: 1500,
      temperature: 0.7
    })
  });

  const data = await response.json();
  const result = data.choices?.[0]?.message?.content;

  if (!result) return res.status(500).json({ error: 'Erreur lors du diagnostic' });

  if (email) {
    await supabase.from('diagnostics').insert({ email, prenom: prenom || null, result });
  }

  res.status(200).json({ result });
}
