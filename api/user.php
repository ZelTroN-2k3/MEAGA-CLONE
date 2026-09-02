<?php
// api/user.php
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/error_log.txt');
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

set_error_handler(function($errno, $errstr, $errfile, $errline) {
    file_put_contents(__DIR__ . '/error_log.txt', "Error [$errno]: $errstr in $errfile on line $errline\n", FILE_APPEND);
});
set_exception_handler(function($e) {
    file_put_contents(__DIR__ . '/error_log.txt', "Exception: " . $e->getMessage() . "\n", FILE_APPEND);
    http_response_code(500);
    echo json_encode(['status'=>'error', 'message'=>$e->getMessage()]);
    exit;
});

require_once 'config.php';
require_once 'Router.php';

if (!isset($_SESSION['user_id'])) {
    respondJson(['status' => 'error', 'message' => 'Unauthorized'], 401);
}

$user_id = $_SESSION['user_id'];
$router = new Router();

$router->post('change_password', function($data) use ($pdo, $user_id) {
    $old_pass = $data['old_password'] ?? '';
    $new_pass = $data['new_password'] ?? '';
    
    $stmt = $pdo->prepare("SELECT password_hash FROM users WHERE id = ?");
    $stmt->execute([$user_id]);
    $user = $stmt->fetch();
    
    if ($user && password_verify($old_pass, $user['password_hash'])) {
        $new_hash = password_hash($new_pass, PASSWORD_DEFAULT);
        $stmt = $pdo->prepare("UPDATE users SET password_hash = ? WHERE id = ?");
        if ($stmt->execute([$new_hash, $user_id])) {
            respondJson(['status' => 'success', 'message' => 'Password updated.']);
        } else {
            respondJson(['status' => 'error', 'message' => 'Failed to update password.'], 500);
        }
    } else {
        respondJson(['status' => 'error', 'message' => 'Incorrect old password.'], 400);
    }
});

$router->post('update_profile', function($data) use ($pdo, $user_id) {
    $firstName = trim($data['first_name'] ?? '');
    $lastName = trim($data['last_name'] ?? '');
    $birthDate = $data['birth_date'] ?? null;
    $country = trim($data['country'] ?? '');
    
    $stmt = $pdo->prepare("UPDATE users SET first_name = ?, last_name = ?, birth_date = ?, country = ? WHERE id = ?");
    if ($stmt->execute([$firstName, $lastName, $birthDate, $country, $user_id])) {
        respondJson(['status' => 'success', 'message' => 'Profil mis à jour avec succès.']);
    } else {
        respondJson(['status' => 'error', 'message' => 'Erreur lors de la mise à jour.'], 500);
    }
});

$router->post('delete_account', function($data) use ($pdo, $user_id) {
    $pdo->beginTransaction();
    try {
        // Delete folders, files, activity_logs, users
        $pdo->prepare("DELETE FROM folders WHERE user_id = ?")->execute([$user_id]);
        $pdo->prepare("DELETE FROM files WHERE user_id = ?")->execute([$user_id]);
        $pdo->prepare("DELETE FROM activity_logs WHERE user_id = ?")->execute([$user_id]);
        $pdo->prepare("DELETE FROM users WHERE id = ?")->execute([$user_id]);
        $pdo->commit();
        session_destroy();
        respondJson(['status' => 'success', 'message' => 'Compte supprimé avec succès.']);
    } catch (Exception $e) {
        $pdo->rollBack();
        respondJson(['status' => 'error', 'message' => 'Erreur lors de la suppression du compte'], 500);
    }
});

$router->get('stats', function() use ($pdo, $user_id) {
    $stmt = $pdo->prepare("SELECT used_storage, total_storage FROM users WHERE id = ?");
    $stmt->execute([$user_id]);
    $stats = $stmt->fetch();
    
    // Calculate trash size (files directly in trash or in a trashed folder)
    $stmt = $pdo->prepare("
        SELECT SUM(size) as trash_size, COUNT(files.id) as trash_count 
        FROM files 
        LEFT JOIN folders ON files.folder_id = folders.id 
        WHERE files.user_id = ? 
        AND (files.deleted_at IS NOT NULL OR folders.deleted_at IS NOT NULL)
    ");
    $stmt->execute([$user_id]);
    $trash_data = $stmt->fetch();
    
    $stats['trash_storage'] = (int)($trash_data['trash_size'] ?? 0);
    $stats['trash_count'] = (int)($trash_data['trash_count'] ?? 0);
    
    respondJson(['status' => 'success', 'stats' => $stats]);
});

$router->get('profile', function() use ($pdo, $user_id) {
    $stmt = $pdo->prepare("SELECT username, email, plan_type, first_name, last_name, birth_date, country, billing_info, subscription_date, avatar, notification_settings, created_at FROM users WHERE id = ?");
    $stmt->execute([$user_id]);
    $profile = $stmt->fetch();
    respondJson(['status' => 'success', 'profile' => $profile]);
});

$router->post('update_notification_settings', function($data) use ($pdo, $user_id) {
    $settings = $data['settings'] ?? '{}';
    $stmt = $pdo->prepare("UPDATE users SET notification_settings = ? WHERE id = ?");
    if ($stmt->execute([$settings, $user_id])) {
        respondJson(['status' => 'success', 'message' => 'Paramètres de notifications mis à jour.']);
    } else {
        respondJson(['status' => 'error', 'message' => 'Erreur lors de la sauvegarde.'], 500);
    }
});

$router->dispatch();
