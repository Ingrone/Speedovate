const container = document.getElementById('card-slider-container');
const nextBtn = document.getElementById('card-navigator-next');
const prevBtn = document.getElementById('card-navigator-prev');
const cards = Array.from(container.querySelectorAll('.card-slider'));

const cardWidth = cards[0].offsetWidth + 40; // adjust if needed
const total = cards.length;
const bufferMultiplier = 8; // 4x the set = 20 cards if you have 5 originals
const bufferCount = total * bufferMultiplier;

// Clone enough cards to make a huge buffer
for (let i = 0; i < bufferMultiplier; i++) {
  cards.forEach(c => container.appendChild(c.cloneNode(true)));
  cards.forEach(c => container.insertBefore(c.cloneNode(true), container.firstChild));
}

// Start in the center of that buffer
const midpoint = total * bufferMultiplier * 0.5;
container.scrollLeft = midpoint * cardWidth;

let isTransitioning = false;

function move(dir) {
  if (isTransitioning) return;
  isTransitioning = true;

  container.scrollBy({ left: dir * cardWidth, behavior: 'smooth' });

  setTimeout(() => {
    const scrollLeft = container.scrollLeft;
    const maxScroll = container.scrollWidth;
    const threshold = total * cardWidth; // move threshold before hitting edge

    // Seamless repositioning logic
    if (scrollLeft < threshold) {
      container.classList.add('no-transition');
      container.scrollLeft = scrollLeft + (bufferCount * 0.5 * cardWidth);
      container.classList.remove('no-transition');
    } else if (scrollLeft > maxScroll - threshold) {
      container.classList.add('no-transition');
      container.scrollLeft = scrollLeft - (bufferCount * 0.5 * cardWidth);
      container.classList.remove('no-transition');
    }

    isTransitioning = false;
  }, 400);
}

// Button controls
nextBtn.addEventListener('click', () => move(1));
prevBtn.addEventListener('click', () => move(-1));

// Swipe gesture support
let startX = 0;
container.addEventListener('touchstart', e => startX = e.touches[0].clientX);
container.addEventListener('touchend', e => {
  const diff = e.changedTouches[0].clientX - startX;
  if (Math.abs(diff) > 50) move(diff < 0 ? 1 : -1);
});
