<?php
// api/upgrade.php
require_once 'config.php';

// Verification PayPal Factice / Demo
// Dans un environnement de production, vous utiliseriez cURL pour appeler l'API de PayPal
// et vérifier que data.orderID a bien été payé avec le montant correct.
// Pour cette démo, nous acceptons l'upgrade si l'utilisateur est connecté et fournit un orderID.

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respondJson(['status' => 'error', 'message' => 'Invalid request method.'], 405);
}

if (!isset($_SESSION['user_id'])) {
    respondJson(['status' => 'error', 'message' => 'Non autorisé. Veuillez vous connecter.'], 401);
}

$data = json_decode(file_get_contents('php://input'), true) ?? $_POST;
$orderID = $data['orderID'] ?? '';
$planType = $data['planType'] ?? '';

if (empty($orderID) || empty($planType)) {
    respondJson(['status' => 'error', 'message' => 'Paramètres manquants.'], 400);
}

if (!in_array($planType, ['pro1', 'pro2'])) {
    respondJson(['status' => 'error', 'message' => 'Type de forfait invalide.'], 400);
}

// Validation du paiement (MOCK / SIMULATION)
// On simule une validation réussie de PayPal.
$payment_valid = true;

if ($payment_valid) {
    // Calcul du nouveau stockage
    // PRO I = 2 To = 2147483648000 octets
    // PRO II = 8 To = 8589934592000 octets
    $new_storage = ($planType === 'pro1') ? 2147483648000 : 8589934592000;
    
    $stmt = $pdo->prepare("UPDATE users SET plan_type = ?, total_storage = ? WHERE id = ?");
    if ($stmt->execute([$planType, $new_storage, $_SESSION['user_id']])) {
        // Mettre à jour la session
        $_SESSION['plan_type'] = $planType;
        
        respondJson([
            'status' => 'success', 
            'message' => 'Compte surclassé avec succès.',
            'new_plan' => $planType
        ]);
    } else {
        respondJson(['status' => 'error', 'message' => 'Erreur lors de la mise à jour de la base de données.'], 500);
    }
} else {
    respondJson(['status' => 'error', 'message' => 'Paiement invalide ou non vérifié.'], 400);
}
?>
