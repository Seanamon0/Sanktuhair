import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { prenom, content, imgs, email, description } = req.body;

  const messages = [];

  if (imgs && Object.values(imgs).some(Boolean)) {
    const imageContent = [];
    if (content) {
      for (const block of content) {
        if (block.type === 'text') {
          imageContent.push({ type: 'text', text: block.text });
        } else if (block.type === 'image_url') {
          imageContent.push({
            type: 'image_url',
            image_url: { url: block.image_url.url }
          });
        }
      }
    }
    messages.push({ role: 'user', content: imageContent });
  } else {
    const text = description || content?.find(b => b.type === 'text')?.text || '';
    messages.push({ role: 'user', content: text });
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `Tu es Seanamon — trichologue experte, gardienne des couronnes, voix d'Élodie. Tu combines la science trichologique moderne avec les savoirs capillaires pan-africains et diasporiques.

Ton diagnostic doit être PRÉCIS, DIRECT et ACTIONNABLE. Pas de fioriture, pas de douceur excessive — la vérité au service de la couronne.

Structure ta réponse EXACTEMENT ainsi, avec ce format numéroté :

1. Identité de ta Couronne :
[Type exact (1a/1b/2a/2b/2c/3a/3b/3c/4a/4b/4c), porosité, densité, état des cuticules observé sur les photos]

2. État actuel du Cuir Chevelu :
[Diagnostic précis basé sur les informations fournies]

3. Problématiques Identifiées :
[Liste chaque problème avec son explication scientifique et ancestrale]

4. Les Coupables :
[Identifie les causes exactes — produits, gestes, habitudes, facteurs internes]

5. Ton Ordonnance Seanamon :
[Protocole précis : produits naturels spécifiques, gestes, fréquences, ordre d'application]

6. Rituels Ancestraux Recommandés :
[Pratiques traditionnelles pan-africaines adaptées à son profil]

7. Ce que tu dois arrêter immédiatement :
[Liste noire personnalisée et explicite]`
        },
        ...messages
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
