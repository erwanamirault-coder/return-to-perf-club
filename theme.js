// Masque l'onglet "Bilan" du menu public (desktop + mobile) selon le réglage admin
// Ne cible QUE le lien exact vers bilans.html, pour ne jamais toucher aux liens admin
(async () => {
  try {
    if (typeof supabaseClient === 'undefined') return;
    const { data } = await supabaseClient
      .from('site_settings')
      .select('valeur')
      .eq('cle', 'nav_bilan_visible')
      .maybeSingle();

    if (data && data.valeur === false) {
      document.querySelectorAll('a[href="bilans.html"]').forEach((a) => {
        a.style.display = 'none';
      });
    }
  } catch (e) {
    // Erreur silencieuse : la navigation reste visible par défaut
  }
})();
