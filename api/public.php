<?php
require_once 'config.php';
require_once 'Router.php';

header('Content-Type: application/json');

$router = new Router();

$router->get('footer', function() use ($pdo) {
    try {
        $stmt = $pdo->query("SELECT setting_key, setting_value FROM settings WHERE setting_key LIKE 'footer_%'");
        $settings = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $settings[$row['setting_key']] = $row['setting_value'];
        }
        
        // Defaults if not set
        $defaults = [
            'footer_desc' => 'La plateforme de stockage en ligne la plus sécurisée. Vos données sont chiffrées de bout en bout et vous seul y avez accès.',
            'footer_twitter' => '#',
            'footer_facebook' => '#',
            'footer_github' => '#',
            'footer_instagram' => '#',
            'footer_copyright' => '&copy; 2026 Mega Clone. Tous droits réservés.',
            'footer_col_legal' => '[{"text":"Conditions générales","url":"#"},{"text":"Politique de confidentialité","url":"#"},{"text":"Politique de retrait (Takedown)","url":"#"},{"text":"Mentions légales","url":"#"}]',
            'footer_col_support' => '[{"text":"Centre d\'aide","url":"#"},{"text":"Nous contacter","url":"#"},{"text":"Signaler un bug","url":"#"},{"text":"Administration","url":"admin.html"}]'
        ];

        foreach ($defaults as $key => $val) {
            if (!isset($settings[$key])) {
                $settings[$key] = $val;
            }
        }

        echo json_encode([
            'status' => 'success',
            'data' => $settings
        ]);
    } catch (Exception $e) {
        echo json_encode(['status' => 'error', 'message' => 'Erreur BDD']);
    }
});

$router->dispatch();
