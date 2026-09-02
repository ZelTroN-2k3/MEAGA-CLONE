<?php
require_once 'config.php';

try {
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $queries = [
        "ALTER TABLE users ADD COLUMN birth_date DATE NULL",
        "ALTER TABLE users ADD COLUMN country VARCHAR(100) NULL"
    ];

    foreach ($queries as $query) {
        try {
            $pdo->exec($query);
            echo "SUCCESS: " . $query . "\n";
        } catch (PDOException $e) {
            echo "NOTICE: " . $e->getMessage() . "\n";
        }
    }

    echo "Update complete.";
} catch (Exception $e) {
    echo "Fatal error: " . $e->getMessage();
}
?>
