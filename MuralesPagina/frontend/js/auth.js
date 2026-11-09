(function () {
    const API = '../backend/';

    function crearInterfaz() {
        const header = document.querySelector('header');
        if (!header) return;

        
        if (!document.getElementById('btn-acceso')) {
            const boton = document.createElement('button');
            boton.id = 'btn-acceso';
            boton.className = 'btn-acceso-header';
            boton.innerHTML = '<i class="fas fa-right-to-bracket"></i> Iniciar sesión';
            boton.addEventListener('click', () => abrirModal('registro'));
            header.appendChild(boton);
        }

       
        if (!document.getElementById('usuario-flotante')) {
            const flotante = document.createElement('div');
            flotante.id = 'usuario-flotante';
            flotante.className = 'usuario-flotante oculto';
            flotante.innerHTML = '<button id="btn-usuario" title="Mi cuenta"><i class="fas fa-user"></i></button><div id="menu-usuario" class="menu-usuario"><strong id="nombre-sesion"></strong><a id="enlace-admin" href="../frontend/administrarmurales.html">Panel administrador</a><button id="cerrar-sesion">Cerrar sesión</button></div>';
            document.body.appendChild(flotante);

            document.getElementById('btn-usuario').addEventListener('click', function () {
                document.getElementById('menu-usuario').classList.toggle('abierto');
            });
            document.getElementById('cerrar-sesion').addEventListener('click', cerrarSesion);
        }

        if (!document.getElementById('modal-acceso')) {
            const modal = document.createElement('div');
            modal.id = 'modal-acceso';
            modal.className = 'modal-acceso oculto';
            modal.innerHTML = `
                <div class="modal-acceso-caja">
                    <button type="button" class="cerrar-modal" id="cerrar-modal">&times;</button>
                    <h2>Acceso</h2>
                    <p class="subtitulo-modal">Elegí una opción</p>

                    <div class="opciones-acceso">
                        <button type="button" class="opcion-acceso activa" data-panel="panel-registro">Registrarse</button>
                        <button type="button" class="opcion-acceso" data-panel="panel-admin">Ingresar como administrador</button>
                    </div>

                    <section id="panel-registro" class="panel-acceso activa">
                        <h3>Crear cuenta</h3>
                        <form id="form-registro">
                            <label>Usuario</label>
                            <input type="text" name="usuario" maxlength="40" required placeholder="Elegí un usuario">
                            <label>Contraseña</label>
                            <input type="password" name="password" required placeholder="Creá una contraseña">
                            <label>Correo</label>
                            <input type="email" name="mail" maxlength="50" required placeholder="correo@ejemplo.com">
                            <button type="submit" class="btn-principal">Registrarse</button>
                        </form>
                        <button type="button" id="ir-inicio-usuario" class="boton-iniciar-resaltado">¿Ya tenés una cuenta? <strong>Iniciar sesión</strong></button>
                        <section id="panel-login-usuario" class="login-usuario-extra">
                            <h4>Iniciar sesión como usuario</h4>
                            <form id="form-login-usuario">
                                <label>Usuario</label>
                                <input type="text" name="usuario" maxlength="40" required placeholder="Tu usuario">
                                <label>Contraseña</label>
                                <input type="password" name="password" required placeholder="Tu contraseña">
                                <button type="submit" class="btn-secundario">Iniciar sesión</button>
                            </form>
                        </section>
                    </section>

                    <section id="panel-admin" class="panel-acceso">
                        <h3>Ingresar como administrador</h3>
                        <form id="form-login-admin">
                            <label>ID de administrador</label>
                            <input type="number" name="id_admin" min="1" required placeholder="Tu ID">
                            <label>Contraseña</label>
                            <input type="password" name="password" required placeholder="Tu contraseña">
                            <button type="submit" class="btn-principal">Ingresar</button>
                        </form>
                        <button type="button" id="mostrar-registro-admin" class="enlace-admin-form">¿Necesitás crear una cuenta de administrador?</button>
                        <form id="form-registro-admin" class="registro-admin-oculto">
                            <h4>Crear administrador</h4>
                            <label>Nombre</label>
                            <input type="text" name="nombre" maxlength="30" required>
                            <label>Contraseña</label>
                            <input type="password" name="password" required>
                            <label>Clave exclusiva de administrador</label>
                            <input type="password" name="clave_admin" required>
                            <button type="submit" class="btn-secundario">Crear administrador</button>
                        </form>
                    </section>

                    <p id="mensaje-acceso" class="mensaje-acceso"></p>
                </div>`;
            document.body.appendChild(modal);

            document.getElementById('cerrar-modal').addEventListener('click', cerrarModal);
            modal.addEventListener('click', function (e) { if (e.target === modal) cerrarModal(); });
            document.querySelectorAll('.opcion-acceso').forEach(btn => btn.addEventListener('click', function () {
                document.querySelectorAll('.opcion-acceso').forEach(x => x.classList.remove('activa'));
                document.querySelectorAll('.panel-acceso').forEach(x => x.classList.remove('activa'));
                this.classList.add('activa');
                document.getElementById(this.dataset.panel).classList.add('activa');
                limpiarMensaje();
            }));

            document.getElementById('mostrar-registro-admin').addEventListener('click', function () {
                document.getElementById('form-registro-admin').classList.toggle('registro-admin-oculto');
            });
            document.getElementById('ir-inicio-usuario').addEventListener('click', function () {
                document.getElementById('panel-login-usuario').classList.toggle('abierto');
            });
            document.getElementById('form-registro').addEventListener('submit', registrarUsuario);
            document.getElementById('form-login-usuario').addEventListener('submit', iniciarUsuario);
            document.getElementById('form-login-admin').addEventListener('submit', iniciarAdmin);
            document.getElementById('form-registro-admin').addEventListener('submit', registrarAdmin);
        }
    }

    function abrirModal(panel) {
        const modal = document.getElementById('modal-acceso');
        if (!modal) return;
        modal.classList.remove('oculto');
        document.body.classList.add('sin-scroll');
        const boton = document.querySelector(`.opcion-acceso[data-panel="panel-${panel}"]`);
        if (boton) boton.click();
    }

    function cerrarModal() {
        const modal = document.getElementById('modal-acceso');
        if (modal) modal.classList.add('oculto');
        document.body.classList.remove('sin-scroll');
        limpiarMensaje();
    }

    function limpiarMensaje() {
        const m = document.getElementById('mensaje-acceso');
        if (m) { m.textContent = ''; m.className = 'mensaje-acceso'; }
    }

    function mostrarMensaje(texto, correcto) {
        const m = document.getElementById('mensaje-acceso');
        if (!m) return;
        m.textContent = texto;
        m.className = 'mensaje-acceso ' + (correcto ? 'exito' : 'error');
    }

    async function enviarFormulario(url, form) {
        const respuesta = await fetch(API + url, {
            method: 'POST',
            body: new FormData(form),
            credentials: 'same-origin'
        });

        const texto = await respuesta.text();
        let resultado;

        try {
            resultado = JSON.parse(texto);
        } catch (e) {
            throw new Error(
                respuesta.status >= 500
                    ? 'El servidor encontró un error. Revisá que Apache y MySQL estén encendidos y que la base sea "murales".'
                    : 'El servidor devolvió una respuesta no válida.'
            );
        }

        return resultado;
    }

    async function registrarUsuario(e) {
        e.preventDefault();
        try {
            const resultado = await enviarFormulario('registrar.php', e.target);
            mostrarMensaje(resultado.mensaje, resultado.ok);
            if (resultado.ok) {
                e.target.reset();
                await actualizarSesion();
                setTimeout(cerrarModal, 500);
            }
        } catch (error) { mostrarMensaje(error.message, false); }
    }

    async function iniciarUsuario(e) {
        e.preventDefault();
        try {
            const resultado = await enviarFormulario('iniciar_usuario.php', e.target);
            mostrarMensaje(resultado.mensaje, resultado.ok);
            if (resultado.ok) {
                e.target.reset();
                await actualizarSesion();
                setTimeout(cerrarModal, 400);
            }
        } catch (error) { mostrarMensaje(error.message, false); }
    }

    async function iniciarAdmin(e) {
        e.preventDefault();
        try {
            const resultado = await enviarFormulario('iniciar_admin.php', e.target);
            mostrarMensaje(resultado.mensaje, resultado.ok);
            if (resultado.ok) {
                e.target.reset();
                actualizarSesion();
                setTimeout(cerrarModal, 700);
            }
        } catch (error) { mostrarMensaje(error.message, false); }
    }

    async function registrarAdmin(e) {
        e.preventDefault();
        try {
            const resultado = await enviarFormulario('registrar_admin.php', e.target);
            mostrarMensaje(resultado.mensaje, resultado.ok);
            if (resultado.ok) {
                e.target.reset();
                actualizarSesion();
                setTimeout(cerrarModal, 1100);
            }
        } catch (error) { mostrarMensaje(error.message, false); }
    }

    async function cerrarSesion() {
        try {
            await fetch(API + 'cerrar_sesion.php');
            document.getElementById('menu-usuario').classList.remove('abierto');
            actualizarSesion();
        } catch (e) { alert('No se pudo cerrar la sesión.'); }
    }

    function aplicarPermisosPagina(datos) {
        const esUsuario = !!datos.usuario_logueado;
        const esAdmin = !!datos.admin_logueado;

        
        const boton = document.getElementById('btn-acceso');
        if (boton) boton.style.display = (esUsuario || esAdmin) ? 'none' : 'inline-flex';

        // El enlace al panel de murales solo existe para administradores.
        document.querySelectorAll('a[href*="administrarmurales.html"]').forEach(enlace => {
            enlace.style.display = esAdmin ? '' : 'none';
        });

        // Los controles de comentario los puede usar un usuario registrado o el administrador.
        const puedeComentar = esUsuario || esAdmin;
        document.querySelectorAll('.comentario textarea, .btn-comentar').forEach(elemento => {
            elemento.disabled = !puedeComentar;
            if (elemento.tagName === 'TEXTAREA') {
                elemento.placeholder = puedeComentar
                    ? 'Escribe un comentario...'
                    : 'Iniciá sesión para comentar.';
            }
        });

        
        window.dispatchEvent(new CustomEvent('sesionActualizada', { detail: datos }));
    }

    async function actualizarSesion() {
        try {
            const respuesta = await fetch(API + 'auth_session.php', { cache: 'no-store' });
            const datos = await respuesta.json();
            const boton = document.getElementById('btn-acceso');
            const flotante = document.getElementById('usuario-flotante');
            const nombre = document.getElementById('nombre-sesion');
            const enlaceAdmin = document.getElementById('enlace-admin');
            if (!boton || !flotante) return;

            if (datos.admin_logueado) {
                flotante.classList.remove('oculto');
                nombre.textContent = 'Administrador: ' + (datos.admin_nombre || '');
                enlaceAdmin.style.display = 'block';
            } else if (datos.usuario_logueado) {
                flotante.classList.remove('oculto');
                nombre.textContent = 'Usuario: ' + (datos.usuario || '');
                enlaceAdmin.style.display = 'none';
            } else {
                flotante.classList.add('oculto');
            }

            aplicarPermisosPagina(datos);
        } catch (e) {
            console.warn('No se pudo consultar la sesión. Abrí el sitio mediante http://localhost/.');
        }
    }

    window.estadoSesion = actualizarSesion;
    window.addEventListener('DOMContentLoaded', function () {
        crearInterfaz();
        actualizarSesion();
    });
})();
