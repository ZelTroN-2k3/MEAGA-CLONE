<?php
// api/auth.php
require_once 'config.php';
require_once 'Router.php';

$router = new Router();

$router->post('register', function($data) use ($pdo) {
    $username = trim($data['username'] ?? '');
    $email = trim($data['email'] ?? '');
    $password = $data['password'] ?? '';

    if (empty($username) || empty($email) || empty($password)) {
        respondJson(['status' => 'error', 'message' => 'All fields are required.'], 400);
    }

    // Check if user exists
    $stmt = $pdo->prepare("SELECT id FROM users WHERE username = ? OR email = ?");
    $stmt->execute([$username, $email]);
    if ($stmt->fetch()) {
        respondJson(['status' => 'error', 'message' => 'Username or Email already exists.'], 400);
    }

    // Check if registration is allowed
    $stmt = $pdo->query("SELECT setting_value FROM settings WHERE setting_key = 'allow_registration'");
    $allow_reg = $stmt->fetchColumn();
    if ($allow_reg !== false && $allow_reg == '0') {
        respondJson(['status' => 'error', 'message' => 'Les inscriptions sont fermées.'], 403);
    }

    // Get default quota
    $stmt = $pdo->query("SELECT setting_value FROM settings WHERE setting_key = 'default_quota'");
    $quota = $stmt->fetchColumn() ?: 53687091200;

    $password_hash = password_hash($password, PASSWORD_DEFAULT);
    
    $stmt = $pdo->prepare("INSERT INTO users (username, email, password_hash, total_storage, avatar) VALUES (?, ?, ?, ?, ?)");
    if ($stmt->execute([$username, $email, $password_hash, $quota, 'uploads/avatars/avatar-1.png'])) {
        $user_id = $pdo->lastInsertId();
        
        $pdo->prepare("INSERT INTO activity_logs (user_id, action, ip_address) VALUES (?, ?, ?)")->execute([$user_id, 'register', $_SERVER['REMOTE_ADDR'] ?? '']);
        $_SESSION['user_id'] = $user_id;
        $_SESSION['username'] = $username;
        
        // Welcome notification (in-app)
        $stmt = $pdo->prepare("INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)");
        $stmt->execute([
            $user_id, 
            "Bienvenue sur Mega Clone", 
            "Nous sommes ravis de vous compter parmi nous. N'oubliez pas de sauvegarder votre Clé de récupération située dans la page de votre compte."
        ]);

        // --- DÉBUT : ENVOI EMAIL DE BIENVENUE ---
        $to = $email;
        $subject = "Bienvenue sur MEGA Clone !";
        
        // Template HTML de l'email avec avertissement Zéro Connaissance
        $htmlContent = "
        <html>
        <head><title>Bienvenue sur MEGA Clone</title></head>
        <body style='font-family: Arial, sans-serif; background-color: #f4f4f9; padding: 20px;'>
            <div style='max-width: 600px; margin: 0 auto; background: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); text-align: center;'>
                <div style='display: inline-block; width: 60px; height: 60px; background: #d92b2f; color: white; border-radius: 50%; font-size: 30px; line-height: 60px; font-weight: bold; margin-bottom: 20px;'>M</div>
                <h2 style='color: #333333;'>Bienvenue, " . htmlspecialchars($username) . " !</h2>
                <p style='color: #555555; line-height: 1.5;'>Nous sommes ravis de vous compter parmi nous. Votre compte est activé et vous bénéficiez dès maintenant de <strong>50 Go de stockage sécurisé</strong>.</p>
                
                <div style='background: #fff8eb; border-left: 4px solid #f59e0b; padding: 15px; margin: 25px 0; text-align: left;'>
                    <h3 style='color: #b45309; margin-top: 0; font-size: 16px;'><span style='font-size: 18px;'>⚠️</span> Action requise : Votre Clé de Secours</h3>
                    <p style='color: #78350f; font-size: 14px; line-height: 1.5; margin-bottom: 0;'>
                        Mega Clone utilise un chiffrement <em>Zéro Connaissance</em>. Nous n'avons <strong>aucun accès</strong> à votre mot de passe ni à vos fichiers.<br><br>
                        Si vous perdez votre mot de passe, le <strong>seul moyen</strong> de récupérer votre compte sera votre Clé de récupération (Master Key). Connectez-vous et téléchargez-la immédiatement depuis les paramètres de votre compte !
                    </p>
                </div>
                
                <a href='http://" . $_SERVER['HTTP_HOST'] . "' style='display: inline-block; padding: 14px 28px; margin: 15px 0; background-color: #d92b2f; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;'>Accéder à mon espace</a>
                
                <p style='font-size: 12px; color: #aaaaaa; margin-top: 30px;'>À très vite sur Mega Clone.</p>
            </div>
        </body>
        </html>
        ";

        // Détection de l'environnement (Local localhost vs Serveur o2switch)
        if ($_SERVER['HTTP_HOST'] === 'localhost' || $_SERVER['HTTP_HOST'] === '127.0.0.1') {
            $mailLog = "\n=== EMAIL DE BIENVENUE SIMULÉ ===\nSujet: $subject\nA: $to\nMessage: Template HTML généré avec succès.\n====================\n";
            file_put_contents(__DIR__ . '/../local_email_interceptor.txt', $mailLog, FILE_APPEND);
        } else {
            $headers = "MIME-Version: 1.0" . "\r\n";
            $headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";
            $headers .= "From: Equipe MEGA Clone <noreply@" . $_SERVER['HTTP_HOST'] . ">" . "\r\n";
            $headers .= "Reply-To: noreply@" . $_SERVER['HTTP_HOST'] . "\r\n";
            
            mail($to, $subject, $htmlContent, $headers);
        }
        // --- FIN : ENVOI EMAIL DE BIENVENUE ---
        
        respondJson(['status' => 'success', 'message' => 'Registered successfully.']);
    } else {
        respondJson(['status' => 'error', 'message' => 'Failed to register.'], 500);
    }
});

