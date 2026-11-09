
document.addEventListener('DOMContentLoaded', () => {
    const barra = document.getElementById('pm-apartados');
    if (!barra) return;

    const botones = barra.querySelectorAll('.pm-tab');
    const secciones = document.querySelectorAll('[data-apartado]:not(button)');

    function mostrar(apartado) {
        botones.forEach(b => b.classList.toggle('activa', b.dataset.apartado === apartado));
        secciones.forEach(sec => {
            sec.style.display = sec.dataset.apartado === apartado ? '' : 'none';
        });
        if (history.replaceState) history.replaceState(null, '', '#' + apartado);
    }

    botones.forEach(b => b.addEventListener('click', () => mostrar(b.dataset.apartado)));

    // Apertura inicial: ?autor=ID -> Autores, ?id=ID -> Murales, o el #hash de la URL
    const params = new URLSearchParams(window.location.search);
    const hash = window.location.hash.replace('#', '');
    let inicial = 'murales';
    if (params.has('autor')) inicial = 'autores';
    else if (['murales', 'comentarios', 'reportes', 'autores'].includes(hash)) inicial = hash;

    mostrar(inicial);
});
