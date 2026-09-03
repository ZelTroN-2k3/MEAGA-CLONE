<?php
// cron_cleanup.php
// Script de nettoyage automatisé de la corbeille (fichiers > 30 jours)

// On inclut la connexion à la base de données
require_once __DIR__ . '/api/config.php';

// SÉCURITÉ : On empêche un visiteur de lancer ce script au hasard.
// Il ne peut être exécuté qu'en ligne de commande (cron) OU avec un jeton secret dans l'URL.
$secret_token = "nettoyage_mega_2026"; 
if (php_sapi_name() !== 'cli' && (!isset($_GET['token']) || $_GET['token'] !== $secret_token)) {
    die("Accès refusé.");
}

$days_to_keep = 30; // Nombre de jours avant suppression définitive
$deleted_files_count = 0;
$freed_space = 0;

try {
    // 1. Récupérer les fichiers dans la corbeille depuis plus de 30 jours
    $stmt = $pdo->prepare("SELECT id, user_id, stored_name, size FROM files WHERE deleted_at IS NOT NULL AND deleted_at < DATE_SUB(NOW(), INTERVAL ? DAY)");
    $stmt->execute([$days_to_keep]);
    $expired_files = $stmt->fetchAll();

    foreach ($expired_files as $file) {
        $file_path = __DIR__ . '/uploads/files/' . $file['stored_name'];
        $thumb_path = $file_path . '_thumb';
        
        // Suppression physique des fichiers sur le serveur
        if (file_exists($file_path)) {
            unlink($file_path);
        }
        if (file_exists($thumb_path)) {
            unlink($thumb_path);
        }
        
        // Suppression définitive dans la base de données
        $del_stmt = $pdo->prepare("DELETE FROM files WHERE id = ?");
        if ($del_stmt->execute([$file['id']])) {
            // Mise à jour (libération) du quota de l'utilisateur
            $update_stmt = $pdo->prepare("UPDATE users SET used_storage = GREATEST(0, used_storage - ?) WHERE id = ?");
            $update_stmt->execute([$file['size'], $file['user_id']]);
            
            $deleted_files_count++;
            $freed_space += $file['size'];
        }
    }

    // 2. Supprimer les dossiers dans la corbeille depuis plus de 30 jours
    // (Comme ils ne pèsent rien sur le disque, une simple requête SQL suffit)
    $stmt_folders = $pdo->prepare("DELETE FROM folders WHERE deleted_at IS NOT NULL AND deleted_at < DATE_SUB(NOW(), INTERVAL ? DAY)");
    $stmt_folders->execute([$days_to_keep]);
    $deleted_folders_count = $stmt_folders->rowCount();

    // Affichage du résumé
    echo "Nettoyage de la corbeille termine avec succes.\n";
    echo "Fichiers supprimes : $deleted_files_count\n";
    echo "Dossiers supprimes : $deleted_folders_count\n";
    echo "Espace libere : " . number_format($freed_space / 1048576, 2) . " Mo\n";

} catch (Exception $e) {
    echo "Erreur lors du nettoyage : " . $e->getMessage();
}
?>