

document.addEventListener('DOMContentLoaded', () => {

    const URL_MURALES = '../backend/mural_api.php';
    const URL_GUARDAR  = '../backend/guardar_reporte.php';

    const form         = document.getElementById('form-reporte');
    const selectMural  = document.getElementById('reporte-mural');
    const inputImagen  = document.getElementById('imagen');
    const textDescripcion = document.getElementById('descripcion');
    const btnEnviar    = document.getElementById('reporte-btn-enviar');
    const mensaje      = document.getElementById('reporte-mensaje');

    if (!form) return;

    let usuarioLogueado = false;

    async function verificarUsuario() {
        try {
            const respuesta = await fetch('../backend/auth_session.php', { cache: 'no-store' });
            const sesion = await respuesta.json();
            usuarioLogueado = !!sesion.usuario_logueado;
            if (!usuarioLogueado) {
                btnEnviar.disabled = true;
                mostrarMensaje('Tenés que iniciar sesión como usuario para enviar un reporte.', 'error');
            }
        } catch (e) {
            btnEnviar.disabled = true;
            mostrarMensaje('No se pudo verificar la sesión.', 'error');
        }
    }


    function mostrarMensaje(texto, tipo) {
        if (!mensaje) return;
        mensaje.textContent = texto;
        mensaje.className = 'mensaje-reporte ' + (tipo === 'error' ? 'mensaje-reporte-error' : 'mensaje-reporte-exito');
        mensaje.hidden = false;
        setTimeout(() => { mensaje.hidden = true; }, 5000);
    }

   
    async function cargarMurales() {
        try {
            const respuesta = await fetch(`${URL_MURALES}?accion=listar`);
            const json = await respuesta.json();

            if (!json.exito || !json.datos.length) {
                selectMural.innerHTML = '<option value="" disabled selected>No hay murales cargados todavía</option>';
                return;
            }

            selectMural.innerHTML = '<option value="" disabled selected>Elegí el mural...</option>' +
                json.datos.map(m =>
                    `<option value="${m.Id_mural}">${m.titulo}${m.tematica ? ' (' + m.tematica + ')' : ''}</option>`
                ).join('');

        } catch (error) {
            selectMural.innerHTML = '<option value="" disabled selected>No se pudieron cargar los murales</option>';
        }
    }

   
    form.addEventListener('submit', async (evento) => {
        evento.preventDefault();

        if (!usuarioLogueado) {
            mostrarMensaje('Tenés que iniciar sesión como usuario para enviar un reporte.', 'error');
            return;
        }

        const causaElegida = form.querySelector('input[name="causa"]:checked');
        if (!causaElegida) {
            mostrarMensaje('Elegí un motivo de reporte.', 'error');
            return;
        }
        if (!selectMural.value) {
            mostrarMensaje('Elegí a qué mural corresponde el reporte.', 'error');
            return;
        }

        const datos = new FormData();
        datos.append('id_mural', selectMural.value);
        datos.append('causa', causaElegida.value);
        datos.append('descripcion', textDescripcion.value.trim());
        if (inputImagen.files[0]) {
            datos.append('imagen', inputImagen.files[0]);
        }

        btnEnviar.disabled = true;

        try {
            const respuesta = await fetch(URL_GUARDAR, { method: 'POST', body: datos });
            const json = await respuesta.json();

            if (json.ok) {
                mostrarMensaje(json.mensaje || 'Reporte enviado correctamente.', 'exito');
                form.reset();
                selectMural.selectedIndex = 0;
            } else {
                mostrarMensaje(json.mensaje || 'No se pudo enviar el reporte.', 'error');
            }
        } catch (error) {
            mostrarMensaje('Error de conexión con el servidor.', 'error');
        } finally {
            btnEnviar.disabled = false;
        }
    });

    verificarUsuario().then(() => {
        if (usuarioLogueado) cargarMurales();
    });

    
    window.addEventListener('sesionActualizada', function (evento) {
        const sesion = evento.detail || {};
        usuarioLogueado = !!sesion.usuario_logueado;
        btnEnviar.disabled = !usuarioLogueado;

        if (usuarioLogueado) {
            if (!selectMural.options.length || selectMural.options.length === 1) {
                cargarMurales();
            }
        } else {
            mostrarMensaje('Tenés que iniciar sesión como usuario para enviar un reporte.', 'error');
        }
    });
});
