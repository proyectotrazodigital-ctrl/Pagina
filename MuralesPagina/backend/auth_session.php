<?php
session_start();
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

echo json_encode([
    'ok' => true,
    'usuario_logueado' => !empty($_SESSION['usuario_id']),
    'usuario' => $_SESSION['usuario_nombre'] ?? null,
    'usuario_id' => $_SESSION['usuario_id'] ?? null,
    'admin_logueado' => !empty($_SESSION['admin_id']),
    'admin_nombre' => $_SESSION['admin_nombre'] ?? null
]);
