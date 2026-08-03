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
// Masque les liens de menu "Bilan" (espace privé) et "Bilan gratuit" (menu
// public). Comparaison en texte exact pour ne jamais toucher au bandeau
// promotionnel du haut, qui n'a jamais l'un de ces deux textes précis.
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
        const texte = a.textContent.trim();
        if (texte === 'Bilan' || texte === 'Bilan gratuit') {
          a.style.display = 'none';
        }
      });
    }
  } catch (e) {
    // Erreur silencieuse : la navigation reste visible par défaut
  }
})();

// ============ PASTILLE DE NOTIFICATION (nouvelles demandes de RDV visio) ============
// Affiche un petit badge rouge sur le lien "Admin" du menu (desktop + mobile)
// quand il existe des demandes de RDV visio non traitées. Ne s'affiche que
// pour l'admin connecté ; ne fait rien si le lien Admin n'est pas dans la page.
(async () => {
  try {
    if (typeof supabaseClient === 'undefined') return;

    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session || !session.user) return;

    const email = (session.user.email || '').toLowerCase().trim();
    if (email !== 'erwan20b@gmail.com') return;

    const { count, error } = await supabaseClient
      .from('demandes_visio')
      .select('id', { count: 'exact', head: true })
      .eq('statut', 'nouveau');

    if (error || !count) return;

    document.querySelectorAll('#admin-link-desktop, #admin-link-mobile').forEach((link) => {
      if (link.querySelector('.notif-badge')) return; // déjà ajoutée
      const badge = document.createElement('span');
      badge.className = 'notif-badge inline-flex items-center justify-center ml-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold leading-none align-middle';
      badge.textContent = count;
      link.appendChild(badge);
    });
  } catch (e) {
    // Erreur silencieuse : pas de pastille si problème
  }
})();
