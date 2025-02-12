<?php
header("Access-Control-Allow-Origin: https://invites.mobi");  // ✅ Restrict to your frontend domain
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");  // ✅ Support GET for token-based logins
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Vary: Origin");  // ✅ Helps prevent caching issues

// ✅ Handle OPTIONS requests (preflight)
if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(204);
    exit;
}

// ✅ Define allowed API prefixes
$allowedPrefixes = [
    "https://api.usd21.org/",
    "https://localhost:4000/"
];

// ✅ Get target URL from query string
$targetUrl = $_GET['target'] ?? '';
if (!$targetUrl) {
    http_response_code(400);
    echo json_encode(["error" => "No target URL provided"]);
    exit;
}

// ✅ More Secure URL Validation
$isValid = false;
$parsedUrl = parse_url($targetUrl);
if ($parsedUrl && isset($parsedUrl['scheme']) && isset($parsedUrl['host'])) {
    foreach ($allowedPrefixes as $prefix) {
        if (strpos($targetUrl, $prefix) === 0) {
            $isValid = true;
            break;
        }
    }
}

if (!$isValid) {
    http_response_code(403);
    echo json_encode(["error" => "Invalid target URL"]);
    exit;
}

// ✅ Forward headers, excluding problematic ones
$headers = [];
$excludedHeaders = ["Host", "Content-Length"];

foreach (getallheaders() as $name => $value) {
    if (!in_array($name, $excludedHeaders)) {
        $headers[] = "$name: $value";
    }
}

// ✅ Forward body (for POST requests)
$body = file_get_contents("php://input");

// ✅ Handle GET & POST requests properly
$ch = curl_init($targetUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
} elseif ($_SERVER["REQUEST_METHOD"] === "GET") {
    curl_setopt($ch, CURLOPT_HTTPGET, true);
}

// ✅ Execute request
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$contentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
curl_close($ch);

// ✅ Relay API response
header("Content-Type: " . ($contentType ?: "application/json"));
http_response_code($httpCode);
echo $response;
?>
