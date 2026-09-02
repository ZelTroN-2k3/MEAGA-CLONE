<?php
require 'api/config.php';
try {
    $pdo->exec("ALTER TABLE users ADD COLUMN avatar VARCHAR(255) DEFAULT NULL");
    echo "DB Updated successfully!";
} catch (Exception $e) {
    echo $e->getMessage();
}
?>
