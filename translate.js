// Google Translate initialization
function googleTranslateElementInit() {
  new google.translate.TranslateElement({
    pageLanguage: 'en',
    includedLanguages: 'en,es',
    autoDisplay: false
  }, 'google_translate_element');
}

// Language switcher logic
(function() {
  const switcher = document.getElementById('langSwitcher');
  if (!switcher) return;

  const btn = switcher.querySelector('.lang-btn');
  const menu = switcher.querySelector('.lang-menu');
  const currentLabel = switcher.querySelector('.lang-current');
  const options = switcher.querySelectorAll('.lang-option');

  const langLabels = { en: 'EN', es: 'ES' };

  // Toggle menu with ARIA
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = switcher.classList.toggle('open');
    btn.setAttribute('aria-expanded', isOpen);
  });

  // Close on outside click
  document.addEventListener('click', () => {
    switcher.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
  });

  menu.addEventListener('click', (e) => {
    e.stopPropagation();
  });

  // Language selection
  options.forEach(option => {
    option.addEventListener('click', (e) => {
      e.preventDefault();
      const lang = option.dataset.lang;

      // Update active state
      options.forEach(o => o.classList.remove('active'));
      option.classList.add('active');
      currentLabel.textContent = langLabels[lang];
      switcher.classList.remove('open');

      // Trigger Google Translate
      if (lang === 'en') {
        // Reset to English
        const frame = document.querySelector('.goog-te-banner-frame');
        if (frame) {
          const innerDoc = frame.contentDocument || frame.contentWindow.document;
          const restoreBtn = innerDoc.querySelector('.goog-te-button button');
          if (restoreBtn) restoreBtn.click();
        }
        // Fallback: set cookie to reset
        document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.' + window.location.hostname;
        if (window.location.hash !== '') {
          window.location.reload();
        } else {
          window.location.reload();
        }
      } else {
        // Set translation cookie and trigger
        document.cookie = 'googtrans=/en/' + lang + '; path=/;';
        document.cookie = 'googtrans=/en/' + lang + '; path=/; domain=.' + window.location.hostname;

        // Try to use the Google Translate select element
        const translateSelect = document.querySelector('.goog-te-combo');
        if (translateSelect) {
          translateSelect.value = lang;
          translateSelect.dispatchEvent(new Event('change'));
        } else {
          // If widget not ready yet, reload with cookie set
          window.location.reload();
        }
      }
    });
  });

  // On load, check if already translated and update label
  const checkTranslation = () => {
    const match = document.cookie.match(/googtrans=\/en\/(\w+)/);
    if (match) {
      const lang = match[1];
      currentLabel.textContent = langLabels[lang] || lang.toUpperCase();
      options.forEach(o => {
        o.classList.toggle('active', o.dataset.lang === lang);
      });
    }
  };
  checkTranslation();
})();
