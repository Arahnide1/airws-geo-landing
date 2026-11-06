/* AiR · лендинги (GEO, контекстная реклама). Настройки страницы — data-атрибуты на <body>. */
(function () {
  'use strict';

  /* ---------- Настройки ---------- */
  var YM_ID = 16999798;            // ID счётчика Яндекс.Метрики (тот же, что в <head>)
  var B = document.body.dataset;
  var ENDPOINT = B.endpoint || 'send.php';   // обработчик форм → Битрикс24
  var LANDING = B.landing || 'geo';          // какой лендинг (уходит в лид)
  var GOAL_PREFIX = B.goalPrefix || '';      // префикс целей Метрики, чтобы разделять лендинги
  // Демо-режим: локально и на GitHub Pages (там нет PHP) формы не отправляются, только показывают успех
  var IS_LOCAL = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname) || location.protocol === 'file:' || /\.github\.io$/.test(location.hostname);

  /* ---------- Метрика ---------- */
  function goal(name, params) {
    name = GOAL_PREFIX + name;
    try { if (!IS_LOCAL && typeof window.ym === 'function') window.ym(YM_ID, 'reachGoal', name, params || {}); } catch (e) {}
    if (IS_LOCAL) console.log('[ym goal]', name, params || '');
  }
  window.airGoal = goal; // для скриптов конкретной страницы (квиз варианта B)
  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-goal]');
    if (el) goal(el.getAttribute('data-goal'));
  });

  /* ---------- UTM: сохраняем первое касание ---------- */
  var UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'yclid'];
  var utm = {};
  try {
    var qs = new URLSearchParams(location.search);
    var stored = JSON.parse(sessionStorage.getItem('air_utm') || '{}');
    UTM_KEYS.forEach(function (k) { utm[k] = qs.get(k) || stored[k] || ''; });
    sessionStorage.setItem('air_utm', JSON.stringify(utm));
  } catch (e) {}

  /* ---------- Header / mobile bar ---------- */
  var header = document.querySelector('.header');
  var bar = document.querySelector('.mobile-bar');
  var hero = document.querySelector('.hero');
  function onScroll() {
    var y = window.scrollY;
    header.classList.toggle('is-scrolled', y > 10);
    if (bar && hero) bar.classList.toggle('is-visible', y > hero.offsetHeight * 0.7);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Reveal + counters ---------- */
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function countUp(el) {
    var end = +el.getAttribute('data-count');
    if (reduce) { el.textContent = end; return; }
    var t0 = null;
    function tick(t) {
      if (!t0) t0 = t;
      var p = Math.min((t - t0) / 1200, 1);
      el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('is-visible');
        en.target.querySelectorAll('[data-count]').forEach(countUp);
        io.unobserve(en.target);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    document.querySelectorAll('.reveal').forEach(function (el, i) {
      el.style.transitionDelay = (i % 4) * 70 + 'ms';
      io.observe(el);
    });
  } else {
    document.documentElement.classList.add('no-js');
    document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('is-visible'); });
    document.querySelectorAll('[data-count]').forEach(function (el) { el.textContent = el.getAttribute('data-count'); });
  }

  /* ---------- Глубина скролла ---------- */
  var depthSent = {};
  window.addEventListener('scroll', function () {
    var h = document.documentElement.scrollHeight - innerHeight;
    var p = h > 0 ? scrollY / h * 100 : 0;
    [50, 90].forEach(function (m) { if (p >= m && !depthSent[m]) { depthSent[m] = 1; goal('scroll_' + m); } });
  }, { passive: true });

  /* ---------- Демо ответа нейросети ---------- */
  var DEMO = window.AIR_DEMO || {
    alice: {
      q: 'Посоветуй надёжную компанию по установке окон в Новосибирске',
      intro: 'Вот компании, которые чаще всего рекомендуют по отзывам и рейтингам:',
      items: [
        ['Ваша компания', ' — 4.9★ на картах, гарантия 5 лет, замер в день обращения', true],
        ['Конкурент А', ' — большой выбор профилей, но долгие сроки монтажа'],
        ['Конкурент Б', ' — низкие цены, смешанные отзывы о сервисе']
      ],
      src: ['yandex.ru/maps', 'vash-site.ru', '2gis.ru']
    },
    gpt: {
      q: 'Какой производитель металлоконструкций на Урале работает с тендерами?',
      intro: 'Для B2B-заказов и участия в тендерах обычно выбирают:',
      items: [
        ['Ваша компания', ' — собственное производство, сертификаты ISO, опыт госзаказа', true],
        ['Завод «Конкурент»', ' — крупные объёмы, высокий порог заказа'],
        ['Конкурент В', ' — быстрые сроки, ограниченная номенклатура']
      ],
      src: ['vash-site.ru', 'rbc.ru', 'b2b-center.ru']
    },
    giga: {
      q: 'Где заказать диван с доставкой и сборкой в Екатеринбурге?',
      intro: 'Хорошие отзывы о доставке и качестве у этих магазинов:',
      items: [
        ['Ваш магазин', ' — доставка за 2 дня, бесплатная сборка, рассрочка 0%', true],
        ['Конкурент Г', ' — широкий ассортимент, платная сборка'],
        ['Маркетплейс', ' — низкие цены, нестабильное качество']
      ],
      src: ['vash-shop.ru', 'otzovik.com', 'market.yandex.ru']
    }
  };
  var demo = document.querySelector('.ai-demo');
  if (demo) {
    var tabs = demo.querySelectorAll('[data-ai]');
    var promptEl = demo.querySelector('.ai-prompt');
    var caret = demo.querySelector('.caret');
    var bot = demo.querySelector('.ai-msg--bot');
    var intro = demo.querySelector('.ai-intro');
    var list = demo.querySelector('.ai-list');
    var sources = demo.querySelector('.ai-sources');
    var keys = Array.prototype.map.call(tabs, function (t) { return t.getAttribute('data-ai'); });
    var timers = [];
    var current = 0;
    var userTouched = false;

    function later(fn, ms) { timers.push(setTimeout(fn, ms)); }
    function clear() { timers.forEach(clearTimeout); timers = []; }

    function play(idx) {
      clear();
      current = idx;
      var d = DEMO[keys[idx]];
      tabs.forEach(function (t, i) { t.classList.toggle('is-active', i === idx); t.setAttribute('aria-pressed', i === idx ? 'true' : 'false'); });
      bot.hidden = true; list.innerHTML = ''; sources.innerHTML = '';
      caret.classList.remove('is-done');
      promptEl.textContent = '';

      if (reduce) { promptEl.textContent = d.q; caret.classList.add('is-done'); render(d, true); return; }

      var i = 0;
      (function type() {
        promptEl.textContent = d.q.slice(0, ++i);
        if (i < d.q.length) later(type, 22 + Math.random() * 30);
        else { caret.classList.add('is-done'); later(function () { render(d, false); }, 450); }
      })();
    }

    function render(d, instant) {
      bot.hidden = false;
      intro.textContent = d.intro;
      d.items.forEach(function (it, n) {
        later(function () {
          var li = document.createElement('li');
          if (it[2]) li.className = 'is-you';
          if (it[3]) { var u = document.createElement('span'); u.className = 'ai-url'; u.textContent = it[3]; li.appendChild(u); }
          var b = document.createElement('b'); b.textContent = it[0];
          li.appendChild(b); li.appendChild(document.createTextNode(it[1]));
          list.appendChild(li);
        }, instant ? 0 : 250 + n * 380);
      });
      later(function () {
        d.src.forEach(function (s) { var sp = document.createElement('span'); sp.textContent = s; sources.appendChild(sp); });
        // автопрокрутка — один круг по всем нейросетям, дальше только по клику (без бесконечной анимации)
        if (!userTouched && !reduce && current < keys.length - 1) later(function () { play(current + 1); }, 5200);
      }, instant ? 0 : 250 + d.items.length * 380 + 200);
    }

    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { userTouched = true; goal('demo_tab', { ai: keys[i] }); play(i); });
    });

    // запускаем, когда блок виден
    if ('IntersectionObserver' in window) {
      var started = false;
      new IntersectionObserver(function (en, obs) {
        if (en[0].isIntersecting && !started) { started = true; play(0); obs.disconnect(); }
      }).observe(demo);
    } else play(0);
  }

  /* ---------- Калькулятор бюджета (если есть на странице) ---------- */
  var calc = document.querySelector('[data-calc]');
  if (calc) {
    var nf = new Intl.NumberFormat('ru-RU');
    var inputs = calc.querySelectorAll('input[type="range"]');
    var calcUsed = false;
    function updateCalc() {
      var v = {};
      inputs.forEach(function (inp) {
        v[inp.name] = +inp.value;
        var out = calc.querySelector('[data-out="' + inp.name + '"]');
        if (out) out.textContent = nf.format(+inp.value);
        inp.style.setProperty('--p', ((inp.value - inp.min) / (inp.max - inp.min) * 100) + '%');
      });
      var clicks = Math.round(v.budget / v.cpc);
      var leads = Math.max(0, Math.round(clicks * v.cr / 100));
      calc.querySelector('[data-res="clicks"]').textContent = nf.format(clicks);
      calc.querySelector('[data-res="leads"]').textContent = nf.format(leads);
      calc.querySelector('[data-res="cpl"]').textContent = leads ? nf.format(Math.round(v.budget / leads)) + ' ₽' : '—';
      var hidden = document.querySelector('[data-form="lead"] input[name="budget"]');
      if (hidden) hidden.value = nf.format(v.budget) + ' ₽/мес';
    }
    inputs.forEach(function (inp) {
      inp.addEventListener('input', function () {
        updateCalc();
        if (!calcUsed) { calcUsed = true; goal('calc_use'); }
      });
    });
    updateCalc();
  }

  /* ---------- FAQ ---------- */
  document.querySelectorAll('.faq details').forEach(function (d, i) {
    d.addEventListener('toggle', function () { if (d.open) goal('faq_open', { q: i + 1 }); });
  });

  /* ---------- Выбор тарифа → форма ---------- */
  document.querySelectorAll('[data-plan]').forEach(function (a) {
    a.addEventListener('click', function () {
      var sel = document.querySelector('[data-form="lead"] select[name="plan"]');
      if (sel) sel.value = a.getAttribute('data-plan');
    });
  });

  /* ---------- Маска телефона ---------- */
  function formatPhone(v) {
    var d = v.replace(/\D/g, '');
    if (!d) return '';
    if (d[0] === '8') d = '7' + d.slice(1);
    if (d[0] !== '7') d = '7' + d;
    d = d.slice(0, 11);
    var out = '+7';
    if (d.length > 1) out += ' (' + d.slice(1, 4);
    if (d.length >= 4) out += ')';
    if (d.length > 4) out += ' ' + d.slice(4, 7);
    if (d.length > 7) out += '-' + d.slice(7, 9);
    if (d.length > 9) out += '-' + d.slice(9, 11);
    return out;
  }
  document.querySelectorAll('input[type="tel"]').forEach(function (inp) {
    inp.addEventListener('input', function () { inp.value = formatPhone(inp.value); });
    inp.addEventListener('focus', function () { if (!inp.value) inp.value = '+7 ('; });
    inp.addEventListener('blur', function () { if (inp.value.replace(/\D/g, '').length <= 1) inp.value = ''; });
  });

  /* ---------- Отправка форм ---------- */
  function getClientId() {
    return new Promise(function (res) {
      try { window.ym(YM_ID, 'getClientID', function (id) { res(id || ''); }); } catch (e) { res(''); }
      setTimeout(function () { res(''); }, 800);
    });
  }

  var formStarted = {};
  document.querySelectorAll('form[data-form]').forEach(function (form) {
    var type = form.getAttribute('data-form');
    var btn = form.querySelector('button[type="submit"]');

    form.addEventListener('focusin', function () {
      if (!formStarted[type]) { formStarted[type] = 1; goal('form_start_' + type); }
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var err = form.querySelector('.form__error');
      if (err) err.remove();

      var invalid = [];
      function check(input, isBad, msg, slot) {
        if (!input) return;
        var box = slot || input.parentElement.querySelector('.field__error');
        input.classList.toggle('is-invalid', isBad);
        input.setAttribute('aria-invalid', isBad ? 'true' : 'false');
        if (box) box.textContent = isBad ? msg : '';
        if (isBad) invalid.push(input);
      }
      var site = form.querySelector('input[name="site"][required]');
      if (site) check(site, !site.value.trim(), 'Укажите сайт или название компании, например company.ru');
      var phone = form.querySelector('input[name="phone"]');
      check(phone, phone.value.replace(/\D/g, '').length !== 11, 'Введите номер полностью: +7 и 10 цифр');
      var consent = form.querySelector('input[name="consent"]');
      check(consent, !consent.checked, 'Отметьте согласие, чтобы мы могли с вами связаться', form.querySelector('.field__error--consent'));
      if (invalid.length) { invalid[0].focus(); return; }

      btn.disabled = true;
      var btnText = btn.textContent;
      btn.classList.add('is-loading');
      btn.textContent = 'Отправляем…';
      var fd = new FormData(form);
      fd.append('form', type);
      fd.append('landing', LANDING);
      fd.append('page', location.href);
      fd.append('referrer', document.referrer);
      UTM_KEYS.forEach(function (k) { fd.append(k, utm[k] || ''); });

      getClientId().then(function (cid) {
        fd.append('ym_client_id', cid);
        if (IS_LOCAL) {
          console.log('[local] form data', Object.fromEntries(fd.entries()));
          return { ok: true };
        }
        return fetch(ENDPOINT, { method: 'POST', body: fd })
          .then(function (r) { return r.json(); });
      }).then(function (res) {
        if (!res || !res.ok) throw new Error(res && res.error);
        goal('lead_' + type);
        goal('lead');
        form.querySelector('.form__success').hidden = false;
      }).catch(function () {
        showError(form, 'Не удалось отправить. Позвоните нам: 8 (800) 775-67-23');
        goal('lead_error');
      }).then(function () { btn.disabled = false; btn.classList.remove('is-loading'); btn.textContent = btnText; });
    });
  });

  function showError(form, text) {
    var p = document.createElement('p');
    p.className = 'form__error';
    p.setAttribute('role', 'alert');
    p.textContent = text;
    form.querySelector('button[type="submit"]').insertAdjacentElement('afterend', p);
  }
})();
