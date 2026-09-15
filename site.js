/* ---- page-enter wipe: if we just arrived via an internal link, reveal the page ---- */
(function(){
 if (sessionStorage.getItem('lh-transitioning')) {
  const cover = document.createElement('div');
  cover.className = 'page-transition entering';
  document.body.appendChild(cover);
  requestAnimationFrame(() => {
   setTimeout(() => cover.remove(), 550);
  });
  sessionStorage.removeItem('lh-transitioning');
 }
})();

/* ---- scroll-progress ring: injected on every page, fills as you scroll, click = jump to top ---- */
(function(){
 const RADIUS = 22;
 const CIRC = 2 * Math.PI * RADIUS;
 const wrap = document.createElement('div');
 wrap.className = 'scroll-progress';
 wrap.setAttribute('role', 'button');
 wrap.setAttribute('aria-label', 'Scroll to top');
 wrap.innerHTML =
  '<svg viewBox="0 0 52 52">' +
   '<circle class="ring-track" cx="26" cy="26" r="' + RADIUS + '"></circle>' +
   '<circle class="ring-fill" cx="26" cy="26" r="' + RADIUS + '" stroke-dasharray="' + CIRC + '" stroke-dashoffset="' + CIRC + '"></circle>' +
  '</svg>' +
  '<span class="ring-arrow"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg></span>';
 document.body.appendChild(wrap);
 const ringFill = wrap.querySelector('.ring-fill');
 wrap.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
 function updateRing(){
  const doc = document.documentElement;
  const max = doc.scrollHeight - doc.clientHeight;
  const pct = max > 0 ? Math.min(1, window.scrollY / max) : 0;
  ringFill.style.strokeDashoffset = String(CIRC * (1 - pct));
  wrap.classList.toggle('show', window.scrollY > 400);
 }
 window.addEventListener('scroll', updateRing, { passive: true });
 window.addEventListener('resize', updateRing);
 updateRing();
})();

/* ---- nav scroll state + hero parallax ---- */
const nav = document.getElementById('nav');
const heroMedia = document.getElementById('heroMedia');
function onScroll(){
 if (!nav) return;
 if (window.scrollY > 30) nav.classList.add('scrolled'); else nav.classList.remove('scrolled');
 if (heroMedia) heroMedia.style.transform = 'translateY(' + (window.scrollY * 0.38) + 'px) scale(1.1)';
}
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

/* ---- section-level parallax - wider range + gentle scale for more motion ---- */
const parallaxLayers = document.querySelectorAll('.tile-parallax,.about-photo-parallax,.video-block-parallax,.quote-parallax');
let parallaxTicking = false;
function updateParallax(){
 const vh = window.innerHeight || 1;
 parallaxLayers.forEach(el => {
  const rect = el.parentElement.getBoundingClientRect();
  const centerOffset = (rect.top + rect.height / 2) - vh / 2;
  const shift = Math.max(-70, Math.min(70, centerOffset * 0.16));
  const scale = 1 + Math.min(0.06, Math.abs(centerOffset) / vh * 0.05);
  el.style.transform = 'translateY(' + shift.toFixed(1) + 'px) scale(' + scale.toFixed(3) + ')';
 });
 parallaxTicking = false;
}
function onParallaxScroll(){
 if (!parallaxTicking) {
  requestAnimationFrame(updateParallax);
  parallaxTicking = true;
 }
}
if (parallaxLayers.length) {
 window.addEventListener('scroll', onParallaxScroll, { passive: true });
 window.addEventListener('resize', onParallaxScroll);
 updateParallax();
}

/* ---- scroll-reveal ---- */
const io = new IntersectionObserver((entries) => {
 entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
}, { threshold: 0.15 });
document.querySelectorAll('.reveal').forEach(el => io.observe(el));

/* ---- button ripple (visual only - does not block real navigation/anchors) ----
  Also logs a 'cta_click' analytics event for every button on the site (label + destination),
  so once GA4 is turned on (see tracking.js) you can see exactly which buttons get used. */
document.querySelectorAll('.btn').forEach(btn => {
 btn.addEventListener('click', function(e){
  const rect = this.getBoundingClientRect();
  const ripple = document.createElement('span');
  ripple.className = 'ripple';
  const size = Math.max(rect.width, rect.height);
  ripple.style.width = ripple.style.height = size + 'px';
  ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
  ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
  this.appendChild(ripple);
  setTimeout(() => ripple.remove(), 650);
  if (typeof trackEvent === 'function') {
   trackEvent('cta_click', { label: this.textContent.trim(), destination: this.getAttribute('href') || '' });
  }
 });
});

/* ---- mobile menu ---- */
const navToggle = document.getElementById('navToggle');
const mobileMenu = document.getElementById('mobileMenu');
function closeMobileMenu(){
 if (!navToggle) return;
 navToggle.classList.remove('open');
 navToggle.setAttribute('aria-expanded', 'false');
 mobileMenu.classList.remove('open');
}
if (navToggle) {
 navToggle.addEventListener('click', () => {
  const isOpen = mobileMenu.classList.toggle('open');
  navToggle.classList.toggle('open', isOpen);
  navToggle.setAttribute('aria-expanded', String(isOpen));
 });
 mobileMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMobileMenu));
}

/* ---- generic "coming soon" info modal - reused for course login, WhatsApp invite, journal articles, etc.
  TODO(next phase): replace the course "Notify Me"/"Client Login" triggers with a real Stripe Checkout
  flow + auth (see Restructure Build Plan doc - Supabase Auth or Clerk for the gated course portal). ---- */
const modalOverlay = document.getElementById('modalOverlay');
const modalMsg = document.getElementById('modalMsg');
const modalClose = document.getElementById('modalClose');
if (modalOverlay) {
 document.querySelectorAll('[data-modal]').forEach(el => {
  el.addEventListener('click', function(e){
   e.preventDefault();
   modalMsg.textContent = this.getAttribute('data-modal');
   modalOverlay.classList.add('open');
   /* logs interest in not-yet-built features (course login, WhatsApp, journal, etc.) - 
     a good signal for what to prioritize building next */
   if (typeof trackEvent === 'function') {
    trackEvent('coming_soon_interest', { label: this.textContent.trim() });
   }
  });
 });
 function closeModal(){ modalOverlay.classList.remove('open'); }
 modalClose.addEventListener('click', closeModal);
 modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) closeModal(); });
 document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeModal(); closeMobileMenu(); } });
}

/* ---- page-to-page transition wipe: intercept clicks on links to other pages on this
  site (not #anchors, not external, not data-modal triggers) and cover the screen
  briefly before navigating, so moving between pages feels like one continuous app
  rather than a hard reload. ---- */
document.querySelectorAll('a[href]').forEach(a => {
 const href = a.getAttribute('href');
 if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || a.target === '_blank' || a.hasAttribute('data-modal')) return;
 if (/^https?:\/\//i.test(href)) return;
 a.addEventListener('click', function(e){
  e.preventDefault();
  const dest = href;
  if (typeof trackEvent === 'function' && !this.classList.contains('btn')) {
   trackEvent('page_nav', { label: this.textContent.trim(), destination: dest });
  }
  sessionStorage.setItem('lh-transitioning', '1');
  const cover = document.createElement('div');
  cover.className = 'page-transition leaving';
  document.body.appendChild(cover);
  requestAnimationFrame(() => {
   setTimeout(() => { window.location.href = dest; }, 480);
  });
 });
});
