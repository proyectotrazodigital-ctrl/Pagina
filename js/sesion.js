(function () {
    const modal = document.getElementById('modal-sesion');
    const abrir = document.getElementById('abrir-sesion');
    const cerrar = document.getElementById('cerrar-sesion');
    const registro = document.getElementById('opcion-registro');
    const admin = document.getElementById('opcion-admin');
    const panelRegistro = document.getElementById('panel-registro');
    const panelAdmin = document.getElementById('panel-admin');
    const panelCrearAdmin = document.getElementById('panel-crear-admin');
    const enlaceCrearAdmin = document.getElementById('mostrar-crear-admin');
    const panelAdminLogin = document.getElementById('panel-admin-login');
    const mensaje = document.getElementById('mensaje-sesion');
    const panelBotonAdmin = document.getElementById('panel-admin-header');
    const usuarioFlotante = document.getElementById('usuario-flotante');
    const botonUsuario = document.getElementById('boton-usuario-flotante');
    const menuUsuario = document.getElementById('menu-usuario-flotante');
    const nombreUsuario = document.getElementById('nombre-usuario-flotante');
    const cerrarSesion = document.getElementById('cerrar-sesion-flotante');
    const enlacePanelFlotante = document.getElementById('enlace-panel-flotante');
    const volverLoginAdmin = document.getElementById('volver-login-admin');

    function mostrarMensaje(texto, error) {
        if (!mensaje) return;
        mensaje.textContent = texto || '';
        mensaje.className = 'mensaje-sesion' + (texto ? (error ? ' error' : ' ok') : '');
    }

    function mostrarVista(vista) {
        if (!panelRegistro || !panelAdmin) return;
        panelRegistro.hidden = vista !== 'registro';
        panelAdmin.hidden = vista !== 'admin';
        if (registro) registro.classList.toggle('activa', vista === 'registro');
        if (admin) admin.classList.toggle('activa', vista === 'admin');
        if (panelCrearAdmin) panelCrearAdmin.hidden = true;
        if (panelAdminLogin) panelAdminLogin.hidden = false;
        if (volverLoginAdmin) volverLoginAdmin.hidden = false;
        mostrarMensaje('', false);
    }

    function abrirModal(vista) {
        if (!modal) return;
        modal.classList.add('abierto');
        mostrarVista(vista || 'registro');
    }

    function cerrarModal() {
        if (modal) modal.classList.remove('abierto');
    }

    if (abrir) abrir.addEventListener('click', () => abrirModal('registro'));
    if (cerrar) cerrar.addEventListener('click', cerrarModal);
    if (registro) registro.addEventListener('click', () => mostrarVista('registro'));
    if (admin) admin.addEventListener('click', () => mostrarVista('admin'));
    if (enlaceCrearAdmin) enlaceCrearAdmin.addEventListener('click', function () {
        if (panelAdminLogin) panelAdminLogin.hidden = true;
        if (panelCrearAdmin) panelCrearAdmin.hidden = false;
        mostrarMensaje('', false);
    });
    if (volverLoginAdmin) volverLoginAdmin.addEventListener('click', function () {
        if (panelCrearAdmin) panelCrearAdmin.hidden = true;
        if (panelAdminLogin) panelAdminLogin.hidden = false;
        mostrarMensaje('', false);
    });

    if (modal) modal.addEventListener('click', e => {
        if (e.target === modal) cerrarModal();
    });

    async function enviarFormulario(formulario, url) {
        mostrarMensaje('Procesando...', false);
        try {
            const respuesta = await fetch(url, { method: 'POST', body: new FormData(formulario) });
            const resultado = await respuesta.json();
            if (!resultado.ok) {
                mostrarMensaje(resultado.mensaje || 'No se pudo completar la operación.', true);
                return;
            }
            mostrarMensaje(resultado.mensaje || 'Operación realizada.', false);
            setTimeout(() => {
                cerrarModal();
                actualizarSesion();
            }, 700);
        } catch (e) {
            mostrarMensaje('No se pudo conectar con XAMPP. Abrí el proyecto mediante http://localhost/.', true);
        }
    }

    const formRegistro = document.getElementById('form-registro-simple');
    if (formRegistro) {
        formRegistro.addEventListener('submit', function (e) {
            e.preventDefault();
            enviarFormulario(formRegistro, '../backend/registrar.php');
        });
    }

    const formAdmin = document.getElementById('form-login-admin');
    if (formAdmin) {
        formAdmin.addEventListener('submit', function (e) {
            e.preventDefault();
            enviarFormulario(formAdmin, '../backend/login_admin.php');
        });
    }

    const formCrearAdmin = document.getElementById('form-registro-admin');
    if (formCrearAdmin) {
        formCrearAdmin.addEventListener('submit', function (e) {
            e.preventDefault();
            enviarFormulario(formCrearAdmin, '../backend/registrar_admin.php');
        });
    }

    async function actualizarSesion() {
        try {
            const respuesta = await fetch('../backend/sesion.php', { cache: 'no-store' });
            const estado = await respuesta.json();
            const logueado = !!estado.logueado;
            const esAdmin = !!estado.es_admin;

            if (panelBotonAdmin) panelBotonAdmin.style.display = esAdmin ? 'inline-flex' : 'none';
            if (enlacePanelFlotante) enlacePanelFlotante.style.display = esAdmin ? 'block' : 'none';
            if (usuarioFlotante) usuarioFlotante.classList.toggle('visible', logueado);
            if (nombreUsuario) nombreUsuario.textContent = esAdmin ? 'Administrador: ' + estado.nombre : 'Usuario: ' + estado.nombre;

            if (abrir) abrir.style.display = logueado ? 'none' : 'inline-flex';
        } catch (e) {
            
        }
    }

    if (botonUsuario) botonUsuario.addEventListener('click', () => {
        if (menuUsuario) menuUsuario.classList.toggle('abierto');
    });

    if (cerrarSesion) cerrarSesion.addEventListener('click', async () => {
        const datos = new FormData();
        datos.append('accion', 'salir');
        try {
            await fetch('../backend/sesion.php', { method: 'POST', body: datos });
            if (menuUsuario) menuUsuario.classList.remove('abierto');
            actualizarSesion();
        } catch (e) {
            alert('No se pudo cerrar la sesión.');
        }
    });

    actualizarSesion();
})();
