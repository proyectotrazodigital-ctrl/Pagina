<?php
require_once "conexion.php";
$mensaje = "";
if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $id_mural = filter_var($_POST["id_mural"] ?? null, FILTER_VALIDATE_INT);
    $id_usuario = filter_var($_POST["id_usuario"] ?? null, FILTER_VALIDATE_INT) ?: null;
    $id_admin = filter_var($_POST["id_admin"] ?? null, FILTER_VALIDATE_INT) ?: null;
    $texto = trim($_POST["comentario"] ?? "");
    if (!$id_mural || $texto === "") {
        $mensaje = "<p style='color:red'>Por favor, escribe un comentario válido.</p>";
    } elseif (mb_strlen($texto) > 300) {
        $mensaje = "<p style='color:red'>El comentario no puede superar los 300 caracteres.</p>";
    } else {
        try {
            $conexion->beginTransaction();
            $stmt=$conexion->prepare("SELECT COALESCE(MAX(id_comentario),0)+1 FROM comentario WHERE Id_mural=:m FOR UPDATE");
            $stmt->execute([":m"=>$id_mural]);
            $id=(int)$stmt->fetchColumn();
            $stmt=$conexion->prepare("INSERT INTO comentario (Id_mural,id_comentario,contenido,publicado,id_usuario) VALUES (:m,:i,:c,'para revisar',:u)");
            $stmt->execute([":m"=>$id_mural,":i"=>$id,":c"=>$texto,":u"=>$id_usuario]);
            $conexion->commit();
            $mensaje="<p style='color:green'>Comentario enviado. Quedó para revisar hasta que un administrador lo apruebe.</p>";
        } catch(PDOException $e) { if($conexion->inTransaction())$conexion->rollBack(); $mensaje="<p style='color:red'>No se pudo guardar el comentario.</p>"; }
    }
}
?>
<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Estado del Comentario</title><style>body{font-family:Arial;background:#f4f4f9;display:flex;justify-content:center;align-items:center;height:100vh;margin:0}.card{background:#fff;padding:25px;border-radius:8px;box-shadow:0 0 10px #0002;text-align:center;max-width:400px}a{color:#007bff;text-decoration:none;font-weight:bold}</style></head><body><div class="card"><h2>Publicación de Comentario</h2><?php echo $mensaje; ?><br><a href="../frontend/index (1).html">Volver al Inicio</a></div></body></html>
