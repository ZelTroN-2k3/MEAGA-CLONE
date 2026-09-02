<?php
// api/upload_avatar.php
require_once 'config.php';
$user_id = requireAuth();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respondJson(['status' => 'error', 'message' => 'Invalid method.'], 405);
}

if (!isset($_FILES['avatar']) || $_FILES['avatar']['error'] !== UPLOAD_ERR_OK) {
    respondJson(['status' => 'error', 'message' => 'Erreur lors du téléchargement du fichier.'], 400);
}

$file = $_FILES['avatar'];
$maxSize = 2 * 1024 * 1024; // 2 MB

if ($file['size'] > $maxSize) {
    respondJson(['status' => 'error', 'message' => 'L\'image dépasse la taille maximale autorisée de 2 Mo.'], 400);
}

$finfo = finfo_open(FILEINFO_MIME_TYPE);
$mime = finfo_file($finfo, $file['tmp_name']);
finfo_close($finfo);

$allowed_mimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
if (!in_array($mime, $allowed_mimes)) {
    respondJson(['status' => 'error', 'message' => 'Seules les images (JPG, PNG, GIF, WEBP) sont autorisées.'], 400);
}

$ext = pathinfo($file['name'], PATHINFO_EXTENSION);
if (!$ext) {
    if ($mime === 'image/jpeg') $ext = 'jpg';
    elseif ($mime === 'image/png') $ext = 'png';
    elseif ($mime === 'image/gif') $ext = 'gif';
    elseif ($mime === 'image/webp') $ext = 'webp';
}

$filename = 'avatar_' . $user_id . '_' . time() . '.' . strtolower($ext);
$upload_dir = __DIR__ . '/../uploads/avatars/';

if (!is_dir($upload_dir)) {
    mkdir($upload_dir, 0777, true);
}

$dest_path = $upload_dir . $filename;

if (move_uploaded_file($file['tmp_name'], $dest_path)) {
    // Supprimer l'ancien avatar si nécessaire (optionnel mais propre)
    $stmt = $pdo->prepare("SELECT avatar FROM users WHERE id = ?");
    $stmt->execute([$user_id]);
    $old = $stmt->fetchColumn();
    
    if ($old && file_exists(__DIR__ . '/../' . $old)) {
        unlink(__DIR__ . '/../' . $old);
    }
    
    $public_path = 'uploads/avatars/' . $filename;
    
    $stmt = $pdo->prepare("UPDATE users SET avatar = ? WHERE id = ?");
    if ($stmt->execute([$public_path, $user_id])) {
        respondJson(['status' => 'success', 'message' => 'Avatar mis à jour avec succès.', 'avatar_url' => $public_path]);
    } else {
        respondJson(['status' => 'error', 'message' => 'Erreur lors de la mise à jour de la base de données.'], 500);
    }
} else {
    respondJson(['status' => 'error', 'message' => 'Erreur lors de l\'enregistrement de l\'image.'], 500);
}
?>
