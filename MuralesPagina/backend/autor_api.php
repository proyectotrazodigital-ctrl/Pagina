<?php
session_start();


header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

require 'conexion.php';

$metodo = $_SERVER['REQUEST_METHOD'];
$accion = $_GET['accion'] ?? $_POST['accion'] ?? 'listar';

// Normaliza el campo "redes" (columna `usuario`): acepta uno o varios links separados por
// coma, espacio o salto de línea. Si falta el esquema agrega https://. Solo permite http/https.
// Devuelve [textoNormalizado, errorOnull]. Vacío es válido (el campo es opcional).
function normalizarRedes($texto) {
    $texto = trim((string) $texto);
    if ($texto === '') {
        return ['', null];
    }
    $links = [];
    foreach (preg_split('/[\s,;]+/', $texto, -1, PREG_SPLIT_NO_EMPTY) as $parte) {
        if (!preg_match('#^[a-z][a-z0-9+.\-]*://#i', $parte)) {
            $parte = 'https://' . $parte;
        }
        $esquema = strtolower((string) parse_url($parte, PHP_URL_SCHEME));
        $host    = (string) parse_url($parte, PHP_URL_HOST);
        if (!in_array($esquema, ['http', 'https'], true) || $host === '' || strpos($host, '.') === false || !filter_var($parte, FILTER_VALIDATE_URL)) {
            return ['', 'Uno de los links de redes no es válido: ' . $parte];
        }
        $links[] = $parte;
    }
    $resultado = implode(' ', array_unique($links));
    if (mb_strlen($resultado) > 255) {
        return ['', 'Las redes no pueden superar los 255 caracteres en total.'];
    }
    return [$resultado, null];
}

