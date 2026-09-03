<?php
// api/recovery.php
require_once 'config.php';
require_once 'Router.php';

$router = new Router();

// 1. Demande de réinitialisation (Génération du lien)
$router->post('request', function($data) use ($pdo) {
    $email = trim($data['email'] ?? '');
    if (empty($email)) respondJson(['status' => 'error', 'message' => 'Email requis.'], 400);

    // Vérifier si l'utilisateur existe
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if ($user) {
        // Générer un jeton cryptographique sécurisé
        $token = bin2hex(random_bytes(32));

        // Laisser MySQL gérer l'heure d'expiration exacte (NOW() + 1 heure)
        $stmt = $pdo->prepare("UPDATE users SET reset_token = ?, reset_expires = DATE_ADD(NOW(), INTERVAL 1 HOUR) WHERE id = ?");
        $stmt->execute([$token, $user['id']]);

        // Construit l'URL complète vers recovery.html
        $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http";
        $baseDir = dirname($_SERVER['REQUEST_URI'], 2);
        if ($baseDir == '\\' || $baseDir == '/') $baseDir = '';
        
        $resetLink = $protocol . "://" . $_SERVER['HTTP_HOST'] . $baseDir . "/recovery.html?token=" . $token;
        
        // Préparation de l'email
        $to = $email;
        $subject = "Récupération de votre compte MEGA Clone";
        
        // Template HTML professionnel pour l'email
        $htmlContent = "
        <html>
        <head><title>Récupération de compte</title></head>
        <body style='font-family: Arial, sans-serif; background-color: #f4f4f9; padding: 20px;'>
            <div style='max-width: 600px; margin: 0 auto; background: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); text-align: center;'>
                <div style='display: inline-block; width: 60px; height: 60px; background: #d92b2f; color: white; border-radius: 50%; font-size: 30px; line-height: 60px; font-weight: bold; margin-bottom: 20px;'>M</div>
                <h2 style='color: #333333;'>Demande de réinitialisation</h2>
                <p style='color: #555555; line-height: 1.5;'>Bonjour,</p>
                <p style='color: #555555; line-height: 1.5;'>Vous avez demandé la réinitialisation de votre mot de passe. Pour des raisons de sécurité Zéro Connaissance, vous aurez besoin de votre <strong>Clé de secours (Master Key)</strong>.</p>
                
                <a href='{$resetLink}' style='display: inline-block; padding: 14px 28px; margin: 25px 0; background-color: #d92b2f; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;'>Restaurer mon compte</a>
                
                <p style='font-size: 12px; color: #888888; text-align: left; background: #f9f9f9; padding: 10px; border-radius: 4px; word-break: break-all;'>
                    Si le bouton ne fonctionne pas, copiez-collez ce lien dans votre navigateur :<br>
                    <a href='{$resetLink}' style='color: #3b82f6;'>{$resetLink}</a>
                </p>
                <p style='font-size: 12px; color: #aaaaaa; margin-top: 20px;'>Ce lien est unique et expirera dans 1 heure. Si vous n'avez pas demandé cette réinitialisation, ignorez simplement cet email.</p>
            </div>
        </body>
        </html>
        ";

        // Détection de l'environnement (Local localhost vs Serveur o2switch)
        if ($_SERVER['HTTP_HOST'] === 'localhost' || $_SERVER['HTTP_HOST'] === '127.0.0.1') {
            // MODE LOCAL : On continue d'écrire dans le fichier texte pour éviter les erreurs de Laragon
            $mailLog = "\n=== EMAIL SIMULÉ (FORMAT HTML) ===\nSujet: $subject\nA: $to\nLien: $resetLink\n====================\n";
            file_put_contents(__DIR__ . '/../local_email_interceptor.txt', $mailLog, FILE_APPEND);
        } else {
            // MODE PRODUCTION : Vrai envoi d'email configuré pour o2switch
            $headers = "MIME-Version: 1.0" . "\r\n";
            $headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";
            // L'expéditeur sera automatiquement du type "noreply@ton-nom-de-domaine.com"
            $headers .= "From: Support MEGA Clone <noreply@" . $_SERVER['HTTP_HOST'] . ">" . "\r\n";
            $headers .= "Reply-To: noreply@" . $_SERVER['HTTP_HOST'] . "\r\n";
            
            mail($to, $subject, $htmlContent, $headers);
        }

    }

    // Toujours renvoyer un succès (Sécurité pour empêcher les hackers de deviner les emails inscrits)
    respondJson(['status' => 'success', 'message' => 'Si cette adresse existe, un lien a été généré.']);
});

