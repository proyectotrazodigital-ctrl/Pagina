<?php
session_start();
require_once "conexion.php";
header("Content-Type: application/json; charset=utf-8");

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(["ok" => false, "mensaje" => "Método no permitido."]);
    exit;
}


if (empty($_SESSION['usuario_id'])) {
    http_response_code(401);
    echo json_encode(["ok" => false, "mensaje" => "Tenés que iniciar sesión como usuario para reportar un mural."]);
    exit;
}

$id = (int)($_POST["id_mural"] ?? 0);
$causa = trim($_POST["causa"] ?? "");
$desc = trim($_POST["descripcion"] ?? "");

if (!$id || $causa === "" || $desc === "") {
    echo json_encode(["ok" => false, "mensaje" => "Completá todos los campos del reporte (mural, motivo y descripción)."]);
    exit;
}
if (mb_strlen($causa) > 14) {
    echo json_encode(["ok" => false, "mensaje" => "El motivo del reporte es demasiado largo."]);
    exit;
}
if (mb_strlen($desc) > 150) {
    echo json_encode(["ok" => false, "mensaje" => "La descripción no puede superar los 150 caracteres."]);
    exit;
}

try {
    
    $stmt = $conexion->prepare("SELECT ubicacion FROM mural WHERE Id_mural = :id");
    $stmt->execute([":id" => $id]);
    $ubic = $stmt->fetchColumn();

    if ($ubic === false) {
        echo json_encode(["ok" => false, "mensaje" => "El mural elegido no existe. Elegí uno de la lista."]);
        exit;
    }

    
    $rutaImagen = null;
    if (!empty($_FILES["imagen"]["name"]) && $_FILES["imagen"]["error"] === UPLOAD_ERR_OK) {
        $permitidos = ["image/png" => "png", "image/jpeg" => "jpg"];
        $tipo = mime_content_type($_FILES["imagen"]["tmp_name"]);

        if (!isset($permitidos[$tipo])) {
            echo json_encode(["ok" => false, "mensaje" => "La imagen debe ser JPG o PNG."]);
            exit;
        }
        if ($_FILES["imagen"]["size"] > 5 * 1024 * 1024) {
            echo json_encode(["ok" => false, "mensaje" => "La imagen no puede superar los 5 MB."]);
            exit;
        }

        $carpeta = __DIR__ . "/uploads/reportes/";
        if (!is_dir($carpeta)) {
            mkdir($carpeta, 0775, true);
        }

        $nombreArchivo = uniqid("reporte_", true) . "." . $permitidos[$tipo];
        if (move_uploaded_file($_FILES["imagen"]["tmp_name"], $carpeta . $nombreArchivo)) {
            $rutaImagen = "uploads/reportes/" . $nombreArchivo;
        }
    }

    $stmt = $conexion->prepare("SELECT COALESCE(MAX(Id_reporte),0)+1 FROM reporte");
    $stmt->execute();
    $rid = (int)$stmt->fetchColumn();

    $stmt = $conexion->prepare(
        "INSERT INTO reporte (Id_reporte, Causa, Descripcion, Imagen, fecha, ubicacion, Resuelto, Id_mural)
         VALUES (:r, :c, :d, :img, CURDATE(), :u, 0, :m)"
    );
    $stmt->execute([
        ":r" => $rid,
        ":c" => $causa,
        ":d" => $desc,
        ":img" => $rutaImagen,
        ":u" => $ubic ?: null,
        ":m" => $id,
    ]);

    echo json_encode(["ok" => true, "mensaje" => "¡Gracias! Tu reporte fue enviado correctamente y va a ser revisado por un administrador."]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["ok" => false, "mensaje" => "No se pudo guardar el reporte."]);
}
?>
