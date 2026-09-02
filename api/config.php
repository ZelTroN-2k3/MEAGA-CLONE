<?php
// api/config.php
session_start();

$env_file = __DIR__ . '/../.env';

if (!file_exists($env_file)) {
    // Si appelé depuis une API, renvoyer une erreur d'installation
    if (strpos($_SERVER['REQUEST_URI'], '/api/') !== false) {
        header('Content-Type: application/json');
        die(json_encode(['status' => 'error', 'message' => 'System not installed. Please run install.php']));
    }
} else {
    $env = parse_ini_file($env_file);
    $db_host = $env['DB_HOST'] ?? 'localhost';
    $db_name = $env['DB_NAME'] ?? '';
    $db_user = $env['DB_USER'] ?? 'root';
    $db_pass = $env['DB_PASS'] ?? '';

    try {
        $pdo = new PDO("mysql:host=$db_host;dbname=$db_name;charset=utf8mb4", $db_user, $db_pass);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        if (strpos($_SERVER['REQUEST_URI'], '/api/') !== false) {
            header('Content-Type: application/json');
            die(json_encode(['status' => 'error', 'message' => 'Database connection failed.']));
        } else {
            die("Database connection failed.");
        }
    }
}

function respondJson($data, $statusCode = 200) {
    http_response_code($statusCode);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
}

function requireAuth() {
    if (!isset($_SESSION['user_id'])) {
        respondJson(['status' => 'error', 'message' => __('unauthorized')], 401);
    }
    return $_SESSION['user_id'];
}

function __($key) {
    global $lang_data;
    if (!isset($lang_data)) {
        $lang = $_COOKIE['mega_clone_lang'] ?? 'fr';
        $allowed = ['fr', 'en', 'es', 'de'];
        if (!in_array($lang, $allowed)) $lang = 'fr';
        $lang_file = __DIR__ . '/lang/' . $lang . '.php';
        if (file_exists($lang_file)) {
            $lang_data = require $lang_file;
        } else {
            $lang_data = [];
        }
    }
    return $lang_data[$key] ?? $key;
}
?>
