// =====================================================================
// /api/get-signed-url.js
// Génère un lien temporaire (1h) vers une vidéo ou un PDF d'une formation,
// uniquement si l'utilisateur connecté a bien acheté cette formation.
// =====================================================================

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    // 1. Vérifier l'utilisateur connecté
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

    // 2. Récupérer la leçon demandée
    const { contentId } = req.body;
    const { data: contenu, error: contenuError } = await supabase
      .from('formation_contenu')
      .select('id, formation_id, chemin_storage')
      .eq('id', contentId)
      .single();

    if (contenuError || !contenu) {
      return res.status(404).json({ error: 'Contenu introuvable' });
    }

    // 3. Vérifier que l'utilisateur a bien acheté cette formation
    const { data: achat, error: achatError } = await supabase
      .from('achats_formations')
      .select('id')
      .eq('user_id', user.id)
      .eq('formation_id', contenu.formation_id)
      .eq('statut', 'paye')
      .maybeSingle();

    if (achatError || !achat) {
      return res.status(403).json({ error: "Tu n'as pas accès à cette formation" });
    }

    // 4. Générer l'URL signée temporaire (1h)
    const { data: signedData, error: signedError } = await supabase
      .storage
      .from('formations-content')
      .createSignedUrl(contenu.chemin_storage, 3600);

    if (signedError || !signedData) {
      return res.status(500).json({ error: 'Impossible de générer le lien' });
    }

    return res.status(200).json({ url: signedData.signedUrl });
  } catch (err) {
    console.error('Erreur get-signed-url:', err);
    return res.status(500).json({ error: 'Erreur serveur, réessaie dans un instant.' });
  }
};
