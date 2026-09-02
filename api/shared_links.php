<?php
// api/shared_links.php
require_once 'config.php';
require_once 'Router.php';
$user_id = requireAuth();

$router = new Router();

$router->get('list', function() use ($pdo, $user_id) {
    // Get all files with a shared link
    $stmt = $pdo->prepare("SELECT id, original_name as name, size, mime_type as type, created_at, shared_link_token, 'file' as item_type, folder_id FROM files WHERE user_id = ? AND shared_link_token IS NOT NULL AND deleted_at IS NULL");
    $stmt->execute([$user_id]);
    $files = $stmt->fetchAll();

    // Get all folders with a shared link
    $stmt = $pdo->prepare("SELECT id, name, 0 as size, 'folder' as type, created_at, shared_link_token, 'folder' as item_type, parent_id as folder_id FROM folders WHERE user_id = ? AND shared_link_token IS NOT NULL AND deleted_at IS NULL");
    $stmt->execute([$user_id]);
    $folders = $stmt->fetchAll();
    
    $items = array_merge($files, $folders);
    
    usort($items, function($a, $b) {
        return strtotime($b['created_at']) - strtotime($a['created_at']);
    });

    foreach ($items as &$item) {
        if (!empty($item['folder_id'])) {
            $stmt = $pdo->prepare("SELECT name FROM folders WHERE id = ?");
            $stmt->execute([$item['folder_id']]);
            $parent = $stmt->fetch();
            $item['location'] = $parent ? $parent['name'] : 'Disque Cloud';
        } else {
            $item['location'] = 'Disque Cloud';
        }
    }

    respondJson(['status' => 'success', 'links' => $items]);
});

if (empty($_GET['action'])) $_GET['action'] = 'list';
$router->dispatch();
