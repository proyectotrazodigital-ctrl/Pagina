
document.addEventListener('DOMContentLoaded', () => {

    const URL_API = '../backend/autor_api.php';
    const grid = document.getElementById('grid-autores');
    const filtrosTipo = document.getElementById('filtros-tipo');
    const vacio = document.getElementById('autores-vacio');
    const buscador = document.querySelector('.buscador input');

    if (!grid) return;

    let autores = [];
    let esAdmin = false;
    let tipoActivo = '';

    function escaparHtml(texto) {
        const div = document.createElement('div');
        div.textContent = texto ?? '';
        return div.innerHTML;
    }

    
    function listaRedes(texto) {
        return String(texto || '').split(/\s+/).filter(l => /^https?:\/\//i.test(l));
    }

    function etiquetaRed(url) {
        try { return new URL(url).hostname.replace(/^www\./i, ''); } catch (e) { return url; }
    }

    function htmlRedes(texto) {
        return listaRedes(texto).map(url =>
            `<a href="${escaparHtml(url)}" target="_blank" rel="noopener noreferrer">${escaparHtml(etiquetaRed(url))}</a>`
        ).join(' · ');
    }

    function nombreCompleto(autor) {
        return [autor.Nombre, autor.Apellido].filter(Boolean).join(' ').trim() || 'Sin nombre';
    }

    function crearTarjeta(autor) {
        const id = autor.id_autor;
        const sufijo = `autor-${id}`;
        const murales = Array.isArray(autor.murales) ? autor.murales : [];

        const articulo = document.createElement('article');
        articulo.className = 'card';
        articulo.dataset.autorNombre = nombreCompleto(autor);

        articulo.innerHTML = `
            <div style="width:100%;height:160px;background:#f5eedf;display:flex;align-items:center;justify-content:center;color:#d48a37;font-size:64px;">
                <i class="fas fa-user-pen"></i>
            </div>
            <div class="contenido">
                <h3>${escaparHtml(nombreCompleto(autor))}</h3>
                ${listaRedes(autor.usuario).length ? `<p><i class="fas fa-link"></i> ${htmlRedes(autor.usuario)}</p>` : ''}
                ${autor.tipo ? `<span class="etiqueta">${escaparHtml(autor.tipo)}</span>` : ''}

                <input type="checkbox" id="detalle-${sufijo}" class="check-detalle">
                <div class="info-extra">
                    <h4><i class="fas fa-id-card"></i> Nombre</h4><p>${escaparHtml(autor.Nombre || '-')}</p>
                    <h4><i class="fas fa-id-card"></i> Apellido</h4><p>${escaparHtml(autor.Apellido || '-')}</p>
                    <h4><i class="fas fa-users"></i> Tipo</h4><p>${escaparHtml(autor.tipo || '-')}</p>
                    <h4><i class="fas fa-link"></i> Redes</h4><p>${listaRedes(autor.usuario).length ? htmlRedes(autor.usuario) : '-'}</p>
                    <h4><i class="fas fa-paint-brush"></i> Murales</h4>
                    <p>${murales.length ? murales.map(escaparHtml).join(', ') : 'Sin murales vinculados.'}</p>
                </div>

                <div class="card-footer">
                    <label for="detalle-${sufijo}" class="btn-detalle"><span class="texto-abrir">Ver detalle</span><span class="texto-cerrar">Cerrar</span></label>
                    ${esAdmin ? `<div class="md-admin-acciones">
                        <a href="administrarmurales.html?autor=${id}" class="md-btn-editar" title="Editar autor"><i class="fas fa-pen"></i></a>
                        <button type="button" class="md-btn-eliminar" data-id="${id}" title="Eliminar autor"><i class="fas fa-trash"></i></button>
                    </div>` : ''}
                </div>
            </div>
        `;
        grid.appendChild(articulo);
    }

    function render() {
        const texto = (buscador ? buscador.value : '').toLowerCase().trim();

        const filtrados = autores.filter(a => {
            const coincideTipo = !tipoActivo || (a.tipo || '') === tipoActivo;
            const coincideTexto = !texto ||
                nombreCompleto(a).toLowerCase().includes(texto) ||
                (a.usuario || '').toLowerCase().includes(texto);
            return coincideTipo && coincideTexto;
        });

        grid.innerHTML = '';
        filtrados.forEach(crearTarjeta);
        vacio.style.display = filtrados.length ? 'none' : 'block';
    }

    
    function renderFiltros() {
        const tipos = [...new Set(autores.map(a => a.tipo).filter(Boolean))].sort();
        filtrosTipo.innerHTML = '';
        if (tipos.length < 2) return;

        ['', ...tipos].forEach(tipo => {
            const boton = document.createElement('button');
            boton.type = 'button';
            boton.className = 'btn-categoria' + (tipo === tipoActivo ? ' activo' : '');
            boton.style.cursor = 'pointer';
            boton.textContent = tipo === '' ? 'Todos' : tipo;
            boton.addEventListener('click', () => {
                tipoActivo = tipo;
                renderFiltros();
                render();
            });
            filtrosTipo.appendChild(boton);
        });
    }

    async function iniciarPagina() {
        try {
            const sesion = await fetch('../backend/auth_session.php', { cache: 'no-store' }).then(r => r.json());
            esAdmin = !!sesion.admin_logueado;
        } catch (e) {
            esAdmin = false;
        }

        try {
            const json = await fetch(`${URL_API}?accion=listar`, { cache: 'no-store' }).then(r => r.json());
            if (json.exito && Array.isArray(json.datos)) autores = json.datos;
        } catch (e) {
            autores = [];
        }

        renderFiltros();
        render();
    }

    if (buscador) buscador.addEventListener('input', render);

    window.addEventListener('sesionActualizada', (evento) => {
        esAdmin = !!((evento.detail || {}).admin_logueado);
        render();
    });

    
    grid.addEventListener('click', async (evento) => {
        const boton = evento.target.closest('.md-btn-eliminar');
        if (!boton) return;
        if (!esAdmin) { alert('Solo un administrador puede eliminar autores.'); return; }

        const articulo = boton.closest('article');
        const nombre = (articulo && articulo.dataset.autorNombre) || 'este autor';

        if (!confirm(`¿Seguro que querés eliminar a "${nombre}"? Se quitarán también sus vínculos con murales y colectivos (los murales no se borran).`)) return;

        const datos = new URLSearchParams();
        datos.append('accion', 'eliminar');
        datos.append('id', boton.dataset.id);

        try {
            const json = await fetch(URL_API, { method: 'POST', body: datos, credentials: 'same-origin' }).then(r => r.json());
            if (json.exito) {
                autores = autores.filter(a => String(a.id_autor) !== String(boton.dataset.id));
                renderFiltros();
                render();
            } else {
                alert(json.mensaje || 'No se pudo eliminar el autor.');
            }
        } catch (e) {
            alert('Error de conexión con el servidor.');
        }
    });

    iniciarPagina();
});
