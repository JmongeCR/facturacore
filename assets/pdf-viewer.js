import * as pdfjs from '/assets/vendor/pdfjs/pdf.min.mjs';

pdfjs.GlobalWorkerOptions.workerSrc = '/assets/vendor/pdfjs/pdf.worker.min.mjs';

const ZOOM_MIN = 0.5;
const ZOOM_MAX = 2.5;
const ZOOM_STEP = 0.25;
const MAX_FIT_SCALE = 1.5;

export async function mount(root) {
  const scroller = root.querySelector('.pv-scroll');
  const stack = root.querySelector('.pv-stack');
  const status = root.querySelector('.pv-status');
  const zoomLabel = root.querySelector('.pv-zoom');
  const countLabel = root.querySelector('.pv-count');
  const zoomButtons = root.querySelectorAll('[data-zoom]');

  const doc = await pdfjs.getDocument({ url: root.dataset.pdf }).promise;
  const pages = [];
  for (let n = 1; n <= doc.numPages; n++) {
    const wrap = document.createElement('div');
    wrap.className = 'pv-page';
    wrap.dataset.page = String(n);
    stack.appendChild(wrap);
    pages.push({ page: await doc.getPage(n), wrap });
  }
  status.hidden = true;

  let zoom = 1;
  let current = 1;
  let renderId = 0;
  let lastWidth = 0;

  function updateLabels() {
    zoomLabel.textContent = Math.round(zoom * 100) + ' %';
    countLabel.textContent = 'Página ' + current + ' de ' + doc.numPages;
    zoomButtons.forEach((b) => {
      b.disabled = Number(b.dataset.zoom) < 0 ? zoom <= ZOOM_MIN : zoom >= ZOOM_MAX;
    });
  }

  async function render() {
    const id = ++renderId;
    const style = getComputedStyle(scroller);
    const available = scroller.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
    lastWidth = scroller.clientWidth;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const jobs = pages.map(({ page, wrap }) => {
      const base = page.getViewport({ scale: 1 });
      const scale = Math.min(available / base.width, MAX_FIT_SCALE) * zoom;
      wrap.style.width = Math.floor(base.width * scale) + 'px';
      wrap.style.height = Math.floor(base.height * scale) + 'px';
      return { page, wrap, scale };
    });

    for (const { page, wrap, scale } of jobs) {
      const viewport = page.getViewport({ scale: scale * dpr });
      const canvas = document.createElement('canvas');
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      canvas.style.width = wrap.style.width;
      canvas.style.height = wrap.style.height;
      canvas.setAttribute('role', 'img');
      canvas.setAttribute('aria-label', 'Página ' + wrap.dataset.page + ' de ' + doc.numPages);
      await page.render({ canvas, canvasContext: canvas.getContext('2d'), viewport }).promise;
      if (id !== renderId) return;
      wrap.replaceChildren(canvas);
    }
  }

  zoomButtons.forEach((b) => {
    b.addEventListener('click', () => {
      zoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, zoom + Number(b.dataset.zoom) * ZOOM_STEP));
      updateLabels();
      render();
    });
  });

  const pageObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      current = Number(entry.target.dataset.page);
      updateLabels();
    });
  }, { root: scroller, rootMargin: '-45% 0px -45% 0px' });
  pages.forEach(({ wrap }) => pageObserver.observe(wrap));

  let resizeTimer;
  new ResizeObserver(() => {
    if (scroller.clientWidth === lastWidth || scroller.clientWidth === 0) return;
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(render, 150);
  }).observe(scroller);

  updateLabels();
  await render();
}
