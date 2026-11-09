<?php
require_once "conexion.php";
header("Content-Type: application/json; charset=utf-8");
header("Cache-Control: no-store");

$id_mural = filter_var($_GET["id_mural"] ?? null, FILTER_VALIDATE_INT);
if (!$id_mural) { echo json_encode([]); exit; }
try {
 
    $stmt = $conexion->prepare("SELECT contenido FROM comentario WHERE Id_mural = :id_mural AND publicado = 'publicado' ORDER BY id_comentario DESC");
    $stmt->execute([":id_mural" => $id_mural]);
    echo json_encode($stmt->fetchAll(PDO::FETCH_COLUMN));
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([]);
}
?>
