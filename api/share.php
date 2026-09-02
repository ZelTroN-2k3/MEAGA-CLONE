<?php
// api/share.php
require_once 'config.php';

$action = $_GET['action'] ?? '';
$token = $_GET['token'] ?? '';

if (empty($token)) {
    die(json_encode(['status' => 'error', 'message' => 'Token required.']));
}

$stmt = $pdo->prepare("SELECT * FROM files WHERE shared_link_token = ?");
$stmt->execute([$token]);
$file = $stmt->fetch();

$folder = null;
if (!$file) {
    $stmt = $pdo->prepare("SELECT * FROM folders WHERE shared_link_token = ?");
    $stmt->execute([$token]);
    $folder = $stmt->fetch();
}

if (!$file && !$folder) {
    if ($_SERVER['REQUEST_METHOD'] === 'GET' && $action === 'download') {
        die("Shared item not found or link expired.");
    }
    respondJson(['status' => 'error', 'message' => 'Shared item not found.'], 404);
}
$item = $file ? $file : $folder;

// Check expiry
if (!empty($item['share_expires_at']) && strtotime($item['share_expires_at']) < time()) {
    if ($_SERVER['REQUEST_METHOD'] === 'GET' && $action === 'download') {
        die("Link expired.");
    }
    respondJson(['status' => 'error', 'message' => 'Link expired.'], 403);
}

// Check password
if (!empty($item['share_password'])) {
    $provided_pwd = $_GET['pwd'] ?? ($_POST['pwd'] ?? '');
    if (!password_verify($provided_pwd, $item['share_password'])) {
        if ($_SERVER['REQUEST_METHOD'] === 'GET' && $action === 'download') {
            die("Password required or incorrect.");
        }
        respondJson(['status' => 'password_required'], 401);
    }
}

require_once 'Router.php';
$router = new Router();

$router->get('info', function() use ($pdo, $file, $folder) {
    if ($file) {
        respondJson([
            'status' => 'success',
            'type' => 'file',
            'file' => [
                'id' => $file['id'],
                'name' => $file['original_name'],
                'size' => $file['size'],
                'mime_type' => $file['mime_type'],
                'encrypted_key' => $file['encrypted_key']
            ]
        ]);
    } else if ($folder) {
        $stmt = $pdo->prepare("
            SELECT f.id, f.original_name as name, f.size, f.mime_type, f.created_at, sfk.shared_encrypted_key as encrypted_key
            FROM files f
            JOIN shared_folder_keys sfk ON f.id = sfk.file_id
            WHERE sfk.folder_id = ?
        ");
        $stmt->execute([$folder['id']]);
        $files = $stmt->fetchAll();
        
        respondJson([
            'status' => 'success',
            'type' => 'folder',
            'folder' => [
                'id' => $folder['id'],
                'name' => $folder['name']
            ],
            'files' => $files
        ]);
    }
});

$router->get('download', function() use ($pdo, $file, $folder) {
    $targetFile = null;
    
    if ($file) {
        $targetFile = $file;
    } else if ($folder) {
        $file_id = isset($_GET['file_id']) ? (int)$_GET['file_id'] : 0;
        $stmt = $pdo->prepare("
            SELECT f.* 
            FROM files f
            JOIN shared_folder_keys sfk ON f.id = sfk.file_id
            WHERE sfk.folder_id = ? AND f.id = ?
        ");
        $stmt->execute([$folder['id'], $file_id]);
        $targetFile = $stmt->fetch();
    }
    
    if ($targetFile) {
        $file_path = __DIR__ . '/../uploads/files/' . $targetFile['stored_name'];
        if (file_exists($file_path)) {
            header('Content-Description: File Transfer');
            header('Content-Type: ' . ($targetFile['mime_type'] ? $targetFile['mime_type'] : 'application/octet-stream'));
            header('Content-Disposition: attachment; filename="' . basename($targetFile['original_name']) . '"');
            header('Expires: 0');
            header('Cache-Control: must-revalidate');
            header('Pragma: public');
            header('Content-Length: ' . filesize($file_path));
            readfile($file_path);
            exit;
        } else {
            die("File not found on server.");
        }
    } else {
        die("File not found in this share.");
    }
});

$router->dispatch();
