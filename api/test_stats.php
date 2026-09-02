<?php
require_once 'config.php';
session_start();
// mock user id
$_SESSION['user_id'] = 1;
$user_id = 1;

try {
    $stmt = $pdo->prepare("SELECT used_storage, total_storage FROM users WHERE id = ?");
    $stmt->execute([$user_id]);
    $stats = $stmt->fetch();
    echo "Stats: " . json_encode($stats) . "\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
