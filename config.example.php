<?php
// Скопируйте этот файл в config.php и заполните. config.php не публикуйте в репозитории.
return [
    // Входящий вебхук Битрикс24 с правом «CRM», например:
    // https://corp-airws.ru/rest/1/xxxxxxxxxxxxxxxx/
    'b24_webhook'        => '',

    // Источник лида (ID из справочника «Источники» в CRM). WEB = «Веб-сайт»
    'b24_source_id'      => 'WEB',

    // ID ответственного менеджера (необязательно)
    'b24_assigned_by_id' => 0,

    // Резервный email, если Битрикс24 не ответил
    'fallback_email'     => 'sale@airws.ru',
];
