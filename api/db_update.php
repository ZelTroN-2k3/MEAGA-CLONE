<?php
require_once 'config.php';

$queries = [
    "ALTER TABLE files ADD COLUMN is_favorite TINYINT(1) DEFAULT 0",
    "ALTER TABLE folders ADD COLUMN is_favorite TINYINT(1) DEFAULT 0",
    "ALTER TABLE files ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL",
    "ALTER TABLE folders ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL"
];

foreach ($queries as $q) {
    try {
        $pdo->exec($q);
        echo "Success: $q<br>";
    } catch (PDOException $e) {
        echo "Skipped: $q (" . $e->getMessage() . ")<br>";
    }
}
?>
