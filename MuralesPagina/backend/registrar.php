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
$mail = trim($_POST['mail'] ?? '');
$password = $_POST['password'] ?? '';

if ($usuario === '' || $mail === '' || $password === '') {
    echo json_encode(['ok' => false, 'mensaje' => 'Completá todos los campos.']);
    exit;
}
if (mb_strlen($usuario) > 40) {
    echo json_encode(['ok' => false, 'mensaje' => 'El usuario no puede superar los 40 caracteres.']);
    exit;
}
if (mb_strlen($mail) > 50 || !filter_var($mail, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['ok' => false, 'mensaje' => 'El correo no es válido.']);
    exit;
}
if (mb_strlen($password) < 4) {
    echo json_encode(['ok' => false, 'mensaje' => 'La contraseña debe tener al menos 4 caracteres.']);
    exit;
}

try {
    $check = $conexion->prepare('SELECT Id_usuario, usuario, mail FROM usuario WHERE usuario = :usuario OR mail = :mail LIMIT 1');
    $check->execute([':usuario' => $usuario, ':mail' => $mail]);
    $existente = $check->fetch(PDO::FETCH_ASSOC);

    if ($existente) {
        if (strcasecmp((string)$existente['usuario'], $usuario) === 0) {
            echo json_encode(['ok' => false, 'mensaje' => 'Ese nombre de usuario ya está registrado.']);
        } else {
            echo json_encode(['ok' => false, 'mensaje' => 'Ese correo ya está registrado.']);
        }
        exit;
    }

    $hash = password_hash($password, PASSWORD_DEFAULT);
    $conexion->beginTransaction();


    $columna = $conexion->query("SHOW COLUMNS FROM usuario LIKE 'Id_usuario'")->fetch(PDO::FETCH_ASSOC);
    $autoIncrement = $columna && stripos((string)$columna['Extra'], 'auto_increment') !== false;

    if ($autoIncrement) {
        $stmt = $conexion->prepare('INSERT INTO usuario (usuario, mail, password) VALUES (:usuario, :mail, :password)');
        $stmt->execute([
            ':usuario' => $usuario,
            ':mail' => $mail,
            ':password' => $hash
        ]);
        $idUsuario = (int)$conexion->lastInsertId();
    } else {
        // El SQL original del proyecto no usa AUTO_INCREMENT.
        $idUsuario = (int)$conexion->query('SELECT COALESCE(MAX(Id_usuario), -1) + 1 FROM usuario FOR UPDATE')->fetchColumn();
        $stmt = $conexion->prepare('INSERT INTO usuario (Id_usuario, usuario, mail, password) VALUES (:id, :usuario, :mail, :password)');
        $stmt->execute([
            ':id' => $idUsuario,
            ':usuario' => $usuario,
            ':mail' => $mail,
            ':password' => $hash
        ]);
    }

    $conexion->commit();

    
    session_regenerate_id(true);
    $_SESSION['usuario_id'] = $idUsuario;
    $_SESSION['usuario_nombre'] = $usuario;
    unset($_SESSION['admin_id'], $_SESSION['admin_nombre']);

    echo json_encode([
        'ok' => true,
        'mensaje' => '¡Cuenta creada correctamente! Ya iniciaste sesión.',
        'usuario_logueado' => true,
        'usuario_id' => $idUsuario,
        'usuario' => $usuario
    ]);
} catch (PDOException $e) {
    if ($conexion->inTransaction()) $conexion->rollBack();
    error_log('Error al registrar usuario: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['ok' => false, 'mensaje' => 'No se pudo registrar el usuario.']);
}
?>
