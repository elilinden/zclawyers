// Navbar scroll effect
const navbar = document.getElementById('navbar');

function syncNavbarScrollState() {
  if (!navbar) return;
  navbar.classList.toggle('scrolled', window.scrollY > 50);
}

syncNavbarScrollState();
window.addEventListener('scroll', syncNavbarScrollState, { passive: true });

// Mobile menu toggle with ARIA
const navToggle = document.getElementById('navToggle');
const navMenu = document.getElementById('navMenu');
let navOverlay = null;
const navDropdownTriggers = Array.from(document.querySelectorAll('.dropdown-trigger'));

function resetMobileDropdowns() {
  document.querySelectorAll('.nav-dropdown.open').forEach(dropdown => {
    dropdown.classList.remove('open');
  });

  navDropdownTriggers.forEach(trigger => {
    trigger.setAttribute('aria-expanded', 'false');
  });
}

function closeMobileMenu() {
  if (!navToggle || !navMenu || !navOverlay) return;
  navMenu.classList.remove('open');
  navToggle.classList.remove('active');
  navOverlay.classList.remove('open');
  navToggle.setAttribute('aria-expanded', 'false');
  navMenu.setAttribute('aria-hidden', 'true');
  navOverlay.setAttribute('aria-hidden', 'true');
  resetMobileDropdowns();
}

if (navToggle && navMenu) {
  navOverlay = document.createElement('div');
  navOverlay.className = 'nav-overlay';
  navOverlay.setAttribute('aria-hidden', 'true');
  document.body.appendChild(navOverlay);

  navToggle.addEventListener('click', () => {
    const isOpen = navMenu.classList.toggle('open');
    navToggle.classList.toggle('active');
    navOverlay.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
    navMenu.setAttribute('aria-hidden', String(!isOpen));
    navOverlay.setAttribute('aria-hidden', String(!isOpen));

    if (!isOpen) {
      resetMobileDropdowns();
    }
  });

  navOverlay.addEventListener('click', closeMobileMenu);
  window.addEventListener('resize', () => {
    if (window.innerWidth > 968) {
      closeMobileMenu();
    }
  });
}

// Close mobile menu on link click (skip dropdown triggers)
document.querySelectorAll('.nav-menu a:not(.dropdown-trigger)').forEach(link => {
  link.addEventListener('click', closeMobileMenu);
});

// Mobile dropdown toggle with ARIA
document.querySelectorAll('.dropdown-trigger').forEach(trigger => {
  trigger.addEventListener('click', (e) => {
    if (window.innerWidth <= 968) {
      e.preventDefault();
      const dropdown = trigger.closest('.nav-dropdown');
      const isOpen = dropdown.classList.toggle('open');
      trigger.setAttribute('aria-expanded', String(isOpen));
    }
  });
});

// Form validation and submission
const pageLocale = (document.documentElement.lang || '').toLowerCase().startsWith('es') ? 'es' : 'en';
const formCopy = {
  en: {
    sending: 'Sending...',
    required: 'Please complete this field.',
    invalidEmail: 'Please enter a valid email address.',
    genericError: 'Something went wrong. Please try again or call us directly.',
    caseReviewSuccessTitle: 'Thank You!',
    caseReviewSuccessBody: 'Your case review request has been submitted. We\'ll be in touch shortly.',
    dsarSuccessTitle: 'Request Received',
    dsarSuccessBody: 'Your privacy request has been submitted. We\'ll follow up shortly.'
  },
  es: {
    sending: 'Enviando...',
    required: 'Por favor complete este campo.',
    invalidEmail: 'Por favor ingrese un correo electr\u00f3nico v\u00e1lido.',
    genericError: 'Algo sali\u00f3 mal. Intente de nuevo o ll\u00e1menos directamente.',
    caseReviewSuccessTitle: '\u00a1Gracias!',
    caseReviewSuccessBody: 'Su solicitud de revisi\u00f3n de caso fue enviada. Nos comunicaremos con usted pronto.',
    dsarSuccessTitle: 'Solicitud Recibida',
    dsarSuccessBody: 'Su solicitud de privacidad fue enviada. Nos comunicaremos con usted pronto.'
  }
};

function getFormMessages(form) {
  const localeMessages = formCopy[pageLocale] || formCopy.en;

  if (form.classList.contains('dsar-form')) {
    return {
      ...localeMessages,
      successTitle: localeMessages.dsarSuccessTitle,
      successBody: localeMessages.dsarSuccessBody
    };
  }

  return {
    ...localeMessages,
    successTitle: localeMessages.caseReviewSuccessTitle,
    successBody: localeMessages.caseReviewSuccessBody
  };
}

function clearFieldError(field) {
  const group = field.closest('.form-group');
  if (!group) return;
  group.classList.remove('error');
  const existing = group.querySelector('.form-error-msg');
  if (existing) existing.remove();
  field.removeAttribute('aria-invalid');
  field.removeAttribute('aria-describedby');
}

