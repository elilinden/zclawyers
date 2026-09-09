(function (window, document) {
  'use strict';

  if (window.__zcAccessibilityInitialized) return;
  window.__zcAccessibilityInitialized = true;

  const scriptElement = document.currentScript;
  const storageKey = 'zcAccessibilityPreferences';
  const textSizes = [100, 125, 150, 200];
  const systemPrefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const locale = (document.documentElement.lang || '').toLowerCase().startsWith('es') ? 'es' : 'en';
  const copy = {
    en: {
      open: 'Accessibility options',
      title: 'Accessibility Options',
      close: 'Close accessibility options',
      textSize: 'Text size',
      decrease: 'Decrease text size',
      increase: 'Increase text size',
      readableFont: 'Readable text',
      highContrast: 'High contrast',
      underlineLinks: 'Highlight links',
      reduceMotion: 'Pause animations',
      largeCursor: 'Large cursor',
      reset: 'Reset accessibility settings',
      updated: 'Accessibility settings updated.',
      resetComplete: 'Accessibility settings reset.'
    },
    es: {
      open: 'Opciones de accesibilidad',
      title: 'Opciones de Accesibilidad',
      close: 'Cerrar opciones de accesibilidad',
      textSize: 'Tama&ntilde;o del texto',
      decrease: 'Reducir el tama&ntilde;o del texto',
      increase: 'Aumentar el tama&ntilde;o del texto',
      readableFont: 'Texto f&aacute;cil de leer',
      highContrast: 'Alto contraste',
      underlineLinks: 'Resaltar enlaces',
      reduceMotion: 'Pausar animaciones',
      largeCursor: 'Cursor grande',
      reset: 'Restablecer ajustes de accesibilidad',
      updated: 'Se actualizaron los ajustes de accesibilidad.',
      resetComplete: 'Se restablecieron los ajustes de accesibilidad.'
    }
  }[locale];

  const defaults = {
    textSize: 100,
    readableFont: false,
    highContrast: false,
    underlineLinks: false,
    reduceMotion: Boolean(systemPrefersReducedMotion),
    largeCursor: false
  };

  function loadStyles() {
    if (!scriptElement || document.querySelector('link[data-accessibility-styles]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = new URL('accessibility.css', scriptElement.src).href;
    link.dataset.accessibilityStyles = 'true';
    document.head.appendChild(link);
  }

  function loadPreferences() {
    try {
      const saved = JSON.parse(window.localStorage.getItem(storageKey));
      if (!saved || typeof saved !== 'object') return { ...defaults };
      return {
        textSize: textSizes.includes(Number(saved.textSize)) ? Number(saved.textSize) : defaults.textSize,
        readableFont: Boolean(saved.readableFont || saved.textSpacing),
        highContrast: Boolean(saved.highContrast),
        underlineLinks: Boolean(saved.underlineLinks),
        reduceMotion: typeof saved.reduceMotion === 'boolean' ? saved.reduceMotion : defaults.reduceMotion,
        largeCursor: Boolean(saved.largeCursor)
      };
    } catch {
      return { ...defaults };
    }
  }

  function savePreferences(preferences) {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(preferences));
    } catch {
      // Settings still work for the current page when browser storage is unavailable.
    }
  }

  function setVideoMotion(reduceMotion) {
    document.querySelectorAll('video').forEach(video => {
      if (reduceMotion) {
        if (!Object.prototype.hasOwnProperty.call(video.dataset, 'accessibilityWasPlaying')) {
          video.dataset.accessibilityWasPlaying = String(!video.paused);
        }
        video.pause();
      } else {
        if (video.autoplay && video.dataset.accessibilityWasPlaying === 'true') {
          const playPromise = video.play();
          if (playPromise && typeof playPromise.catch === 'function') playPromise.catch(() => {});
        }
        delete video.dataset.accessibilityWasPlaying;
      }
    });
  }

  const textStyleState = new Map();
  let textAdjustmentFrame;
  let textAdjustmentTimer;

  function beginTextAdjustment() {
    window.cancelAnimationFrame(textAdjustmentFrame);
    window.clearTimeout(textAdjustmentTimer);
    root.classList.add('a11y-text-adjusting');
  }

  function endTextAdjustment() {
    window.cancelAnimationFrame(textAdjustmentFrame);
    window.clearTimeout(textAdjustmentTimer);
    const finishAdjustment = () => {
      window.cancelAnimationFrame(textAdjustmentFrame);
      window.clearTimeout(textAdjustmentTimer);
      root.classList.remove('a11y-text-adjusting');
    };
    textAdjustmentFrame = window.requestAnimationFrame(() => {
      textAdjustmentFrame = window.requestAnimationFrame(finishAdjustment);
    });
    textAdjustmentTimer = window.setTimeout(finishAdjustment, 100);
  }

  function findScalableText() {
    return [...document.querySelectorAll('body *')].filter(element => {
      if (
        element.closest('svg, .accessibility-widget') ||
        ['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE'].includes(element.tagName)
      ) return false;
      if (['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON'].includes(element.tagName)) return true;
      return [...element.childNodes].some(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim());
    });
  }

  function rememberTextStyle(element) {
    if (textStyleState.has(element)) return;
    const computedSize = Number.parseFloat(window.getComputedStyle(element).fontSize);
    if (!Number.isFinite(computedSize)) return;
    textStyleState.set(element, {
      baseSize: computedSize,
      inlineValue: element.style.getPropertyValue('font-size'),
      inlinePriority: element.style.getPropertyPriority('font-size')
    });
  }

  function restoreTextStyle(element, state) {
    if (state.inlineValue) element.style.setProperty('font-size', state.inlineValue, state.inlinePriority);
    else element.style.removeProperty('font-size');
  }

  function applyTextSize(percent, adjustmentInProgress) {
    if (!adjustmentInProgress) beginTextAdjustment();
    root.style.removeProperty('font-size');
    root.classList.toggle('a11y-text-resized', percent !== 100);

    if (percent === 100) {
      for (const [element, state] of textStyleState) {
        if (element.isConnected) restoreTextStyle(element, state);
      }
      textStyleState.clear();
      if (!adjustmentInProgress) endTextAdjustment();
      return;
    }

    findScalableText().forEach(rememberTextStyle);

    for (const [element, state] of textStyleState) {
      if (!element.isConnected) {
        textStyleState.delete(element);
        continue;
      }
      element.style.setProperty('font-size', `${state.baseSize * (percent / 100)}px`, 'important');
    }

    if (!adjustmentInProgress) endTextAdjustment();
  }

  function refreshTextBaselines() {
    beginTextAdjustment();
    for (const [element, state] of textStyleState) {
      if (element.isConnected) restoreTextStyle(element, state);
    }
    void root.offsetWidth;
    textStyleState.clear();
    applyTextSize(preferences.textSize, true);
    endTextAdjustment();
  }

  function createSwitch(key, label) {
    return `
      <div class="accessibility-option">
        <span class="accessibility-option-label" id="accessibility-${key}-label">${label}</span>
        <button class="accessibility-switch" type="button" role="switch" aria-checked="false" aria-labelledby="accessibility-${key}-label" data-accessibility-setting="${key}"></button>
      </div>`;
  }

  function createInterface() {
    const wrapper = document.createElement('div');
    wrapper.className = 'accessibility-widget';
    wrapper.innerHTML = `
      <button class="accessibility-trigger" type="button" title="${copy.open}" aria-label="${copy.open}" aria-expanded="false" aria-controls="accessibilityPanel">
        <span aria-hidden="true">&#9855;&#65038;</span>
      </button>
      <section class="accessibility-panel" id="accessibilityPanel" role="dialog" aria-modal="false" aria-labelledby="accessibilityPanelTitle" hidden>
        <div class="accessibility-panel-header">
          <h2 class="accessibility-panel-title" id="accessibilityPanelTitle">${copy.title}</h2>
          <button class="accessibility-close" type="button" aria-label="${copy.close}">&times;</button>
        </div>
        <div class="accessibility-panel-body">
          <div class="accessibility-text-control">
            <span class="accessibility-control-label">${copy.textSize}</span>
            <div class="accessibility-size-controls">
              <button class="accessibility-size-button" type="button" data-text-size-action="decrease" aria-label="${copy.decrease}">A&minus;</button>
              <output class="accessibility-size-value" aria-live="polite">100%</output>
              <button class="accessibility-size-button" type="button" data-text-size-action="increase" aria-label="${copy.increase}">A+</button>
            </div>
          </div>
          ${createSwitch('readableFont', copy.readableFont)}
          ${createSwitch('highContrast', copy.highContrast)}
          ${createSwitch('underlineLinks', copy.underlineLinks)}
          ${createSwitch('reduceMotion', copy.reduceMotion)}
          ${createSwitch('largeCursor', copy.largeCursor)}
          <button class="accessibility-reset" type="button">${copy.reset}</button>
          <p class="accessibility-status" aria-live="polite"></p>
        </div>
      </section>`;
    document.body.appendChild(wrapper);
    return wrapper;
  }

  loadStyles();
  const preferences = loadPreferences();
  const root = document.documentElement;
  const widget = createInterface();
  const trigger = widget.querySelector('.accessibility-trigger');
  const panel = widget.querySelector('.accessibility-panel');
  const closeButton = widget.querySelector('.accessibility-close');
  const sizeValue = widget.querySelector('.accessibility-size-value');
  const decreaseButton = widget.querySelector('[data-text-size-action="decrease"]');
  const increaseButton = widget.querySelector('[data-text-size-action="increase"]');
  const resetButton = widget.querySelector('.accessibility-reset');
  const status = widget.querySelector('.accessibility-status');
  const classMap = {
    readableFont: 'a11y-readable-font',
    highContrast: 'a11y-high-contrast',
    underlineLinks: 'a11y-underline-links',
    reduceMotion: 'a11y-reduce-motion',
    largeCursor: 'a11y-large-cursor'
  };

  function updateInterface() {
    applyTextSize(preferences.textSize);
    sizeValue.textContent = `${preferences.textSize}%`;
    decreaseButton.disabled = preferences.textSize === textSizes[0];
    increaseButton.disabled = preferences.textSize === textSizes[textSizes.length - 1];

    Object.entries(classMap).forEach(([key, className]) => {
      root.classList.toggle(className, Boolean(preferences[key]));
      const control = widget.querySelector(`[data-accessibility-setting="${key}"]`);
      control.setAttribute('aria-checked', String(Boolean(preferences[key])));
    });

    setVideoMotion(preferences.reduceMotion);
  }

  function announce(message) {
    status.textContent = '';
    window.setTimeout(() => {
      status.textContent = message;
    }, 20);
  }

  function updateSetting(key, value) {
    preferences[key] = value;
    updateInterface();
    savePreferences(preferences);
    announce(copy.updated);
  }

  function openPanel() {
    panel.hidden = false;
    trigger.setAttribute('aria-expanded', 'true');
    closeButton.focus();
  }

  function closePanel(returnFocus) {
    panel.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
    if (returnFocus) trigger.focus();
  }

  trigger.addEventListener('click', () => {
    if (panel.hidden) openPanel();
    else closePanel(true);
  });

  closeButton.addEventListener('click', () => closePanel(true));

  widget.querySelectorAll('[data-accessibility-setting]').forEach(control => {
    control.addEventListener('click', () => {
      const key = control.dataset.accessibilitySetting;
      updateSetting(key, !preferences[key]);
    });
  });

  widget.querySelectorAll('[data-text-size-action]').forEach(control => {
    control.addEventListener('click', () => {
      const currentIndex = textSizes.indexOf(preferences.textSize);
      const direction = control.dataset.textSizeAction === 'increase' ? 1 : -1;
      const nextIndex = Math.max(0, Math.min(textSizes.length - 1, currentIndex + direction));
      updateSetting('textSize', textSizes[nextIndex]);
    });
  });

  resetButton.addEventListener('click', () => {
    Object.assign(preferences, defaults);
    updateInterface();
    try {
      window.localStorage.removeItem(storageKey);
    } catch {
      // The reset remains effective for the current page.
    }
    announce(copy.resetComplete);
  });

  document.addEventListener('click', event => {
    if (!panel.hidden && event.target instanceof Element && !widget.contains(event.target)) {
      closePanel(false);
    }
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !panel.hidden) closePanel(true);
  });

  const navigationMenu = document.getElementById('navMenu');
  if (navigationMenu && typeof window.MutationObserver === 'function') {
    const syncNavigationState = () => {
      const navigationIsOpen = navigationMenu.classList.contains('open');
      widget.classList.toggle('accessibility-navigation-open', navigationIsOpen);
      if (navigationIsOpen && !panel.hidden) closePanel(false);
    };
    new window.MutationObserver(syncNavigationState).observe(navigationMenu, {
      attributes: true,
      attributeFilter: ['class']
    });
    syncNavigationState();
  }

  let resizeTimer;
  window.addEventListener('resize', () => {
    if (preferences.textSize === 100) return;
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(refreshTextBaselines, 150);
  });

  window.addEventListener('load', () => {
    if (preferences.textSize !== 100) refreshTextBaselines();
  }, { once: true });

  updateInterface();
})(window, document);
