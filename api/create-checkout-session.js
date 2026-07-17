// =====================================================================
// /api/create-checkout-session.js
// Crée une session de paiement Stripe pour une formation donnée.
// Appelée depuis formation-detail.html quand le client clique "Acheter".
//
// Variables d'environnement Vercel nécessaires (Settings > Environment
// Variables sur ton projet Vercel) :
//   STRIPE_SECRET_KEY       -> clé secrète Stripe (sk_live_... ou sk_test_...)
//   SUPABASE_URL            -> déjà utilisée ailleurs sur le site
//   SUPABASE_SERVICE_ROLE_KEY -> clé "service_role" Supabase (PAS la clé anon,
//                                 Settings > API dans Supabase)
//   SITE_URL                -> ex: https://return-to-perf-club.vercel.app
// =====================================================================

const Stripe = require('stripe');
const { createClient } = require('@supabase/supabase-js');

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    // 1. Vérifier que l'utilisateur est bien connecté (token Supabase)
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData?.user) {
      return res.status(401).json({ error: 'Session invalide' });
    }
    const user = userData.user;

    // 2. Vérifier la formation demandée (source de vérité : Supabase)
    const { formationId } = req.body;
    const { data: formation, error: formationError } = await supabase
      .from('formations')
      .select('id, stripe_price_id, actif')
      .eq('id', formationId)
      .eq('actif', true)
      .single();

    if (formationError || !formation || !formation.stripe_price_id) {
      return res.status(400).json({ error: 'Formation inconnue ou indisponible' });
    }
    const priceId = formation.stripe_price_id;

    // 3. Créer la session Stripe
    const siteUrl = process.env.SITE_URL || `https://${req.headers.host}`;

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: user.email,
      success_url: `${siteUrl}/formation-merci.html?formation=${formationId}`,
      cancel_url: `${siteUrl}/formation-detail.html?id=${formationId}`,
      metadata: {
        formation_id: String(formationId),
        user_id: user.id,
      },
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Erreur create-checkout-session:', err);
    return res.status(500).json({ error: 'Erreur serveur, réessaie dans un instant.' });
  }
};
