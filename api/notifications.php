<?php
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

$user_id = requireAuth();
$router = new Router();

$router->get('list', function() use ($pdo, $user_id) {
    $stmt = $pdo->prepare("SELECT id, title, message, is_read, created_at FROM notifications WHERE user_id = ? AND is_read = 0 ORDER BY created_at DESC LIMIT 50");
    $stmt->execute([$user_id]);
    $notifications = $stmt->fetchAll();
    
    $stmt = $pdo->prepare("SELECT COUNT(id) as unread_count FROM notifications WHERE user_id = ? AND is_read = 0");
    $stmt->execute([$user_id]);
    $unread = $stmt->fetchColumn();
    
    respondJson(['status' => 'success', 'notifications' => $notifications, 'unread_count' => $unread]);
});

$router->post('mark_read', function($data) use ($pdo, $user_id) {
    $notif_id = $data['id'] ?? null;
    if ($notif_id) {
        $stmt = $pdo->prepare("UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?");
        $stmt->execute([$notif_id, $user_id]);
    } else {
        // Mark all as read
        $stmt = $pdo->prepare("UPDATE notifications SET is_read = 1 WHERE user_id = ?");
        $stmt->execute([$user_id]);
    }
    respondJson(['status' => 'success']);
});

$router->dispatch();
