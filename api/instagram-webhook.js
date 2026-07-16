// api/instagram-webhook.js
//
// Fonction serverless Vercel — reçoit les événements Instagram (nouveaux commentaires),
// et si le commentaire contient un mot-clé actif (et correspond au post ciblé, si précisé) :
//   1. Répond publiquement sous le commentaire (une des 3 variantes, choisie au hasard)
//   2. Attend le délai configuré (si renseigné)
//   3. Envoie un message privé — avec un vrai bouton cliquable si un lien est configuré
//
// Variables d'environnement nécessaires (Vercel → Settings → Environment Variables) :
//   - IG_VERIFY_TOKEN, IG_PAGE_ACCESS_TOKEN, IG_USER_ID, META_APP_SECRET,
//     SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

const crypto = require('crypto');

module.exports = async function handler(req, res) {
  // ---------- 1. Vérification du webhook par Meta (requête GET) ----------
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === process.env.IG_VERIFY_TOKEN) {
      return res.status(200).send(challenge);
    }
    return res.status(403).send('Verification failed');
  }

  // ---------- 2. Réception d'un événement (requête POST) ----------
  if (req.method === 'POST') {
    const signature = req.headers['x-hub-signature-256'];
    if (!isValidSignature(req.body, signature)) {
      return res.status(401).send('Invalid signature');
    }

    try {
      const entries = req.body.entry || [];

      for (const entry of entries) {
        const changes = entry.changes || [];

        for (const change of changes) {
          if (change.field !== 'comments') continue;

          const commentText = (change.value?.text || '').toLowerCase();
          const commentId = change.value?.id;
          const postId = change.value?.media?.id || null;
          if (!commentText || !commentId) continue;

          const automation = await findMatchingAutomation(commentText, postId);
          if (automation) {
            await handleAutomation(commentId, automation);
          }
        }
      }

      return res.status(200).send('EVENT_RECEIVED');
    } catch (err) {
      console.error('Erreur webhook Instagram:', err);
      return res.status(500).send('Internal error');
    }
  }

  return res.status(405).send('Method not allowed');
}

function isValidSignature(body, signatureHeader) {
  if (!signatureHeader) return false;
  const expected = 'sha256=' + crypto
    .createHmac('sha256', process.env.META_APP_SECRET)
    .update(JSON.stringify(body))
    .digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(signatureHeader), Buffer.from(expected));
  } catch {
    return false;
  }
}

async function findMatchingAutomation(commentText, postId) {
  const res = await fetch(
    `${process.env.SUPABASE_URL}/rest/v1/instagram_automations?actif=eq.true&select=*`,
    {
      headers: {
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
      }
    }
  );
  const automations = await res.json();

  return automations.find(a => {
    const keywordMatches = commentText.includes(a.mot_cle.toLowerCase());
    const postMatches = !a.post_id || a.post_id === postId;
    return keywordMatches && postMatches;
  }) || null;
}

async function handleAutomation(commentId, automation) {
  // 1. Réponse publique sous le commentaire (une des 3 variantes, au hasard)
  const publicReplies = [automation.reponse_publique_1, automation.reponse_publique_2, automation.reponse_publique_3]
    .filter(Boolean);
  if (publicReplies.length > 0) {
    const chosen = publicReplies[Math.floor(Math.random() * publicReplies.length)];
    await postPublicReply(commentId, chosen);
  }

  // 2. Délai avant l'envoi du message privé (plafonné à 8s pour rester dans les limites Vercel)
  const delaiMs = Math.min(Number(automation.delai_secondes) || 0, 8) * 1000;
  if (delaiMs > 0) {
    await new Promise(resolve => setTimeout(resolve, delaiMs));
  }

  // 3. Message privé (avec bouton cliquable si un lien est configuré)
  await sendPrivateReply(commentId, automation);
}

// Réponse publique visible sous le commentaire
async function postPublicReply(commentId, message) {
  const url = `https://graph.facebook.com/v19.0/${commentId}/replies`;
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, access_token: process.env.IG_PAGE_ACCESS_TOKEN })
  });
}

// Message privé envoyé en réponse au commentaire.
// Adresse correcte selon la doc officielle Meta : POST /{IG_USER_ID}/messages
// avec recipient.comment_id (et non /{comment_id}/private_replies comme dans une version précédente).
async function sendPrivateReply(commentId, automation) {
  const url = `https://graph.facebook.com/v19.0/${process.env.IG_USER_ID}/messages?access_token=${process.env.IG_PAGE_ACCESS_TOKEN}`;

  let message;
  if (automation.lien && automation.bouton_texte) {
    // Message avec un vrai bouton cliquable (Button Template Instagram)
    message = {
      attachment: {
        type: 'template',
        payload: {
          template_type: 'button',
          text: automation.message,
          buttons: [
            { type: 'web_url', url: automation.lien, title: automation.bouton_texte.slice(0, 20) }
          ]
        }
      }
    };
  } else {
    // Pas de bouton configuré : message texte simple (avec le lien collé si présent)
    const text = automation.lien ? `${automation.message}\n\n${automation.lien}` : automation.message;
    message = { text };
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      recipient: { comment_id: commentId },
      message
    })
  });

  const data = await response.json();
  if (data.error) {
    console.error('Erreur envoi message privé Instagram:', data.error);
  }
}
