/**
 * NEXUS — Main JavaScript
 * Features:
 *  - Particle canvas animation
 *  - Chaos ↔ Clockwork drag slider
 *  - Scroll-triggered reveal animations
 *  - Animated number counters
 *  - Sticky navbar with scroll state
 *  - Pricing toggle (monthly/annual)
 *  - Contact form validation + submission
 *  - Demo modal
 *  - Mobile nav menu
 */

'use strict';

/* ════════════════════════════════════════
   UTILS
   ════════════════════════════════════════ */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ════════════════════════════════════════
   1. PARTICLE CANVAS
   ════════════════════════════════════════ */
function initParticles() {
  const canvas = $('#particleCanvas');
  if (!canvas || prefersReducedMotion) return;

  const ctx = canvas.getContext('2d');
  let particles = [];
  let raf;

  const PARTICLE_COUNT = window.innerWidth < 768 ? 40 : 80;
  const COLORS = ['rgba(0,245,255,', 'rgba(123,94,167,', 'rgba(0,245,255,'];

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  class Particle {
    constructor() { this.reset(true); }

    reset(initial = false) {
      this.x = Math.random() * canvas.width;
      this.y = initial ? Math.random() * canvas.height : canvas.height + 10;
      this.size = Math.random() * 2 + 0.5;
      this.speedY = -(Math.random() * 0.4 + 0.1);
      this.speedX = (Math.random() - 0.5) * 0.3;
      this.life = 0;
      this.maxLife = Math.random() * 300 + 200;
      this.color = COLORS[Math.floor(Math.random() * COLORS.length)];
    }

    update() {
      this.x += this.speedX;
      this.y += this.speedY;
      this.life++;
      if (this.life > this.maxLife || this.y < -10) this.reset();
    }

    draw() {
      const alpha = Math.sin((this.life / this.maxLife) * Math.PI) * 0.6;
      ctx.fillStyle = this.color + alpha + ')';
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function init() {
    resize();
    particles = Array.from({ length: PARTICLE_COUNT }, () => new Particle());
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => { p.update(); p.draw(); });
    raf = requestAnimationFrame(animate);
  }

  init();
  animate();

  const resizeObserver = new ResizeObserver(() => { resize(); });
  resizeObserver.observe(document.body);

  // Cleanup on page hide
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) cancelAnimationFrame(raf);
    else raf = requestAnimationFrame(animate);
  });
}

/* ════════════════════════════════════════
   2. CHAOS ↔ CLOCKWORK SLIDER
   ════════════════════════════════════════ */
function initChaosSlider() {
  const slider = $('#chaosSlider');
  if (!slider) return;

  const handle = $('#sliderHandle');
  const chaosPanel = $('#chaosPanel');
  const clockworkPanel = $('#clockworkPanel');

  let isDragging = false;
  let startX, startPercent;
  let currentPercent = 50;

  function setPosition(percent) {
    percent = Math.max(5, Math.min(95, percent));
    currentPercent = percent;

    chaosPanel.style.width = percent + '%';
    clockworkPanel.style.width = (100 - percent) + '%';
    handle.style.left = percent + '%';
    handle.setAttribute('aria-valuenow', Math.round(percent));
  }

  function getSliderX(clientX) {
    const rect = slider.getBoundingClientRect();
    return ((clientX - rect.left) / rect.width) * 100;
  }

  // Mouse events
  handle.addEventListener('mousedown', (e) => {
    isDragging = true;
    startX = e.clientX;
    startPercent = currentPercent;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    e.preventDefault();
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    setPosition(getSliderX(e.clientX));
  });

  document.addEventListener('mouseup', () => {
    if (!isDragging) return;
    isDragging = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  });

  // Touch events
  handle.addEventListener('touchstart', (e) => {
    isDragging = true;
    startX = e.touches[0].clientX;
    startPercent = currentPercent;
    e.preventDefault();
  }, { passive: false });

  document.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    setPosition(getSliderX(e.touches[0].clientX));
  }, { passive: true });

  document.addEventListener('touchend', () => { isDragging = false; });

  // Click on slider body
  slider.addEventListener('click', (e) => {
    if (e.target === handle || handle.contains(e.target)) return;
    setPosition(getSliderX(e.clientX));
  });

  // Keyboard accessibility
  handle.addEventListener('keydown', (e) => {
    const step = e.shiftKey ? 10 : 2;
    if (e.key === 'ArrowLeft') { setPosition(currentPercent - step); e.preventDefault(); }
    if (e.key === 'ArrowRight') { setPosition(currentPercent + step); e.preventDefault(); }
    if (e.key === 'Home') { setPosition(5); e.preventDefault(); }
    if (e.key === 'End') { setPosition(95); e.preventDefault(); }
  });

  // Auto demo animation on load
  if (!prefersReducedMotion) {
    let autoDemo = null;
    let demoPhase = 'right';
    let demoPct = 50;

    function runAutoDemo() {
      autoDemo = setInterval(() => {
        if (isDragging) return;
        if (demoPhase === 'right') {
          demoPct += 0.8;
          if (demoPct >= 80) demoPhase = 'left';
        } else {
          demoPct -= 0.8;
          if (demoPct <= 20) demoPhase = 'right';
        }
        setPosition(demoPct);
      }, 30);
    }

    // Start demo after 2s, stop on first user interaction
    const demoTimer = setTimeout(runAutoDemo, 2000);

    slider.addEventListener('mousedown', () => {
      clearTimeout(demoTimer);
      clearInterval(autoDemo);
    }, { once: true });

    slider.addEventListener('touchstart', () => {
      clearTimeout(demoTimer);
      clearInterval(autoDemo);
    }, { once: true });
  }

  // Initialize
  setPosition(50);
}

