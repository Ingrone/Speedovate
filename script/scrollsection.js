const header = document.getElementById('header');
const menu = document.getElementById('mobile-menu');
const menuToggle = document.getElementById('menu-toggle');
const portfolio = document.getElementById('main-container2');
const sections = [document.getElementById('main_container'), portfolio, document.getElementById('partners')];
const sectionLinks = document.querySelectorAll('.navigator-destinations[href^="#"], .section-link');

function updateHeader() {
  header.classList.toggle('is-scrolled', window.scrollY > 24);
  const active = sections.reduce((closest, section) =>
    Math.abs(section.getBoundingClientRect().top) < Math.abs(closest.getBoundingClientRect().top)
      ? section : closest);
  const activeSection = `#${active.id}`;

  sectionLinks.forEach((link) => {
    if (link.getAttribute('href') === activeSection) {
      link.setAttribute('aria-current', 'location');
    } else {
      link.removeAttribute('aria-current');
    }
  });
}

menuToggle.addEventListener('click', () => {
  menu.showModal();
  menuToggle.setAttribute('aria-expanded', 'true');
  document.documentElement.classList.add('menu-open');
});

document.getElementById('menu-close').addEventListener('click', () => menu.close());
menu.addEventListener('close', () => {
  menuToggle.setAttribute('aria-expanded', 'false');
  document.documentElement.classList.remove('menu-open');
});
menu.addEventListener('click', (event) => {
  const bounds = menu.getBoundingClientRect();
  if (event.target === menu && (event.clientX < bounds.left || event.clientX > bounds.right)) {
    menu.close();
  }
});
menu.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => menu.close());
});

window.matchMedia('(min-width: 760px)').addEventListener('change', (event) => {
  if (event.matches && menu.open) menu.close();
});
window.addEventListener('scroll', updateHeader, { passive: true });
window.addEventListener('resize', updateHeader);
updateHeader();

// Advance one section per desktop wheel gesture, like the reference website.
// Native snapping handles touch; tall sections retain normal scrolling.
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let scrollFrame = 0;
let snapping = false;
let lastWheelTime = 0;

function sectionTop(section) {
  return section.getBoundingClientRect().top + window.scrollY;
}

function scrollToSection(section, duration = 560) {
  cancelAnimationFrame(scrollFrame);
  const start = window.scrollY;
  const target = Math.min(sectionTop(section), document.documentElement.scrollHeight - window.innerHeight);
  const started = performance.now();
  snapping = true;
  document.documentElement.classList.add('is-section-scrolling');

  function frame(now) {
    const progress = reducedMotion.matches ? 1 : Math.min((now - started) / duration, 1);
    const eased = progress < 0.5 ? 4 * progress ** 3 : 1 - (-2 * progress + 2) ** 3 / 2;
    window.scrollTo({ top: start + (target - start) * eased, behavior: 'instant' });
    if (progress < 1) {
      scrollFrame = requestAnimationFrame(frame);
    } else {
      snapping = false;
      document.documentElement.classList.remove('is-section-scrolling');
      updateHeader();
    }
  }
  scrollFrame = requestAnimationFrame(frame);
}

window.addEventListener('wheel', (event) => {
  if (menu.open || event.ctrlKey || event.shiftKey ||
      Math.abs(event.deltaX) >= Math.abs(event.deltaY) ||
      !window.matchMedia('(min-width: 760px) and (pointer: fine)').matches) return;

  const now = performance.now();
  const continuingGesture = now - lastWheelTime < 180;
  lastWheelTime = now;
  if (snapping) {
    event.preventDefault();
    return;
  }

  const current = sections.reduce((closest, section) =>
    Math.abs(sectionTop(section) - window.scrollY) < Math.abs(sectionTop(closest) - window.scrollY)
      ? section : closest);
  // Let readers reach all content on short windows and when zoomed in.
  if (current.offsetHeight > window.innerHeight + 2) return;

  event.preventDefault();
  if (continuingGesture) return;
  const direction = event.deltaY > 0 ? 1 : -1;
  const next = sections[sections.indexOf(current) + direction];
  if (next) scrollToSection(next);
}, { passive: false });

sectionLinks.forEach((link) => {
  link.addEventListener('click', (event) => {
    event.preventDefault();
    const target = document.querySelector(link.getAttribute('href'));
    if (menu.open) menu.close();
    history.pushState(null, '', link.getAttribute('href'));
    scrollToSection(target, 700);
  });
});

// Keep clearance in sync with the real header height, including text zoom.
new ResizeObserver(() => {
  document.documentElement.style.setProperty('--header-clearance', `${header.getBoundingClientRect().bottom + 20}px`);
}).observe(header);
