<?php
require_once 'api/config.php';

try {
    $pdo->exec("ALTER TABLE files ADD COLUMN encrypted_key TEXT DEFAULT NULL AFTER mime_type");
    echo "Column encrypted_key added successfully.\n";
} catch (PDOException $e) {
    if (strpos($e->getMessage(), 'Duplicate column name') !== false) {
        echo "Column already exists.\n";
    } else {
        echo "Error: " . $e->getMessage() . "\n";
    }
}
?>
