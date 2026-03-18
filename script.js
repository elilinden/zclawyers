// Navbar scroll effect
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  if (window.scrollY > 50) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
});

// Mobile menu toggle with ARIA
const navToggle = document.getElementById('navToggle');
const navMenu = document.getElementById('navMenu');

// Create overlay for closing menu by tapping outside
const navOverlay = document.createElement('div');
navOverlay.className = 'nav-overlay';
navOverlay.setAttribute('aria-hidden', 'true');
document.body.appendChild(navOverlay);

function closeMobileMenu() {
  navMenu.classList.remove('open');
  navToggle.classList.remove('active');
  navOverlay.classList.remove('open');
  navToggle.setAttribute('aria-expanded', 'false');
  navMenu.setAttribute('aria-hidden', 'true');
  navOverlay.setAttribute('aria-hidden', 'true');
}

navToggle.addEventListener('click', () => {
  const isOpen = navMenu.classList.toggle('open');
  navToggle.classList.toggle('active');
  navOverlay.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', isOpen);
  navMenu.setAttribute('aria-hidden', !isOpen);
  navOverlay.setAttribute('aria-hidden', !isOpen);
});

// Close menu when tapping the overlay (outside the drawer)
navOverlay.addEventListener('click', closeMobileMenu);

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
      trigger.setAttribute('aria-expanded', isOpen);
    }
  });
});

// Scroll animations
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, observerOptions);

// Add fade-in class with staggered delays
document.querySelectorAll('.practice-card, .result-card, .team-card, .stat-card, .about-text, .contact-info, .contact-form-wrapper').forEach(el => {
  el.classList.add('fade-in');

  // Calculate stagger index among siblings of same class
  const parent = el.parentElement;
  const className = el.classList[0];
  const siblings = parent.querySelectorAll('.' + className);
  const index = Array.from(siblings).indexOf(el);
  const delay = Math.min(index * 100, 600);
  el.style.setProperty('--stagger-delay', delay + 'ms');

  observer.observe(el);
});

// Form validation and submission
const contactForm = document.getElementById('contactForm');
if (contactForm) {
  // Clear error on input
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

    return isValid;
  }

  function showFieldError(field, message) {
    const group = field.closest('.form-group');
    clearFieldError(field);
    group.classList.add('error');
    const errorEl = document.createElement('span');
    errorEl.className = 'form-error-msg';
    errorEl.textContent = message;
    group.appendChild(errorEl);
  }

  function clearFieldError(field) {
    const group = field.closest('.form-group');
    if (!group) return;
    group.classList.remove('error');
    const existing = group.querySelector('.form-error-msg');
    if (existing) existing.remove();
  }
}

// Smooth reveal for sections (skip hero which should be visible immediately)
document.querySelectorAll('section:not(.hero)').forEach(section => {
  section.style.opacity = '0';
  section.style.transform = 'translateY(20px)';
  section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
});

const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, { threshold: 0.05 });

document.querySelectorAll('section:not(.hero)').forEach(section => {
  sectionObserver.observe(section);
});

// Number counting animation
function animateStatNumbers() {
  const statNumbers = document.querySelectorAll('.stat-number');
  if (!statNumbers.length) return;

  const statObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !entry.target.dataset.animated) {
        entry.target.dataset.animated = 'true';
        countUp(entry.target);
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

animateStatNumbers();

// Mobile sticky CTA - show after hero, hide near footer
const mobileCta = document.getElementById('mobileCta');
if (mobileCta) {
  const heroSection = document.querySelector('.hero');
  const footer = document.querySelector('.footer');

  if (heroSection && footer) {
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
}

// Language switcher toggle
const langSwitcher = document.getElementById('langSwitcher');
if (langSwitcher) {
  const langBtn = langSwitcher.querySelector('.lang-btn');

  langBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = langSwitcher.classList.toggle('open');
    langBtn.setAttribute('aria-expanded', isOpen);
  });

  document.addEventListener('click', () => {
    langSwitcher.classList.remove('open');
    langBtn.setAttribute('aria-expanded', 'false');
  });

  langSwitcher.querySelector('.lang-menu').addEventListener('click', (e) => {
    e.stopPropagation();
  });
}
