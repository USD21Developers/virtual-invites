<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// Allowed API prefixes
$allowedPrefixes = [
    "https://api.usd21.org/",
    "https://localhost:4000/"
];

// Get the requested target URL
$targetUrl = $_POST['url'] ?? '';

if (!$targetUrl) {
    http_response_code(400);
    echo json_encode(["error" => "No target URL provided"]);
    exit;
}

// Ensure the target URL starts with an allowed prefix
$isValid = false;
foreach ($allowedPrefixes as $prefix) {
    if (strpos($targetUrl, $prefix) === 0) {
        $isValid = true;
        break;
    }
}

if (!$isValid) {
    http_response_code(403);
    echo json_encode(["error" => "Invalid target URL"]);
    exit;
}

// Forward headers
$headers = [];
foreach (getallheaders() as $name => $value) {
    $headers[] = "$name: $value";
}

// Forward body
$body = file_get_contents("php://input");

// cURL request to API server
$ch = curl_init($targetUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);

// Execute request
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$contentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
curl_close($ch);

// Relay the API response
header("Content-Type: " . ($contentType ?: "application/json"));
http_response_code($httpCode);
echo $response;
?>
