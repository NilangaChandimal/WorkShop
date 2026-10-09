<?php

/**
 * Concurrency & Race Condition Verification Script
 *
 * Demonstrates pessimistic locking (`lockForUpdate`) effectiveness against MySQL.
 * Fires concurrent booking requests against the last remaining seat of a workshop.
 * Exactly 1 request succeeds (HTTP 201), all remaining requests receive HTTP 422 (capacity_exceeded).
 */

$base = $argv[1] ?? 'http://127.0.0.1:8000/api';

function call(string $method, string $url, ?string $token = null, array $body = []): array
{
    $ch = curl_init($url);
    $headers = ['Accept: application/json', 'Content-Type: application/json'];
    if ($token) {
        $headers[] = "Authorization: Bearer {$token}";
    }
    curl_setopt_array($ch, [
        CURLOPT_CUSTOMREQUEST => $method,
        CURLOPT_HTTPHEADER => $headers,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POSTFIELDS => $body ? json_encode($body) : null,
    ]);
    $res = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);

    return [$code, json_decode($res, true)];
}

function token(string $email, string $base): string
{
    [$code, $json] = call('POST', "$base/login", null, ['email' => $email, 'password' => 'password']);
    if ($code !== 200) {
        exit("login failed for $email: $code " . json_encode($json) . PHP_EOL);
    }

    return $json['token'];
}

echo "Testing API at: {$base}\n";
$admin = token('admin@workshop.test', $base);
$manager = token('manager@workshop.test', $base);
$staff = token('staff@workshop.test', $base);

echo "--- RBAC Sanity ---\n";
echo 'admin  GET /registrations      => ' . call('GET', "$base/registrations", $admin)[0] . " (expect 403)\n";
echo 'staff  GET /users              => ' . call('GET', "$base/users", $staff)[0] . " (expect 403)\n";
echo 'admin  GET /users              => ' . call('GET', "$base/users", $admin)[0] . " (expect 200)\n";
echo 'anon   GET /me                 => ' . call('GET', "$base/me")[0] . " (expect 401)\n";

// Create a test workshop with capacity = 1
[$wsCode, $wsJson] = call('POST', "$base/workshops", $manager, [
    'title' => 'Concurrency Challenge ' . time(),
    'starts_at' => date('Y-m-d H:i:s', strtotime('+3 days')),
    'ends_at' => date('Y-m-d H:i:s', strtotime('+3 days 2 hours')),
    'capacity' => 1,
    'status' => 'scheduled',
]);

if ($wsCode !== 201) {
    exit("Failed to create test workshop: {$wsCode} " . json_encode($wsJson) . PHP_EOL);
}

$workshopId = $wsJson['data']['id'];
echo "\nCreated workshop #{$workshopId} with capacity = 1\n";

echo "--- Firing 20 parallel bookings for the SINGLE available seat ---\n";
$mh = curl_multi_init();
$handles = [];
for ($i = 0; $i < 20; $i++) {
    $ch = curl_init("{$base}/workshops/{$workshopId}/registrations");
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            'Accept: application/json',
            'Content-Type: application/json',
            'Authorization: Bearer ' . $staff,
        ],
        CURLOPT_POSTFIELDS => json_encode([
            'attendee_name' => "Racer {$i}",
            'attendee_email' => "racer{$i}_" . time() . "@example.com",
        ]),
    ]);
    curl_multi_add_handle($mh, $ch);
    $handles[] = $ch;
}

do {
    curl_multi_exec($mh, $running);
    curl_multi_select($mh);
} while ($running > 0);

$tally = [];
foreach ($handles as $ch) {
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $json = json_decode(curl_multi_getcontent($ch), true);
    $key = $code . ' ' . ($json['error'] ?? 'success');
    $tally[$key] = ($tally[$key] ?? 0) + 1;
    curl_multi_remove_handle($mh, $ch);
}

print_r($tally);

[$wCheckCode, $wCheckJson] = call('GET', "$base/workshops/{$workshopId}", $staff);
echo "Final available seats: " . $wCheckJson['data']['available_seats'] . " (expect 0)\n";
echo "Active registrations count: " . $wCheckJson['data']['active_registrations_count'] . " (expect 1)\n";

if (($tally['201 success'] ?? 0) === 1 && $wCheckJson['data']['active_registrations_count'] === 1) {
    echo "\n>>> RACE TEST PASSED: Exactly 1 booking succeeded, zero overselling! <<<\n";
} else {
    echo "\n>>> RACE TEST FAILED: Concurrency anomaly detected! <<<\n";
}