/* ════════════════════════════════════════
   3. SCROLL ANIMATIONS
   ════════════════════════════════════════ */
function initScrollAnimations() {
  const elements = $$('[data-animate]');
  if (!elements.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const delay = parseInt(el.dataset.delay || 0);

      setTimeout(() => {
        el.classList.add('is-visible');
      }, delay);

      observer.unobserve(el);
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -60px 0px'
  });

  elements.forEach(el => observer.observe(el));
}

/* ════════════════════════════════════════
   4. NUMBER COUNTERS
   ════════════════════════════════════════ */
function initCounters() {
  const counters = $$('[data-target]');
  if (!counters.length) return;

  function animateCounter(el) {
    const target = parseFloat(el.dataset.target);
    const isDecimal = el.dataset.target.includes('.');
    const duration = 2000;
    const start = performance.now();

    function update(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = eased * target;

      el.textContent = isDecimal ? current.toFixed(1) : Math.floor(current).toLocaleString();

      if (progress < 1) requestAnimationFrame(update);
      else el.textContent = isDecimal ? target.toFixed(1) : target.toLocaleString();
    }

    requestAnimationFrame(update);
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      animateCounter(entry.target);
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.3 });

  counters.forEach(el => observer.observe(el));
}

/* ════════════════════════════════════════
   5. NAVBAR SCROLL BEHAVIOR
   ════════════════════════════════════════ */
function initNavbar() {
  const navbar = $('#navbar');
  if (!navbar) return;

  let lastScroll = 0;

  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;

    // Add scrolled class
    navbar.classList.toggle('scrolled', scrollY > 20);

    // Auto-hide on scroll down (optional behavior)
    // navbar.classList.toggle('hidden', scrollY > lastScroll && scrollY > 200);
    lastScroll = scrollY;
  }, { passive: true });
}

/* ════════════════════════════════════════
   6. MOBILE MENU
   ════════════════════════════════════════ */
function initMobileMenu() {
  const hamburger = $('#navHamburger');
  const mobileMenu = $('#mobileMenu');
  if (!hamburger || !mobileMenu) return;

  let isOpen = false;

  function toggle() {
    isOpen = !isOpen;
    hamburger.classList.toggle('active', isOpen);
    hamburger.setAttribute('aria-expanded', isOpen);
    mobileMenu.classList.toggle('open', isOpen);
    mobileMenu.setAttribute('aria-hidden', !isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
  }

  hamburger.addEventListener('click', toggle);

  // Close on link click
  $$('.mobile-nav-link', mobileMenu).forEach(link => {
    link.addEventListener('click', () => {
      if (isOpen) toggle();
    });
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (isOpen && !mobileMenu.contains(e.target) && !hamburger.contains(e.target)) {
      toggle();
    }
  });

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen) toggle();
  });
}

/* ════════════════════════════════════════
   7. PRICING TOGGLE
   ════════════════════════════════════════ */
