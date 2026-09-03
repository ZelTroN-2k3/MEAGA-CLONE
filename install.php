<?php
// install.php
session_start();

$env_file = __DIR__ . '/.env';
$step = 1;
$message = '';
$error = false;

if (file_exists($env_file)) {
    die("L'application est déjà installée. Si vous souhaitez réinstaller, supprimez le fichier .env.");
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $db_host = $_POST['db_host'] ?? '';
    $db_name = $_POST['db_name'] ?? '';
    $db_user = $_POST['db_user'] ?? '';
    $db_pass = $_POST['db_pass'] ?? '';
    
    $admin_user = $_POST['admin_user'] ?? '';
    $admin_email = $_POST['admin_email'] ?? '';
    $admin_pass = $_POST['admin_pass'] ?? '';
    
    try {
        // Connect without dbname first to create it
        $pdo_test = new PDO("mysql:host=$db_host;charset=utf8mb4", $db_user, $db_pass);
        $pdo_test->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        
        $pdo_test->exec("CREATE DATABASE IF NOT EXISTS `$db_name` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
        
        // Connect to the actual db
        $pdo = new PDO("mysql:host=$db_host;dbname=$db_name;charset=utf8mb4", $db_user, $db_pass);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        
        // Create Schema
        $schema = "
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(50) NOT NULL UNIQUE,
            email VARCHAR(100) NOT NULL UNIQUE,
            password_hash VARCHAR(255) NOT NULL,
            storage_quota BIGINT DEFAULT 53687091200,
            used_storage BIGINT DEFAULT 0,
            total_storage BIGINT DEFAULT 53687091200,
            first_name VARCHAR(100) NULL,
            last_name VARCHAR(100) NULL,
            billing_info VARCHAR(255) NULL,
            subscription_date TIMESTAMP NULL,
            birth_date DATE NULL,
            country VARCHAR(100) NULL,
            status VARCHAR(20) DEFAULT 'active',
            is_admin TINYINT(1) DEFAULT 0,
            plan_type VARCHAR(50) DEFAULT 'free',
            avatar VARCHAR(255) DEFAULT NULL,
            notification_settings JSON DEFAULT NULL,
            reset_token VARCHAR(255) NULL DEFAULT NULL,
            reset_expires DATETIME NULL DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

        CREATE TABLE IF NOT EXISTS folders (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            parent_id INT DEFAULT NULL,
            name VARCHAR(255) NOT NULL,
            shared_link_token VARCHAR(255) UNIQUE DEFAULT NULL,
            share_password VARCHAR(255) DEFAULT NULL,
            share_expires_at DATETIME DEFAULT NULL,
            is_favorite TINYINT(1) DEFAULT 0,
            is_hidden TINYINT(1) DEFAULT 0,
            deleted_at TIMESTAMP NULL DEFAULT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            color_tag VARCHAR(50) DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (parent_id) REFERENCES folders(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

        CREATE TABLE IF NOT EXISTS files (
            id INT AUTO_INCREMENT PRIMARY KEY,
            folder_id INT DEFAULT NULL,
            user_id INT NOT NULL,
            original_name VARCHAR(255) NOT NULL,
            stored_name VARCHAR(255) NOT NULL,
            size BIGINT NOT NULL,
            mime_type VARCHAR(100),
            shared_link_token VARCHAR(64) DEFAULT NULL UNIQUE,
            share_password VARCHAR(255) DEFAULT NULL,
            share_expires_at DATETIME DEFAULT NULL,
            is_favorite TINYINT(1) DEFAULT 0,
            is_hidden TINYINT(1) DEFAULT 0,
            has_thumbnail TINYINT(1) DEFAULT 0,
            deleted_at TIMESTAMP NULL DEFAULT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            color_tag VARCHAR(50) DEFAULT NULL,
            encrypted_key TEXT DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

        CREATE TABLE IF NOT EXISTS settings (
            id INT AUTO_INCREMENT PRIMARY KEY,
            setting_key VARCHAR(100) UNIQUE NOT NULL,
            setting_value TEXT
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

        INSERT IGNORE INTO settings (setting_key, setting_value) VALUES 
        ('allow_registration', '1'),
        ('default_quota', '53687091200'),
        ('footer_desc', 'La plateforme de stockage en ligne la plus sécurisée. Vos données sont chiffrées de bout en bout et vous seul y avez accès.'),
        ('footer_copyright', '&copy; 2026 Mega Clone. Tous droits réservés.'),
        ('footer_twitter', '#'),
        ('footer_facebook', '#'),
        ('footer_github', '#'),
        ('footer_instagram', '#'),
        ('footer_col_legal', '[{\"text\":\"Conditions générales\",\"url\":\"terms.html\"},{\"text\":\"Politique de confidentialité\",\"url\":\"privacy.html\"},{\"text\":\"Politique de retrait (Takedown)\",\"url\":\"takedown.html\"},{\"text\":\"Mentions légales\",\"url\":\"legal.html\"}]'),
        ('footer_col_support', '[{\"text\":\"Centre d\'aide\",\"url\":\"help.html\"},{\"text\":\"Nous contacter\",\"url\":\"contact.html\"},{\"text\":\"Signaler un bug\",\"url\":\"bug.html\"},{\"text\":\"Administration\",\"url\":\"admin.html\"}]');

        CREATE TABLE IF NOT EXISTS activity_logs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NULL,
            action VARCHAR(100) NOT NULL,
            details TEXT,
            ip_address VARCHAR(50),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

        CREATE TABLE IF NOT EXISTS notifications (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            title VARCHAR(255) NOT NULL,
            message TEXT NOT NULL,
            is_read TINYINT(1) DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

        CREATE TABLE IF NOT EXISTS shared_folder_keys (
            id INT AUTO_INCREMENT PRIMARY KEY,
            folder_id INT NOT NULL,
            file_id INT NOT NULL,
            shared_encrypted_key TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE CASCADE,
            FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE,
            UNIQUE KEY unique_folder_file (folder_id, file_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        ";
        
        $pdo->exec($schema);
        
        // Create Admin
        $hash = password_hash($admin_pass, PASSWORD_DEFAULT);
        $stmt = $pdo->prepare("INSERT INTO users (username, email, password_hash, is_admin, avatar) VALUES (?, ?, ?, 1, 'uploads/avatars/zeltron2k3_btc.png')");
        $stmt->execute([$admin_user, $admin_email, $hash]);
        $admin_id = $pdo->lastInsertId();
        
        // Create default folders
        $stmt = $pdo->prepare("INSERT INTO folders (user_id, name) VALUES (?, ?)");
        $stmt->execute([$admin_id, 'Documents']);
        $stmt->execute([$admin_id, 'Images']);
        
        // Write .env
        // Quotation marks are necessary for parse_ini_file() to correctly handle
        // passwords containing special characters (#, $, !, @, etc.)
        $env_content = "DB_HOST=\"" . $db_host . "\"\n" .
                       "DB_NAME=\"" . $db_name . "\"\n" .
                       "DB_USER=\"" . $db_user . "\"\n" .
                       "DB_PASS=\"" . addslashes($db_pass) . "\"\n";
        file_put_contents($env_file, $env_content);
        
        // Disconnect any active sessions (leftovers from previous tests)
        session_unset();
        session_destroy();
        setcookie(session_name(), '', time() - 3600, '/');
        
        $step = 2; // Success
    } catch (PDOException $e) {
        $error = true;
        $message = "Database error: " . $e->getMessage();
    }
}
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Installation - Mega Clone</title>
    <link rel="stylesheet" href="assets/css/style.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        .install-container {
            max-width: 600px;
            margin: 40px auto;
            padding: 30px;
        }
        .install-section {
            margin-bottom: 25px;
            padding-bottom: 20px;
            border-bottom: 1px solid var(--border);
        }
        .install-section h3 {
            margin-bottom: 15px;
            color: var(--accent);
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .alert-error {
            background: rgba(255, 0, 0, 0.1);
            border: 1px solid #ff4d4d;
            color: #ff4d4d;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        .alert-success {
            background: rgba(0, 255, 0, 0.1);
            border: 1px solid #00ff00;
            color: #00ff00;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
        }
    </style>
</head>
<body class="landing-page">
    <div class="install-container glass-panel">
        
        <div style="text-align: center; margin-bottom: 30px;">
            <div class="navbar-brand" style="justify-content: center;">
                <i class="fa-solid fa-cloud"></i> Mega Clone Setup
            </div>
            <p style="color: var(--text-secondary); margin-top: 10px;">Installation et configuration initiale</p>
        </div>

        <?php if ($error): ?>
            <div class="alert-error">
                <i class="fa-solid fa-triangle-exclamation"></i> <?php echo htmlspecialchars($message); ?>
            </div>
        <?php endif; ?>

        <?php if ($step === 1): ?>
        <form method="POST" action="install.php">
            <div class="install-section">
                <h3><i class="fa-solid fa-database"></i> Base de données MySQL</h3>
                
                <div class="input-group">
                    <label for="db_host">Hôte (Host)</label>
                    <input type="text" id="db_host" name="db_host" class="input-control" value="localhost" required>
                </div>
                
                <div class="input-group">
                    <label for="db_name">Nom de la base de données</label>
                    <input type="text" id="db_name" name="db_name" class="input-control" value="mega_clone_db" required>
                </div>
                
                <div class="input-group">
                    <label for="db_user">Utilisateur (User)</label>
                    <input type="text" id="db_user" name="db_user" class="input-control" value="root" required>
                </div>
                
                <div class="input-group">
                    <label for="db_pass">Mot de passe (Password)</label>
                    <input type="password" id="db_pass" name="db_pass" class="input-control">
                </div>
            </div>

            <div class="install-section" style="border-bottom: none;">
                <h3><i class="fa-solid fa-user-shield"></i> Compte Administrateur</h3>
                <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 15px;">
                    Ce compte aura accès à tous les droits et les dossiers "Documents" et "Images" seront créés pour lui.
                </p>
                
                <div class="input-group">
                    <label for="admin_user">Pseudo</label>
                    <input type="text" id="admin_user" name="admin_user" class="input-control" required>
                </div>
                
                <div class="input-group">
                    <label for="admin_email">Adresse Email</label>
                    <input type="email" id="admin_email" name="admin_email" class="input-control" required>
                </div>
                
                <div class="input-group">
                    <label for="admin_pass">Mot de passe</label>
                    <input type="password" id="admin_pass" name="admin_pass" class="input-control" required>
                </div>
            </div>

            <button type="submit" class="btn btn-primary" style="width: 100%; padding: 12px; font-size: 1.1rem;">
                <i class="fa-solid fa-rocket"></i> Lancer l'installation
            </button>
        </form>
        <?php else: ?>
            <script>
                sessionStorage.clear();
                // Optionally clear localStorage if we store anything persistent that should be wiped on install
                // localStorage.clear();
            </script>
            <div class="alert-success" style="text-align: center;">
                <i class="fa-solid fa-circle-check" style="font-size: 3rem; margin-bottom: 15px;"></i>
                <h2>Installation réussie !</h2>
                <p style="margin-top: 10px;">Votre base de données a été créée, les tables ont été importées et le compte administrateur est prêt.</p>
                <p style="margin-top: 10px;">Les dossiers "Documents" et "Images" ont été ajoutés.</p>
            </div>
            
            <div style="background: rgba(255,165,0,0.1); border: 1px solid orange; padding: 15px; border-radius: 8px; color: orange; margin-bottom: 25px; text-align: center;">
                <i class="fa-solid fa-triangle-exclamation"></i> <strong>IMPORTANT :</strong> Pour des raisons de sécurité, veuillez <u>supprimer</u> ce fichier <code>install.php</code> de votre serveur.
            </div>

            <a href="index.html" class="btn btn-primary" style="width: 100%; text-decoration: none; text-align: center;">
                Accéder à l'application
            </a>
        <?php endif; ?>
    </div>
</body>
</html>