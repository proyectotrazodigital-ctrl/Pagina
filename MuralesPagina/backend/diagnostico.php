<?php
// Página de diagnóstico TEMPORAL: abrila en el navegador y mirá el resultado.
// Borrala cuando el sitio ya funcione.
session_start();
header('Content-Type: text/plain; charset=utf-8');
header('Cache-Control: no-store');
echo "PHP: " . PHP_VERSION . "\n\n";

echo "== SESION ==\n";
echo "usuario logueado: " . (!empty($_SESSION['usuario_id']) ? 'SI' : 'no') . "\n";
echo "admin logueado:   " . (!empty($_SESSION['admin_id']) ? 'SI' : 'no') . "\n\n";

try {
    require_once 'conexion.php';
    echo "== TABLA comentario (columnas) ==\n";
    foreach ($conexion->query('SHOW COLUMNS FROM comentario') as $c) {
        echo $c['Field'] . " | " . $c['Type'] . " | acepta NULL: " . $c['Null'] . " | default: " . ($c['Default'] ?? 'NULL') . "\n";
    }
    echo "\n== COMENTARIOS GUARDADOS ==\n";
    echo "total: " . (int)$conexion->query('SELECT COUNT(*) FROM comentario')->fetchColumn() . "\n";
    echo "\n== MURALES (id | titulo | tematica | publicacion) ==\n";
    foreach ($conexion->query('SELECT Id_mural, titulo, tematica, estado_publicacion FROM mural ORDER BY Id_mural') as $m) {
        echo $m['Id_mural'] . " | " . $m['titulo'] . " | " . $m['tematica'] . " | " . $m['estado_publicacion'] . "\n";
    }
} catch (Throwable $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
