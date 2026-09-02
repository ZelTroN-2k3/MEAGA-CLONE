<?php
require_once 'config.php';

try {
    $pdo->exec("ALTER TABLE users ADD COLUMN used_storage BIGINT DEFAULT 0");
    echo "Added used_storage\n";
} catch (Exception $e) {
    echo "used_storage error: " . $e->getMessage() . "\n";
}

try {
    $pdo->exec("ALTER TABLE users ADD COLUMN total_storage BIGINT DEFAULT 53687091200");
    echo "Added total_storage\n";
} catch (Exception $e) {
    echo "total_storage error: " . $e->getMessage() . "\n";
}

echo "Done.";
?>
