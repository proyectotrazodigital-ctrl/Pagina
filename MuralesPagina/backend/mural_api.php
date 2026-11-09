<?php
session_start();


header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

require 'conexion.php';

$metodo = $_SERVER['REQUEST_METHOD'];
$accion = $_GET['accion'] ?? $_POST['accion'] ?? 'listar';

function responder($exito, $datos = [], $mensaje = '') {
    echo json_encode([
        'exito'   => $exito,
        'mensaje' => $mensaje,
        'datos'   => $datos
    ], JSON_UNESCAPED_UNICODE);
    exit;
}


function buscarAutorPorNombre($conexion, $nombre) {
    $stmt = $conexion->prepare(
        "SELECT id_autor FROM autor
         WHERE TRIM(CONCAT_WS(' ', Nombre, Apellido)) = :nombre OR TRIM(Nombre) = :nombre
         ORDER BY id_autor ASC LIMIT 1"
    );
    $stmt->execute([':nombre' => $nombre]);
    $id = $stmt->fetchColumn();
    return $id === false ? null : (int) $id;
}


$CATEGORIAS_VALIDAS = ['Historia', 'Naturaleza', 'Cultura'];

try {

    
    if ($metodo === 'GET' && $accion === 'listar') {

        $tematicaFiltro = trim($_GET['tematica'] ?? '');

        
        $idUsuarioSesion = !empty($_SESSION['usuario_id']) ? (int) $_SESSION['usuario_id'] : 0;

        $sql = "SELECT Id_mural, titulo, autor, tematica, estado, direccion,
                       ubicacion, imagen, Descripcion, fecha_creacion,
                       cantidad_puntuacion, estrellas, estado_publicacion,
                       (SELECT p.estrellas FROM puntuacion p
                         WHERE p.Id_mural = mural.Id_mural AND p.Id_usuario = :uid) AS mi_voto
                FROM mural
                WHERE estado_publicacion = 'Activo'";


        $parametros = [':uid' => $idUsuarioSesion];
        if ($tematicaFiltro !== '' && in_array($tematicaFiltro, $CATEGORIAS_VALIDAS, true)) {
            $sql .= " AND tematica = :tematica";
            $parametros[':tematica'] = $tematicaFiltro;
        }

        $sql .= " ORDER BY fecha_creacion DESC, Id_mural DESC";

        $stmt = $conexion->prepare($sql);
        $stmt->execute($parametros);
        $murales = $stmt->fetchAll(PDO::FETCH_ASSOC);

        responder(true, $murales);
    }

    
    if ($metodo === 'POST' && in_array($accion, ['crear', 'actualizar', 'eliminar'], true) && empty($_SESSION['admin_id'])) {
        http_response_code(403);
        responder(false, [], 'Solo un administrador puede modificar los murales.');
    }

   
    if ($metodo === 'POST' && $accion === 'crear') {

        $titulo      = trim($_POST['titulo'] ?? '');
        $autor       = trim($_POST['autor'] ?? '');
        $tematica    = trim($_POST['tematica'] ?? '');
        $estado      = trim($_POST['estado'] ?? '');
        $direccion   = trim($_POST['direccion'] ?? '');
        $ubicacion   = trim($_POST['ubicacion'] ?? $direccion);
        $imagen      = trim($_POST['imagen'] ?? '');
        $descripcion = trim($_POST['descripcion'] ?? '');
        $fechaTexto  = trim($_POST['fecha_creacion'] ?? '');

        if ($titulo === '' || $tematica === '' || $estado === '' || $direccion === '') {
            responder(false, [], 'Faltan campos obligatorios (nombre, categoría, estado y dirección).');
        }

        
        if ($autor === '') {
            responder(false, [], 'No se pueden crear murales sin autor. Ingresá un autor que esté registrado.');
        }
        $idAutor = buscarAutorPorNombre($conexion, $autor);
        if ($idAutor === null) {
            responder(false, [], 'El autor "' . $autor . '" no está en la base de datos. Primero dalo de alta en la pestaña Autores.');
        }

        if (!in_array($tematica, $CATEGORIAS_VALIDAS, true)) {
            responder(false, [], 'La categoría debe ser Historia, Naturaleza o Cultura.');
        }
        if (mb_strlen($titulo) > 40) {
            responder(false, [], 'El nombre del mural no puede superar los 40 caracteres.');
        }
        if (mb_strlen($estado) > 20) {
            responder(false, [], 'El estado no puede superar los 20 caracteres.');
        }

        $fecha = $fechaTexto !== '' ? strtotime($fechaTexto) : time();
        if ($fecha === false) { $fecha = time(); }

        
        $idNuevo = (int) $conexion->query("SELECT COALESCE(MAX(Id_mural), 0) + 1 FROM mural")->fetchColumn();

        $sql = "INSERT INTO mural
                    (Id_mural, titulo, autor, tematica, estado, direccion, ubicacion,
                     imagen, Descripcion, fecha_creacion, cantidad_puntuacion, estrellas, estado_publicacion)
                VALUES
                    (:id, :titulo, :autor, :tematica, :estado, :direccion, :ubicacion,
                     :imagen, :descripcion, :fecha, 0, 0, 'Activo')";

        $stmt = $conexion->prepare($sql);
        $stmt->execute([
            ':id'          => $idNuevo,
            ':titulo'      => $titulo,
            ':autor'       => $autor !== '' ? $autor : null,
            ':tematica'    => $tematica,
            ':estado'      => $estado,
            ':direccion'   => $direccion,
            ':ubicacion'   => $ubicacion !== '' ? $ubicacion : $direccion,
            ':imagen'      => $imagen !== '' ? $imagen : null,
            ':descripcion' => $descripcion !== '' ? $descripcion : null,
            ':fecha'       => $fecha,
        ]);

        
        $conexion->prepare("INSERT IGNORE INTO crea (Id_mural, Id_autor) VALUES (:mural, :autor)")
                 ->execute([':mural' => $idNuevo, ':autor' => $idAutor]);

        responder(true, ['Id_mural' => $idNuevo], 'Mural creado correctamente.');
    }

  
    if ($metodo === 'POST' && $accion === 'actualizar') {

        $id          = (int) ($_POST['id'] ?? 0);
        $titulo      = trim($_POST['titulo'] ?? '');
        $autor       = trim($_POST['autor'] ?? '');
        $tematica    = trim($_POST['tematica'] ?? '');
        $estado      = trim($_POST['estado'] ?? '');
        $direccion   = trim($_POST['direccion'] ?? '');
        $ubicacion   = trim($_POST['ubicacion'] ?? $direccion);
        $imagen      = trim($_POST['imagen'] ?? '');
        $descripcion = trim($_POST['descripcion'] ?? '');
        $fechaTexto  = trim($_POST['fecha_creacion'] ?? '');

        if ($id <= 0) {
            responder(false, [], 'Falta el identificador del mural.');
        }
        if ($titulo === '' || $tematica === '' || $estado === '' || $direccion === '') {
            responder(false, [], 'Faltan campos obligatorios (nombre, categoría, estado y dirección).');
        }
        if (!in_array($tematica, $CATEGORIAS_VALIDAS, true)) {
            responder(false, [], 'La categoría debe ser Historia, Naturaleza o Cultura.');
        }

        $existe = $conexion->prepare("SELECT autor FROM mural WHERE Id_mural = :id AND estado_publicacion = 'Activo'");
        $existe->execute([':id' => $id]);
        $fila = $existe->fetch(PDO::FETCH_ASSOC);
        if ($fila === false) {
            responder(false, [], 'No se encontró el mural que querés editar.');
        }

        
        if ($autor === '') {
            responder(false, [], 'Un mural no puede quedar sin autor. Ingresá un autor que esté registrado.');
        }
        $idAutor = null;
        $autorCambio = trim((string) ($fila['autor'] ?? '')) !== $autor;
        if ($autorCambio) {
            $idAutor = buscarAutorPorNombre($conexion, $autor);
            if ($idAutor === null) {
                responder(false, [], 'El autor "' . $autor . '" no está en la base de datos. Primero dalo de alta en la pestaña Autores.');
            }
        }

        $sql = "UPDATE mural SET
                    titulo = :titulo,
                    autor = :autor,
                    tematica = :tematica,
                    estado = :estado,
                    direccion = :direccion,
                    ubicacion = :ubicacion,
                    imagen = :imagen,
                    Descripcion = :descripcion";

        $parametros = [
            ':titulo'      => $titulo,
            ':autor'       => $autor !== '' ? $autor : null,
            ':tematica'    => $tematica,
            ':estado'      => $estado,
            ':direccion'   => $direccion,
            ':ubicacion'   => $ubicacion !== '' ? $ubicacion : $direccion,
            ':imagen'      => $imagen !== '' ? $imagen : null,
            ':descripcion' => $descripcion !== '' ? $descripcion : null,
            ':id'          => $id,
        ];

        if ($fechaTexto !== '') {
            $fecha = strtotime($fechaTexto);
            if ($fecha !== false) {
                $sql .= ", fecha_creacion = :fecha";
                $parametros[':fecha'] = $fecha;
            }
        }

        $sql .= " WHERE Id_mural = :id AND estado_publicacion = 'Activo'";

        $stmt = $conexion->prepare($sql);
        $stmt->execute($parametros);

        if ($idAutor !== null) {
            $conexion->prepare("DELETE FROM crea WHERE Id_mural = :mural")->execute([':mural' => $id]);
            $conexion->prepare("INSERT INTO crea (Id_mural, Id_autor) VALUES (:mural, :autor)")
                     ->execute([':mural' => $id, ':autor' => $idAutor]);
        }

        responder(true, ['Id_mural' => $id], 'Mural actualizado correctamente.');
    }

    
    if ($metodo === 'POST' && $accion === 'eliminar') {

        $id = (int) ($_POST['id'] ?? 0);

        if ($id <= 0) {
            responder(false, [], 'Falta el identificador del mural.');
        }

        try {
          
            $conexion->prepare("DELETE FROM crea WHERE Id_mural = :id")->execute([':id' => $id]);
            $conexion->prepare("DELETE FROM puntuacion WHERE Id_mural = :id")->execute([':id' => $id]);
            $stmt = $conexion->prepare("DELETE FROM mural WHERE Id_mural = :id");
            $stmt->execute([':id' => $id]);
        } catch (PDOException $e) {
            
            $stmt = $conexion->prepare("UPDATE mural SET estado_publicacion = 'Inactivo' WHERE Id_mural = :id");
            $stmt->execute([':id' => $id]);
        }

        responder(true, ['Id_mural' => $id], 'Mural eliminado correctamente.');
    }

    responder(false, [], 'Acción no reconocida.');

} catch (PDOException $e) {
    responder(false, [], 'Error en la base de datos: ' . $e->getMessage());
}
