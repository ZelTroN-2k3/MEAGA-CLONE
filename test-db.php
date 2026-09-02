<?php
$db_host = 'localhost'; // On teste avec localhost
$db_name = 'anpa3906_mega-clone';
$db_user = 'anpa3906_o2switch';
$db_pass = 'Vku8-Ly76-svs)'; // Attention aux guillemets simples ici !

try {
    $bdd = new PDO("mysql:host=$db_host;dbname=$db_name;charset=utf8", $db_user, $db_pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);
    echo "✅ Connexion réussie avec localhost !";
} catch (Exception $e) {
    die('❌ Erreur de connexion SQL : ' . $e->getMessage());
}
?>