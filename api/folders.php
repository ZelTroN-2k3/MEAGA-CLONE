<?php
// api/folders.php
require_once 'config.php';
require_once 'Router.php';

$user_id = requireAuth();
$router = new Router();

$router->post('create', function($data) use ($pdo, $user_id) {
    $name = trim($data['name'] ?? '');
    $parent_id = !empty($data['parent_id']) ? (int)$data['parent_id'] : null;

    if (empty($name)) respondJson(['status' => 'error', 'message' => 'Folder name is required.'], 400);

    if ($parent_id !== null) {
        $stmt = $pdo->prepare("SELECT id FROM folders WHERE id = ? AND user_id = ?");
        $stmt->execute([$parent_id, $user_id]);
        if (!$stmt->fetch()) respondJson(['status' => 'error', 'message' => 'Invalid parent folder.'], 400);
    }

    $stmt = $pdo->prepare("INSERT INTO folders (user_id, parent_id, name) VALUES (?, ?, ?)");
    if ($stmt->execute([$user_id, $parent_id, $name])) {
        respondJson(['status' => 'success', 'folder' => ['id' => $pdo->lastInsertId(), 'parent_id' => $parent_id, 'name' => $name]]);
    } else {
        respondJson(['status' => 'error', 'message' => 'Failed to create folder.'], 500);
    }
});

$router->post('rename', function($data) use ($pdo, $user_id) {
    $folder_id = isset($data['id']) ? (int)$data['id'] : 0;
    $new_name = trim($data['new_name'] ?? '');
    
    if (empty($new_name)) respondJson(['status' => 'error', 'message' => 'Name cannot be empty.'], 400);

    $stmt = $pdo->prepare("UPDATE folders SET name = ? WHERE id = ? AND user_id = ?");
    if ($stmt->execute([$new_name, $folder_id, $user_id])) respondJson(['status' => 'success', 'message' => 'Folder renamed.']);
    else respondJson(['status' => 'error', 'message' => 'Failed to rename folder.'], 500);
});

$router->post('move', function($data) use ($pdo, $user_id) {
    $folder_id = isset($data['id']) ? (int)$data['id'] : 0;
    $new_parent_id = isset($data['parent_id']) && $data['parent_id'] !== '' && $data['parent_id'] !== 'null' ? (int)$data['parent_id'] : null;

    if ($folder_id === $new_parent_id) {
        respondJson(['status' => 'error', 'message' => 'Cannot move a folder into itself.'], 400);
    }

    // Anti-loop check
    $curr = $new_parent_id;
    while ($curr !== null) {
        if ($curr === $folder_id) respondJson(['status' => 'error', 'message' => 'Cannot move a folder into its own subfolder.'], 400);
        $stmt = $pdo->prepare("SELECT parent_id FROM folders WHERE id = ? AND user_id = ?");
        $stmt->execute([$curr, $user_id]);
        $res = $stmt->fetch();
        if (!$res) break;
        $curr = $res['parent_id'];
    }

    $stmt = $pdo->prepare("UPDATE folders SET parent_id = ? WHERE id = ? AND user_id = ?");
    if ($stmt->execute([$new_parent_id, $folder_id, $user_id])) {
        respondJson(['status' => 'success', 'message' => 'Folder moved.']);
    } else {
        respondJson(['status' => 'error', 'message' => 'Failed to move folder.'], 500);
    }
});

