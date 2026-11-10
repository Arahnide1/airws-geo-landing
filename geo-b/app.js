/* AiR · GEO вариант B: ответ нейросети на первом экране + квиз-диалог */
(function () {
  'use strict';
  var goal = window.airGoal || function () {};
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ================= Ответ нейросети ================= */
  var NICHES = [
    { ai: 'Алиса AI', q: 'Кому доверить установку окон в Новосибирске?',
      a: ['Чаще всего советуют ', 'вашу компанию', ': 4,9 на Яндекс Картах, замер в день обращения и гарантия 5 лет.'],
      src: ['vash-site.ru', 'yandex.ru/maps'] },
    { ai: 'ChatGPT', q: 'Где в Екатеринбурге поставить имплант без долгого ожидания?',
      a: ['Пациенты хорошо отзываются о ', 'вашей клинике', ': цены на имплантацию указаны на сайте, приём в день обращения, рейтинг 4,9.'],
      src: ['vasha-klinika.ru', 'prodoctorov.ru'] },
    { ai: 'Google AI', q: 'Какой завод металлоконструкций работает с тендерами?',
      a: ['Для тендеров обычно выбирают ', 'вашу компанию', ': собственное производство, сертификаты ISO и опыт госзаказов.'],
      src: ['vash-zavod.ru', 'b2b-center.ru'] }
  ];

  var stage = document.querySelector('[data-stage]');
  if (stage) {
    var aiEl = stage.querySelector('[data-stage-ai]');
    var qEl = stage.querySelector('[data-stage-q]');
    var aEl = stage.querySelector('[data-stage-a]');
    var srcEl = stage.querySelector('[data-stage-src]');
    var btns = stage.querySelectorAll('[data-niche]');
    var timer = null;

    function tokens(str) { return str.match(/\S+\s*/g) || []; }

    function play(i, instant) {
      clearTimeout(timer);
      var n = NICHES[i];
      btns.forEach(function (b, k) { b.setAttribute('aria-pressed', k === i ? 'true' : 'false'); });
      aiEl.textContent = n.ai;
      qEl.textContent = n.q;
      srcEl.innerHTML = '';
      n.src.forEach(function (s) { var li = document.createElement('li'); li.textContent = s; srcEl.appendChild(li); });

      aEl.textContent = '';
      var before = document.createTextNode('');
      var mark = document.createElement('mark');
      var markText = document.createTextNode('');
      var sup = document.createElement('sup'); sup.textContent = '1';
      var after = document.createTextNode('');
      var cursor = document.createElement('span'); cursor.className = 'cursor'; cursor.setAttribute('aria-hidden', 'true');
      aEl.appendChild(before);

      if (instant || reduce) {
        before.data = n.a[0]; markText.data = n.a[1]; after.data = n.a[2];
        mark.appendChild(markText); mark.appendChild(sup);
        aEl.appendChild(mark); aEl.appendChild(after);
        mark.classList.add('is-on');
        stage.classList.remove('is-typing');
        return;
      }

      stage.classList.add('is-typing');
      aEl.appendChild(cursor);
      var parts = [[before, tokens(n.a[0])], [markText, tokens(n.a[1])], [after, tokens(n.a[2])]];
      var p = 0, t = 0;
      (function step() {
        if (p === 1 && t === 0) { mark.appendChild(markText); aEl.insertBefore(mark, cursor); }
        if (p === 2 && t === 0) { mark.appendChild(sup); aEl.insertBefore(after, cursor); }
        var part = parts[p];
        part[0].data += part[1][t];
        t++;
        if (t >= part[1].length) { p++; t = 0; }
        if (p < parts.length) {
          timer = setTimeout(step, 55 + Math.random() * 70);
        } else {
          cursor.remove();
          stage.classList.remove('is-typing');
          // маркер «проводится» по названию компании — единственная автоматическая анимация на странице
          requestAnimationFrame(function () { mark.classList.add('is-on'); });
        }
      })();
    }

    btns.forEach(function (b, k) {
      b.addEventListener('click', function () { goal('demo_tab', { niche: k }); play(k); });
    });
    // стартуем после загрузки шрифтов, чтобы текст не прыгал
    var start = function () { setTimeout(function () { play(0); }, 350); };
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(start); else start();
  }

  /* ================= Квиз-диалог ================= */
  var quiz = document.querySelector('[data-quiz]');
  if (!quiz) return;

  var Q = [
    { q: 'Клиенты выбирают вас, сравнивая несколько компаний?',
      a: [['Да, почти всегда', 2], ['Иногда', 1], ['Нет, конкурентов почти нет', 0]] },
    { q: 'Если спросить нейросеть о вашей услуге в вашем городе, она назовёт вас?',
      a: [['Нет, называет других', 2], ['Не проверял', 2], ['Да, называет', 0]] },
    { q: 'У конкурентов больше отзывов, статей и упоминаний в рейтингах?',
      a: [['Да, заметно больше', 2], ['Примерно поровну', 1], ['Нет, у нас больше', 0]] },
    { q: 'На сайте подробно расписаны цены, сроки и гарантии?',
      a: [['Нет, только общие слова', 2], ['Частично', 1], ['Да, всё подробно', 0]] }
  ];
  var R = {
    high: { t: 'Скорее всего, нейросети советуют ваших конкурентов',
      p: 'Клиенты сравнивают, а у нейросетей мало фактов о вас. Бесплатный AI-срез покажет, по каким запросам вас нет и кого называют вместо вас.' },
    mid: { t: 'Часть клиентов вы теряете в ответах нейросетей',
      p: 'Базу можно быстро усилить: дописать факты на сайте и добрать внешние упоминания. AI-срез покажет, с чего начать.' },
    low: { t: 'У вас хорошая база, её стоит закрепить',
      p: 'Конкуренты тоже начинают заниматься GEO. AI-срез покажет, где вас уже называют и где можно занять первое место.' }
  };

  var log = quiz.querySelector('[data-quiz-log]');
  var replies = quiz.querySelector('[data-quiz-replies]');
  var count = quiz.querySelector('[data-quiz-count]');
  var restart = quiz.querySelector('[data-quiz-restart]');
  var answers = [];

  function say(text, who) {
    var m = document.createElement('div');
    m.className = 'msg msg--' + who;
    if (who === 'ai') { var s = document.createElement('small'); s.textContent = 'AiR'; m.appendChild(s); }
    m.appendChild(document.createTextNode(text));
    log.appendChild(m);
    return m;
  }

  function ask() {
    var i = answers.length;
    replies.innerHTML = '';
    if (i >= Q.length) return finish();
    count.textContent = 'Вопрос ' + (i + 1) + ' из ' + Q.length;
    say(Q[i].q, 'ai');
    Q[i].a.forEach(function (a, n) {
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = a[0];
      b.addEventListener('click', function () {
        if (!answers.length) goal('quiz_start');
        answers.push(n);
        say(a[0], 'me');
        restart.hidden = false;
        replies.innerHTML = '';
        setTimeout(function () {
          ask();
          var first = replies.querySelector('button');
          if (first) first.focus({ preventScroll: true });
        }, reduce ? 0 : 380);
      });
      replies.appendChild(b);
    });
  }

  function finish() {
    var score = answers.reduce(function (s, n, i) { return s + Q[i].a[n][1]; }, 0);
    var key = score >= 6 ? 'high' : score >= 3 ? 'mid' : 'low';
    count.textContent = 'Готово';
    var box = document.createElement('div');
    box.className = 'msg msg--result';
    var b = document.createElement('b'); b.textContent = R[key].t;
    var p = document.createElement('p'); p.textContent = R[key].p;
    var cta = document.createElement('a'); cta.href = '#audit'; cta.className = 'btn btn--main'; cta.textContent = 'Получить AI-срез бесплатно';
    cta.addEventListener('click', function (e) {
      var input = document.querySelector('[data-form="audit"] input[name="site"]');
      if (!input) return;
      e.preventDefault();
      goal('quiz_cta');
      document.getElementById('audit').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
      setTimeout(function () { input.focus({ preventScroll: true }); }, reduce ? 0 : 500);
    });
    box.appendChild(b); box.appendChild(p); box.appendChild(cta);
    log.appendChild(box);
    var hidden = document.querySelector('[data-form="audit"] input[name="quiz"]');
    if (hidden) hidden.value = R[key].t + ' (' + score + '/8): ' + answers.map(function (n, i) { return Q[i].a[n][0]; }).join('; ');
    goal('quiz_done', { result: key });
    cta.focus({ preventScroll: true });
  }

  restart.addEventListener('click', function () {
    answers = []; log.innerHTML = ''; restart.hidden = true; ask();
  });

  ask();
})();
