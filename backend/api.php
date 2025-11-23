<?php
// Allow CORS from any origin (for development)
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Handle preflight request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

header('Content-Type: application/json');

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    echo json_encode(['error' => 'Invalid input']);
    exit;
}

$action = $input['action'] ?? '';
$query = $input['query'] ?? '';
$content = $input['content'] ?? '';

// Mock AI Response Logic
// In the future, this is where you'd call OpenAI/Groq API
$response = "I received your question: '$query'. \n\n";
$response .= "I also have the page content (length: " . strlen($content) . " chars). \n";
$response .= "Since I am just a prototype backend, I can't analyze it yet, but the connection works!";

echo json_encode([
    'status' => 'success',
    'reply' => $response
]);
