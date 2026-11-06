/* AiR · GEO вариант B — квиз «Нужен ли вашему бизнесу GEO?» */
(function () {
  'use strict';
  var root = document.querySelector('[data-quiz]');
  if (!root) return;

  var goal = window.airGoal || function () {};

  // weight: насколько ответ говорит о том, что GEO нужен (0–2)
  var Q = [
    { q: 'Клиенты выбирают вас, сравнивая несколько компаний?',
      a: [['Да, почти всегда сравнивают', 2], ['Иногда', 1], ['Нет, у нас нет конкурентов', 0]] },
    { q: 'Если спросить Алису AI или ChatGPT о вашей услуге в вашем городе, они назовут вас?',
      a: [['Нет, называют других', 2], ['Не знаю, не проверял', 2], ['Да, называют', 0]] },
    { q: 'У конкурентов больше отзывов, статей и упоминаний в рейтингах?',
      a: [['Да, заметно больше', 2], ['Примерно одинаково', 1], ['Нет, у нас больше', 0]] },
    { q: 'Насколько на сайте раскрыты цены, сроки, гарантии и ответы на вопросы клиентов?',
      a: [['Почти нет, только общие слова', 2], ['Частично', 1], ['Всё подробно расписано', 0]] }
  ];

  var R = {
    high: { badge: 'Высокая потребность', cls: 'high',
      title: 'Нейросети, скорее всего, советуют ваших конкурентов',
      text: 'Клиенты сравнивают, а у ИИ мало фактов о вас. Начните с бесплатного AI-среза: увидите, по каким запросам вас нет и кого называют вместо вас.' },
    mid: { badge: 'Есть точки роста', cls: 'mid',
      title: 'Вы теряете часть клиентов в ответах нейросетей',
      text: 'Базу можно быстро усилить: дописать факты на сайте и добрать внешние упоминания. AI-срез покажет, с чего начать.' },
    low: { badge: 'Хорошая база', cls: 'low',
      title: 'У вас хорошие позиции, их важно удержать',
      text: 'Конкуренты тоже начинают заниматься GEO. Бесплатный AI-срез покажет, где вас уже называют и где можно занять первое место.' }
  };

  var bar = root.querySelector('.quiz__progress span');
  var count = root.querySelector('.quiz__count');
  var body = root.querySelector('.quiz__body');
  var qEl = root.querySelector('.quiz__q');
  var opts = root.querySelector('.quiz__opts');
  var result = root.querySelector('.quiz__result');
  var back = root.querySelector('[data-quiz-back]');
  var answers = [];
  var started = false;

  function render() {
    var i = answers.length;
    bar.style.setProperty('--p', i / Q.length);
    back.hidden = i === 0 || i >= Q.length;
    if (i >= Q.length) return finish();
    body.hidden = false; result.hidden = true;
    count.textContent = 'Вопрос ' + (i + 1) + ' из ' + Q.length;
    qEl.textContent = Q[i].q;
    opts.setAttribute('aria-label', Q[i].q);
    opts.innerHTML = '';
    Q[i].a.forEach(function (a, n) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'quiz__opt';
      b.textContent = a[0];
      b.addEventListener('click', function () {
        if (!started) { started = true; goal('quiz_start'); }
        answers.push(n);
        render();
        var first = opts.querySelector('button');
        if (first && answers.length < Q.length) first.focus({ preventScroll: true });
      });
      opts.appendChild(b);
    });
  }

  function finish() {
    var score = answers.reduce(function (s, n, i) { return s + Q[i].a[n][1]; }, 0); // 0..8
    var key = score >= 6 ? 'high' : score >= 3 ? 'mid' : 'low';
    var r = R[key];
    body.hidden = true; result.hidden = false;
    count.textContent = 'Готово';
    var badge = result.querySelector('.quiz__badge');
    badge.textContent = r.badge;
    badge.className = 'quiz__badge quiz__badge--' + r.cls;
    result.querySelector('.quiz__title').textContent = r.title;
    result.querySelector('.quiz__text').textContent = r.text;
    // результат квиза уходит в лид вместе с формой AI-среза
    var hidden = document.querySelector('[data-form="audit"] input[name="quiz"]');
    if (hidden) hidden.value = r.badge + ' (' + score + '/8): ' + answers.map(function (n, i) { return Q[i].a[n][0]; }).join('; ');
    goal('quiz_done', { result: key });
    result.querySelector('.quiz__title').setAttribute('tabindex', '-1');
    result.querySelector('.quiz__title').focus({ preventScroll: true });
  }

  back.addEventListener('click', function () { answers.pop(); render(); });
  root.querySelector('[data-quiz-restart]').addEventListener('click', function () { answers = []; render(); });
  // CTA из результата: прокрутить к форме и сразу поставить курсор в первое поле
  root.querySelector('[data-quiz-cta]').addEventListener('click', function (e) {
    var input = document.querySelector('[data-form="audit"] input[name="site"]');
    if (!input) return;
    e.preventDefault();
    document.getElementById('audit').scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(function () { input.focus({ preventScroll: true }); }, 500);
  });

  render();
})();