function showFieldError(field, message) {
  const group = field.closest('.form-group');
  if (!group) return;

  clearFieldError(field);
  group.classList.add('error');

  const errorEl = document.createElement('span');
  errorEl.className = 'form-error-msg';
  const fieldKey = field.id || field.name || 'field';
  const errorId = `${fieldKey}-error`;
  errorEl.id = errorId;
  errorEl.textContent = message;
  group.appendChild(errorEl);

  field.setAttribute('aria-invalid', 'true');
  field.setAttribute('aria-describedby', errorId);
}

function validateForm(form) {
  let isValid = true;
  const messages = getFormMessages(form);
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  form.querySelectorAll('input, select, textarea').forEach(field => {
    if (field.disabled || field.type === 'hidden') return;

    clearFieldError(field);

    const value = typeof field.value === 'string' ? field.value.trim() : '';
    const isRequired = field.hasAttribute('required');
    const isEmailField = field.type === 'email' || field.name === 'email';

    if (isRequired && !value) {
      showFieldError(field, messages.required);
      isValid = false;
      return;
    }

    if (value && isEmailField && !emailPattern.test(value)) {
      showFieldError(field, messages.invalidEmail);
      isValid = false;
    }
  });

  if (!isValid) {
    const firstError = form.querySelector('[aria-invalid="true"]');
    if (firstError) firstError.focus();
  }

  return isValid;
}

document.querySelectorAll('form.contact-form').forEach(form => {
  form.querySelectorAll('input, select, textarea').forEach(field => {
    if (field.type === 'hidden') return;
    field.addEventListener('input', () => clearFieldError(field));
    field.addEventListener('change', () => clearFieldError(field));
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validateForm(form)) return;

    const btn = form.querySelector('button[type="submit"]');
    const messages = getFormMessages(form);
    const defaultButtonText = btn ? (btn.dataset.defaultText || btn.textContent.trim()) : '';

    if (btn) {
      btn.dataset.defaultText = defaultButtonText;
      btn.textContent = messages.sending;
      btn.disabled = true;
    }

    try {
      const response = await fetch(form.action.replace('formsubmit.co/', 'formsubmit.co/ajax/'), {
        method: 'POST',
        body: new FormData(form),
        headers: { 'Accept': 'application/json' }
      });

      if (!response.ok) {
        throw new Error('Form submission failed');
      }

      form.innerHTML = `<div style="text-align:center;padding:40px 20px;"><h3 style="margin-bottom:12px;">${messages.successTitle}</h3><p>${messages.successBody}</p></div>`;
    } catch {
      if (btn) {
        btn.textContent = defaultButtonText;
        btn.disabled = false;
      }

      alert(messages.genericError);
    }
  });
});

// Language switcher toggle
const langSwitcher = document.getElementById('langSwitcher');
if (langSwitcher) {
  const langBtn = langSwitcher.querySelector('.lang-btn');
  const langOptions = Array.from(langSwitcher.querySelectorAll('.lang-option'));
  const langCurrent = langSwitcher.querySelector('.lang-current');
  const langLabels = {
    en: 'EN',
    es: 'ES'
  };
  const preferredLocaleKey = 'preferredLocale';

  function getDocumentLocale() {
    const lang = (document.documentElement.lang || '').toLowerCase();
    if (lang.startsWith('es')) return 'es';
    return 'en';
  }

  function getLocaleFromLink(link) {
    if (!link) return null;

    try {
      const url = new URL(link.getAttribute('href'), window.location.href);
      const segments = url.pathname.split('/').filter(Boolean);
      if (segments[0] === 'es') return 'es';
      return 'en';
    } catch {
      return null;
    }
  }

  function readPreferredLocale() {
    try {
      return window.localStorage.getItem(preferredLocaleKey);
    } catch {
      return null;
    }
  }

  function writePreferredLocale(locale) {
    try {
      window.localStorage.setItem(preferredLocaleKey, locale);
    } catch {
      // Ignore storage access failures and continue with current page locale.
    }
  }

  function syncLanguageUi(locale) {
    if (langCurrent) {
      langCurrent.textContent = langLabels[locale] || locale.toUpperCase();
    }

    langOptions.forEach(option => {
      option.classList.toggle('active', getLocaleFromLink(option) === locale);
    });
  }

  const currentLocale = getDocumentLocale();
  const preferredLocale = readPreferredLocale();
  const localeOptions = new Map(
    langOptions
      .map(option => [getLocaleFromLink(option), option])
      .filter(([locale]) => Boolean(locale))
  );
  let redirectedToPreferredLocale = false;

  if (preferredLocale && preferredLocale !== currentLocale) {
    const preferredOption = localeOptions.get(preferredLocale);

    if (preferredOption) {
      const targetUrl = new URL(preferredOption.getAttribute('href'), window.location.href);
      if (targetUrl.href !== window.location.href) {
        redirectedToPreferredLocale = true;
        window.location.replace(targetUrl.href);
      }
    }
  }

  if (redirectedToPreferredLocale) {
    // Skip UI updates and storage writes while navigation is in flight.
  } else {
    if (!preferredLocale || preferredLocale === currentLocale) {
      writePreferredLocale(currentLocale);
    }
    syncLanguageUi(currentLocale);

    langBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = langSwitcher.classList.toggle('open');
      langBtn.setAttribute('aria-expanded', String(isOpen));
    });

    document.addEventListener('click', () => {
      langSwitcher.classList.remove('open');
      langBtn.setAttribute('aria-expanded', 'false');
    });

    langSwitcher.querySelector('.lang-menu').addEventListener('click', (e) => {
      e.stopPropagation();
    });

    langOptions.forEach(option => {
      option.addEventListener('click', () => {
        const locale = getLocaleFromLink(option);
        if (locale) {
          writePreferredLocale(locale);
        }
      });
    });
  }
}