$router->post('login', function($data) use ($pdo) {
    $email = trim($data['email'] ?? '');
    $password = $data['password'] ?? '';

    if (empty($email) || empty($password)) {
        respondJson(['status' => 'error', 'message' => 'Email and password are required.'], 400);
    }

    $stmt = $pdo->prepare("SELECT id, username, password_hash, is_admin, plan_type, avatar, status FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if ($user && password_verify($password, $user['password_hash'])) {
        if ($user['status'] === 'suspended') {
            respondJson(['status' => 'error', 'message' => 'Votre compte est suspendu.'], 403);
        }
        
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['username'] = $user['username'];
        $_SESSION['is_admin'] = $user['is_admin'];
        $_SESSION['plan_type'] = $user['plan_type'];
        $_SESSION['avatar'] = $user['avatar'];
        
        $pdo->prepare("INSERT INTO activity_logs (user_id, action, ip_address) VALUES (?, ?, ?)")->execute([$user['id'], 'login', $_SERVER['REMOTE_ADDR'] ?? '']);
        respondJson(['status' => 'success', 'message' => 'Logged in successfully.', 'avatar' => $user['avatar']]);
    } else {
        respondJson(['status' => 'error', 'message' => 'Invalid email or password.'], 401);
    }
});

$router->get('logout', function() {
    session_destroy();
    respondJson(['status' => 'success', 'message' => 'Logged out.']);
});

$router->get('check', function() use ($pdo) {
    if (isset($_SESSION['user_id'])) {
        $stmt = $pdo->prepare("SELECT is_admin, plan_type, avatar, status, email, first_name, last_name FROM users WHERE id = ?");
        $stmt->execute([$_SESSION['user_id']]);
        $u = $stmt->fetch();
        
        if ($u && $u['status'] === 'suspended') {
            session_destroy();
            respondJson(['status' => 'error', 'message' => 'Votre compte est suspendu.'], 403);
        }
        
        respondJson([
            'status' => 'success', 
            'user' => [
                'id' => $_SESSION['user_id'], 
                'username' => $_SESSION['username'],
                'email' => $u ? $u['email'] : '',
                'first_name' => $u ? $u['first_name'] : '',
                'last_name' => $u ? $u['last_name'] : '',
                'is_admin' => $u ? $u['is_admin'] : 0,
                'plan_type' => $u ? $u['plan_type'] : 'free',
                'avatar' => $u ? $u['avatar'] : null
            ]
        ]);
    } else {
        respondJson(['status' => 'error', 'message' => 'Not logged in.'], 200); 
    }
});

$router->dispatch();
?>