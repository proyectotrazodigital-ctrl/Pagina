// Muestra en la grilla de cada página (Historia / Naturaleza / Cultura) los murales
// cargados desde el Panel de Administración, con la misma tarjeta que las fijas.
// Se activa solo si <body data-tematica="Historia|Naturaleza|Cultura"> está presente.

document.addEventListener('DOMContentLoaded', () => {

    const contenedor = document.querySelector('.grid-murales');
    const tematica = document.body.dataset.tematica;

    if (!contenedor || !tematica) return;

    const URL_API = '../backend/mural_api.php';
    let esAdmin = false;
    let esUsuario = false;
    // Tanto un usuario registrado como el administrador pueden comentar.
    const puedeComentar = () => esUsuario || esAdmin;

    // Valoraciones por mural: { promedio (entero), cantidad (usuarios que votaron), miVoto }
    const valoraciones = {};

    // Las estrellas se rellenan SOLO con el voto del usuario actual (vacías si no votó o no inició sesión).
    // El promedio entero y la cantidad de votos se muestran en el texto de abajo.
    function pintarValoracion(sufijo, idMural) {
        const v = valoraciones[idMural] || { promedio: 0, cantidad: 0, miVoto: null };
        const estrellas = document.querySelectorAll(`input[name="puntuacion-${sufijo}"]`);
        estrellas.forEach(radio => { radio.checked = Number(radio.value) === Number(v.miVoto); });

        const info = document.getElementById(`info-puntuacion-${sufijo}`);
        if (!info) return;
        if (v.cantidad > 0) {
            const votos = v.cantidad === 1 ? '1 voto' : `${v.cantidad} votos`;
            info.textContent = `Promedio: ${v.promedio} de 5 (${votos})` +
                (v.miVoto ? ` · Tu voto: ${v.miVoto}` : '');
        } else {
            info.textContent = 'Todavía sin puntuaciones.';
        }
    }

    function guardarValoracion(mural) {
        valoraciones[mural.Id_mural] = {
            promedio: Number(mural.estrellas) || 0,
            cantidad: Number(mural.cantidad_puntuacion) || 0,
            miVoto: mural.mi_voto ? Number(mural.mi_voto) : null
        };
    }

    // Vuelve a pedir los murales para actualizar las estrellas (por ejemplo al iniciar sesión,
    // así se marca el voto propio).
    async function refrescarValoraciones() {
        try {
            const respuesta = await fetch(`${URL_API}?accion=listar&tematica=${encodeURIComponent(tematica)}`, {
                cache: 'no-store', credentials: 'same-origin'
            });
            const json = await respuesta.json();
            if (!json.exito || !Array.isArray(json.datos)) return;
            json.datos.forEach(mural => {
                guardarValoracion(mural);
                pintarValoracion(`${prefijo}-db${mural.Id_mural}`, mural.Id_mural);
            });
        } catch (e) { /* si falla, se dejan las estrellas como estaban */ }
    }

    const prefijo = tematica.toLowerCase();

    function escaparHtml(texto) {
        const div = document.createElement('div');
        div.textContent = texto ?? '';
        return div.innerHTML;
    }

    function formatearFecha(timestamp) {
        if (!timestamp) return 'Fecha no especificada';
        const fecha = new Date(Number(timestamp) * 1000);
        if (isNaN(fecha.getTime())) return 'Fecha no especificada';
        const mes = fecha.toLocaleDateString('es-UY', { month: 'long' });
        return `${mes.charAt(0).toUpperCase()}${mes.slice(1)} de ${fecha.getFullYear()}`;
    }

    // Los comentarios se leen siempre desde el servidor (MySQL), así los ven
    // todos: usuarios, invitados y administrador.
    async function cargarComentariosGuardados(listaId, idMural) {
        const lista = document.getElementById(listaId);
        if (!lista) return;
        try {
            const respuesta = await fetch(`../backend/listar_comentarios.php?id_mural=${encodeURIComponent(idMural)}`, {
                cache: 'no-store', credentials: 'same-origin'
            });
            if (!respuesta.ok) throw new Error('HTTP ' + respuesta.status);
            const comentarios = await respuesta.json();
            lista.innerHTML = '';
            if (!Array.isArray(comentarios)) return;
            comentarios.forEach(texto => {
                const item = document.createElement('div');
                item.className = 'item-comentario';
                item.textContent = texto;
                lista.appendChild(item);
            });
        } catch (e) {
            console.warn('No se pudieron cargar los comentarios del mural ' + idMural + ':', e);
            lista.innerHTML = '<p style="color:#b00;font-size:.85rem;margin:6px 0;">No se pudieron cargar los comentarios.</p>';
        }
    }

    function crearTarjeta(mural) {
        const id = mural.Id_mural;
        const sufijo = `${prefijo}-db${id}`;

        const imagenSrc = mural.imagen && mural.imagen.trim() !== ''
            ? mural.imagen
            : 'imagenes/imagenprincipal.jpg';

        const articulo = document.createElement('article');
        articulo.className = 'card';
        articulo.dataset.muralTitulo = mural.titulo || '';

        articulo.innerHTML = `
            <img src="${escaparHtml(imagenSrc)}" alt="">
            <div class="contenido">
                <h3>${escaparHtml(mural.titulo)}</h3>
                ${mural.autor ? `<p><i class="fas fa-user-pen"></i> ${escaparHtml(mural.autor)}</p>` : ''}
                <p><i class="fas fa-location-dot"></i> ${escaparHtml(mural.direccion || mural.ubicacion || '')}</p>
                <p><i class="fas fa-calendar"></i> ${formatearFecha(mural.fecha_creacion)}</p>
                <span class="etiqueta">${escaparHtml(mural.tematica)}</span>

                <input type="checkbox" id="detallemural-${sufijo}" class="check-detalle">
                <div class="info-extra">
                    <h4><i class="fas fa-user"></i> Estado</h4><p>${escaparHtml(mural.estado)}</p>
                    <h4><i class="fas fa-circle-info"></i> Descripción:</h4><p>${escaparHtml(mural.Descripcion || 'Sin descripción.')}</p>
                    <div class="valoracion">
                        <span>Puntuación:</span>
                        <div class="estrellas" data-id="${id}" data-sufijo="${sufijo}">
                            <input type="radio" id="estrella-${sufijo}-5" name="puntuacion-${sufijo}" value="5"><label for="estrella-${sufijo}-5" title="5 estrellas">★</label>
                            <input type="radio" id="estrella-${sufijo}-4" name="puntuacion-${sufijo}" value="4"><label for="estrella-${sufijo}-4" title="4 estrellas">★</label>
                            <input type="radio" id="estrella-${sufijo}-3" name="puntuacion-${sufijo}" value="3"><label for="estrella-${sufijo}-3" title="3 estrellas">★</label>
                            <input type="radio" id="estrella-${sufijo}-2" name="puntuacion-${sufijo}" value="2"><label for="estrella-${sufijo}-2" title="2 estrellas">★</label>
                            <input type="radio" id="estrella-${sufijo}-1" name="puntuacion-${sufijo}" value="1"><label for="estrella-${sufijo}-1" title="1 estrella">★</label>
                        </div>
                    </div>
                    <p class="valoracion-info" id="info-puntuacion-${sufijo}"></p>
                    <div class="comentario">
                        <label for="comentario-${sufijo}">Comentario:</label>
                        <textarea id="comentario-${sufijo}" rows="2" placeholder="${puedeComentar() ? 'Escribe un comentario...' : 'Iniciá sesión para comentar.'}" ${puedeComentar() ? '' : 'disabled'}></textarea>
                        <button type="button" class="btn-comentar" ${puedeComentar() ? '' : 'disabled'} onclick="agregarComentario('${sufijo}', '${id}')">Publicar</button>
                        <div id="lista-comentarios-${sufijo}" class="lista-comentarios"></div>
                    </div>
                </div>

                <div class="card-footer">
                    <label for="detallemural-${sufijo}" class="btn-detalle"><span class="texto-abrir">Ver detalle</span><span class="texto-cerrar">Cerrar</span></label>
                    ${esAdmin ? `<div class="md-admin-acciones">
                        <a href="administrarmurales.html?id=${id}" class="md-btn-editar" title="Editar mural"><i class="fas fa-pen"></i></a>
                        <button type="button" class="md-btn-eliminar" data-id="${id}" title="Eliminar mural"><i class="fas fa-trash"></i></button>
                    </div>` : ''}
                </div>
            </div>
        `;

        contenedor.appendChild(articulo);
        guardarValoracion(mural);
        pintarValoracion(sufijo, id);
        cargarComentariosGuardados(`lista-comentarios-${sufijo}`, id);
    }

    // Carga los murales de esta categoría desde el servidor
    async function iniciarPagina() {
        try {
            const sesion = await fetch('../backend/auth_session.php', { cache: 'no-store' }).then(r => r.json());
            esAdmin = !!sesion.admin_logueado;
            esUsuario = !!sesion.usuario_logueado;
        } catch (e) {
            esAdmin = false;
            esUsuario = false;
        }

        try {
            const respuesta = await fetch(`${URL_API}?accion=listar&tematica=${encodeURIComponent(tematica)}`);
            const json = await respuesta.json();
            if (json.exito && Array.isArray(json.datos)) json.datos.forEach(crearTarjeta);
        } catch (e) {
            // Si el backend no responde, la página sigue mostrando los murales fijos sin romperse.
        }
    }

    // Cuando cambia la sesión, solo actualizamos permisos.
    // No borramos las tarjetas fijas: esas tarjetas forman parte del contenido
    // original de cada página y no deben desaparecer al iniciar sesión.
    window.addEventListener('sesionActualizada', function (evento) {
        const sesion = evento.detail || {};
        esAdmin = !!sesion.admin_logueado;
        esUsuario = !!sesion.usuario_logueado;

        document.querySelectorAll('.comentario textarea, .btn-comentar').forEach(elemento => {
            elemento.disabled = !puedeComentar();
            if (elemento.tagName === 'TEXTAREA') {
                elemento.placeholder = puedeComentar()
                    ? 'Escribe un comentario...'
                    : 'Iniciá sesión para comentar.';
            }
        });

        // Se actualizan las estrellas para marcar (o dejar de marcar) el voto propio.
        refrescarValoraciones();

        // Los botones de administración se muestran/ocultan sin reconstruir la página.
        document.querySelectorAll('.md-admin-acciones').forEach(acciones => {
            acciones.style.display = esAdmin ? '' : 'none';
        });
    });

    iniciarPagina();

    window.agregarComentario = async function(sufijo, idMural) {
        if (!puedeComentar()) {
            alert('Tenés que iniciar sesión para comentar.');
            return;
        }
        const textarea = document.getElementById(`comentario-${sufijo}`);
        const lista = document.getElementById(`lista-comentarios-${sufijo}`);
        const texto = textarea ? textarea.value.trim() : '';
        if (!texto) return;

        const datos = new FormData();
        datos.append('id_mural', idMural);
        datos.append('comentario', texto);

        try {
            const respuesta = await fetch('../backend/guardar_comentario.php', {
                method: 'POST', body: datos, credentials: 'same-origin'
            });
            const json = await respuesta.json();
            if (!json.ok) { alert(json.mensaje || 'No se pudo guardar el comentario.'); return; }

            textarea.value = '';
            if (json.estado === 'publicado') {
                // Solo el administrador publica directo; el comentario se ve al instante.
                const nuevo = document.createElement('div');
                nuevo.className = 'item-comentario';
                nuevo.textContent = texto;
                lista.prepend(nuevo);
            } else {
                // Comentario de usuario: queda 'para revisar' y no se muestra todavía.
                alert(json.mensaje);
            }
        } catch (e) {
            alert('No se pudo conectar con el servidor.');
        }
    };

    // Puntuar un mural: al tocar una estrella se guarda el voto y se actualiza el promedio entero.
    contenedor.addEventListener('change', async (evento) => {
        const radio = evento.target.closest('.estrellas input');
        if (!radio) return;

        const caja = radio.closest('.estrellas');
        const idMural = caja.dataset.id;
        const sufijo = caja.dataset.sufijo;

        if (!esUsuario) {
            alert(esAdmin
                ? 'Solo los usuarios registrados pueden puntuar.'
                : 'Tenés que iniciar sesión para puntuar.');
            pintarValoracion(sufijo, idMural); // vuelve a mostrar el promedio real
            return;
        }

        const datos = new FormData();
        datos.append('id_mural', idMural);
        datos.append('estrellas', radio.value);

        try {
            const respuesta = await fetch('../backend/puntuar_mural.php', {
                method: 'POST', body: datos, credentials: 'same-origin'
            });
            const json = await respuesta.json();
            if (!json.ok) {
                alert(json.mensaje || 'No se pudo guardar la puntuación.');
                pintarValoracion(sufijo, idMural);
                return;
            }
            valoraciones[idMural] = {
                promedio: Number(json.promedio),
                cantidad: Number(json.cantidad),
                miVoto: Number(json.mi_voto)
            };
            pintarValoracion(sufijo, idMural);
        } catch (e) {
            alert('No se pudo conectar con el servidor.');
            pintarValoracion(sufijo, idMural);
        }
    });

    // Eliminar un mural agregado desde el panel (delegación de eventos)
    contenedor.addEventListener('click', async (evento) => {
        const boton = evento.target.closest('.md-btn-eliminar');
        if (!boton) return;
        if (!esAdmin) { alert('Solo un administrador puede eliminar murales.'); return; }

        const articulo = boton.closest('article');
        const nombre = (articulo && articulo.dataset.muralTitulo) || 'este mural';

        if (!confirm(`¿Seguro que querés eliminar "${nombre}"? Esta acción no se puede deshacer.`)) {
            return;
        }

        const datos = new URLSearchParams();
        datos.append('accion', 'eliminar');
        datos.append('id', boton.dataset.id);

        try {
            const respuesta = await fetch(URL_API, { method: 'POST', body: datos });
            const json = await respuesta.json();

            if (json.exito) {
                articulo.remove();
            } else {
                alert(json.mensaje || 'No se pudo eliminar el mural.');
            }
        } catch (error) {
            alert('Error de conexión con el servidor.');
        }
    });
});
