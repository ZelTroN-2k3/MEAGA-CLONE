<?php
require_once 'config.php';
$stmt = $pdo->query("DESCRIBE files");
$files = $stmt->fetchAll();
$stmt = $pdo->query("DESCRIBE folders");
$folders = $stmt->fetchAll();
echo json_encode(['files' => $files, 'folders' => $folders]);
?>