function initPricingToggle() {
  const monthlyBtn = $('#toggleMonthly');
  const annualBtn = $('#toggleAnnual');
  const priceAmounts = $$('[data-monthly]');

  if (!monthlyBtn || !annualBtn) return;

  function setMode(mode) {
    const isAnnual = mode === 'annual';

    monthlyBtn.classList.toggle('active', !isAnnual);
    annualBtn.classList.toggle('active', isAnnual);
    monthlyBtn.setAttribute('aria-pressed', !isAnnual);
    annualBtn.setAttribute('aria-pressed', isAnnual);

    priceAmounts.forEach(el => {
      const target = isAnnual ? el.dataset.annual : el.dataset.monthly;
      // Animate price change
      el.style.transform = 'scale(0.8)';
      el.style.opacity = '0';
      setTimeout(() => {
        el.textContent = target;
        el.style.transform = 'scale(1)';
        el.style.opacity = '1';
        el.style.transition = 'all 0.3s ease';
      }, 150);
    });
  }

  monthlyBtn.addEventListener('click', () => setMode('monthly'));
  annualBtn.addEventListener('click', () => setMode('annual'));
}

/* ════════════════════════════════════════
   8. CONTACT FORM
   ════════════════════════════════════════ */
function initContactForm() {
  const form = $('#contactForm');
  const successEl = $('#formSuccess');
  const submitBtn = $('#formSubmitBtn');

  if (!form) return;

  // Validation rules
  const validators = {
    firstName: {
      validate: v => v.trim().length >= 2,
      message: 'Please enter your first name (min 2 characters).'
    },
    lastName: {
      validate: v => v.trim().length >= 2,
      message: 'Please enter your last name (min 2 characters).'
    },
    companyEmail: {
      validate: v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()),
      message: 'Please enter a valid email address.'
    },
    companyName: {
      validate: v => v.trim().length >= 2,
      message: 'Please enter your company name.'
    },
    eventVolume: {
      validate: v => v.length > 0,
      message: 'Please select your annual event volume.'
    },
    consent: {
      validate: (_, el) => el.checked,
      message: 'Please agree to receive communications.'
    }
  };

  function showError(fieldId, message) {
    const input = $(`#${fieldId}`);
    const errorEl = $(`#${fieldId}Error`);
    if (input) input.classList.add('error');
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.classList.add('visible');
    }
  }

  function clearError(fieldId) {
    const input = $(`#${fieldId}`);
    const errorEl = $(`#${fieldId}Error`);
    if (input) input.classList.remove('error');
    if (errorEl) {
      errorEl.textContent = '';
      errorEl.classList.remove('visible');
    }
  }

  // Live validation on blur
  Object.keys(validators).forEach(fieldId => {
    const input = $(`#${fieldId}`);
    if (!input) return;

    input.addEventListener('blur', () => {
      const { validate, message } = validators[fieldId];
      if (!validate(input.value, input)) {
        showError(fieldId, message);
      } else {
        clearError(fieldId);
      }
    });

    input.addEventListener('input', () => {
      const { validate } = validators[fieldId];
      if (validate(input.value, input)) {
        clearError(fieldId);
      }
    });
  });

  function setLoading(loading) {
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoading = submitBtn.querySelector('.btn-loading');
    submitBtn.disabled = loading;
    btnText.hidden = loading;
    btnLoading.hidden = !loading;
    if (loading) {
      submitBtn.setAttribute('aria-busy', 'true');
    } else {
      submitBtn.removeAttribute('aria-busy');
    }
  }

  function collectFormData() {
    const fd = new FormData(form);
    const data = {};
    fd.forEach((val, key) => { data[key] = val; });
    data.timestamp = new Date().toISOString();
    data.source = window.location.href;
    return data;
  }

  async function submitToBackend(data) {
    /**
     * BACKEND INTEGRATION POINT
     * --------------------------
     * Option A: Netlify Forms — add `data-netlify="true"` to <form>
     * Option B: Formspree.io — replace URL with your Formspree endpoint
     * Option C: Custom API — replace with your endpoint
     * Option D: Zapier webhook — replace URL with your Zap webhook
     *
     * Example with Formspree:
     *   const res = await fetch('https://formspree.io/f/YOUR_ID', { ... });
     *
     * Example with a custom API:
     *   const res = await fetch('/api/leads', { ... });
     */

    // Simulate API call (replace with real endpoint)
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Simulate 95% success rate
        if (Math.random() > 0.05) {
          resolve({ ok: true, message: 'Lead created successfully' });
        } else {
          reject(new Error('Network error'));
        }
      }, 1500);
    });

    /*
    // PRODUCTION: Uncomment and configure one of these:

    // Option A: Formspree
    const res = await fetch('https://formspree.io/f/YOUR_FORM_ID', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();

    // Option B: Custom API endpoint
    const res = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
    */
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Validate all fields
    let hasErrors = false;
    Object.keys(validators).forEach(fieldId => {
      const input = $(`#${fieldId}`);
      if (!input) return;
      const { validate, message } = validators[fieldId];
      if (!validate(input.value, input)) {
        showError(fieldId, message);
        hasErrors = true;
      } else {
        clearError(fieldId);
      }
    });

    if (hasErrors) {
      // Scroll to first error
      const firstError = form.querySelector('.form-input.error, input.error');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        firstError.focus();
      }
      return;
    }

    const data = collectFormData();
    setLoading(true);

    try {
      await submitToBackend(data);

      // Log to console in dev for CRM routing reference
      console.log('[NEXUS Lead Form] Submission data:', data);

      // Show success
      form.hidden = true;
      successEl.hidden = false;
      successEl.focus();
      successEl.scrollIntoView({ behavior: 'smooth', block: 'center' });

    } catch (err) {
      console.error('[NEXUS Form Error]', err);
      setLoading(false);

      // Show inline error banner
      const existingBanner = form.querySelector('.form-submit-error');
      if (!existingBanner) {
        const banner = document.createElement('div');
        banner.className = 'form-submit-error';
        banner.setAttribute('role', 'alert');
        banner.style.cssText = `
          background: rgba(255,68,68,0.1);
          border: 1px solid rgba(255,68,68,0.3);
          border-radius: 8px;
          padding: 0.75rem 1rem;
          font-size: 0.85rem;
          color: #ff6b6b;
          margin-bottom: 1rem;
          text-align: center;
        `;
        banner.textContent = 'Something went wrong. Please try again or email us at hello@nexus.io';
        submitBtn.insertAdjacentElement('beforebegin', banner);
        setTimeout(() => banner.remove(), 5000);
      }
    }
  });
}