function scheduleNonCriticalWork(task, timeout = 1200) {
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(task, { timeout });
  } else {
    window.setTimeout(() => task({
      didTimeout: false,
      timeRemaining: () => 0
    }), 1);
  }
}

function initRevealAnimations() {
  const revealTargets = document.querySelectorAll('.practice-card, .result-card, .team-card, .stat-card, .about-text, .contact-info, .contact-form-wrapper, .process-step');
  const sectionTargets = document.querySelectorAll('section:not(.hero)');

  if (!('IntersectionObserver' in window)) {
    revealTargets.forEach(el => {
      el.classList.add('fade-in', 'visible');
      el.style.setProperty('--stagger-delay', '0ms');
    });

    sectionTargets.forEach(section => {
      section.classList.add('section-reveal', 'visible');
    });
    return;
  }

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  });

  const staggerGroups = new WeakMap();
  revealTargets.forEach(el => {
    el.classList.add('fade-in');

    const parent = el.parentElement || document.body;
    const primaryClass = Array.from(el.classList).find(className => className !== 'fade-in') || 'default';
    let groupCounts = staggerGroups.get(parent);

    if (!groupCounts) {
      groupCounts = new Map();
      staggerGroups.set(parent, groupCounts);
    }

    const index = groupCounts.get(primaryClass) || 0;
    groupCounts.set(primaryClass, index + 1);
    el.style.setProperty('--stagger-delay', `${Math.min(index * 100, 600)}ms`);
    revealObserver.observe(el);
  });

  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        sectionObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.05 });

  sectionTargets.forEach(section => {
    section.classList.add('section-reveal');
    sectionObserver.observe(section);
  });
}

function animateStatNumbers() {
  const statNumbers = document.querySelectorAll('.stat-number');
  if (!statNumbers.length) return;

  if (!('IntersectionObserver' in window)) {
    statNumbers.forEach(el => {
      if (!el.dataset.animated) {
        el.dataset.animated = 'true';
        countUp(el);
      }
    });
    return;
  }

  const statObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !entry.target.dataset.animated) {
        entry.target.dataset.animated = 'true';
        countUp(entry.target);
        statObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  statNumbers.forEach(el => statObserver.observe(el));
}

function countUp(element) {
  const originalText = element.textContent;
  const match = originalText.match(/^([^\d]*)(\d[\d,]*\.?\d*)(.*)$/);
  if (!match) return;

  const prefix = match[1];
  const numberStr = match[2];
  const suffix = match[3];

  const cleanNumber = parseFloat(numberStr.replace(/,/g, ''));
  if (isNaN(cleanNumber)) return;

  const hasDecimal = numberStr.includes('.');
  const decimalPlaces = hasDecimal ? numberStr.split('.')[1].length : 0;
  const hasCommas = numberStr.includes(',');

  const duration = 2000;
  const startTime = performance.now();

  function easeOutQuart(t) {
    return 1 - Math.pow(1 - t, 4);
  }

  function formatNumber(num) {
    let formatted;

    if (hasDecimal) {
      formatted = num.toFixed(decimalPlaces);
    } else {
      formatted = Math.round(num).toString();
    }

    if (hasCommas) {
      const parts = formatted.split('.');
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      formatted = parts.join('.');
    }

    return prefix + formatted + suffix;
  }

  function tick(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easedProgress = easeOutQuart(progress);
    const currentValue = cleanNumber * easedProgress;

    element.textContent = formatNumber(currentValue);

    if (progress < 1) {
      requestAnimationFrame(tick);
    }
  }

  requestAnimationFrame(tick);
}

function initMobileStickyCta() {
  const mobileCta = document.getElementById('mobileCta');
  const heroSection = document.querySelector('.hero');
  const footer = document.querySelector('.footer');

  if (!mobileCta || !heroSection || !footer || !('IntersectionObserver' in window)) return;

  const ctaObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.target === heroSection) {
        if (!entry.isIntersecting) {
          mobileCta.classList.add('visible');
          mobileCta.classList.remove('hidden-for-footer');
        } else {
          mobileCta.classList.remove('visible');
        }
      }

      if (entry.target === footer) {
        if (entry.isIntersecting) {
          mobileCta.classList.add('hidden-for-footer');
        } else {
          mobileCta.classList.remove('hidden-for-footer');
        }
      }
    });
  }, { threshold: 0.1 });

  ctaObserver.observe(heroSection);
  ctaObserver.observe(footer);
}

scheduleNonCriticalWork(() => {
  initRevealAnimations();
  animateStatNumbers();
  initMobileStickyCta();
});