// 2. Validation du token et récupération des clés
$router->post('validate', function($data) use ($pdo) {
    $token = $data['token'] ?? '';
    if (empty($token)) respondJson(['status' => 'error', 'message' => 'Token manquant.'], 400);

    // Vérifier le token et la date d'expiration
    $stmt = $pdo->prepare("SELECT id, username FROM users WHERE reset_token = ? AND reset_expires > NOW()");
    $stmt->execute([$token]);
    $user = $stmt->fetch();

    if (!$user) {
        respondJson(['status' => 'error', 'message' => 'Lien de récupération invalide ou expiré.'], 400);
    }

    // Le token est bon ! On récupère TOUTES les clés de fichiers de cet utilisateur
    $stmt = $pdo->prepare("SELECT id, encrypted_key FROM files WHERE user_id = ? AND encrypted_key IS NOT NULL AND encrypted_key != '' AND encrypted_key != 'null'");
    $stmt->execute([$user['id']]);
    $files = $stmt->fetchAll();

    respondJson([
        'status' => 'success',
        'user' => ['username' => $user['username']],
        'files' => $files // Ces clés sont chiffrées avec l'ancienne Master Key
    ]);
});

// 3. Application de la mise à jour (Nouveau mot de passe + Nouvelles clés)
$router->post('apply', function($data) use ($pdo) {
    $token = $data['token'] ?? '';
    $new_password = $data['new_password'] ?? '';
    $new_keys = $data['keys'] ?? []; // Objet : { file_id: "new_encrypted_key", ... }

    if (empty($token) || empty($new_password)) {
        respondJson(['status' => 'error', 'message' => 'Paramètres manquants.'], 400);
    }

    $stmt = $pdo->prepare("SELECT id FROM users WHERE reset_token = ? AND reset_expires > NOW()");
    $stmt->execute([$token]);
    $user = $stmt->fetch();

    if (!$user) respondJson(['status' => 'error', 'message' => 'Lien invalide ou expiré.'], 400);

    $pdo->beginTransaction();
    try {
        // 3a. Hasher le nouveau mot de passe
        $password_hash = password_hash($new_password, PASSWORD_DEFAULT);
        
        // 3b. Mettre à jour le mot de passe et effacer le token de sécurité
        $stmt = $pdo->prepare("UPDATE users SET password_hash = ?, reset_token = NULL, reset_expires = NULL WHERE id = ?");
        $stmt->execute([$password_hash, $user['id']]);

        // 3c. Mettre à jour en masse toutes les clés de fichiers
        if (!empty($new_keys) && is_array($new_keys)) {
            $stmtKey = $pdo->prepare("UPDATE files SET encrypted_key = ? WHERE id = ? AND user_id = ?");
            foreach ($new_keys as $file_id => $encrypted_key) {
                $stmtKey->execute([$encrypted_key, (int)$file_id, $user['id']]);
            }
        }

        $pdo->commit();
        respondJson(['status' => 'success', 'message' => 'Compte récupéré avec succès !']);
    } catch (Exception $e) {
        $pdo->rollBack();
        respondJson(['status' => 'error', 'message' => 'Erreur BDD : ' . $e->getMessage()], 500);
    }
});

$router->dispatch();
?>