// =====================================================================
// /api/import-youtube-playlist.js
// Récupère toutes les vidéos d'une playlist YouTube publique/non
// répertoriée (titre + lien), en gérant la pagination automatiquement.
// =====================================================================

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    const { playlistUrl } = req.body;
    if (!playlistUrl) {
      return res.status(400).json({ error: 'Lien de playlist manquant' });
    }

    const match = playlistUrl.match(/[?&]list=([a-zA-Z0-9_-]+)/);
    const playlistId = match ? match[1] : playlistUrl.trim();

    let videos = [];
    let pageToken = '';

    do {
      const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${encodeURIComponent(playlistId)}&key=${process.env.YOUTUBE_API_KEY}${pageToken ? `&pageToken=${pageToken}` : ''}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.error) {
        return res.status(400).json({ error: data.error.message || 'Erreur YouTube API — vérifie que le lien de playlist est correct.' });
      }

      (data.items || []).forEach((item) => {
        const videoId = item.snippet?.resourceId?.videoId;
        const title = item.snippet?.title;
        if (videoId && title && title !== 'Deleted video' && title !== 'Private video') {
          videos.push({
            nom: title,
            youtube_id: videoId,
            lien_video: `https://www.youtube.com/watch?v=${videoId}`,
          });
        }
      });

      pageToken = data.nextPageToken || '';
    } while (pageToken);

    if (videos.length === 0) {
      return res.status(400).json({ error: "Aucune vidéo trouvée. Vérifie que le lien de playlist est correct et que la playlist n'est pas privée." });
    }

    return res.status(200).json({ videos });
  } catch (err) {
    console.error('Erreur import-youtube-playlist:', err);
    return res.status(500).json({ error: 'Erreur serveur, réessaie dans un instant.' });
  }
};
