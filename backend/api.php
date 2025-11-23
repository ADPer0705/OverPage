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

// Load configuration
require_once 'config.php';

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    echo json_encode(['error' => 'Invalid input']);
    exit;
}

$action = $input['action'] ?? '';
$query = $input['query'] ?? '';
$content = $input['content'] ?? '';

// Basic validation
if (empty($query) || empty($content)) {
    echo json_encode(['reply' => 'Please provide both a question and page content.']);
    exit;
}

// 1. Preprocess Content (Truncate to avoid token limits)
// A rough estimate: 1 token ~= 4 chars. 
// Llama3-8b on Groq has a limit, let's keep it safe around 15,000 chars for now.
$maxChars = 15000;
$cleanContent = substr(strip_tags($content), 0, $maxChars);

// 2. Prepare the API Request
$apiKey = '';
$apiUrl = '';
$model = '';
$data = [];
$headers = ["Content-Type: application/json"];

if (AI_PROVIDER === 'google') {
    $apiKey = GOOGLE_API_KEY;
    $model = GOOGLE_MODEL;
    $apiUrl = "https://generativelanguage.googleapis.com/v1beta/models/$model:generateContent?key=$apiKey";
    
    // Google Gemini format
    $prompt = SYSTEM_PROMPT . "\n\nContext from webpage:\n" . $cleanContent . "\n\nUser Question: " . $query;
    $data = [
        "contents" => [
            [
                "parts" => [
                    ["text" => $prompt]
                ]
            ]
        ]
    ];
} else {
    // Fallback to error if not google
    echo json_encode(['reply' => "Error: Only Google AI Provider is supported in this version."]);
    exit;
}

// 3. Call the API
$response = null;
$httpCode = 0;
$curlError = null;

if (function_exists('curl_init')) {
    // Use cURL if available (Recommended)
    $ch = curl_init($apiUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);
} else {
    // Fallback: use file_get_contents if cURL is missing
    // Note: This requires 'allow_url_fopen = On' in php.ini
    $options = [
        'http' => [
            'header'  => implode("\r\n", $headers),
            'method'  => 'POST',
            'content' => json_encode($data),
            'ignore_errors' => true
        ]
    ];
    $context  = stream_context_create($options);
    $response = @file_get_contents($apiUrl, false, $context);
    
    if ($response === false) {
        $curlError = "file_get_contents failed. Enable php-curl or allow_url_fopen.";
    } else {
        // Extract HTTP code from headers
        if (isset($http_response_header)) {
            preg_match('#HTTP/\d\.\d (\d+)#', $http_response_header[0], $matches);
            $httpCode = intval($matches[1] ?? 0);
        }
    }
}

// 4. Handle Response
if ($curlError) {
    echo json_encode(['reply' => "Connection Error: $curlError"]);
    exit;
}

if ($httpCode !== 200) {
    $errorBody = json_decode($response, true);
    $errorMessage = $errorBody['error']['message'] ?? "API returned status $httpCode";
    echo json_encode(['reply' => "API Error: $errorMessage"]);
    exit;
}

$responseData = json_decode($response, true);
$aiReply = "No response generated.";

$aiReply = $responseData['candidates'][0]['content']['parts'][0]['text'] ?? "No response from Gemini.";

echo json_encode([
    'status' => 'success',
    'reply' => $aiReply
]);

