<?php
// api/actions.php
require_once 'config.php';
require_once 'Router.php';

$user_id = requireAuth();
$router = new Router();

$router->post('empty_trash', function($data) use ($pdo, $user_id) {
    // Physical hard delete for all items in trash
    // First files
    $stmt = $pdo->prepare("SELECT id, stored_name, size FROM files WHERE user_id = ? AND deleted_at IS NOT NULL");
    $stmt->execute([$user_id]);
    $files = $stmt->fetchAll();
    
    $size_freed = 0;
    foreach ($files as $file) {
        $file_path = __DIR__ . '/../uploads/files/' . $file['stored_name'];
        if (file_exists($file_path)) unlink($file_path);
        
        $thumb_path = $file_path . '_thumb';
        if (file_exists($thumb_path)) unlink($thumb_path);
        
        $size_freed += $file['size'];
    }
    
    $pdo->beginTransaction();
    try {
        $stmt = $pdo->prepare("DELETE FROM files WHERE user_id = ? AND deleted_at IS NOT NULL");
        $stmt->execute([$user_id]);
        
        $stmt = $pdo->prepare("DELETE FROM folders WHERE user_id = ? AND deleted_at IS NOT NULL");
        $stmt->execute([$user_id]);
        
        if ($size_freed > 0) {
            $stmt_update = $pdo->prepare("UPDATE users SET used_storage = GREATEST(0, used_storage - ?) WHERE id = ?");
            $stmt_update->execute([$size_freed, $user_id]);
        }
        $pdo->commit();
        respondJson(['status' => 'success', 'message' => 'Corbeille vidée.']);
    } catch (Exception $e) {
        $pdo->rollBack();
        respondJson(['status' => 'error', 'message' => 'Erreur: ' . $e->getMessage()], 500);
    }
});

// Helper for multiple targets validation
function getTargets($data) {
    if (isset($data['targets']) && is_array($data['targets'])) {
        return $data['targets'];
    }
    $type = $data['type'] ?? '';
    $id = isset($data['id']) ? (int)$data['id'] : 0;
    if ($id > 0 && in_array($type, ['file', 'folder'])) {
        return [['id' => $id, 'type' => $type]];
    }
    return [];
}

$router->post('toggle_favorite', function($data) use ($pdo, $user_id) {
    $targets = getTargets($data);
    if (empty($targets)) respondJson(['status' => 'error', 'message' => 'Invalid parameters.'], 400);
    
    foreach ($targets as $t) {
        $table = $t['type'] === 'file' ? 'files' : 'folders';
        $stmt = $pdo->prepare("UPDATE $table SET is_favorite = NOT is_favorite WHERE id = ? AND user_id = ?");
        $stmt->execute([(int)$t['id'], $user_id]);
    }
    respondJson(['status' => 'success', 'message' => 'Favori mis à jour.']);
});

$router->post('toggle_hidden', function($data) use ($pdo, $user_id) {
    // Verify user is PRO
    $stmt_plan = $pdo->prepare("SELECT plan_type FROM users WHERE id = ?");
    $stmt_plan->execute([$user_id]);
    $user_data = $stmt_plan->fetch();
    if (!$user_data || $user_data['plan_type'] === 'free') {
        respondJson(['status' => 'error', 'message' => 'Cette fonctionnalité requiert un compte PRO.'], 403);
    }

    $targets = getTargets($data);
    if (empty($targets)) respondJson(['status' => 'error', 'message' => 'Invalid parameters.'], 400);
    
    foreach ($targets as $t) {
        $table = $t['type'] === 'file' ? 'files' : 'folders';
        $stmt = $pdo->prepare("UPDATE $table SET is_hidden = NOT is_hidden WHERE id = ? AND user_id = ?");
        $stmt->execute([(int)$t['id'], $user_id]);
    }
    respondJson(['status' => 'success', 'message' => 'Visibilité mise à jour.']);
});

$router->post('trash', function($data) use ($pdo, $user_id) {
    $targets = getTargets($data);
    if (empty($targets)) respondJson(['status' => 'error', 'message' => 'Invalid parameters.'], 400);
    
    foreach ($targets as $t) {
        $table = $t['type'] === 'file' ? 'files' : 'folders';
        $stmt = $pdo->prepare("UPDATE $table SET deleted_at = NOW() WHERE id = ? AND user_id = ?");
        $stmt->execute([(int)$t['id'], $user_id]);
    }
    respondJson(['status' => 'success', 'message' => 'Placé dans la corbeille.']);
});

$router->post('restore', function($data) use ($pdo, $user_id) {
    $targets = getTargets($data);
    if (empty($targets)) respondJson(['status' => 'error', 'message' => 'Invalid parameters.'], 400);
    
    foreach ($targets as $t) {
        $table = $t['type'] === 'file' ? 'files' : 'folders';
        $stmt = $pdo->prepare("UPDATE $table SET deleted_at = NULL WHERE id = ? AND user_id = ?");
        $stmt->execute([(int)$t['id'], $user_id]);
    }
    respondJson(['status' => 'success', 'message' => 'Élément(s) restauré(s).']);
});

$router->post('set_color_tag', function($data) use ($pdo, $user_id) {
    $targets = getTargets($data);
    $color = $data['color_tag'] ?? null;
    if (empty($targets)) respondJson(['status' => 'error', 'message' => 'Invalid parameters.'], 400);
    
    foreach ($targets as $t) {
        $table = $t['type'] === 'file' ? 'files' : 'folders';
        $stmt = $pdo->prepare("UPDATE $table SET color_tag = ? WHERE id = ? AND user_id = ?");
        $stmt->execute([$color, (int)$t['id'], $user_id]);
    }
    respondJson(['status' => 'success', 'message' => 'Étiquette(s) mise(s) à jour.']);
});

$router->dispatch();
