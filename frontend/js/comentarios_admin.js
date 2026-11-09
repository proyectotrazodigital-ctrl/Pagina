
document.addEventListener('DOMContentLoaded', async () => {
    const URL_API = '../backend/comentarios_admin.php';
    const seccion = document.getElementById('pm-comentarios');
    if (!seccion) return;

    const lista   = document.getElementById('pc-lista');
    const vacio   = document.getElementById('pc-vacio');
    const mensaje = document.getElementById('pc-mensaje');
    const tabs    = seccion.querySelectorAll('.pm-tab');

    let comentarios = [];
    let estadoActivo = null;

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
        ['para revisar', 'publicado', 'rechazado'].forEach(e => {
            const n = document.getElementById('pc-n-' + e.replace(' ', '-'));
            if (n) n.textContent = comentarios.filter(c => c.estado === e).length;
        });
        tabs.forEach(t => t.classList.toggle('activa', t.dataset.estado === estadoActivo));

        const visibles = comentarios.filter(c => c.estado === estadoActivo);
        vacio.hidden = visibles.length !== 0;

        lista.innerHTML = visibles.map(c => {
            const botones = [];
            if (c.estado !== 'publicado') botones.push(['publicado', 'pc-publicar', 'fa-check', 'Publicar']);
            if (c.estado !== 'rechazado') botones.push(['rechazado', 'pc-rechazar', 'fa-ban', 'Rechazar']);
            if (c.estado !== 'para revisar') botones.push(['para revisar', 'pc-revisar', 'fa-rotate-left', 'Pasar a revisar']);
            return `
                <div class="pc-item">
                    <div class="pc-meta">
                        <span><strong>${escaparHtml(c.mural)}</strong></span>
                        <span><i class="fas fa-user"></i> ${escaparHtml(c.usuario)}</span>
                        <span><i class="fas fa-calendar"></i> ${escaparHtml(c.fecha)}</span>
                    </div>
                    <p class="pc-texto">${escaparHtml(c.contenido)}</p>
                    <div class="pc-acciones">
                        ${botones.map(b => `<button type="button" class="${b[1]}" data-mural="${c.Id_mural}" data-comentario="${c.id_comentario}" data-estado="${b[0]}"><i class="fas ${b[2]}"></i> ${b[3]}</button>`).join('')}
                    </div>
                </div>`;
        }).join('');
    }

    async function cargar() {
        try {
            const respuesta = await fetch(URL_API + '?accion=listar', { credentials: 'same-origin', cache: 'no-store' });
            const json = await respuesta.json();
            if (!json.exito) { mostrarMensaje(json.mensaje || 'No se pudieron cargar los comentarios.', 'error'); return; }
            comentarios = json.datos;
            // Primera carga: si hay comentarios para revisar se muestran primero
            if (!estadoActivo) {
                estadoActivo = comentarios.some(c => c.estado === 'para revisar') ? 'para revisar' : 'publicado';
            }
            render();
        } catch (e) {
            mostrarMensaje('Error de conexión con el servidor.', 'error');
        }
    }

    tabs.forEach(t => t.addEventListener('click', () => { estadoActivo = t.dataset.estado; render(); }));

    lista.addEventListener('click', async (evento) => {
        const boton = evento.target.closest('button[data-estado]');
        if (!boton) return;

        const datos = new URLSearchParams();
        datos.append('accion', 'cambiar_estado');
        datos.append('id_mural', boton.dataset.mural);
        datos.append('id_comentario', boton.dataset.comentario);
        datos.append('estado', boton.dataset.estado);

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
