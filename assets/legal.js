(function () {
  var viewer = document.getElementById('pdf');
  if (!viewer) return;
  import('/assets/pdf-viewer.js')
    .then(function (m) { return m.mount(viewer); })
    .catch(function () {
      var status = viewer.querySelector('.pv-status');
      status.hidden = false;
      status.innerHTML = 'No se pudo cargar el visor. <a href="' + viewer.dataset.pdf + '">Abrí el PDF directamente</a>.';
    });
})();
