<?php
session_start();
require_once 'conexion.php';
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok'=>false,'mensaje'=>'Método no permitido.']);
    exit;
}

$id = filter_var($_POST['id_admin'] ?? null, FILTER_VALIDATE_INT);
$password = $_POST['password'] ?? '';

if (!$id || $password === '') {
    echo json_encode(['ok'=>false,'mensaje'=>'Ingresá el ID y la contraseña.']);
    exit;
}

try {
    $stmt = $conexion->prepare('SELECT id_admin, nombre, contraseña FROM administrador WHERE id_admin = :id');
    $stmt->execute([':id'=>$id]);
    $admin = $stmt->fetch();

    if (!$admin || !password_verify($password, $admin['contraseña'])) {
        echo json_encode(['ok'=>false,'mensaje'=>'ID o contraseña incorrectos.']);
        exit;
    }

    session_regenerate_id(true);
    $_SESSION['admin_id'] = (int)$admin['id_admin'];
    $_SESSION['admin_nombre'] = $admin['nombre'];
    unset($_SESSION['usuario_id'], $_SESSION['usuario_nombre']);

    echo json_encode(['ok'=>true,'mensaje'=>'Sesión de administrador iniciada.']);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['ok'=>false,'mensaje'=>'No se pudo iniciar sesión.']);
}
