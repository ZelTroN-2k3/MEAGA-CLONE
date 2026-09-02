<?php
require_once 'config.php';
$stmt = $pdo->query("DESCRIBE users");
$columns = $stmt->fetchAll();
echo json_encode($columns);
?>
