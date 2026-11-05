<?php
/**
 * AiR · GEO landing — обработчик форм → Битрикс24 (crm.lead.add)
 *
 * Настройка: создайте в Битрикс24 входящий вебхук
 *   Разработчикам → Другое → Входящий вебхук → права: CRM (crm)
 * и вставьте его URL в config.php (см. config.example.php).
 */

header('Content-Type: application/json; charset=utf-8');

function respond($ok, $error = '') {
    echo json_encode(['ok' => $ok, 'error' => $error], JSON_UNESCAPED_UNICODE);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    respond(false, 'method');
}

$config = file_exists(__DIR__ . '/config.php') ? require __DIR__ . '/config.php' : [];
$webhook = rtrim($config['b24_webhook'] ?? '', '/');
if (!$webhook) {
    http_response_code(500);
    respond(false, 'config');
}

// Honeypot: боты заполняют скрытое поле
if (!empty($_POST['company_fax'])) {
    respond(true);
}

function field($key, $max = 255) {
    $v = trim((string)($_POST[$key] ?? ''));
    $v = strip_tags($v);
    return mb_substr($v, 0, $max);
}

$phoneRaw = field('phone', 40);
$digits = preg_replace('/\D/', '', $phoneRaw);
if (strlen($digits) !== 11) {
    http_response_code(422);
    respond(false, 'phone');
}
if (empty($_POST['consent'])) {
    http_response_code(422);
    respond(false, 'consent');
}

$form       = field('form', 20) === 'audit' ? 'audit' : 'lead';
$name       = field('name', 100);
$site       = field('site', 200);
$plan       = field('plan', 100);
$contactVia = field('contact_via', 30);
$formTitle  = $form === 'audit' ? 'Бесплатный AI-срез' : 'Заявка на GEO-продвижение';

$comments = implode("<br>", array_filter([
    'Форма: ' . $formTitle,
    $site ? 'Сайт / компания: ' . htmlspecialchars($site) : '',
    $plan ? 'Тариф: ' . htmlspecialchars($plan) : '',
    $contactVia ? 'Предпочтительная связь: ' . htmlspecialchars($contactVia) : '',
    'Страница: ' . htmlspecialchars(field('page', 500)),
    field('referrer', 500) ? 'Реферер: ' . htmlspecialchars(field('referrer', 500)) : '',
    field('ym_client_id', 40) ? 'Метрика ClientID: ' . htmlspecialchars(field('ym_client_id', 40)) : '',
    field('yclid', 60) ? 'yclid: ' . htmlspecialchars(field('yclid', 60)) : '',
]));

$fields = [
    'TITLE'          => 'GEO-лендинг: ' . $formTitle . ($site ? ' — ' . $site : ''),
    'NAME'           => $name ?: 'Без имени',
    'PHONE'          => [['VALUE' => '+' . $digits, 'VALUE_TYPE' => 'WORK']],
    'SOURCE_ID'      => $config['b24_source_id'] ?? 'WEB',
    'SOURCE_DESCRIPTION' => 'Лендинг GEO-продвижения',
    'COMMENTS'       => $comments,
    'UTM_SOURCE'     => field('utm_source'),
    'UTM_MEDIUM'     => field('utm_medium'),
    'UTM_CAMPAIGN'   => field('utm_campaign'),
    'UTM_CONTENT'    => field('utm_content'),
    'UTM_TERM'       => field('utm_term'),
];
if ($site && preg_match('/[a-zа-я0-9-]+\.[a-zа-я]{2,}/iu', $site)) {
    $fields['WEB'] = [['VALUE' => $site, 'VALUE_TYPE' => 'WORK']];
}
if (!empty($config['b24_assigned_by_id'])) {
    $fields['ASSIGNED_BY_ID'] = (int)$config['b24_assigned_by_id'];
}

$ch = curl_init($webhook . '/crm.lead.add.json');
curl_setopt_array($ch, [
    CURLOPT_POST           => true,
    CURLOPT_POSTFIELDS     => http_build_query(['fields' => $fields, 'params' => ['REGISTER_SONET_EVENT' => 'Y']]),
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT        => 15,
]);
$resp = curl_exec($ch);
$code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

$data = json_decode((string)$resp, true);
if ($code === 200 && !empty($data['result'])) {
    respond(true);
}

// Резерв: если Битрикс24 недоступен — письмо в отдел продаж, чтобы заявка не потерялась
if (!empty($config['fallback_email'])) {
    $body = strip_tags(str_replace('<br>', "\n", $comments)) . "\nИмя: $name\nТелефон: +$digits";
    @mail($config['fallback_email'], '=?UTF-8?B?' . base64_encode('[GEO-лендинг] ' . $formTitle) . '?=', $body,
        "Content-Type: text/plain; charset=utf-8\r\n");
    respond(true);
}

http_response_code(502);
respond(false, 'b24');
