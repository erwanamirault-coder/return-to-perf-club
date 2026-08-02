// Masque UNIQUEMENT le lien "Bilan" du menu de navigation (nav), sans
// jamais toucher au bandeau promotionnel en haut de page (qui utilise
// la même adresse mais n'est pas à l'intérieur de la balise <nav>)
(async () => {
  try {
    if (typeof supabaseClient === 'undefined') return;
    const { data } = await supabaseClient
      .from('site_settings')
      .select('valeur')
      .eq('cle', 'nav_bilan_visible')
      .maybeSingle();

    if (data && data.valeur === false) {
      document.querySelectorAll('nav a[href="bilans.html"]').forEach((a) => {
        a.style.display = 'none';
      });
    }
  } catch (e) {
    // Erreur silencieuse : la navigation reste visible par défaut
  }
})();