$router->post('delete', function($data) use ($pdo, $user_id) {
    // Physical hard delete
    $folder_id = isset($data['id']) ? (int)$data['id'] : 0;
    
    function deleteFolderRecursively($pdo, $f_id, $u_id) {
        $stmt = $pdo->prepare("SELECT stored_name, size FROM files WHERE folder_id = ? AND user_id = ?");
        $stmt->execute([$f_id, $u_id]);
        $files = $stmt->fetchAll();
        $size_freed = 0;
        foreach ($files as $file) {
            $file_path = __DIR__ . '/../uploads/files/' . $file['stored_name'];
            if (file_exists($file_path)) unlink($file_path);
            $size_freed += $file['size'];
        }
        $stmt = $pdo->prepare("SELECT id FROM folders WHERE parent_id = ? AND user_id = ?");
        $stmt->execute([$f_id, $u_id]);
        $subfolders = $stmt->fetchAll();
        foreach ($subfolders as $sub) $size_freed += deleteFolderRecursively($pdo, $sub['id'], $u_id);
        return $size_freed;
    }
    
    $pdo->beginTransaction();
    try {
        $total_freed = deleteFolderRecursively($pdo, $folder_id, $user_id);
        $stmt = $pdo->prepare("DELETE FROM folders WHERE id = ? AND user_id = ?");
        $stmt->execute([$folder_id, $user_id]);
        
        if ($total_freed > 0) {
            $stmt_update = $pdo->prepare("UPDATE users SET used_storage = GREATEST(0, used_storage - ?) WHERE id = ?");
            $stmt_update->execute([$total_freed, $user_id]);
        }
        
        $pdo->commit();
        respondJson(['status' => 'success', 'message' => 'Folder hard deleted.']);
    } catch (Exception $e) {
        $pdo->rollBack();
        respondJson(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()], 500);
    }
});

$router->post('share', function($data) use ($pdo, $user_id) {
    $folder_id = isset($data['id']) ? (int)$data['id'] : 0;
    $keys = isset($data['keys']) ? $data['keys'] : []; // Array of [file_id => shared_encrypted_key]
    
    $stmt = $pdo->prepare("SELECT shared_link_token FROM folders WHERE id = ? AND user_id = ?");
    $stmt->execute([$folder_id, $user_id]);
    $folder = $stmt->fetch();
    
    if (!$folder) respondJson(['status' => 'error', 'message' => 'Folder not found.'], 404);
    
    $token = $folder['shared_link_token'] ?: bin2hex(random_bytes(16));
    
    $pdo->beginTransaction();
    try {
        if (!$folder['shared_link_token']) {
            $stmt = $pdo->prepare("UPDATE folders SET shared_link_token = ? WHERE id = ?");
            $stmt->execute([$token, $folder_id]);
        }
        
        if (isset($data['update_settings']) && $data['update_settings'] === true) {
            $stmt_plan = $pdo->prepare("SELECT plan_type FROM users WHERE id = ?");
            $stmt_plan->execute([$user_id]);
            $user_data = $stmt_plan->fetch();
            $is_pro = $user_data && $user_data['plan_type'] !== 'free';
            
            $password = ($is_pro && !empty($data['password'])) ? password_hash($data['password'], PASSWORD_DEFAULT) : null;
            $expires_at = ($is_pro && !empty($data['expires_at'])) ? $data['expires_at'] : null;
            
            $stmt = $pdo->prepare("UPDATE folders SET share_password = ?, share_expires_at = ? WHERE id = ?");
            $stmt->execute([$password, $expires_at, $folder_id]);
        } else {
            // Delete old keys for this folder if regenerating (or just upsert)
            $stmt = $pdo->prepare("DELETE FROM shared_folder_keys WHERE folder_id = ?");
            $stmt->execute([$folder_id]);
            
            $stmt = $pdo->prepare("INSERT INTO shared_folder_keys (folder_id, file_id, shared_encrypted_key) VALUES (?, ?, ?)");
            foreach ($keys as $file_id => $shared_key) {
                $stmt->execute([$folder_id, (int)$file_id, $shared_key]);
            }
        }
        
        $pdo->commit();
        respondJson(['status' => 'success', 'token' => $token]);
    } catch (Exception $e) {
        $pdo->rollBack();
        respondJson(['status' => 'error', 'message' => 'Failed to generate link.'], 500);
    }
});

