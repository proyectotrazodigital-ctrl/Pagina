<?php
session_start();
require_once 'conexion.php';
header('Content-Type: application/json; charset=utf-8');

$CLAVE_ADMIN = 'MURALES-ADMIN-2026';
$MAX_ADMINISTRADORES = 3;

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok'=>false,'mensaje'=>'Método no permitido.']);
    exit;
}

$nombre = trim($_POST['nombre'] ?? '');
$password = $_POST['password'] ?? '';
$clave = $_POST['clave_admin'] ?? '';

if ($nombre === '' || $password === '' || $clave === '') {
    echo json_encode(['ok'=>false,'mensaje'=>'Completá todos los campos.']);
    exit;
}
if (mb_strlen($nombre) > 30) {
    echo json_encode(['ok'=>false,'mensaje'=>'El nombre no puede superar los 30 caracteres.']);
    exit;
}
if (!hash_equals($CLAVE_ADMIN, $clave)) {
    echo json_encode(['ok'=>false,'mensaje'=>'La clave exclusiva de administrador es incorrecta.']);
    exit;
}

try {
    $cantidad = (int)$conexion->query('SELECT COUNT(*) FROM administrador')->fetchColumn();
    if ($cantidad >= $MAX_ADMINISTRADORES) {
        echo json_encode(['ok'=>false,'mensaje'=>'Se alcanzó el límite máximo de administradores.']);
        exit;
    }

    $id = (int)$conexion->query('SELECT COALESCE(MAX(id_admin), 0) + 1 FROM administrador')->fetchColumn();
    $hash = password_hash($password, PASSWORD_DEFAULT);
    $stmt = $conexion->prepare('INSERT INTO administrador (id_admin, contraseña, nombre) VALUES (:id, :password, :nombre)');
    $stmt->execute([':id'=>$id, ':password'=>$hash, ':nombre'=>$nombre]);

    session_regenerate_id(true);
    $_SESSION['admin_id'] = $id;
    $_SESSION['admin_nombre'] = $nombre;
    unset($_SESSION['usuario_id'], $_SESSION['usuario_nombre']);

    echo json_encode(['ok'=>true,'mensaje'=>'Administrador creado correctamente. Tu ID es '.$id.'. Guardalo porque lo necesitás para ingresar.','id_admin'=>$id]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['ok'=>false,'mensaje'=>'No se pudo crear el administrador.']);
}
