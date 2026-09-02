<?php
require_once 'api/config.php';
try {
    $pdo->exec("ALTER TABLE users ADD COLUMN notification_settings JSON DEFAULT NULL");
    echo "Successfully added notification_settings column.";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
?>