/* ════════════════════════════════════════
   9. DEMO MODAL
   ════════════════════════════════════════ */
function initDemoModal() {
  const modal = $('#demoModal');
  const openBtn = $('#watchDemoBtn');
  const closeBtn = $('#modalClose');
  if (!modal || !openBtn) return;

  function open() {
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    closeBtn.focus();
    trap(modal);
  }

  function close() {
    modal.hidden = true;
    document.body.style.overflow = '';
    openBtn.focus();
  }

  openBtn.addEventListener('click', open);
  closeBtn?.addEventListener('click', close);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) close();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.hidden) close();
  });

  // Basic focus trap
  function trap(el) {
    const focusable = el.querySelectorAll('button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])');
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    el.addEventListener('keydown', function trapKey(e) {
      if (e.key !== 'Tab') return;
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
      if (modal.hidden) el.removeEventListener('keydown', trapKey);
    });
  }
}

/* ════════════════════════════════════════
   10. SMOOTH ANCHOR SCROLL
   ════════════════════════════════════════ */
function initSmoothScroll() {
  $$('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const id = anchor.getAttribute('href').slice(1);
      if (!id) return;
      const target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      const navHeight = $('#navbar')?.offsetHeight || 80;
      const top = target.getBoundingClientRect().top + window.scrollY - navHeight - 20;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
}

/* ════════════════════════════════════════
   11. FEATURE CARDS — INTERACTIVE VISUALS
   ════════════════════════════════════════ */
function initFeatureVisuals() {
  // Animate integration dots on hover
  $$('.int-logo').forEach((logo, i) => {
    logo.style.animationDelay = `${i * 0.1}s`;
  });

  // Pulse active states in timeline
  const pulseEls = $$('.pulse-cyan');
  if (prefersReducedMotion) {
    pulseEls.forEach(el => el.style.animation = 'none');
  }
}

/* ════════════════════════════════════════
   INIT ALL
   ════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  initParticles();
  initChaosSlider();
  initScrollAnimations();
  initCounters();
  initNavbar();
  initMobileMenu();
  initPricingToggle();
  initContactForm();
  initDemoModal();
  initSmoothScroll();
  initFeatureVisuals();
});
