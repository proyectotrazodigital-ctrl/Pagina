<?php
session_start();
require_once 'conexion.php';
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

function salir($codigo, $datos) {
    http_response_code($codigo);
    echo json_encode($datos, JSON_UNESCAPED_UNICODE);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    salir(405, ['ok' => false, 'mensaje' => 'Método no permitido.']);
}


if (empty($_SESSION['usuario_id'])) {
    $mensaje = !empty($_SESSION['admin_id'])
        ? 'Solo los usuarios registrados pueden puntuar.'
        : 'Tenés que iniciar sesión para puntuar.';
    salir(401, ['ok' => false, 'mensaje' => $mensaje]);
}

$idMural   = filter_var($_POST['id_mural'] ?? null, FILTER_VALIDATE_INT);
$estrellas = filter_var($_POST['estrellas'] ?? null, FILTER_VALIDATE_INT);
$idUsuario = (int) $_SESSION['usuario_id'];

if (!$idMural || $estrellas === false || $estrellas === null || $estrellas < 1 || $estrellas > 5) {
    salir(400, ['ok' => false, 'mensaje' => 'La puntuación debe ser un número entero de 1 a 5.']);
}

try {
    $conexion->beginTransaction();

    
    $stmt = $conexion->prepare("SELECT Id_mural FROM mural WHERE Id_mural = :m AND estado_publicacion = 'Activo' FOR UPDATE");
    $stmt->execute([':m' => $idMural]);
    if (!$stmt->fetch()) {
        $conexion->rollBack();
        salir(404, ['ok' => false, 'mensaje' => 'El mural no existe.']);
    }

    
    $stmt = $conexion->prepare(
        'INSERT INTO puntuacion (Id_mural, Id_usuario, estrellas) VALUES (:m, :u, :e)
         ON DUPLICATE KEY UPDATE estrellas = VALUES(estrellas), fecha = CURRENT_TIMESTAMP'
    );
    $stmt->execute([':m' => $idMural, ':u' => $idUsuario, ':e' => $estrellas]);

   
    $stmt = $conexion->prepare('SELECT COUNT(*) AS cantidad, COALESCE(SUM(estrellas), 0) AS suma FROM puntuacion WHERE Id_mural = :m');
    $stmt->execute([':m' => $idMural]);
    $fila = $stmt->fetch(PDO::FETCH_ASSOC);
    $cantidad = (int) $fila['cantidad'];
    $promedio = $cantidad > 0 ? (int) round($fila['suma'] / $cantidad) : 0;

    $stmt = $conexion->prepare('UPDATE mural SET cantidad_puntuacion = :c, estrellas = :p WHERE Id_mural = :m');
    $stmt->execute([':c' => $cantidad, ':p' => $promedio, ':m' => $idMural]);

    $conexion->commit();

    echo json_encode([
        'ok'       => true,
        'promedio' => $promedio,
        'cantidad' => $cantidad,
        'mi_voto'  => $estrellas,
        'mensaje'  => 'Gracias por tu puntuación.'
    ], JSON_UNESCAPED_UNICODE);

} catch (PDOException $e) {
    if ($conexion->inTransaction()) { $conexion->rollBack(); }
    salir(500, ['ok' => false, 'mensaje' => 'Error de MySQL: ' . $e->getMessage()]);
}
