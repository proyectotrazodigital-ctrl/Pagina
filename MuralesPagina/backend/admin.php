<?php
session_start();
require_once "conexion.php";

if (isset($_GET["salir"])) { session_destroy(); header("Location: admin.php"); exit; }
$mensaje="";
if (isset($_POST["login"])) {
    $id=(int)($_POST["id_admin"]??0); $pass=$_POST["password"]??"";
    $stmt=$conexion->prepare("SELECT id_admin,nombre,contraseña FROM administrador WHERE id_admin=:id");
    $stmt->execute([":id"=>$id]); $admin=$stmt->fetch();
    if($admin && password_verify($pass,$admin["contraseña"])) { $_SESSION["admin_id"]=$admin["id_admin"]; $_SESSION["admin_nombre"]=$admin["nombre"]; header("Location: admin.php"); exit; }
    $mensaje="ID o contraseña incorrectos.";
}
if (!empty($_SESSION["admin_id"]) && isset($_POST["accion"])) {
    $accion=$_POST["accion"];
    if($accion==="comentario") {
        $id_mural=(int)$_POST["id_mural"]; $id_com=(int)$_POST["id_comentario"];
        // El estado se guarda en la columna `publicado`.
        $estados=["aprobar"=>"publicado","rechazar"=>"rechazado","revisar"=>"para revisar"];
        $nuevo=$estados[$_POST["decision"] ?? ""] ?? null;
        if($nuevo!==null){
            $stmt=$conexion->prepare("UPDATE comentario SET publicado=:e WHERE Id_mural=:m AND id_comentario=:c"); $stmt->execute([":e"=>$nuevo,":m"=>$id_mural,":c"=>$id_com]);
        }
    } elseif($accion==="reporte") {
        $id=(int)$_POST["id_reporte"]; $stmt=$conexion->prepare("UPDATE reporte SET Resuelto=1 WHERE Id_reporte=:id"); $stmt->execute([":id"=>$id]);
    }
}
$comentarios=[];$reportes=[];$conteo=[];
$validos=["para revisar","publicado","rechazado"];
$filtro=in_array($_GET["estado"] ?? "", $validos, true) ? $_GET["estado"] : "para revisar";
if(!empty($_SESSION["admin_id"])) {
    $comentarios=[]; $conteo=["para revisar"=>0,"publicado"=>0,"rechazado"=>0];
    foreach($conexion->query("SELECT publicado, COUNT(*) AS n FROM comentario GROUP BY publicado") as $f){ $conteo[$f["publicado"]]=(int)$f["n"]; }
    $stmt=$conexion->prepare("SELECT c.Id_mural,c.id_comentario,c.contenido,c.publicado,c.fecha,c.id_usuario,COALESCE(u.usuario,'Administrador/Visitante') AS usuario FROM comentario c LEFT JOIN usuario u ON u.Id_usuario=c.id_usuario WHERE c.publicado=:e ORDER BY c.Id_mural,c.id_comentario DESC");
    $stmt->execute([":e"=>$filtro]); $comentarios=$stmt->fetchAll();
    $reportes=$conexion->query("SELECT * FROM reporte WHERE COALESCE(Resuelto,0)=0 ORDER BY Id_reporte DESC")->fetchAll();
}
?><!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Panel de administración</title><style>body{font-family:Arial;margin:0;background:#f4f6f8;color:#222}.wrap{max-width:1000px;margin:40px auto;padding:20px}.box{background:#fff;padding:24px;border-radius:12px;box-shadow:0 2px 12px #0001;margin-bottom:20px}.login{max-width:400px;margin:80px auto}.field{display:flex;flex-direction:column;gap:6px;margin:12px 0}input,textarea,button{padding:10px;border-radius:6px;border:1px solid #ccc}button{cursor:pointer;background:#003b78;color:#fff;border:0}.danger{background:#8b1e1e}.ok{background:#1b6e35}.item{border:1px solid #ddd;border-radius:8px;padding:15px;margin:10px 0}.actions{display:flex;gap:8px;margin-top:10px}a{color:#003b78}.tabs{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px}.tab{padding:8px 14px;border-radius:20px;border:1px solid #ccc;text-decoration:none;color:#222}.tab.activa{background:#003b78;color:#fff;border-color:#003b78}.estado{font-size:.8rem;padding:2px 8px;border-radius:10px;background:#eee}.e-publicado{background:#d6f0dd}.e-rechazado{background:#f6d6d6}.e-para-revisar{background:#fdf0c8}</style></head><body><div class="wrap"><?php if(empty($_SESSION["admin_id"])): ?><div class="box login"><h1>Acceso administrador</h1><?php if($mensaje): ?><p style="color:#b00"><?php echo htmlspecialchars($mensaje); ?></p><?php endif; ?><form method="post"><div class="field"><label>ID administrador</label><input type="number" name="id_admin" required></div><div class="field"><label>Contraseña</label><input type="password" name="password" required></div><button name="login" value="1">Ingresar</button></form></div><?php else: ?><div class="box"><h1>Panel de administración</h1><p>Administrador: <strong><?php echo htmlspecialchars($_SESSION["admin_nombre"]); ?></strong></p><a href="admin.php?salir=1">Cerrar sesión</a></div><div class="box"><h2>Comentarios</h2><div class="tabs"><?php foreach(["para revisar"=>"Para revisar","publicado"=>"Publicados","rechazado"=>"Rechazados"] as $k=>$t): ?><a class="tab<?php echo $filtro===$k?' activa':''; ?>" href="admin.php?estado=<?php echo urlencode($k); ?>"><?php echo $t; ?> (<?php echo (int)$conteo[$k]; ?>)</a><?php endforeach; ?></div><?php if(!$comentarios): ?><p>No hay comentarios con estado "<?php echo htmlspecialchars($filtro); ?>".</p><?php endif; ?><?php foreach($comentarios as $c): ?><div class="item"><strong>Mural <?php echo (int)$c["Id_mural"]; ?></strong> <span class="estado e-<?php echo str_replace(' ','-',$c["publicado"]); ?>"><?php echo htmlspecialchars($c["publicado"]); ?></span><br>Usuario: <?php echo htmlspecialchars($c["usuario"]); ?><p><?php echo htmlspecialchars($c["contenido"]); ?></p><small><?php echo htmlspecialchars($c["fecha"]); ?></small><div class="actions"><?php foreach(["aprobar"=>["publicado","Publicar","ok"],"rechazar"=>["rechazado","Rechazar","danger"],"revisar"=>["para revisar","Pasar a revisar",""]] as $dec=>$cfg): if($c["publicado"]===$cfg[0]) continue; ?><form method="post" action="admin.php?estado=<?php echo urlencode($filtro); ?>"><input type="hidden" name="accion" value="comentario"><input type="hidden" name="decision" value="<?php echo $dec; ?>"><input type="hidden" name="id_mural" value="<?php echo (int)$c["Id_mural"]; ?>"><input type="hidden" name="id_comentario" value="<?php echo (int)$c["id_comentario"]; ?>"><button class="<?php echo $cfg[2]; ?>"><?php echo $cfg[1]; ?></button></form><?php endforeach; ?></div></div><?php endforeach; ?></div><div class="box"><h2>Reportes pendientes</h2><?php if(!$reportes): ?><p>No hay reportes pendientes.</p><?php endif; ?><?php foreach($reportes as $r): ?><div class="item"><strong>Reporte #<?php echo (int)$r["Id_reporte"]; ?> — Mural <?php echo (int)$r["Id_mural"]; ?></strong><p><b>Causa:</b> <?php echo htmlspecialchars($r["Causa"]??""); ?></p><p><?php echo htmlspecialchars($r["Descripcion"]??""); ?></p><?php if(!empty($r["Imagen"])): ?><img src="<?php echo htmlspecialchars($r["Imagen"]); ?>" alt="Imagen del reporte" style="max-width:220px;border-radius:6px;margin-top:8px;display:block"><?php endif; ?><small>Fecha: <?php echo htmlspecialchars($r["fecha"]??""); ?> | Ubicación: <?php echo htmlspecialchars($r["ubicacion"]??""); ?></small><form method="post" class="actions"><input type="hidden" name="accion" value="reporte"><input type="hidden" name="id_reporte" value="<?php echo (int)$r["Id_reporte"]; ?>"><button class="ok">Marcar como resuelto</button></form></div><?php endforeach; ?></div><?php endif; ?></div></body></html>
