// =====================================================================
// /api/notify-lead.js
// Envoie un e-mail à Erwan à chaque fois qu'un bilan (genou/épaule)
// est complété avec des coordonnées laissées.
// =====================================================================

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    const { zone, nom, telephone, score, commentaire } = req.body;

    const zoneLabel = zone === 'genou' ? 'Genou' : zone === 'epaule' ? 'Épaule' : zone;

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Return To Perf <onboarding@resend.dev>',
        to: ['erwan.amirault@gmail.com'],
        subject: `📩 Nouveau bilan ${zoneLabel} — ${nom || 'Sans nom'} (${score}/100)`,
        html: `
          <h2>Nouveau bilan ${zoneLabel}</h2>
          <p><strong>Nom :</strong> ${nom || '—'}</p>
          <p><strong>Téléphone :</strong> ${telephone || '—'}</p>
          <p><strong>Score :</strong> ${score}/100</p>
          ${commentaire ? `<p><strong>Précision laissée :</strong> ${commentaire}</p>` : ''}
        `,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Erreur Resend:', errText);
      // On ne bloque jamais l'utilisateur pour un souci d'email : on répond quand même 200
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Erreur notify-lead:', err);
    // Idem : erreur silencieuse côté utilisateur
    return res.status(200).json({ ok: true });
  }
};
