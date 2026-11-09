<?php
session_start();
require_once 'conexion.php';
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'mensaje' => 'Método no permitido.']);
    exit;
}

$usuario = trim($_POST['usuario'] ?? '');
$password = $_POST['password'] ?? '';

if ($usuario === '' || $password === '') {
    echo json_encode(['ok' => false, 'mensaje' => 'Ingresá usuario y contraseña.']);
    exit;
}

try {
    $stmt = $conexion->prepare(
        'SELECT Id_usuario, usuario, password
         FROM usuario
         WHERE usuario = :usuario
         LIMIT 1'
    );
    $stmt->execute([':usuario' => $usuario]);
    $fila = $stmt->fetch();

    if (!$fila || empty($fila['password']) || !password_verify($password, $fila['password'])) {
        echo json_encode(['ok' => false, 'mensaje' => 'Usuario o contraseña incorrectos.']);
        exit;
    }

    session_regenerate_id(true);
    $_SESSION['usuario_id'] = (int)$fila['Id_usuario'];
    $_SESSION['usuario_nombre'] = $fila['usuario'];
    unset($_SESSION['admin_id'], $_SESSION['admin_nombre']);

    echo json_encode(['ok' => true, 'mensaje' => 'Sesión iniciada correctamente.']);
} catch (PDOException $e) {
    error_log('Error al iniciar sesión de usuario: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['ok' => false, 'mensaje' => 'No se pudo iniciar sesión.']);
}
?>
