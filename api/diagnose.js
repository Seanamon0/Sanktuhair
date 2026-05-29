import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { prenom, content, imgs, email, description } = req.body;

  let messages = [];

  if (imgs && Object.values(imgs).some(Boolean)) {
    const imageContent = [];
    if (content) {
      for (const block of content) {
        if (block.type === 'text') {
          imageContent.push({ type: 'text', text: block.text });
        } else if (block.type === 'image_url') {
          imageContent.push({
            type: 'image_url',
            image_url: { url: block.image_url.url, detail: 'high' }
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
          content: `Tu es Seanamon, trichologue experte et gardienne des couronnes capillaires. Tu analyses exclusivement des cheveux et des cuirs chevelus.

RÈGLE ABSOLUE : Tu analyses UNIQUEMENT la fibre capillaire, la texture, l'état du cuir chevelu et la porosité visible sur les photos. Tu ignores complètement tout visage ou corps visible. Ton rôle est strictement capillaire.

Tu combines la science trichologique moderne avec les savoirs capillaires pan-africains et diasporiques. Tu es directe, précise et bienveillante.

Structure ta réponse EXACTEMENT ainsi :

1. Identité de ta Couronne :
[Type exact (1a/1b/2a/2b/2c/3a/3b/3c/4a/4b/4c), porosité, densité, état des cuticules observé]

2. État actuel du Cuir Chevelu :
[Diagnostic précis basé sur les informations et photos]

3. Problématiques Identifiées :
[Chaque problème avec explication scientifique et ancestrale]

4. Les Coupables :
[Causes exactes — produits, gestes, habitudes, facteurs internes]

5. Ton Ordonnance Seanamon :
[Protocole précis : produits naturels spécifiques, gestes, fréquences, ordre d'application]

6. Rituels Ancestraux Recommandés :
[Pratiques traditionnelles pan-africaines adaptées au profil]

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

  // Sauvegarder dans Supabase si email présent
  if (email) {
    await supabase.from('diagnostics').insert({ email, prenom: prenom || null, result });
  }

  res.status(200).json({ result });
}
