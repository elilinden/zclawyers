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

function closeMobileMenu() {
  if (!navToggle || !navMenu || !navOverlay) return;
  navMenu.classList.remove('open');
  navToggle.classList.remove('active');
  navOverlay.classList.remove('open');
  navToggle.setAttribute('aria-expanded', 'false');
  navMenu.setAttribute('aria-hidden', 'true');
  navOverlay.setAttribute('aria-hidden', 'true');
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
  });

  navOverlay.addEventListener('click', closeMobileMenu);
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
const contactForm = document.getElementById('contactForm');
if (contactForm) {
  contactForm.querySelectorAll('input, select, textarea').forEach(field => {
    field.addEventListener('input', () => clearFieldError(field));
    field.addEventListener('change', () => clearFieldError(field));
  });

  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (validateForm()) {
      const btn = contactForm.querySelector('button[type="submit"]');
      const originalText = btn.textContent;
      btn.textContent = 'Submitted! We\'ll be in touch.';
      btn.style.background = '#22c55e';
      btn.style.borderColor = '#22c55e';
      setTimeout(() => {
        btn.textContent = originalText;
        btn.style.background = '';
        btn.style.borderColor = '';
        contactForm.reset();
      }, 3000);
    }
  });

  function validateForm() {
    let isValid = true;

    const name = contactForm.querySelector('#name');
    if (name && !name.value.trim()) {
      showFieldError(name, 'Please enter your full name.');
      isValid = false;
    }

    const phone = contactForm.querySelector('#phone');
    if (phone && !phone.value.trim()) {
      showFieldError(phone, 'Please enter your phone number.');
      isValid = false;
    }

    const email = contactForm.querySelector('#email');
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email) {
      if (!email.value.trim()) {
        showFieldError(email, 'Please enter your email address.');
        isValid = false;
      } else if (!emailPattern.test(email.value.trim())) {
        showFieldError(email, 'Please enter a valid email address.');
        isValid = false;
      }
    }

    const message = contactForm.querySelector('#message');
    if (message && !message.value.trim()) {
      showFieldError(message, 'Please describe your situation.');
      isValid = false;
    }

    if (!isValid) {
      const firstError = contactForm.querySelector('[aria-invalid="true"]');
      if (firstError) firstError.focus();
    }

    return isValid;
  }

  function showFieldError(field, message) {
    const group = field.closest('.form-group');
    clearFieldError(field);
    group.classList.add('error');
    const errorEl = document.createElement('span');
    errorEl.className = 'form-error-msg';
    const errorId = field.id + '-error';
    errorEl.id = errorId;
    errorEl.textContent = message;
    group.appendChild(errorEl);
    field.setAttribute('aria-invalid', 'true');
    field.setAttribute('aria-describedby', errorId);
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
}

// Language switcher toggle
const langSwitcher = document.getElementById('langSwitcher');
if (langSwitcher) {
  const langBtn = langSwitcher.querySelector('.lang-btn');
  const langOptions = Array.from(langSwitcher.querySelectorAll('.lang-option'));
  const langCurrent = langSwitcher.querySelector('.lang-current');
  const langLabels = {
    en: 'EN',
    es: 'ES',
    fa: 'FA'
  };
  const preferredLocaleKey = 'preferredLocale';

  function getDocumentLocale() {
    const lang = (document.documentElement.lang || '').toLowerCase();
    if (lang.startsWith('es')) return 'es';
    if (lang.startsWith('fa')) return 'fa';
    return 'en';
  }

  function getLocaleFromLink(link) {
    if (!link) return null;

    try {
      const url = new URL(link.getAttribute('href'), window.location.href);
      const segments = url.pathname.split('/').filter(Boolean);
      if (segments.includes('fa')) return 'fa';
      if (segments.includes('es')) return 'es';
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
  const revealTargets = document.querySelectorAll('.practice-card, .result-card, .team-card, .stat-card, .about-text, .contact-info, .contact-form-wrapper');
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
