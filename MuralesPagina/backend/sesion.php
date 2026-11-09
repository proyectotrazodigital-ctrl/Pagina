<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['accion'] ?? '') === 'salir') {
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000, $params['path'], $params['domain'], $params['secure'], $params['httponly']);
    }
    session_destroy();
    echo json_encode(['ok' => true, 'mensaje' => 'Sesión cerrada.']);
    exit;
}

echo json_encode([
    'ok' => true,
    'logueado' => !empty($_SESSION['usuario_id']) || !empty($_SESSION['admin_id']),
    'es_admin' => !empty($_SESSION['admin_id']),
    'nombre' => $_SESSION['usuario_nombre'] ?? $_SESSION['admin_nombre'] ?? '',
    'usuario' => $_SESSION['usuario_nombre'] ?? '',
]);
?>
