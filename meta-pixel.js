/* Meta Pixel base code and sitewide interaction tracking. */
(function (window, document) {
  const pixelId = '4481727002051340';

  function isRedirectingToPreferredLocale() {
    try {
      const currentLocale = (document.documentElement.lang || '').toLowerCase().startsWith('es') ? 'es' : 'en';
      const preferredLocale = window.localStorage.getItem('preferredLocale');

      return Boolean(preferredLocale && preferredLocale !== currentLocale && document.querySelector('.lang-option'));
    } catch {
      return false;
    }
  }

  // The shared language switcher immediately redirects to a saved locale.
  // Let the destination page issue the PageView so redirects are not double-counted.
  if (isRedirectingToPreferredLocale()) return;

  if (!window.__zcMetaPixelInitialized) {
    window.__zcMetaPixelInitialized = true;

    !function(f,b,e,v,n,t,s)
    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;
    n.version='2.0';n.queue=[];t=b.createElement(e);
    t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)}(window,document,'script',
    'https://connect.facebook.net/en_US/fbevents.js');

    if (typeof window.fbq === 'function') {
      window.fbq('init', pixelId);
      window.fbq('track', 'PageView');
    }
  }

  function trackCustomEvent(eventName) {
    if (typeof window.fbq === 'function') {
      window.fbq('trackCustom', eventName);
    }
  }

  document.addEventListener('click', function (event) {
    if (!(event.target instanceof Element)) return;

    if (event.target.closest('a[href^="tel:"]')) {
      trackCustomEvent('PhoneClick');
      return;
    }

    if (event.target.closest('a[href^="sms:"]')) {
      trackCustomEvent('TextClick');
    }
  });

  window.addEventListener('zc:consultation-form-success', function () {
    if (typeof window.fbq === 'function') {
      window.fbq('track', 'Lead');
    }
  });
})(window, document);
