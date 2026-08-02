// Masque le lien de menu dont le texte est exactement "Bilan" (comme
// affiché dans la navigation). Le bandeau promotionnel du haut n'a
// jamais ce texte exact (c'est une phrase complète), donc il n'est
// jamais concerné, peu importe où il se trouve dans la page.
(async () => {
  try {
    if (typeof supabaseClient === 'undefined') return;
    const { data } = await supabaseClient
      .from('site_settings')
      .select('valeur')
      .eq('cle', 'nav_bilan_visible')
      .maybeSingle();

    if (data && data.valeur === false) {
      document.querySelectorAll('a').forEach((a) => {
        if (a.textContent.trim() === 'Bilan') {
          a.style.display = 'none';
        }
      });
    }
  } catch (e) {
    // Erreur silencieuse : la navigation reste visible par défaut
  }
})();