function responder($exito, $datos = [], $mensaje = '') {
    echo json_encode([
        'exito'   => $exito,
        'mensaje' => $mensaje,
        'datos'   => $datos
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

try {

    // ------------------------------------------------------------
    // LISTAR (GET) - público
    // ------------------------------------------------------------
    if ($metodo === 'GET' && $accion === 'listar') {

        // Murales vinculados a cada autor (solo para mostrarlos). Un mural cuenta como del autor si:
        //  - está registrado en la tabla `crea` (vínculo por id), o
        //  - su texto `autor` coincide con el nombre completo del autor (murales cargados antes del vínculo), o
        //  - coincide con el Nombre cuando el autor no tiene Apellido (ej: un colectivo).
        $sql = "SELECT a.id_autor, a.Nombre, a.Apellido, a.tipo, a.usuario,
                       (SELECT GROUP_CONCAT(DISTINCT m.titulo ORDER BY m.titulo SEPARATOR '||')
                        FROM mural m
                        WHERE m.estado_publicacion = 'Activo'
                          AND (
                                m.Id_mural IN (SELECT c.Id_mural FROM crea c WHERE c.Id_autor = a.id_autor)
                                OR TRIM(m.autor) = TRIM(CONCAT_WS(' ', a.Nombre, a.Apellido))
                                OR ((a.Apellido IS NULL OR TRIM(a.Apellido) = '') AND TRIM(m.autor) = TRIM(a.Nombre))
                              )
                       ) AS murales
                FROM autor a
                ORDER BY a.Apellido ASC, a.Nombre ASC, a.id_autor ASC";

        $autores = $conexion->query($sql)->fetchAll(PDO::FETCH_ASSOC);

        foreach ($autores as &$autor) {
            $autor['murales'] = ($autor['murales'] !== null && $autor['murales'] !== '')
                ? explode('||', $autor['murales'])
                : [];
        }
        unset($autor);

        responder(true, $autores);
    }

    // Solo los administradores pueden crear, modificar o eliminar autores.
    if ($metodo === 'POST' && in_array($accion, ['crear', 'actualizar', 'eliminar'], true) && empty($_SESSION['admin_id'])) {
        http_response_code(403);
        responder(false, [], 'Solo un administrador puede modificar los autores.');
    }

    // ------------------------------------------------------------
    // CREAR (POST accion=crear)
    // ------------------------------------------------------------
    if ($metodo === 'POST' && $accion === 'crear') {

        $nombre   = trim($_POST['nombre'] ?? '');
        $apellido = trim($_POST['apellido'] ?? '');
        $tipo     = trim($_POST['tipo'] ?? '');
        $usuario  = trim($_POST['usuario'] ?? '');

        if ($nombre === '') {
            responder(false, [], 'El nombre es obligatorio.');
        }
        if (mb_strlen($nombre) > 30)   { responder(false, [], 'El nombre no puede superar los 30 caracteres.'); }
        if (mb_strlen($apellido) > 30) { responder(false, [], 'El apellido no puede superar los 30 caracteres.'); }
        if (mb_strlen($tipo) > 15)     { responder(false, [], 'El tipo no puede superar los 15 caracteres.'); }
        list($usuario, $errorRedes) = normalizarRedes($usuario);
        if ($errorRedes !== null) { responder(false, [], $errorRedes); }

        // Genera el próximo id_autor (la tabla no tiene AUTO_INCREMENT)
        $idNuevo = (int) $conexion->query("SELECT COALESCE(MAX(id_autor), 0) + 1 FROM autor")->fetchColumn();

        $stmt = $conexion->prepare(
            "INSERT INTO autor (id_autor, Nombre, Apellido, tipo, usuario)
             VALUES (:id, :nombre, :apellido, :tipo, :usuario)"
        );
        $stmt->execute([
            ':id'       => $idNuevo,
            ':nombre'   => $nombre,
            ':apellido' => $apellido !== '' ? $apellido : null,
            ':tipo'     => $tipo !== '' ? $tipo : null,
            ':usuario'  => $usuario !== '' ? $usuario : null,
        ]);

        responder(true, ['id_autor' => $idNuevo], 'Autor creado correctamente.');
    }

    // ------------------------------------------------------------
    // ACTUALIZAR (POST accion=actualizar)
    // ------------------------------------------------------------
    if ($metodo === 'POST' && $accion === 'actualizar') {

        $id       = (int) ($_POST['id'] ?? 0);
        $nombre   = trim($_POST['nombre'] ?? '');
        $apellido = trim($_POST['apellido'] ?? '');
        $tipo     = trim($_POST['tipo'] ?? '');
        $usuario  = trim($_POST['usuario'] ?? '');

        if ($id <= 0) {
            responder(false, [], 'Falta el identificador del autor.');
        }
        if ($nombre === '') {
            responder(false, [], 'El nombre es obligatorio.');
        }
        if (mb_strlen($nombre) > 30)   { responder(false, [], 'El nombre no puede superar los 30 caracteres.'); }
        if (mb_strlen($apellido) > 30) { responder(false, [], 'El apellido no puede superar los 30 caracteres.'); }
        if (mb_strlen($tipo) > 15)     { responder(false, [], 'El tipo no puede superar los 15 caracteres.'); }
        list($usuario, $errorRedes) = normalizarRedes($usuario);
        if ($errorRedes !== null) { responder(false, [], $errorRedes); }

        $existe = $conexion->prepare("SELECT COUNT(*) FROM autor WHERE id_autor = :id");
        $existe->execute([':id' => $id]);
        if ((int) $existe->fetchColumn() === 0) {
            responder(false, [], 'No se encontró el autor que querés editar.');
        }

        $stmt = $conexion->prepare(
            "UPDATE autor SET Nombre = :nombre, Apellido = :apellido, tipo = :tipo, usuario = :usuario
             WHERE id_autor = :id"
        );
        $stmt->execute([
            ':nombre'   => $nombre,
            ':apellido' => $apellido !== '' ? $apellido : null,
            ':tipo'     => $tipo !== '' ? $tipo : null,
            ':usuario'  => $usuario !== '' ? $usuario : null,
            ':id'       => $id,
        ]);

        responder(true, ['id_autor' => $id], 'Autor actualizado correctamente.');
    }

    // ------------------------------------------------------------
    // ELIMINAR (POST accion=eliminar)
    // ------------------------------------------------------------
    if ($metodo === 'POST' && $accion === 'eliminar') {

        $id = (int) ($_POST['id'] ?? 0);

        if ($id <= 0) {
            responder(false, [], 'Falta el identificador del autor.');
        }

        // El autor está referenciado por claves foráneas (autor_contacto, crea, pertenece).
        // Se quitan primero esos vínculos (los murales y colectivos NO se borran) y luego el autor.
        $conexion->beginTransaction();
        try {
            $conexion->prepare("DELETE FROM autor_contacto WHERE id_autor = :id")->execute([':id' => $id]);
            $conexion->prepare("DELETE FROM crea WHERE Id_autor = :id")->execute([':id' => $id]);
            $conexion->prepare("DELETE FROM pertenece WHERE id_autor = :id")->execute([':id' => $id]);
            $conexion->prepare("DELETE FROM autor WHERE id_autor = :id")->execute([':id' => $id]);
            $conexion->commit();
        } catch (PDOException $e) {
            $conexion->rollBack();
            throw $e;
        }

        responder(true, ['id_autor' => $id], 'Autor eliminado correctamente.');
    }

    responder(false, [], 'Acción no reconocida.');

} catch (PDOException $e) {
    responder(false, [], 'Error en la base de datos: ' . $e->getMessage());
}
