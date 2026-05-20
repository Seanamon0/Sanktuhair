export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { diagnostic, email, prenom } = req.body;
  if (!diagnostic) return res.status(400).json({ error: 'Diagnostic requis' });

  const today = new Date();
  const dateStr = today.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

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
          content: `Tu es Seanamon — trichologue experte et gardienne des couronnes. Tu crées des programmes capillaires ultra-précis sur 30 jours à partir d'un diagnostic capillaire.

Tu dois générer un programme jour par jour depuis aujourd'hui (${dateStr}) jusqu'à dans 30 jours.

Format STRICT pour chaque jour :

JOUR [numéro] — [date complète]
[MATIN ou SOIR ou MATIN & SOIR]
- [tâche précise avec produit, geste, durée]
- [tâche suivante]

Types de tâches possibles selon le profil :
- WASH DAY complet : détrempage, shampoing, après-shampoing, masque, rinçage, leave-in, sceller
- Huiler les pointes : huile spécifique, quantité, geste
- Sérum cuir chevelu : produit, zones, massage
- Coupe des pointes : fréquence recommandée
- Coiffure protectrice : type, mise en place
- Hydratation quotidienne : méthode LOC ou LCO
- Massage cuir chevelu : durée, huile, technique
- Nuit : bonnet de satin, soin de nuit si nécessaire

Sois ULTRA précise sur :
- Les produits naturels spécifiques (karité, aloe vera, huile de ricin, etc.)
- Les quantités (noisette, 3-4 gouttes, etc.)
- L'ordre d'application exact
- Le timing (combien de minutes laisser poser)
- Matin ou soir

Base-toi UNIQUEMENT sur le diagnostic fourni pour personnaliser chaque recommandation.`
        },
        {
          role: 'user',
          content: `Voici le diagnostic capillaire de ${prenom || 'cette personne'} :\n\n${diagnostic}\n\nGénère son programme capillaire complet sur 30 jours à partir du ${dateStr}.`
        }
      ],
      max_tokens: 4000,
      temperature: 0.7
    })
  });

  const data = await response.json();
  const result = data.choices?.[0]?.message?.content;

  if (!result) return res.status(500).json({ error: 'Erreur lors de la génération' });

  res.status(200).json({ result });
}
