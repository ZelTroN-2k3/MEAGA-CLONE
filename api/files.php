<?php
// api/files.php
require_once 'config.php';
require_once 'Router.php';

$user_id = requireAuth();
$router = new Router();

$router->post('upload', function($data) use ($pdo, $user_id) {
    if (!isset($_FILES['file'])) {
        respondJson(['status' => 'error', 'message' => 'No file uploaded.'], 400);
    }

    $folder_id = isset($_POST['folder_id']) && $_POST['folder_id'] !== '' && $_POST['folder_id'] !== 'null' ? (int)$_POST['folder_id'] : null;
    $file = $_FILES['file'];
    
    $original_name = $file['name'];
    $size = $file['size'];
    $mime_type = $file['type'];
    $tmp_path = $file['tmp_name'];

    if ($file['error'] !== UPLOAD_ERR_OK) {
        respondJson(['status' => 'error', 'message' => 'Upload failed with error code: ' . $file['error']], 500);
    }

    // Verify folder_id if set
    if ($folder_id !== null) {
        $stmt = $pdo->prepare("SELECT id FROM folders WHERE id = ? AND user_id = ?");
        $stmt->execute([$folder_id, $user_id]);
        if (!$stmt->fetch()) {
            respondJson(['status' => 'error', 'message' => 'Invalid folder.'], 400);
        }
    }

    // Check storage quota
    $stmt = $pdo->prepare("SELECT storage_quota, used_storage FROM users WHERE id = ?");
    $stmt->execute([$user_id]);
    $user_quota = $stmt->fetch();
    
    if ($user_quota['used_storage'] + $size > $user_quota['storage_quota']) {
        respondJson(['status' => 'error', 'message' => 'Storage quota exceeded.'], 400);
    }

    $stored_name = bin2hex(random_bytes(16)) . '_' . time();
    $target_dir = __DIR__ . '/../uploads/files/';
    $target_path = $target_dir . $stored_name;
    
    $encrypted_key = trim($_POST['encrypted_key'] ?? '');
    
    $has_thumbnail = 0;
    if (isset($_FILES['thumbnail']) && $_FILES['thumbnail']['error'] === UPLOAD_ERR_OK) {
        $has_thumbnail = 1;
    }

    if (move_uploaded_file($tmp_path, $target_path)) {
        if ($has_thumbnail) {
            move_uploaded_file($_FILES['thumbnail']['tmp_name'], $target_path . '_thumb');
        }
        
        $pdo->beginTransaction();
        try {
            $stmt = $pdo->prepare("INSERT INTO files (folder_id, user_id, original_name, stored_name, size, mime_type, encrypted_key, has_thumbnail) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([$folder_id, $user_id, $original_name, $stored_name, $size, $mime_type, $encrypted_key, $has_thumbnail]);
            
            $new_file_id = $pdo->lastInsertId();
            
            // Update user storage
            $stmt_update = $pdo->prepare("UPDATE users SET used_storage = used_storage + ? WHERE id = ?");
            $stmt_update->execute([$size, $user_id]);
            
            $pdo->commit();
            
            respondJson([
                'status' => 'success', 
                'message' => 'File uploaded.',
                'file' => [
                    'id' => $new_file_id,
                    'name' => $original_name,
                    'size' => $size,
                    'mime_type' => $mime_type
                ]
            ]);
        } catch (Exception $e) {
            $pdo->rollBack();
            unlink($target_path); // Remove file if db insert fails
            $thumb_path = $target_path . '_thumb';
            if (file_exists($thumb_path)) unlink($thumb_path);
            respondJson(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()], 500);
        }
    } else {
        respondJson(['status' => 'error', 'message' => 'Failed to move uploaded file.'], 500);
    }
});

$router->post('rename', function($data) use ($pdo, $user_id) {
    $file_id = isset($data['id']) ? (int)$data['id'] : 0;
    $new_name = trim($data['new_name'] ?? '');
    
    if (empty($new_name)) respondJson(['status' => 'error', 'message' => 'Name cannot be empty.'], 400);

    $stmt = $pdo->prepare("UPDATE files SET original_name = ? WHERE id = ? AND user_id = ?");
    if ($stmt->execute([$new_name, $file_id, $user_id])) {
        respondJson(['status' => 'success', 'message' => 'File renamed.']);
    } else {
        respondJson(['status' => 'error', 'message' => 'Failed to rename file.'], 500);
    }
});

$router->post('move', function($data) use ($pdo, $user_id) {
    $file_id = isset($data['id']) ? (int)$data['id'] : 0;
    $new_folder_id = isset($data['folder_id']) && $data['folder_id'] !== '' && $data['folder_id'] !== 'null' ? (int)$data['folder_id'] : null;

    $stmt = $pdo->prepare("UPDATE files SET folder_id = ? WHERE id = ? AND user_id = ?");
    if ($stmt->execute([$new_folder_id, $file_id, $user_id])) {
        respondJson(['status' => 'success', 'message' => 'File moved.']);
    } else {
        respondJson(['status' => 'error', 'message' => 'Failed to move file.'], 500);
    }
});

