<?php
require 'db.php';
$db = getDB();

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Please sign in first']);
    exit;
}
$userId = $_SESSION['user_id'];
$data = body();

$paymentMethod = $data['payment_method'] ?? 'COD';
$address = $data['address'] ?? '';
$city    = $data['city'] ?? '';
$pincode = $data['pincode'] ?? '';
$phone   = $data['phone'] ?? '';

$stmt = $db->prepare(
    'SELECT c.product_id, c.quantity, p.price
     FROM cart c JOIN products p ON p.id = c.product_id
     WHERE c.user_id = ?'
);
$stmt->execute([$userId]);
$items = $stmt->fetchAll();

if (!$items) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Your cart is empty']);
    exit;
}

$total = 0;
foreach ($items as $item) { $total += $item['price'] * $item['quantity']; }

$db->beginTransaction();
try {
    $stmt = $db->prepare(
        'INSERT INTO orders (user_id, total_amount, payment_method, address, city, pincode, phone)
         VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    $stmt->execute([$userId, $total, $paymentMethod, $address, $city, $pincode, $phone]);
    $orderId = $db->lastInsertId();

    $stmt = $db->prepare(
        'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)'
    );
    foreach ($items as $item) {
        $stmt->execute([$orderId, $item['product_id'], $item['quantity'], $item['price']]);
    }

    $db->prepare('DELETE FROM cart WHERE user_id = ?')->execute([$userId]);
    $db->commit();

    echo json_encode(['success' => true, 'order_id' => $orderId, 'total' => $total]);
} catch (Exception $e) {
    $db->rollBack();
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Could not place order']);
}
