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
    responder(false, [], 'Solo un administrador puede ver los reportes.');
}

try {
    $metodo = $_SERVER['REQUEST_METHOD'];
    $accion = $_GET['accion'] ?? $_POST['accion'] ?? 'listar';

  
    if ($metodo === 'GET' && $accion === 'listar') {
        $sql = "SELECT r.Id_reporte, r.Causa, r.Descripcion, r.Imagen, r.fecha, r.ubicacion,
                       COALESCE(r.Resuelto, 0) AS resuelto, r.Id_mural,
                       COALESCE(m.titulo, CONCAT('Mural ', r.Id_mural)) AS mural
                FROM reporte r
                LEFT JOIN mural m ON m.Id_mural = r.Id_mural
                ORDER BY r.Id_reporte DESC";
        responder(true, $conexion->query($sql)->fetchAll());
    }

  
    if ($metodo === 'POST' && $accion === 'cambiar_estado') {
        $id = (int)($_POST['id_reporte'] ?? 0);
        $resuelto = ((int)($_POST['resuelto'] ?? 0)) === 1 ? 1 : 0;
        if ($id <= 0) { responder(false, [], 'Falta identificar el reporte.'); }

        $stmt = $conexion->prepare('UPDATE reporte SET Resuelto = :r WHERE Id_reporte = :id');
        $stmt->execute([':r' => $resuelto, ':id' => $id]);
        responder(true, ['resuelto' => $resuelto], $resuelto ? 'Reporte marcado como resuelto.' : 'Reporte devuelto a pendientes.');
    }

    responder(false, [], 'Acción no reconocida.');
} catch (PDOException $e) {
    http_response_code(500);
    responder(false, [], 'Error en la base de datos: ' . $e->getMessage());
}