$router->post('delete', function($data) use ($pdo, $user_id) {
    $file_id = isset($data['id']) ? (int)$data['id'] : 0;
    
    // Fetch file to get size and path
    $stmt = $pdo->prepare("SELECT stored_name, size FROM files WHERE id = ? AND user_id = ?");
    $stmt->execute([$file_id, $user_id]);
    $file = $stmt->fetch();
    
    if (!$file) respondJson(['status' => 'error', 'message' => 'File not found.'], 404);
    
    $pdo->beginTransaction();
    try {
        $stmt = $pdo->prepare("DELETE FROM files WHERE id = ? AND user_id = ?");
        $stmt->execute([$file_id, $user_id]);
        
        // Reduce used storage
        $stmt_update = $pdo->prepare("UPDATE users SET used_storage = GREATEST(0, used_storage - ?) WHERE id = ?");
        $stmt_update->execute([$file['size'], $user_id]);
        
        $pdo->commit();
        
        // Delete physical file
        $file_path = __DIR__ . '/../uploads/files/' . $file['stored_name'];
        if (file_exists($file_path)) unlink($file_path);
        
        $thumb_path = $file_path . '_thumb';
        if (file_exists($thumb_path)) unlink($thumb_path);
        
        respondJson(['status' => 'success', 'message' => 'File deleted.']);
    } catch (Exception $e) {
        $pdo->rollBack();
        respondJson(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()], 500);
    }
});

$router->post('share', function($data) use ($pdo, $user_id) {
    $file_id = isset($data['id']) ? (int)$data['id'] : 0;
    
    $stmt = $pdo->prepare("SELECT shared_link_token FROM files WHERE id = ? AND user_id = ?");
    $stmt->execute([$file_id, $user_id]);
    $file = $stmt->fetch();
    
    if (!$file) respondJson(['status' => 'error', 'message' => 'File not found.'], 404);
    
    $token = $file['shared_link_token'];
    if (!$token) {
        $token = bin2hex(random_bytes(16));
        $stmt = $pdo->prepare("UPDATE files SET shared_link_token = ? WHERE id = ?");
        $stmt->execute([$token, $file_id]);
    }
    
    if (isset($data['update_settings']) && $data['update_settings'] === true) {
        $stmt_plan = $pdo->prepare("SELECT plan_type FROM users WHERE id = ?");
        $stmt_plan->execute([$user_id]);
        $user_data = $stmt_plan->fetch();
        $is_pro = $user_data && $user_data['plan_type'] !== 'free';
        
        $password = ($is_pro && !empty($data['password'])) ? password_hash($data['password'], PASSWORD_DEFAULT) : null;
        $expires_at = ($is_pro && !empty($data['expires_at'])) ? $data['expires_at'] : null;
        
        $stmt = $pdo->prepare("UPDATE files SET share_password = ?, share_expires_at = ? WHERE id = ?");
        $stmt->execute([$password, $expires_at, $file_id]);
    }
    
    respondJson(['status' => 'success', 'token' => $token]);
});

$router->get('download', function() use ($pdo, $user_id) {
    $file_id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
    
    $stmt = $pdo->prepare("SELECT * FROM files WHERE id = ? AND user_id = ?");
    $stmt->execute([$file_id, $user_id]);
    $file = $stmt->fetch();
    
    if (!$file) {
        http_response_code(404);
        die("File not found or unauthorized.");
    }
    
    $file_path = __DIR__ . '/../uploads/files/' . $file['stored_name'];
    if (file_exists($file_path)) {
        header('Content-Description: File Transfer');
        header('Content-Type: ' . ($file['mime_type'] ? $file['mime_type'] : 'application/octet-stream'));
        header('Content-Disposition: attachment; filename="' . basename($file['original_name']) . '"');
        header('Expires: 0');
        header('Cache-Control: must-revalidate');
        header('Pragma: public');
        header('Content-Length: ' . filesize($file_path));
        readfile($file_path);
        exit;
    } else {
        http_response_code(404);
        die("File not found on server.");
    }
});

$router->get('thumbnail', function() use ($pdo, $user_id) {
    $file_id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
    
    $stmt = $pdo->prepare("SELECT stored_name, has_thumbnail FROM files WHERE id = ? AND user_id = ?");
    $stmt->execute([$file_id, $user_id]);
    $file = $stmt->fetch();
    
    if (!$file || !$file['has_thumbnail']) {
        http_response_code(404);
        die("Thumbnail not found.");
    }
    
    $file_path = __DIR__ . '/../uploads/files/' . $file['stored_name'] . '_thumb';
    if (file_exists($file_path)) {
        header('Content-Type: application/octet-stream');
        header('Content-Length: ' . filesize($file_path));
        readfile($file_path);
        exit;
    } else {
        http_response_code(404);
        die("Thumbnail file not found on server.");
    }
});

$router->dispatch();
