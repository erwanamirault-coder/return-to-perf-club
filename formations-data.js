// =====================================================================
// DONNÉES DES FORMATIONS
// ⚠️ Modifie uniquement les valeurs ci-dessous, ne touche pas au reste.
// - id            : identifiant unique (ne jamais changer une fois publié,
//                    utilisé pour lier Stripe à la formation)
// - titre         : nom de la formation
// - accroche      : courte phrase affichée sur la carte (catalogue)
// - prix          : prix en euros (nombre, ex: 149)
// - image         : chemin vers ta photo (ex: "images/formation-1.jpg")
//                    laisse "" si tu n'as pas encore de photo
// - niveau        : ex "Débutant", "Intermédiaire", "Tous niveaux"
// - description   : texte complet affiché sur la page détail (peut
//                    contenir plusieurs paragraphes séparés par \n\n)
// - programme     : liste des modules / points du programme
// - stripePriceId : à remplir une fois le produit créé dans Stripe
//                    (Dashboard Stripe > Produits > copier le Price ID,
//                    commence par "price_...")
// =====================================================================

const FORMATIONS = [
  {
    id: 1,
    titre: "Formation Réathlétisation Express",
    accroche: "Comprendre et corriger les déséquilibres qui freinent ta progression.",
    prix: 149,
    image: "",
    niveau: "Tous niveaux",
    description:
      "Cette formation te donne les clés pour identifier tes propres limitations de mobilité et de stabilité, et construire un plan d'action concret pour les corriger.\n\nTu apprendras à lire les résultats d'un bilan de capacités, à prioriser les zones à travailler, et à construire une routine de rééducation adaptée à ton niveau.",
    programme: [
      "Comprendre les tests de mobilité et ce qu'ils révèlent",
      "Les erreurs les plus fréquentes en réathlétisation",
      "Construire sa routine de correction en 3 phases",
      "Savoir quand et comment progresser en charge",
    ],
    stripePriceId: "price_REMPLACER_MOI_1",
  },
  {
    id: 2,
    titre: "Formation Programmation & Hypertrophie",
    accroche: "Structurer un programme d'entraînement efficace, semaine après semaine.",
    prix: 199,
    image: "",
    niveau: "Intermédiaire",
    description:
      "Une formation orientée méthode : apprends à construire un programme d'entraînement cohérent sur plusieurs semaines, à gérer le volume et l'intensité, et à ajuster en fonction des retours du corps.\n\nParfait si tu veux sortir des programmes tout faits et comprendre la logique derrière une vraie progression.",
    programme: [
      "Les principes de la surcharge progressive",
      "Répartir le volume sur la semaine",
      "Gérer la fatigue et les semaines de décharge",
      "Adapter le programme selon les retours client",
    ],
    stripePriceId: "price_REMPLACER_MOI_2",
  },
];
