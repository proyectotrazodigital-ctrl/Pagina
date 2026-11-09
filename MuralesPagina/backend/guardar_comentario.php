<?php
session_start();
require_once 'conexion.php';
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); echo json_encode(['ok'=>false,'mensaje'=>'Método no permitido.']); exit; }
$esAdmin   = !empty($_SESSION['admin_id']);
$esUsuario = !empty($_SESSION['usuario_id']);
if (!$esAdmin && !$esUsuario) { http_response_code(401); echo json_encode(['ok'=>false,'mensaje'=>'Tenés que iniciar sesión antes de comentar.']); exit; }

$id_mural = filter_var($_POST['id_mural'] ?? null, FILTER_VALIDATE_INT);
$comentario = trim($_POST['comentario'] ?? '');
if (!$id_mural || $comentario === '') { echo json_encode(['ok'=>false,'mensaje'=>'Escribí un comentario válido.']); exit; }
if (mb_strlen($comentario) > 300) { echo json_encode(['ok'=>false,'mensaje'=>'El comentario no puede superar los 300 caracteres.']); exit; }

try {
    $conexion->beginTransaction();

    
    $stmtMural = $conexion->prepare('SELECT Id_mural FROM mural WHERE Id_mural = :m FOR UPDATE');
    $stmtMural->execute([':m' => $id_mural]);
    if (!$stmtMural->fetch()) {
        
        $conexion->rollBack();
        echo json_encode(['ok' => false, 'mensaje' => 'El mural especificado no existe.']);
        exit;
    }

    
    $stmt = $conexion->prepare('SELECT COALESCE(MAX(id_comentario), 0) + 1 FROM comentario WHERE Id_mural = :m');
    $stmt->execute([':m' => $id_mural]);
    $id_comentario = (int)$stmt->fetchColumn();

   
    $estado    = $esAdmin ? 'publicado' : 'para revisar';
    $idUsuario = $esAdmin ? null : (int)$_SESSION['usuario_id'];
    $stmt = $conexion->prepare('INSERT INTO comentario (Id_mural, id_comentario, contenido, publicado, id_usuario) VALUES (:m, :c, :contenido, :estado, :u)');
    $stmt->execute([
        ':m' => $id_mural,
        ':c' => $id_comentario,
        ':contenido' => $comentario,
        ':estado' => $estado,
        ':u' => $idUsuario
    ]);

    $conexion->commit();
    echo json_encode([
        'ok' => true,
        'estado' => $estado,
        'mensaje' => $esAdmin
            ? 'Comentario publicado correctamente.'
            : 'Tu comentario fue enviado y quedó para revisar. Se publicará cuando un administrador lo apruebe.'
    ]);

} catch (PDOException $e) {
    if ($conexion->inTransaction()) {
        $conexion->rollBack();
    }

    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'mensaje' => 'Error de MySQL: ' . $e->getMessage()
    ]);
}

