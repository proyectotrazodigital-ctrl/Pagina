

document.addEventListener('DOMContentLoaded', async () => {

    const URL_API = '../backend/autor_api.php';

  
    try {
        const sesion = await fetch('../backend/auth_session.php', { cache: 'no-store' }).then(r => r.json());
        if (!sesion.admin_logueado) return;
    } catch (e) { return; }

    const form            = document.getElementById('form-autor');
    if (!form) return;

    const inputId         = document.getElementById('autor-id');
    const inputNombre     = document.getElementById('autor-nombre');
    const inputApellido   = document.getElementById('autor-apellido');
    const inputTipo       = document.getElementById('autor-tipo');
    const inputUsuario    = document.getElementById('autor-usuario');
    const listaTipos      = document.getElementById('lista-tipos-autor');

    const tituloForm      = document.getElementById('aa-form-titulo');
    const btnGuardar      = document.getElementById('aa-btn-guardar');
    const btnCancelar     = document.getElementById('aa-btn-cancelar');
    const mensajeForm     = document.getElementById('aa-form-mensaje');

    const inputBuscar     = document.getElementById('aa-buscar');
    const filtroTipo      = document.getElementById('aa-filtro-tipo');
    const contenedorLista = document.getElementById('aa-lista-autores');
    const contador        = document.getElementById('aa-contador');
    const sinResultados   = document.getElementById('aa-sin-resultados');

    let autores = [];

    function mostrarMensaje(texto, tipo) {
        mensajeForm.textContent = texto;
        mensajeForm.className = 'pm-mensaje ' + (tipo === 'error' ? 'pm-mensaje-error' : 'pm-mensaje-exito');
        mensajeForm.hidden = false;
        setTimeout(() => { mensajeForm.hidden = true; }, 4000);
    }

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

    function nombreCompleto(a) {
        return [a.Nombre, a.Apellido].filter(Boolean).join(' ').trim() || 'Sin nombre';
    }

    
    async function cargarAutores() {
        try {
            const json = await fetch(`${URL_API}?accion=listar`, { cache: 'no-store' }).then(r => r.json());
            if (!json.exito) {
                contador.textContent = 'No se pudieron cargar los autores.';
                return;
            }
            autores = json.datos;
            actualizarTipos();
            aplicarFiltros();
            precargarEdicionDesdeUrl();
        } catch (e) {
            contador.textContent = 'Error de conexión con el servidor.';
        }
    }

    
    function actualizarTipos() {
        const tipos = [...new Set(autores.map(a => a.tipo).filter(Boolean))].sort();

        listaTipos.innerHTML = tipos.map(t => `<option value="${escaparHtml(t)}">`).join('');

        const seleccionado = filtroTipo.value;
        filtroTipo.innerHTML = '<option value="">Todos los tipos</option>' +
            tipos.map(t => `<option value="${escaparHtml(t)}">${escaparHtml(t)}</option>`).join('');
        filtroTipo.value = tipos.includes(seleccionado) ? seleccionado : '';
    }

    function precargarEdicionDesdeUrl() {
        const id = Number(new URLSearchParams(window.location.search).get('autor'));
        if (!id) return;
        const autor = autores.find(a => Number(a.id_autor) === id);
        if (autor) {
            cargarAutorEnFormulario(autor);
            tituloForm.scrollIntoView({ behavior: 'smooth' });
        }
    }

    
    function aplicarFiltros() {
        const texto = (inputBuscar.value || '').toLowerCase().trim();
        const tipo  = filtroTipo.value;

        const filtrados = autores.filter(a => {
            const coincideTexto = !texto ||
                (a.Nombre || '').toLowerCase().includes(texto) ||
                (a.Apellido || '').toLowerCase().includes(texto) ||
                (a.usuario || '').toLowerCase().includes(texto);
            const coincideTipo = !tipo || (a.tipo || '') === tipo;
            return coincideTexto && coincideTipo;
        });

        renderizarLista(filtrados);
    }

    function renderizarLista(lista) {
        contenedorLista.innerHTML = '';

        contador.textContent = `${lista.length} autor${lista.length === 1 ? '' : 'es'} encontrado${lista.length === 1 ? '' : 's'}`;
        sinResultados.hidden = lista.length !== 0;

        lista.forEach(autor => {
            const tarjeta = document.createElement('div');
            tarjeta.className = 'card';
            tarjeta.innerHTML = `
                <div class="pm-card-imagen"><i class="fas fa-user-pen"></i></div>
                <div style="padding:18px;">
                    <div class="pm-card-header">
                        <h4>${escaparHtml(nombreCompleto(autor))}</h4>
                        ${autor.tipo ? `<span class="pm-estado pm-estado-restaurado">${escaparHtml(autor.tipo)}</span>` : ''}
                    </div>

                    ${listaRedes(autor.usuario).length ? `<div class="pm-card-dato"><i class="fas fa-link"></i> ${htmlRedes(autor.usuario)}</div>` : ''}
                    <div class="pm-card-dato"><i class="fas fa-paint-brush"></i> ${autor.murales && autor.murales.length ? escaparHtml(autor.murales.join(', ')) : 'Sin murales vinculados'}</div>

                    <div class="pm-card-acciones">
                        <button type="button" class="pm-btn-editar" data-id="${autor.id_autor}">
                            <i class="fas fa-pen"></i> Editar
                        </button>
                        <button type="button" class="pm-btn-eliminar" data-id="${autor.id_autor}">
                            <i class="fas fa-trash"></i> Eliminar
                        </button>
                    </div>
                </div>
            `;
            contenedorLista.appendChild(tarjeta);
        });
    }

    inputBuscar.addEventListener('input', aplicarFiltros);
    filtroTipo.addEventListener('change', aplicarFiltros);

    
    function cargarAutorEnFormulario(autor) {
        inputId.value       = autor.id_autor;
        inputNombre.value   = autor.Nombre || '';
        inputApellido.value = autor.Apellido || '';
        inputTipo.value     = autor.tipo || '';
        inputUsuario.value  = autor.usuario || '';

        tituloForm.innerHTML = '<i class="fas fa-pen"></i> Editar autor';
        btnGuardar.innerHTML = '<i class="fas fa-save"></i> Guardar cambios';
        btnCancelar.hidden = false;
    }

    function cancelarEdicion() {
        form.reset();
        inputId.value = '';
        tituloForm.innerHTML = '<i class="fas fa-user-pen"></i> Alta de autor';
        btnGuardar.innerHTML = '<i class="fas fa-save"></i> Guardar autor';
        btnCancelar.hidden = true;

        const url = new URL(window.location.href);
        if (url.searchParams.has('autor')) {
            url.searchParams.delete('autor');
            window.history.replaceState({}, '', url);
        }
    }

    btnCancelar.addEventListener('click', cancelarEdicion);

    form.addEventListener('submit', async (evento) => {
        evento.preventDefault();

        const id = inputId.value;

        const datos = new URLSearchParams();
        datos.append('accion', id ? 'actualizar' : 'crear');
        if (id) datos.append('id', id);
        datos.append('nombre', inputNombre.value.trim());
        datos.append('apellido', inputApellido.value.trim());
        datos.append('tipo', inputTipo.value.trim());
        datos.append('usuario', inputUsuario.value.trim());

        btnGuardar.disabled = true;

        try {
            const json = await fetch(URL_API, { method: 'POST', body: datos, credentials: 'same-origin' }).then(r => r.json());

            if (json.exito) {
                mostrarMensaje(json.mensaje || 'Guardado correctamente.', 'exito');
                cancelarEdicion();
                cargarAutores();
            } else {
                mostrarMensaje(json.mensaje || 'No se pudo guardar el autor.', 'error');
            }
        } catch (e) {
            mostrarMensaje('Error de conexión con el servidor.', 'error');
        } finally {
            btnGuardar.disabled = false;
        }
    });

    
    contenedorLista.addEventListener('click', async (evento) => {
        const botonEditar = evento.target.closest('.pm-btn-editar');
        const botonEliminar = evento.target.closest('.pm-btn-eliminar');

        if (botonEditar) {
            const autor = autores.find(a => Number(a.id_autor) === Number(botonEditar.dataset.id));
            if (!autor) return;
            cargarAutorEnFormulario(autor);
            form.closest('section').scrollIntoView({ behavior: 'smooth' });
        }

        if (botonEliminar) {
            const id = Number(botonEliminar.dataset.id);
            const autor = autores.find(a => Number(a.id_autor) === id);
            const nombre = autor ? nombreCompleto(autor) : 'este autor';

            if (!confirm(`¿Seguro que querés eliminar a "${nombre}"? Se quitarán también sus vínculos con murales y colectivos (los murales no se borran). Esta acción no se puede deshacer.`)) return;

            const datos = new URLSearchParams();
            datos.append('accion', 'eliminar');
            datos.append('id', id);

            try {
                const json = await fetch(URL_API, { method: 'POST', body: datos, credentials: 'same-origin' }).then(r => r.json());
                if (json.exito) {
                    mostrarMensaje(json.mensaje || 'Autor eliminado.', 'exito');
                    if (Number(inputId.value) === id) cancelarEdicion();
                    cargarAutores();
                } else {
                    mostrarMensaje(json.mensaje || 'No se pudo eliminar el autor.', 'error');
                }
            } catch (e) {
                mostrarMensaje('Error de conexión con el servidor.', 'error');
            }
        }
    });

    cargarAutores();
});
