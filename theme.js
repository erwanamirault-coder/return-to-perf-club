// ============ MODE CLAIR / SOMBRE ============
// Le thème choisi est lu très tôt dans le <head> de chaque page
// (petit script inline qui ajoute la classe "light" sur <html> si besoin),
// ici on gère juste l'icône du bouton et le clic pour changer de mode.

(function () {
  const toggleBtn = document.getElementById('theme-toggle');
  if (!toggleBtn) return;

  const sunIcon = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="4"></circle>
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"></path>
    </svg>`;

  const moonIcon = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z"></path>
    </svg>`;

  function currentTheme() {
    return document.documentElement.classList.contains('light') ? 'light' : 'dark';
  }

  function renderIcon() {
    // En mode clair on montre une icône soleil, en mode sombre une lune
    toggleBtn.innerHTML = currentTheme() === 'light' ? sunIcon : moonIcon;
  }

  function applyTheme(theme) {
    if (theme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
    localStorage.setItem('theme', theme);
    renderIcon();
  }

  toggleBtn.addEventListener('click', function () {
    applyTheme(currentTheme() === 'light' ? 'dark' : 'light');
  });

  // Icône correcte dès le chargement de la page
  renderIcon();
})();

// ============ MASQUAGE DU LIEN "BILAN" SELON LE RÉGLAGE ADMIN ============
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
