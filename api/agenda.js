export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { description } = req.body;
  if (!description) return res.status(400).json({ error: 'Description requise' });

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
          content: `Tu es une experte capillaire bienveillante mais directe. 
Tu crées des agendas capillaires personnalisés, concrets et réalistes.
Ton agenda doit inclure : fréquence des lavages, soins (masques, huiles), 
coiffures protectrices, et conseils de préservation au quotidien.
Sois précise sur les jours, les produits à utiliser et les gestes.
Donne un vrai programme semaine par semaine.`
        },
        {
          role: 'user',
          content: description
        }
      ],
      max_tokens: 1000,
      temperature: 0.7
    })
  });

  const data = await response.json();
  const result = data.choices?.[0]?.message?.content;

  if (!result) return res.status(500).json({ error: 'Erreur lors de la génération' });

  res.status(200).json({ result });
}