$router->post('get_all_files', function($data) use ($pdo, $user_id) {
    $folder_id = isset($_GET['folder_id']) ? (int)$_GET['folder_id'] : 0;
    
    $all_files = [];
    
    function fetchFilesRecursive($pdo, $f_id, $u_id, &$all_files) {
        $stmt = $pdo->prepare("SELECT id, encrypted_key FROM files WHERE folder_id = ? AND user_id = ? AND deleted_at IS NULL");
        $stmt->execute([$f_id, $u_id]);
        $files = $stmt->fetchAll();
        foreach ($files as $file) {
            $all_files[] = $file;
        }
        
        $stmt = $pdo->prepare("SELECT id FROM folders WHERE parent_id = ? AND user_id = ? AND deleted_at IS NULL");
        $stmt->execute([$f_id, $u_id]);
        $subfolders = $stmt->fetchAll();
        foreach ($subfolders as $sub) {
            fetchFilesRecursive($pdo, $sub['id'], $u_id, $all_files);
        }
    }
    
    fetchFilesRecursive($pdo, $folder_id, $user_id, $all_files);
    
    respondJson(['status' => 'success', 'files' => $all_files]);
});

$router->get('list', function() use ($pdo, $user_id) {
    try {
        $parent_id = isset($_GET['parent_id']) && $_GET['parent_id'] !== '' ? (int)$_GET['parent_id'] : null;
        $view = $_GET['view'] ?? 'drive';
        $show_hidden = isset($_GET['show_hidden']) && $_GET['show_hidden'] == '1';
        $hidden_cond = $show_hidden ? '' : ' AND is_hidden = 0';
        $show_hidden = isset($_GET['show_hidden']) && $_GET['show_hidden'] == '1';
        $hidden_cond = $show_hidden ? '' : ' AND is_hidden = 0';
        
        if ($view === 'trash') {
            $stmt = $pdo->prepare("SELECT id, name, created_at, updated_at, color_tag, is_favorite, deleted_at, is_hidden FROM folders WHERE user_id = ? AND deleted_at IS NOT NULL" . $hidden_cond . " ORDER BY deleted_at DESC");
            $stmt->execute([$user_id]);
            $folders = $stmt->fetchAll();

            $stmt_files = $pdo->prepare("SELECT id, original_name as name, size, mime_type, created_at, updated_at, color_tag, encrypted_key, is_favorite, deleted_at, is_hidden, has_thumbnail FROM files WHERE user_id = ? AND deleted_at IS NOT NULL" . $hidden_cond . " ORDER BY deleted_at DESC");
            $stmt_files->execute([$user_id]);
            $files = $stmt_files->fetchAll();
            respondJson(['status' => 'success', 'folders' => $folders, 'files' => $files]);
        } 
        elseif ($view === 'favorites') {
            $stmt = $pdo->prepare("SELECT id, name, created_at, updated_at, color_tag, is_favorite, deleted_at, is_hidden FROM folders WHERE user_id = ? AND is_favorite = 1 AND deleted_at IS NULL" . $hidden_cond . " ORDER BY name ASC");
            $stmt->execute([$user_id]);
            $folders = $stmt->fetchAll();

            $stmt_files = $pdo->prepare("SELECT id, original_name as name, size, mime_type, created_at, updated_at, color_tag, encrypted_key, is_favorite, deleted_at, is_hidden, has_thumbnail FROM files WHERE user_id = ? AND is_favorite = 1 AND deleted_at IS NULL" . $hidden_cond . " ORDER BY name ASC");
            $stmt_files->execute([$user_id]);
            $files = $stmt_files->fetchAll();
            respondJson(['status' => 'success', 'folders' => $folders, 'files' => $files]);
        }
        elseif ($view === 'recent') {
            $stmt_files = $pdo->prepare("SELECT id, original_name as name, size, mime_type, created_at, updated_at, color_tag, encrypted_key, is_favorite, deleted_at, is_hidden, has_thumbnail FROM files WHERE user_id = ? AND deleted_at IS NULL" . $hidden_cond . " ORDER BY created_at DESC LIMIT 50");
            $stmt_files->execute([$user_id]);
            $files = $stmt_files->fetchAll();
            respondJson(['status' => 'success', 'folders' => [], 'files' => $files]);
        }
        elseif ($view === 'media') {
            $stmt_files = $pdo->prepare("SELECT id, original_name as name, size, mime_type, created_at, updated_at, color_tag, encrypted_key, is_favorite, deleted_at, is_hidden, has_thumbnail FROM files WHERE user_id = ? AND deleted_at IS NULL AND (mime_type LIKE 'image/%' OR mime_type LIKE 'video/%')" . $hidden_cond . " ORDER BY created_at DESC");
            $stmt_files->execute([$user_id]);
            $files = $stmt_files->fetchAll();
            respondJson(['status' => 'success', 'folders' => [], 'files' => $files]);
        }
        elseif ($view === 'shared') {
            $stmt_files = $pdo->prepare("SELECT id, original_name as name, size, mime_type, created_at, updated_at, color_tag, encrypted_key, is_favorite, deleted_at, is_hidden, has_thumbnail FROM files WHERE user_id = ? AND deleted_at IS NULL AND shared_link_token IS NOT NULL" . $hidden_cond . " ORDER BY created_at DESC");
            $stmt_files->execute([$user_id]);
            $files = $stmt_files->fetchAll();
            respondJson(['status' => 'success', 'folders' => [], 'files' => $files]);
        }
        else {
            if ($parent_id === null) {
                $stmt = $pdo->prepare("SELECT id, name, created_at, updated_at, color_tag, is_favorite, deleted_at, is_hidden FROM folders WHERE user_id = ? AND parent_id IS NULL AND deleted_at IS NULL" . $hidden_cond . " ORDER BY name ASC");
                $stmt->execute([$user_id]);
            } else {
                $stmt = $pdo->prepare("SELECT id, name, created_at, updated_at, color_tag, is_favorite, deleted_at, is_hidden FROM folders WHERE user_id = ? AND parent_id = ? AND deleted_at IS NULL" . $hidden_cond . " ORDER BY name ASC");
                $stmt->execute([$user_id, $parent_id]);
            }
            $folders = $stmt->fetchAll();

            if ($parent_id === null) {
                $stmt_files = $pdo->prepare("SELECT id, original_name as name, size, mime_type, created_at, updated_at, color_tag, encrypted_key, is_favorite, deleted_at, shared_link_token, is_hidden, has_thumbnail FROM files WHERE user_id = ? AND folder_id IS NULL AND deleted_at IS NULL" . $hidden_cond . " ORDER BY original_name ASC");
                $stmt_files->execute([$user_id]);
            } else {
                $stmt_files = $pdo->prepare("SELECT id, original_name as name, size, mime_type, created_at, updated_at, color_tag, encrypted_key, is_favorite, deleted_at, shared_link_token, is_hidden, has_thumbnail FROM files WHERE user_id = ? AND folder_id = ? AND deleted_at IS NULL" . $hidden_cond . " ORDER BY original_name ASC");
                $stmt_files->execute([$user_id, $parent_id]);
            }
            $files = $stmt_files->fetchAll();

            respondJson(['status' => 'success', 'folders' => $folders, 'files' => $files]);
        }
    } catch (PDOException $e) {
        respondJson(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()], 500);
    }
});

$router->get('list_all', function() use ($pdo, $user_id) {
    try {
        // Ajout de la définition de la variable manquante
        $show_hidden = isset($_GET['show_hidden']) && $_GET['show_hidden'] == '1';
        $hidden_cond = $show_hidden ? '' : ' AND is_hidden = 0';

        $stmt = $pdo->prepare("SELECT id, name, parent_id, is_hidden FROM folders WHERE user_id = ? AND deleted_at IS NULL" . $hidden_cond . " ORDER BY name ASC");
        $stmt->execute([$user_id]);
        $folders = $stmt->fetchAll();
        respondJson(['status' => 'success', 'folders' => $folders]);
    } catch (PDOException $e) {
        respondJson(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()], 500);
    }
});

$router->dispatch();
