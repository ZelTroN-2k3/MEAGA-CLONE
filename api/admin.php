<?php
// api/admin.php
require_once 'config.php';
require_once 'Router.php';

// Verifier l'authentification et le role admin
if (!isset($_SESSION['user_id'])) {
    respondJson(['status' => 'error', 'message' => 'Unauthorized'], 401);
}

$stmt = $pdo->prepare("SELECT is_admin FROM users WHERE id = ?");
$stmt->execute([$_SESSION['user_id']]);
$user = $stmt->fetch();

if (!$user || $user['is_admin'] != 1) {
    respondJson(['status' => 'error', 'message' => 'Forbidden: Admins only'], 403);
}

$router = new Router();

$router->get('stats', function() use ($pdo) {
    $stmt = $pdo->query("SELECT COUNT(id) as total_users, SUM(used_storage) as total_used, SUM(total_storage) as total_quota FROM users");
    $stats = $stmt->fetch(PDO::FETCH_ASSOC);
    
    $stmt2 = $pdo->query("SELECT COUNT(id) as total_files, SUM(size) as total_size FROM files");
    $files_stats = $stmt2->fetch(PDO::FETCH_ASSOC);
    
    // Count users by plan
    $stmt3 = $pdo->query("SELECT plan_type, COUNT(id) as count FROM users GROUP BY plan_type");
    $plans_stats = $stmt3->fetchAll(PDO::FETCH_ASSOC);
    
    respondJson([
        'status' => 'success',
        'users' => $stats,
        'files' => $files_stats,
        'plans' => $plans_stats
    ]);
});

$router->get('users', function() use ($pdo) {
    $stmt = $pdo->query("SELECT id, username, email, used_storage, total_storage, plan_type, created_at, is_admin, status, first_name, last_name, birth_date, country, billing_info, subscription_date, avatar FROM users ORDER BY created_at DESC");
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    respondJson(['status' => 'success', 'users' => $users]);
});

$router->get('settings', function() use ($pdo) {
    $stmt = $pdo->query("SELECT setting_key, setting_value FROM settings");
    $settings = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);
    respondJson(['status' => 'success', 'settings' => $settings]);
});

$router->get('logs', function() use ($pdo) {
    $stmt = $pdo->query("SELECT l.*, u.username FROM activity_logs l LEFT JOIN users u ON l.user_id = u.id ORDER BY l.created_at DESC LIMIT 100");
    $logs = $stmt->fetchAll(PDO::FETCH_ASSOC);
    respondJson(['status' => 'success', 'logs' => $logs]);
});

$router->post('clear_logs', function() use ($pdo) {
    if ($pdo->query("TRUNCATE TABLE activity_logs")) {
        respondJson(['status' => 'success', 'message' => 'Logs vidés avec succès']);
    } else {
        respondJson(['status' => 'error', 'message' => 'Erreur lors de la suppression des logs'], 500);
    }
});

$router->post('upgrade', function($data) use ($pdo) {
    $user_id = $data['id'] ?? null;
    $plan = $data['plan'] ?? 'free';
    
    if (!$user_id) respondJson(['status' => 'error', 'message' => 'Missing User ID'], 400);
    
    $quota = 50 * 1024 * 1024 * 1024; // Free: 50GB
    if ($plan === 'pro1') $quota = 2 * 1024 * 1024 * 1024 * 1024; // Pro I: 2TB
    if ($plan === 'pro2') $quota = 8 * 1024 * 1024 * 1024 * 1024; // Pro II: 8TB
    
    $stmt = $pdo->prepare("UPDATE users SET plan_type = ?, total_storage = ? WHERE id = ?");
    if ($stmt->execute([$plan, $quota, $user_id])) {
        respondJson(['status' => 'success', 'message' => 'Utilisateur mis à jour']);
    } else {
        respondJson(['status' => 'error', 'message' => 'Erreur BDD'], 500);
    }
});

$router->post('delete_user', function($data) use ($pdo) {
    $user_id = $data['id'] ?? null;
    if (!$user_id || $user_id == $_SESSION['user_id']) {
        respondJson(['status' => 'error', 'message' => 'Impossible de supprimer cet utilisateur.'], 400);
    }
    
    $pdo->beginTransaction();
    try {
        // Supprimer dossiers et fichiers de cet utilisateur
        $pdo->prepare("DELETE FROM folders WHERE user_id = ?")->execute([$user_id]);
        $pdo->prepare("DELETE FROM files WHERE user_id = ?")->execute([$user_id]);
        $pdo->prepare("DELETE FROM activity_logs WHERE user_id = ?")->execute([$user_id]);
        $pdo->prepare("DELETE FROM users WHERE id = ?")->execute([$user_id]);
        $pdo->commit();
        respondJson(['status' => 'success', 'message' => 'Utilisateur et ses données supprimés.']);
    } catch (Exception $e) {
        $pdo->rollBack();
        respondJson(['status' => 'error', 'message' => 'Database error'], 500);
    }
});

$router->post('suspend_user', function($data) use ($pdo) {
    $user_id = $data['id'] ?? null;
    if (!$user_id || $user_id == $_SESSION['user_id']) respondJson(['status' => 'error', 'message' => 'Action impossible.'], 400);
    
    $stmt = $pdo->prepare("UPDATE users SET status = 'suspended' WHERE id = ?");
    $stmt->execute([$user_id]);
    respondJson(['status' => 'success', 'message' => 'Utilisateur suspendu.']);
});

