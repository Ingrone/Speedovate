(() => {
  const marquee = document.getElementById('partner-marquee');
  const track = marquee.querySelector('.partner-track');
  const original = track.querySelector('.partner-logos');
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function configureTrack() {
    track.querySelectorAll('[aria-hidden]').forEach((copy) => copy.remove());
    marquee.classList.toggle('is-animated', !motion.matches);
    if (motion.matches) return;

    const cycle = original.getBoundingClientRect().width;
    if (!cycle) return;
    track.style.setProperty('--partner-cycle', `${cycle}px`);
    const copies = Math.ceil(marquee.clientWidth / cycle) + 1;
    for (let index = 0; index < copies; index++) {
      const copy = original.cloneNode(true);
      copy.setAttribute('aria-hidden', 'true');
      copy.querySelectorAll('a').forEach(link => link.setAttribute('tabindex', '-1'));
      track.appendChild(copy);
    }
  }

  motion.addEventListener('change', configureTrack);
  new ResizeObserver(configureTrack).observe(marquee);
  configureTrack();
})();
