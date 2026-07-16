// =====================================================================
// /api/stripe-webhook.js
// Reçoit les événements Stripe. Quand un paiement est confirmé, enregistre
// l'achat dans Supabase pour débloquer l'accès à la formation.
//
// Variables d'environnement Vercel nécessaires en plus des précédentes :
//   STRIPE_WEBHOOK_SECRET   -> obtenu quand tu crées le webhook dans le
//                              Dashboard Stripe (whsec_...)
//
// ⚠️ Cette fonction a besoin du corps brut (raw body) de la requête pour
// vérifier la signature Stripe, d'où la config ci-dessous.
// =====================================================================

const Stripe = require('stripe');
const { createClient } = require('@supabase/supabase-js');
const { buffer } = require('micro');

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports.config = {
  api: { bodyParser: false },
};

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  let event;
  try {
    const rawBody = await buffer(req);
    const signature = req.headers['stripe-signature'];
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Signature webhook invalide:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const formationId = session.metadata?.formation_id;
    const userId = session.metadata?.user_id;

    if (formationId && userId) {
      const { error } = await supabase
        .from('achats_formations')
        .insert({
          user_id: userId,
          formation_id: parseInt(formationId, 10),
          statut: 'paye',
          stripe_session_id: session.id,
          montant: session.amount_total,
        });

      if (error) {
        console.error('Erreur insertion Supabase:', error);
        // On répond quand même 200 pour éviter que Stripe ne renvoie l'event
        // en boucle ; l'erreur est loggée pour investigation manuelle.
      }
    }
  }

  return res.status(200).json({ received: true });
};