$router->post('activate_user', function($data) use ($pdo) {
    $user_id = $data['id'] ?? null;
    if (!$user_id) respondJson(['status' => 'error', 'message' => 'Missing ID.'], 400);
    
    $stmt = $pdo->prepare("UPDATE users SET status = 'active' WHERE id = ?");
    $stmt->execute([$user_id]);
    respondJson(['status' => 'success', 'message' => 'Utilisateur réactivé.']);
});

$router->post('save_settings', function($data) use ($pdo) {
    $settings = $data['settings'] ?? [];
    foreach ($settings as $key => $value) {
        $stmt = $pdo->prepare("INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?");
        $stmt->execute([$key, $value, $value]);
    }
    respondJson(['status' => 'success', 'message' => 'Paramètres sauvegardés.']);
});

$router->post('update_user_quota', function($data) use ($pdo) {
    $user_id = $data['id'] ?? null;
    $quota_gb = $data['quota_gb'] ?? null;
    if (!$user_id || !$quota_gb) respondJson(['status' => 'error', 'message' => 'Paramètres manquants'], 400);
    
    $quota_bytes = intval($quota_gb) * 1024 * 1024 * 1024;
    $stmt = $pdo->prepare("UPDATE users SET total_storage = ? WHERE id = ?");
    if ($stmt->execute([$quota_bytes, $user_id])) {
        respondJson(['status' => 'success', 'message' => 'Quota mis à jour avec succès.']);
    } else {
        respondJson(['status' => 'error', 'message' => 'Erreur lors de la mise à jour.'], 500);
    }
});

$router->post('change_user_password', function($data) use ($pdo) {
    $user_id = $data['id'] ?? null;
    $new_pass = $data['new_password'] ?? null;
    if (!$user_id || !$new_pass) respondJson(['status' => 'error', 'message' => 'Paramètres manquants'], 400);
    
    $hash = password_hash($new_pass, PASSWORD_DEFAULT);
    $stmt = $pdo->prepare("UPDATE users SET password_hash = ? WHERE id = ?");
    if ($stmt->execute([$hash, $user_id])) {
        respondJson(['status' => 'success', 'message' => 'Mot de passe modifié avec succès.']);
    } else {
        respondJson(['status' => 'error', 'message' => 'Erreur lors de la modification.'], 500);
    }
});

$router->get('health_stats', function() use ($pdo) {
    // PHP Version & Environment
    $php_version = phpversion();
    $memory_limit = ini_get('memory_limit');
    $upload_max = ini_get('upload_max_filesize');
    $post_max = ini_get('post_max_size');
    $os = php_uname('s') . ' ' . php_uname('r');
    $server_software = $_SERVER['SERVER_SOFTWARE'] ?? 'Inconnu';
    
    // DB Size & Version
    $db_size_mb = 0;
    $mysql_version = 'Inconnue';
    try {
        $stmt = $pdo->query("SELECT ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'size' FROM information_schema.TABLES WHERE table_schema = (SELECT DATABASE())");
        $res = $stmt->fetch();
        $db_size_mb = $res['size'] ?? 0;
        
        $stmt_ver = $pdo->query("SELECT VERSION() as v");
        $mysql_version = $stmt_ver->fetch()['v'] ?? 'Inconnue';
    } catch (Exception $e) {}
    
    // Disk Free
    $disk_free = disk_free_space(__DIR__ . '/../uploads/');
    
    respondJson([
        'status' => 'success',
        'stats' => [
            'os' => $os,
            'server_software' => $server_software,
            'php_version' => $php_version,
            'memory_limit' => $memory_limit,
            'upload_max' => $upload_max,
            'post_max' => $post_max,
            'mysql_version' => $mysql_version,
            'db_size' => $db_size_mb,
            'disk_free' => $disk_free
        ]
    ]);
});

$router->post('clean_orphans', function() use ($pdo) {
    $uploads_dir = __DIR__ . '/../uploads/';
    if (!is_dir($uploads_dir)) {
        respondJson(['status' => 'success', 'message' => '0 fichiers orphelins supprimés.']);
    }
    
    // Get all valid stored_names from DB
    $stmt = $pdo->query("SELECT stored_name FROM files");
    $valid_files = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    // Add _thumb to valid files as they are also legitimate
    $valid_names = [];
    foreach($valid_files as $vf) {
        $valid_names[] = $vf;
        $valid_names[] = $vf . '_thumb';
    }
    
    $deleted_count = 0;
    $files = scandir($uploads_dir);
    foreach ($files as $file) {
        if ($file === '.' || $file === '..' || $file === 'avatars' || $file === 'index.html' || $file === '.htaccess') continue;
        
        if (!in_array($file, $valid_names)) {
            $filepath = $uploads_dir . $file;
            if (is_file($filepath)) {
                unlink($filepath);
                $deleted_count++;
            }
        }
    }
    
    respondJson(['status' => 'success', 'message' => "$deleted_count fichier(s) orphelin(s) supprimé(s)."]);
});

$router->dispatch();
