<?php
require_once 'config.php';

try {
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $queries = [
        // 1. Add status to users
        "ALTER TABLE users ADD COLUMN status VARCHAR(20) DEFAULT 'active'",
        
        // 2. Settings table
        "CREATE TABLE IF NOT EXISTS settings (
            id INT AUTO_INCREMENT PRIMARY KEY,
            setting_key VARCHAR(100) UNIQUE NOT NULL,
            setting_value VARCHAR(255)
        )",
        
        // 3. Insert defaults for settings
        "INSERT IGNORE INTO settings (setting_key, setting_value) VALUES ('allow_registration', '1')",
        "INSERT IGNORE INTO settings (setting_key, setting_value) VALUES ('default_quota', '53687091200')",
        
        // 4. Activity Logs table
        "CREATE TABLE IF NOT EXISTS activity_logs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NULL,
            action VARCHAR(100) NOT NULL,
            details TEXT,
            ip_address VARCHAR(50),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )"
    ];

    foreach ($queries as $query) {
        try {
            $pdo->exec($query);
            echo "SUCCESS: " . substr($query, 0, 50) . "...\n";
        } catch (PDOException $e) {
            // Ignore errors for existing columns
            echo "NOTICE: " . $e->getMessage() . "\n";
        }
    }

    echo "Base de donnees mise a jour avec succes.";
} catch (Exception $e) {
    echo "Erreur fatale: " . $e->getMessage();
}
?>
