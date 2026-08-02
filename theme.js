// Masque l'onglet "Bilan" du menu (desktop + mobile) selon le réglage admin
(async () => {
  try {
    if (typeof supabaseClient === 'undefined') return;
    const { data } = await supabaseClient
      .from('site_settings')
      .select('valeur')
      .eq('cle', 'nav_bilan_visible')
      .maybeSingle();

    // Si le réglage est absent, on n'y touche pas (visible par défaut)
    if (data && data.valeur === false) {
      document.querySelectorAll('nav a, header a').forEach((a) => {
        if (
          a.textContent.trim().toLowerCase() === 'bilan' ||
          /^(bilans?|choix-bilan)\.html$/i.test((a.getAttribute('href') || '').split('?')[0])
        ) {
          a.style.display = 'none';
        }
      });
    }
  } catch (e) {
    // Erreur silencieuse : la navigation reste visible par défaut
  }
})();
