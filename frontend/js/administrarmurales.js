

document.addEventListener('DOMContentLoaded', async () => {

    const URL_API = '../backend/mural_api.php';

    if (!(await verificarAdministrador())) return;

    const form             = document.getElementById('form-mural');
    const inputId           = document.getElementById('mural-id');
    const inputNombre       = document.getElementById('mural-nombre');
    const inputAutor        = document.getElementById('mural-autor');
    const selectCategoria   = document.getElementById('mural-categoria');
    const inputEstado       = document.getElementById('mural-estado');
    const inputDireccion    = document.getElementById('mural-direccion');
    const inputFecha        = document.getElementById('mural-fecha');
    const inputImagen       = document.getElementById('mural-imagen');
    const textDescripcion   = document.getElementById('mural-descripcion');

    const tituloForm   = document.getElementById('pm-form-titulo');
    const btnGuardar   = document.getElementById('pm-btn-guardar');
    const btnCancelar  = document.getElementById('pm-btn-cancelar');
    const mensajeForm  = document.getElementById('pm-form-mensaje');

    const inputBuscar     = document.getElementById('pm-buscar');
    const filtroCategoria = document.getElementById('pm-filtro-categoria');
    const contenedorLista = document.getElementById('pm-lista-murales');
    const contador        = document.getElementById('pm-contador');
    const sinResultados   = document.getElementById('pm-sin-resultados');

    let murales = [];

    
    const listaAutores = document.getElementById('lista-autores-mural');
    async function cargarAutoresSugeridos() {
        if (!listaAutores) return;
        try {
            const json = await fetch('../backend/autor_api.php?accion=listar', { cache: 'no-store' }).then(r => r.json());
            if (!json.exito || !Array.isArray(json.datos)) return;
            listaAutores.innerHTML = '';
            json.datos.forEach(a => {
                const nombre = [a.Nombre, a.Apellido].filter(Boolean).join(' ').trim();
                if (!nombre) return;
                const opcion = document.createElement('option');
                opcion.value = nombre;
                listaAutores.appendChild(opcion);
            });
        } catch (e) {  }
    }
    cargarAutoresSugeridos();
    inputAutor.addEventListener('focus', cargarAutoresSugeridos);

    async function verificarAdministrador() {
        try {
            const respuesta = await fetch('../backend/auth_session.php', { cache: 'no-store' });
            const sesion = await respuesta.json();
            if (!sesion.admin_logueado) {
                document.body.innerHTML = '<main style="max-width:600px;margin:80px auto;font-family:Arial;text-align:center;padding:30px"><h2>Acceso restringido</h2><p>Solo un administrador puede modificar o eliminar murales.</p><a href="index (1).html">Volver al inicio</a></main>';
                return false;
            }
            return true;
        } catch (e) {
            document.body.innerHTML = '<main style="max-width:600px;margin:80px auto;font-family:Arial;text-align:center;padding:30px"><h2>No se pudo verificar la sesión</h2><p>Ingresá como administrador e intentá nuevamente.</p></main>';
            return false;
        }
    }


    function mostrarMensaje(texto, tipo) {
        if (!mensajeForm) return;
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

    function timestampAFecha(timestamp) {
        if (!timestamp) return '';
        const fecha = new Date(Number(timestamp) * 1000);
        if (isNaN(fecha.getTime())) return '';
        return fecha.toISOString().slice(0, 10);
    }

    function timestampATextoLegible(timestamp) {
        if (!timestamp) return 'Sin fecha';
        const fecha = new Date(Number(timestamp) * 1000);
        if (isNaN(fecha.getTime())) return 'Sin fecha';
        return fecha.toLocaleDateString('es-UY', { month: 'long', year: 'numeric' });
    }

    

    async function cargarMurales() {
        try {
            const respuesta = await fetch(`${URL_API}?accion=listar`);
            const json = await respuesta.json();

            if (!json.exito) {
                contador.textContent = 'No se pudieron cargar los murales.';
                return;
            }

            murales = json.datos;
            aplicarFiltros();
            precargarEdicionDesdeUrl();

        } catch (error) {
            contador.textContent = 'Error de conexión con el servidor.';
        }
    }

    
    function precargarEdicionDesdeUrl() {
        const params = new URLSearchParams(window.location.search);
        const id = Number(params.get('id'));
        if (!id) return;

        const mural = murales.find(m => Number(m.Id_mural) === id);
        if (mural) {
            cargarMuralEnFormulario(mural);
            document.getElementById('pm-form-titulo').scrollIntoView({ behavior: 'smooth' });
        }
    }

    

    function aplicarFiltros() {
        const texto     = (inputBuscar.value || '').toLowerCase().trim();
        const categoria = filtroCategoria.value;

        const filtrados = murales.filter(m => {
            const coincideTexto = !texto ||
                (m.titulo || '').toLowerCase().includes(texto) ||
                (m.autor || '').toLowerCase().includes(texto) ||
                (m.direccion || '').toLowerCase().includes(texto);

            const coincideCategoria = !categoria || m.tematica === categoria;

            return coincideTexto && coincideCategoria;
        });

        renderizarLista(filtrados);
    }

    function renderizarLista(lista) {
        contenedorLista.innerHTML = '';

        contador.textContent = `${lista.length} mural${lista.length === 1 ? '' : 'es'} encontrado${lista.length === 1 ? '' : 's'}`;
        sinResultados.hidden = lista.length !== 0;

        lista.forEach(mural => {
            const tarjeta = document.createElement('div');
            tarjeta.className = 'card';
            tarjeta.innerHTML = `
                <div class="pm-card-imagen">
                    ${mural.imagen
                        ? `<img src="${escaparHtml(mural.imagen)}" alt="${escaparHtml(mural.titulo)}" style="width:100%;height:100%;object-fit:cover;">`
                        : `<i class="fas fa-image"></i>`}
                </div>
                <div style="padding:18px;">
                    <div class="pm-card-header">
                        <h4>${escaparHtml(mural.titulo)}</h4>
                        <span class="pm-estado pm-estado-restaurado">${escaparHtml(mural.tematica || 'Sin categoría')}</span>
                    </div>

                    ${mural.autor ? `<div class="pm-card-dato"><i class="fas fa-user-pen"></i> ${escaparHtml(mural.autor)}</div>` : ''}
                    <div class="pm-card-dato"><i class="fas fa-location-dot"></i> ${escaparHtml(mural.direccion)}</div>
                    <div class="pm-card-dato"><i class="fas fa-toggle-on"></i> ${escaparHtml(mural.estado)}</div>
                    <div class="pm-card-dato"><i class="fas fa-calendar"></i> ${timestampATextoLegible(mural.fecha_creacion)}</div>

                    ${mural.Descripcion ? `<p class="pm-card-descripcion">${escaparHtml(mural.Descripcion)}</p>` : ''}

                    <div class="pm-card-acciones">
                        <button type="button" class="pm-btn-editar" data-id="${mural.Id_mural}">
                            <i class="fas fa-pen"></i> Editar
                        </button>
                        <button type="button" class="pm-btn-eliminar" data-id="${mural.Id_mural}">
                            <i class="fas fa-trash"></i> Eliminar
                        </button>
                    </div>
                </div>
            `;
            contenedorLista.appendChild(tarjeta);
        });
    }

    inputBuscar.addEventListener('input', aplicarFiltros);
    filtroCategoria.addEventListener('change', aplicarFiltros);

  

    function cargarMuralEnFormulario(mural) {
        inputId.value = mural.Id_mural;
        inputNombre.value = mural.titulo || '';
        inputAutor.value = mural.autor || '';
        selectCategoria.value = mural.tematica || '';
        inputEstado.value = mural.estado || '';
        inputDireccion.value = mural.direccion || '';
        inputFecha.value = timestampAFecha(mural.fecha_creacion);
        inputImagen.value = mural.imagen || '';
        textDescripcion.value = mural.Descripcion || '';

        tituloForm.innerHTML = '<i class="fas fa-pen"></i> Editar mural';
        btnGuardar.innerHTML = '<i class="fas fa-save"></i> Guardar cambios';
        btnCancelar.hidden = false;
    }

    function cancelarEdicion() {
        form.reset();
        inputId.value = '';
        tituloForm.innerHTML = '<i class="fas fa-paint-brush"></i> Alta de mural';
        btnGuardar.innerHTML = '<i class="fas fa-save"></i> Guardar mural';
        btnCancelar.hidden = true;

      
        const url = new URL(window.location.href);
        if (url.searchParams.has('id')) {
            url.searchParams.delete('id');
            window.history.replaceState({}, '', url);
        }
    }

    btnCancelar.addEventListener('click', cancelarEdicion);

    form.addEventListener('submit', async (evento) => {
        evento.preventDefault();

        const id = inputId.value;
        const accion = id ? 'actualizar' : 'crear';

        const datos = new URLSearchParams();
        datos.append('accion', accion);
        if (id) datos.append('id', id);
        datos.append('titulo', inputNombre.value.trim());
        datos.append('autor', inputAutor.value.trim());
        datos.append('tematica', selectCategoria.value);
        datos.append('estado', inputEstado.value.trim());
        datos.append('direccion', inputDireccion.value.trim());
        datos.append('fecha_creacion', inputFecha.value);
        datos.append('imagen', inputImagen.value.trim());
        datos.append('descripcion', textDescripcion.value.trim());

        btnGuardar.disabled = true;

        try {
            const respuesta = await fetch(URL_API, { method: 'POST', body: datos });
            const json = await respuesta.json();

            if (json.exito) {
                mostrarMensaje(json.mensaje || 'Guardado correctamente.', 'exito');
                cancelarEdicion();
                cargarMurales();
            } else {
                mostrarMensaje(json.mensaje || 'No se pudo guardar el mural.', 'error');
            }
        } catch (error) {
            mostrarMensaje('Error de conexión con el servidor.', 'error');
        } finally {
            btnGuardar.disabled = false;
        }
    });

    

    contenedorLista.addEventListener('click', async (evento) => {
        const botonEditar = evento.target.closest('.pm-btn-editar');
        const botonEliminar = evento.target.closest('.pm-btn-eliminar');

        if (botonEditar) {
            const id = Number(botonEditar.dataset.id);
            const mural = murales.find(m => Number(m.Id_mural) === id);
            if (!mural) return;

            cargarMuralEnFormulario(mural);
            form.closest('section').scrollIntoView({ behavior: 'smooth' });
        }

        if (botonEliminar) {
            const id = Number(botonEliminar.dataset.id);
            const mural = murales.find(m => Number(m.Id_mural) === id);
            const nombre = mural ? mural.titulo : 'este mural';

            if (!confirm(`¿Seguro que querés eliminar "${nombre}"? Esta acción no se puede deshacer.`)) {
                return;
            }

            const datos = new URLSearchParams();
            datos.append('accion', 'eliminar');
            datos.append('id', id);

            try {
                const respuesta = await fetch(URL_API, { method: 'POST', body: datos });
                const json = await respuesta.json();

                if (json.exito) {
                    mostrarMensaje(json.mensaje || 'Mural eliminado.', 'exito');
                    cargarMurales();
                } else {
                    mostrarMensaje(json.mensaje || 'No se pudo eliminar el mural.', 'error');
                }
            } catch (error) {
                mostrarMensaje('Error de conexión con el servidor.', 'error');
            }
        }
    });

    cargarMurales();
});
