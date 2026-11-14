(function () {
  var layout = document.querySelector('.doc-layout');
  var texto = document.getElementById('texto');
  var pdf = document.getElementById('pdf');
  if (!layout || !texto || !pdf) return;

  var tabs = Array.prototype.slice.call(document.querySelectorAll('.tab'));
  var mounted = false;

  function mountViewer() {
    if (mounted) return;
    mounted = true;
    import('/assets/pdf-viewer.js')
      .then(function (m) { return m.mount(pdf); })
      .catch(function () {
        var status = pdf.querySelector('.pv-status');
        status.hidden = false;
        status.innerHTML = 'No se pudo cargar el visor. <a href="' + pdf.dataset.pdf + '">Abrí el PDF directamente</a>.';
      });
  }

  function show(name, updateHash) {
    tabs.forEach(function (t) {
      var on = t.dataset.tab === name;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
    });
    texto.hidden = name !== 'texto';
    pdf.hidden = name !== 'pdf';
    layout.classList.toggle('is-pdf', name === 'pdf');
    if (name === 'pdf') mountViewer();
    if (updateHash) history.replaceState(null, '', '#' + name);
  }

  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { show(t.dataset.tab, true); });
    t.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      var next = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
      next.focus();
      show(next.dataset.tab, true);
    });
  });

  // Un enlace a una sección (#p-datos) abre el texto; sin ancla, las pantallas anchas abren el PDF.
  function fromHash() {
    var h = location.hash.slice(1);
    if (h === 'pdf') return 'pdf';
    if (h === 'texto' || (h && document.getElementById(h))) return 'texto';
    return null;
  }
  show(fromHash() || (window.matchMedia('(min-width: 761px)').matches ? 'pdf' : 'texto'), false);
  window.addEventListener('hashchange', function () {
    var name = fromHash();
    if (!name) return;
    show(name, false);
    var target = document.getElementById(location.hash.slice(1));
    if (name === 'texto' && target && target !== texto) target.scrollIntoView();
  });

  var tocLinks = document.querySelectorAll('.toc a');
  if (tocLinks.length && 'IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        tocLinks.forEach(function (a) {
          a.classList.toggle('active', a.getAttribute('href') === '#' + entry.target.id);
        });
      });
    }, { rootMargin: '-15% 0px -75% 0px' });
    document.querySelectorAll('.doc section[id]').forEach(function (s) { observer.observe(s); });
  }
})();
