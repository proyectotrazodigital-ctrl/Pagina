<?php
session_start();
require_once 'conexion.php';
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');


function responder($exito, $datos = [], $mensaje = '') {
    echo json_encode(['exito' => $exito, 'mensaje' => $mensaje, 'datos' => $datos], JSON_UNESCAPED_UNICODE);
    exit;
}

if (empty($_SESSION['admin_id'])) {
    http_response_code(403);
    responder(false, [], 'Solo un administrador puede moderar comentarios.');
}


$ESTADOS = ['para revisar', 'publicado', 'rechazado'];

try {
    $metodo = $_SERVER['REQUEST_METHOD'];
    $accion = $_GET['accion'] ?? $_POST['accion'] ?? 'listar';

    
    if ($metodo === 'GET' && $accion === 'listar') {
        $sql = "SELECT c.Id_mural, c.id_comentario, c.contenido, c.publicado AS estado, c.fecha,
                       COALESCE(m.titulo, CONCAT('Mural ', c.Id_mural)) AS mural,
                       COALESCE(u.usuario, 'Administrador') AS usuario
                FROM comentario c
                LEFT JOIN mural m ON m.Id_mural = c.Id_mural
                LEFT JOIN usuario u ON u.Id_usuario = c.id_usuario
                ORDER BY c.fecha DESC, c.Id_mural, c.id_comentario DESC";
        responder(true, $conexion->query($sql)->fetchAll());
    }

    
    if ($metodo === 'POST' && $accion === 'cambiar_estado') {
        $idMural = (int)($_POST['id_mural'] ?? 0);
        $idCom   = (int)($_POST['id_comentario'] ?? 0);
        $estado  = trim($_POST['estado'] ?? '');
        if ($idMural <= 0 || $idCom <= 0) { responder(false, [], 'Falta identificar el comentario.'); }
        if (!in_array($estado, $ESTADOS, true)) { responder(false, [], 'Estado no válido.'); }

        $stmt = $conexion->prepare('UPDATE comentario SET publicado = :e WHERE Id_mural = :m AND id_comentario = :c');
        $stmt->execute([':e' => $estado, ':m' => $idMural, ':c' => $idCom]);

        $mensajes = ['publicado' => 'Comentario publicado.', 'rechazado' => 'Comentario rechazado.', 'para revisar' => 'Comentario devuelto a revisión.'];
        responder(true, ['estado' => $estado], $mensajes[$estado]);
    }

    responder(false, [], 'Acción no reconocida.');
} catch (PDOException $e) {
    http_response_code(500);
    responder(false, [], 'Error en la base de datos: ' . $e->getMessage());
}
