<?php
declare(strict_types=1);

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception as MailException;

header('Content-Type: application/json');

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
    exit;
}

$config = require __DIR__ . '/contact-config.php';

if (empty($config['smtp_user']) || empty($config['smtp_pass'])) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Mail is not configured yet']);
    exit;
}

$raw = file_get_contents('php://input');
$data = json_decode($raw !== false ? $raw : '', true);
if (!is_array($data)) {
    $data = $_POST;
}

$field = static function (array $data, string $key, int $max): string {
    $v = $data[$key] ?? '';
    if (!is_string($v)) {
        return '';
    }
    $v = trim($v);
    return function_exists('mb_substr') ? mb_substr($v, 0, $max) : substr($v, 0, $max);
};

$name = $field($data, 'name', 120);
$phone = $field($data, 'phone', 40);
$email = $field($data, 'email', 160);
$subject = $field($data, 'subject', 120);
$message = $field($data, 'message', 4000);
if ($subject === '') {
    $subject = 'Visit enquiry';
}

if ($name === '' || $message === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Missing or invalid fields']);
    exit;
}

require __DIR__ . '/lib/Exception.php';
require __DIR__ . '/lib/PHPMailer.php';
require __DIR__ . '/lib/SMTP.php';

$send = static function (bool $relaxTls) use ($config, $name, $phone, $email, $subject, $message): void {
    $mail = new PHPMailer(true);
    $mail->isSMTP();
    $mail->Host = (string) $config['smtp_host'];
    $mail->SMTPAuth = true;
    $mail->Username = (string) $config['smtp_user'];
    $mail->Password = (string) $config['smtp_pass'];
    $mail->SMTPSecure = (string) $config['smtp_secure'];
    $mail->Port = (int) $config['smtp_port'];
    if ($relaxTls) {
        $mail->SMTPOptions = [
            'ssl' => [
                'verify_peer' => false,
                'verify_peer_name' => false,
                'allow_self_signed' => true,
            ],
        ];
    }
    $mail->CharSet = 'UTF-8';
    $mail->setFrom((string) $config['smtp_user'], (string) $config['from_name']);
    $mail->addAddress((string) $config['to_email']);
    $mail->addReplyTo($email, $name);
    $mail->Subject = 'Website enquiry - ' . $subject;
    $mail->Body =
        "New enquiry from the Bodhisattva exhibition website\n\n" .
        "Name: {$name}\n" .
        'Phone: ' . ($phone !== '' ? $phone : 'Not provided') . "\n" .
        "Email: {$email}\n" .
        "Subject: {$subject}\n\n" .
        "Message:\n{$message}\n";
    $mail->send();
};

try {
    try {
        $send(false);
    } catch (MailException $e) {
        $send(true);
    }
    echo json_encode(['ok' => true]);
} catch (Throwable $e) {
    error_log('contact.php send failed: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Could not send']);
}
