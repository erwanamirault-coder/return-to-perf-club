// api/instagram-posts.js
//
// Fonction serverless Vercel — récupère les publications Instagram récentes
// (miniature + légende) pour les afficher dans le sélecteur de posts de l'admin.
//
// Nécessite en plus des variables déjà configurées :
//   - IG_USER_ID          (l'ID numérique de ton compte Instagram, visible dans
//                           Meta for Developers → Cas d'utilisation → API Instagram,
//                           à côté de ton nom de compte, ex. 17841457897124419)
//   - ADMIN_API_SECRET     (un mot de passe que TU inventes, à mettre aussi en dur
//                           dans admin.html à l'endroit indiqué — protège cette route
//                           pour que seule ta page admin puisse l'appeler)

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).send('Method not allowed');
  }

  const providedSecret = req.headers['x-admin-secret'];
  if (providedSecret !== process.env.ADMIN_API_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const url = `https://graph.facebook.com/v19.0/${process.env.IG_USER_ID}/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp&limit=24&access_token=${process.env.IG_PAGE_ACCESS_TOKEN}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      return res.status(500).json({ error: data.error.message });
    }

    const posts = (data.data || []).map(p => ({
      id: p.id,
      caption: p.caption || '',
      thumbnail: p.media_type === 'VIDEO' ? p.thumbnail_url : p.media_url,
      permalink: p.permalink,
      timestamp: p.timestamp
    }));

    return res.status(200).json({ posts });
  } catch (err) {
    console.error('Erreur récupération posts Instagram:', err);
    return res.status(500).json({ error: 'Internal error' });
  }
}
