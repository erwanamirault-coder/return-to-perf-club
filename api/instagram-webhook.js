// api/instagram-webhook.js
//
// Fonction serverless Vercel — reçoit les événements Instagram (nouveaux commentaires)
// et envoie automatiquement un message privé si le commentaire contient un mot-clé actif.
//
// ⚠️ NE FONCTIONNE PAS TANT QUE :
//   1. Ton app Meta n'a pas obtenu les permissions instagram_manage_comments +
//      instagram_manage_messages via App Review
//   2. Les variables d'environnement ci-dessous ne sont pas configurées sur Vercel
//      (Vercel → ton projet → Settings → Environment Variables) :
//        - IG_VERIFY_TOKEN       (un mot de passe que TU inventes, à remettre identique
//                                  dans la config du webhook sur Meta for Developers)
//        - IG_PAGE_ACCESS_TOKEN  (fourni par Meta après connexion de ta Page)
//        - META_APP_SECRET       (visible dans Paramètres → Général de ton app Meta)
//        - SUPABASE_URL
//        - SUPABASE_SERVICE_ROLE_KEY  (clé "service_role", PAS la clé publique anon —
//                                       à récupérer dans Supabase → Project Settings → API.
//                                       Ne jamais mettre cette clé côté navigateur.)
//
// Une fois déployé, l'URL de ce webhook sera :
//   https://return-to-perf-club.vercel.app/api/instagram-webhook
// C'est cette URL qu'il faut renseigner dans Meta for Developers → Instagram → Webhooks.

import crypto from 'crypto';

export default async function handler(req, res) {
  // ---------- 1. Vérification du webhook par Meta (requête GET) ----------
  // Meta appelle cette route une seule fois, pour vérifier que le webhook t'appartient.
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
    // Vérifie que la requête vient bien de Meta (signature HMAC avec ton App Secret)
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
          if (!commentText || !commentId) continue;

          const automation = await findMatchingAutomation(commentText);
          if (automation) {
            await sendPrivateReply(commentId, automation);
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

// Cherche dans Supabase un mot-clé actif contenu dans le commentaire
async function findMatchingAutomation(commentText) {
  const res = await fetch(
    `${process.env.SUPABASE_URL}/rest/v1/instagram_automations?actif=eq.true&select=mot_cle,message,lien`,
    {
      headers: {
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
      }
    }
  );
  const automations = await res.json();

  return automations.find(a => commentText.includes(a.mot_cle.toLowerCase())) || null;
}

// Envoie un message privé en réponse au commentaire (fonctionnalité "Réponse privée" de Meta)
async function sendPrivateReply(commentId, automation) {
  const messageText = automation.lien
    ? `${automation.message}\n\n${automation.lien}`
    : automation.message;

  const url = `https://graph.facebook.com/v19.0/${commentId}/private_replies`;

  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: messageText,
      access_token: process.env.IG_PAGE_ACCESS_TOKEN
    })
  });
}
