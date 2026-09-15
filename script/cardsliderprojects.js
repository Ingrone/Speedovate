(() => {
  const viewport = document.getElementById('card-slider-container');
  const next = document.getElementById('card-navigator-next');
  const previous = document.getElementById('card-navigator-prev');
  const cards = [...viewport.querySelectorAll('.card-slider')];
  const track = document.createElement('div');
  track.className = 'portfolio-track';
  cards.forEach(card => track.appendChild(card));
  viewport.appendChild(track);

  const middle = Math.floor(cards.length / 2);
  for (let i = 0; i < middle; i++) track.prepend(track.lastElementChild);
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let offset = 0;
  let step = 0;
  let frame = 0;
  let moving = false;
  let pointer = null;
  let suppressClick = false;
  const pending = [];

  function render() {
    const width = track.children[middle].getBoundingClientRect().width;
    step = width + parseFloat(getComputedStyle(track).columnGap);
    track.style.transform = `translateX(${(viewport.clientWidth - width) / 2 - middle * step + offset}px)`;
  }

  // Move only offscreen cards. Compensating the offset keeps every visible
  // card in the same pixel position, with no cloned buffer or start reset.
  function recycle() {
    while (offset <= -step) {
      track.appendChild(track.firstElementChild);
      offset += step;
    }
    while (offset >= step) {
      track.prepend(track.lastElementChild);
      offset -= step;
    }
  }

  function animateTo(target) {
    moving = true;
    const from = offset;
    const started = performance.now();
    function tick(now) {
      const progress = reducedMotion.matches ? 1 : Math.min((now - started) / 360, 1);
      const eased = 1 - (1 - progress) ** 3;
      offset = from + (target - from) * eased;
      if (progress === 1) {
        // Use the exact endpoint to avoid accumulating rounding errors.
        offset = target;
        recycle();
        moving = false;
      }
      render();
      if (moving) frame = requestAnimationFrame(tick);
      else if (pending.length) move(pending.shift());
    }
    frame = requestAnimationFrame(tick);
  }

  function move(direction) {
    if (moving) {
      pending.push(direction);
      return;
    }
    if (pointer) return;
    animateTo(-direction * step);
  }

  next.addEventListener('click', () => move(1));
  previous.addEventListener('click', () => move(-1));
  viewport.addEventListener('keydown', event => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      move(event.key === 'ArrowRight' ? 1 : -1);
    }
  });

  viewport.addEventListener('pointerdown', event => {
    suppressClick = false;
    if (event.button !== 0 || moving || event.target.closest('button')) return;
    pointer = { id: event.pointerId, x: event.clientX, y: event.clientY, horizontal: false };
  });
  viewport.addEventListener('pointermove', event => {
    if (!pointer || pointer.id !== event.pointerId) return;
    const dx = event.clientX - pointer.x;
    const dy = event.clientY - pointer.y;
    if (!pointer.horizontal) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      if (Math.abs(dy) >= Math.abs(dx)) { pointer = null; return; }
      pointer.horizontal = true;
      suppressClick = true;
      viewport.setPointerCapture(event.pointerId);
    }
    offset += dx;
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    recycle();
    render();
  });
  function finishDrag(event) {
    if (!pointer || pointer.id !== event.pointerId) return;
    const dragged = pointer.horizontal;
    pointer = null;
    if (viewport.hasPointerCapture(event.pointerId)) viewport.releasePointerCapture(event.pointerId);
    if (dragged) {
      const direction = Math.abs(offset) > Math.min(50, step * 0.2) ? Math.sign(offset) : 0;
      animateTo(direction * step);
    }
  }
  viewport.addEventListener('pointerup', finishDrag);
  viewport.addEventListener('pointercancel', finishDrag);
  viewport.addEventListener('lostpointercapture', finishDrag);
  viewport.addEventListener('dragstart', event => event.preventDefault());
  viewport.addEventListener('click', event => {
    if (suppressClick && event.detail !== 0) {
      event.preventDefault();
      event.stopPropagation();
      suppressClick = false;
    }
  }, true);

  let lastWheel = -Infinity;
  viewport.addEventListener('wheel', event => {
    if (event.ctrlKey) return;
    const delta = event.shiftKey ? event.deltaY || event.deltaX : event.deltaX;
    if (!delta || (!event.shiftKey && Math.abs(event.deltaY) >= Math.abs(delta))) return;
    event.preventDefault();
    const now = performance.now();
    const freshGesture = now - lastWheel > 180;
    lastWheel = now;
    if (freshGesture && !moving) move(Math.sign(delta));
  }, { passive: false });

  new ResizeObserver(() => {
    cancelAnimationFrame(frame);
    moving = false;
    pending.length = 0;
    const pointerId = pointer?.id;
    pointer = null;
    if (pointerId !== undefined && viewport.hasPointerCapture(pointerId)) {
      viewport.releasePointerCapture(pointerId);
    }
    // Keep the nearest project selected when rotating/resizing mid-swipe.
    if (step > 0) {
      offset = Math.round(offset / step) * step;
      recycle();
    }
    offset = 0;
    render();
  }).observe(viewport);
  render();
})();
