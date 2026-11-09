
document.addEventListener('DOMContentLoaded', async () => {
    const URL_API = '../backend/reportes_admin.php';
    const seccion = document.getElementById('pm-reportes');
    if (!seccion) return;

    const lista   = document.getElementById('pr-lista');
    const vacio   = document.getElementById('pr-vacio');
    const mensaje = document.getElementById('pr-mensaje');
    const tabs    = seccion.querySelectorAll('.pm-tab');

    let reportes = [];
    let vista = 'pendientes';

    function escaparHtml(texto) {
        const div = document.createElement('div');
        div.textContent = texto ?? '';
        return div.innerHTML;
    }

    function mostrarMensaje(texto, tipo) {
        mensaje.textContent = texto;
        mensaje.className = 'pm-mensaje ' + (tipo === 'error' ? 'pm-mensaje-error' : 'pm-mensaje-exito');
        mensaje.hidden = false;
        setTimeout(() => { mensaje.hidden = true; }, 4000);
    }

    function render() {
        const pendientes = reportes.filter(r => Number(r.resuelto) === 0);
        const resueltos  = reportes.filter(r => Number(r.resuelto) === 1);
        document.getElementById('pr-n-pendientes').textContent = pendientes.length;
        document.getElementById('pr-n-resueltos').textContent = resueltos.length;
        tabs.forEach(t => t.classList.toggle('activa', t.dataset.vista === vista));

        const visibles = vista === 'pendientes' ? pendientes : resueltos;
        vacio.hidden = visibles.length !== 0;

        lista.innerHTML = visibles.map(r => {
            const imagen = r.Imagen
                ? `<a href="../backend/${encodeURI(r.Imagen)}" target="_blank" rel="noopener"><img class="pr-imagen" src="../backend/${encodeURI(r.Imagen)}" alt="Imagen del reporte"></a>`
                : '';
            const boton = Number(r.resuelto) === 0
                ? `<button type="button" class="pc-publicar" data-id="${r.Id_reporte}" data-resuelto="1"><i class="fas fa-check"></i> Marcar como resuelto</button>`
                : `<button type="button" class="pc-revisar" data-id="${r.Id_reporte}" data-resuelto="0"><i class="fas fa-rotate-left"></i> Volver a pendientes</button>`;
            return `
                <div class="pc-item">
                    <div class="pc-meta">
                        <span><strong>${escaparHtml(r.mural)}</strong></span>
                        <span><i class="fas fa-flag"></i> ${escaparHtml(r.Causa)}</span>
                        <span><i class="fas fa-calendar"></i> ${escaparHtml(r.fecha)}</span>
                        ${r.ubicacion ? `<span><i class="fas fa-location-dot"></i> ${escaparHtml(r.ubicacion)}</span>` : ''}
                    </div>
                    <p class="pc-texto">${escaparHtml(r.Descripcion)}</p>
                    ${imagen}
                    <div class="pc-acciones">${boton}</div>
                </div>`;
        }).join('');
    }

    async function cargar() {
        try {
            const respuesta = await fetch(URL_API + '?accion=listar', { credentials: 'same-origin', cache: 'no-store' });
            const json = await respuesta.json();
            if (!json.exito) { mostrarMensaje(json.mensaje || 'No se pudieron cargar los reportes.', 'error'); return; }
            reportes = json.datos;
            render();
        } catch (e) {
            mostrarMensaje('Error de conexión con el servidor.', 'error');
        }
    }

    tabs.forEach(t => t.addEventListener('click', () => { vista = t.dataset.vista; render(); }));

    lista.addEventListener('click', async (evento) => {
        const boton = evento.target.closest('button[data-id]');
        if (!boton) return;

        const datos = new URLSearchParams();
        datos.append('accion', 'cambiar_estado');
        datos.append('id_reporte', boton.dataset.id);
        datos.append('resuelto', boton.dataset.resuelto);

        boton.disabled = true;
        try {
            const respuesta = await fetch(URL_API, { method: 'POST', body: datos, credentials: 'same-origin' });
            const json = await respuesta.json();
            mostrarMensaje(json.mensaje || (json.exito ? 'Listo.' : 'No se pudo cambiar el estado.'), json.exito ? 'exito' : 'error');
            if (json.exito) await cargar(); else boton.disabled = false;
        } catch (e) {
            mostrarMensaje('Error de conexión con el servidor.', 'error');
            boton.disabled = false;
        }
    });

    cargar();
});
