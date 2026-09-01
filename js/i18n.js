/**
 * Portfolio i18n — ES (default) / EN toggle.
 * Translations hand-polished; MT (MyMemory) used as a second pass for doubt cases.
 * Proper names kept: Fantasma, Arte Único, Premios Diente, Escuela Da Vinci, etc.
 */
(function (global) {
  'use strict';

  var STORAGE_KEY = 'tz-lang';
  var dict = {
    'meta.title': {
      es: 'Tomi Zárate — Diseñador Gráfico',
      en: 'Tomi Zárate — Graphic Designer'
    },
    'meta.description': {
      es: 'Portfolio de Tomás Zárate, diseñador gráfico. Branding, social media, editorial e identidad visual. Escuela Da Vinci.',
      en: 'Portfolio of Tomás Zárate, graphic designer. Branding, social media, editorial, and visual identity. Escuela Da Vinci.'
    },
    'meta.ogDesc': {
      es: 'Branding, social media, editorial e identidad visual.',
      en: 'Branding, social media, editorial, and visual identity.'
    },
    'meta.galleryTitle': {
      es: 'Todos los trabajos — Tomi Zárate',
      en: 'All work — Tomi Zárate'
    },
    'meta.galleryDesc': {
      es: 'Selección completa de trabajos de Tomás Zárate: branding, social media, posters e ilustración.',
      en: 'Full selection of work by Tomás Zárate: branding, social media, posters, and illustration.'
    },
    'nav.work': { es: 'Trabajo', en: 'Work' },
    'nav.about': { es: 'Sobre mí', en: 'About' },
    'nav.contact': { es: 'Contacto', en: 'Contact' },
    'nav.menu': { es: 'Menú', en: 'Menu' },
    'hero.cta.work': { es: 'Ver trabajo', en: 'View work' },
    'hero.cta.contact': { es: 'Contacto', en: 'Contact' },
    'work.title': { es: 'Trabajo', en: 'Work' },
    'work.desc': {
      es: 'Una mirada a los proyectos que definen mi enfoque.',
      en: 'A look at the projects that define my approach.'
    },
    'work.all': { es: 'Ver todos los trabajos →', en: 'View all work →' },
    'cat.redes': { es: 'Redes', en: 'Social' },
    'cat.branding': { es: 'Branding', en: 'Branding' },
    'cat.posters': { es: 'Posters', en: 'Posters' },
    'cat.proyectos': { es: 'Proyectos', en: 'Projects' },
    'cat.ilustraciones': { es: 'Ilustraciones', en: 'Illustration' },
    'cat.infografias': { es: 'Infografías', en: 'Infographics' },
    'cat.revistas': { es: 'Revistas', en: 'Magazines' },
    'cat.modelos3d': { es: 'Modelos 3D', en: '3D Models' },
    'qty.unit': { es: 'proyectos', en: 'projects' },
    'overlay.view': { es: 'Ver →', en: 'View →' },
    'overlay.viewProject': { es: 'Ver proyecto →', en: 'View project →' },
    'about.overline': { es: 'Acerca de', en: 'About' },
    'about.title': { es: 'Sobre mí', en: 'About me' },
    'about.bio1': {
      es: 'Soy <span class="highlight">diseñador gráfico</span> recibido en <strong>Escuela Da Vinci</strong>, con experiencia tanto en <span class="highlight">agencias de marketing</span> como trabajando de manera <span class="highlight">independiente</span>.',
      en: 'I\'m a <span class="highlight">graphic designer</span> graduated from <strong>Escuela Da Vinci</strong>, with experience both at <span class="highlight">marketing agencies</span> and working <span class="highlight">independently</span>.'
    },
    'about.bio2': {
      es: 'Me interesa crear soluciones visuales que combinen <span class="highlight">diseño</span>, <span class="highlight">comunicación</span> y <span class="highlight">nuevas tecnologías</span>. Exploro el potencial de la <span class="highlight">inteligencia artificial</span> como una herramienta más dentro del proceso creativo, buscando nuevas formas de desarrollar ideas y comunicar conceptos.',
      en: 'I\'m interested in creating visual solutions that combine <span class="highlight">design</span>, <span class="highlight">communication</span>, and <span class="highlight">new technologies</span>. I explore the potential of <span class="highlight">artificial intelligence</span> as another tool in the creative process, looking for new ways to develop ideas and communicate concepts.'
    },
    'about.bio3': {
      es: 'Actualmente trabajo como <span class="highlight">creativo</span> y diseñador gráfico <span class="highlight">freelance</span>, desarrollando proyectos de <span class="highlight">identidad</span>, contenido, comunicación visual y piezas digitales. Estoy abierto a nuevas oportunidades, tanto en posiciones <span class="highlight">full time</span> como <span class="highlight">part time</span>, y a formar parte de equipos de trabajo donde pueda aportar mi experiencia y seguir desarrollándome profesionalmente.',
      en: 'I currently work as a <span class="highlight">creative</span> and <span class="highlight">freelance</span> graphic designer, developing <span class="highlight">identity</span>, content, visual communication, and digital pieces. I\'m open to new opportunities — <span class="highlight">full time</span> or <span class="highlight">part time</span> — and to joining teams where I can contribute my experience and keep growing professionally.'
    },
    'about.formation': { es: 'Formación', en: 'Education' },
    'about.languages': { es: 'Idiomas', en: 'Languages' },
    'about.langValue': { es: 'Español · Inglés', en: 'Spanish · English' },
    'about.toolkit': { es: 'Toolkit', en: 'Toolkit' },
    'about.availability': { es: 'Disponibilidad', en: 'Availability' },
    'about.availabilityValue': { es: 'Abierto a oportunidades', en: 'Open to opportunities' },
    'contact.overline': { es: 'Contacto', en: 'Contact' },
    'contact.title': { es: '¿Trabajamos<br>juntos?', en: 'Shall we work<br>together?' },
    'contact.text': {
      es: 'Abierto a proyectos freelance, colaboraciones o una charla.',
      en: 'Open to freelance projects, collaborations, or a conversation.'
    },
    'footer.meta': {
      es: 'Diseño gráfico · Branding · Editorial',
      en: 'Graphic design · Branding · Editorial'
    },
    'footer.work': { es: 'Trabajo', en: 'Work' },
    'footer.about': { es: 'Sobre mí', en: 'About' },
    'footer.contact': { es: 'Contacto →', en: 'Contact →' },
    'footer.navLabel': { es: 'Pie de página', en: 'Footer' },
    'gallery.heading': { es: 'Todos los trabajos', en: 'All work' },
    'gallery.back': { es: 'Volver', en: 'Back' },
    'gallery.filterAll': { es: 'Todo', en: 'All' },
    'gallery.filtersLabel': { es: 'Filtros', en: 'Filters' },
    'js.instagram': { es: 'Ver Instagram →', en: 'View Instagram →' },
    'js.instagramShort': { es: 'Ver Instagram', en: 'View Instagram' },
    'js.protoSoon': { es: 'Prototipo próximamente', en: 'Prototype coming soon' },
    'js.magazine': { es: 'Ver revista →', en: 'View magazine →' },
    'js.cd': { es: 'Ver caja de CD →', en: 'View CD case →' },
    'js.bottle': { es: 'Ver botella →', en: 'View bottle →' },
    'js.manual': { es: 'Ver manual de marca →', en: 'View brand manual →' },
    'js.menu': { es: 'Diseño de carta →', en: 'Menu design →' },
    'js.menuShort': { es: 'Diseño de carta', en: 'Menu design' },
    'js.behance': { es: 'Ver en Behance →', en: 'View on Behance →' },
    'js.motion': { es: 'Ver motion →', en: 'View motion →' },
    'js.process': { es: 'Ver proceso →', en: 'View process →' },
    'js.image': { es: 'Ver imagen →', en: 'View image →' }
  };

  /* data-description EN by "Title||Category" or Title alone */
  var DESCS_EN = {
    'Epic||Social Media · 2026':
      'Instagram feed posts for a ski & snowboard lodge/rental at Cerro Catedral, Bariloche. Single posts & carousels.',
    '26Shop||Social Media · 2026':
      'Instagram feed posts for a ski & snowboard shop & rental at Cerro Catedral, Bariloche and Las Leñas / Malargüe, Mendoza. Single posts, carousels, Stories & ads.',
    'Distravel||Social Media · 2026':
      'Instagram feed posts for a travel agency in Hernandarias, Paraguay. Single posts, carousels, Stories & Reels covers.',
    'Mercado Montañés||Social Media · 2026':
      'Instagram feed posts for a restaurant-café / ski & snowboard shop & rental at Cerro Catedral, Bariloche. Single posts, carousels, Stories & highlight icons.',
    'Mercado Montañés||Branding · 2026':
      'Vector logo and menu for a restaurant-café / ski & snowboard shop & rental at Cerro Catedral, Bariloche.',
    'Fernet Cordobita||Branding · 2025':
      'Brand design & labels for an artisanal Fernet brand made in Tandil.',
    'Naturaleza Humana||Branding · 2024':
      'Full logo system with all versions and a T-shirt with a mini brand manual for an Argentine progressive metal band.',
    'Fantasma - Gustavo Cerati||Poster · 2026':
      'Poster inspired by the song Fantasma by Gustavo Cerati.',
    'Fly me to the Moon||Poster · 2024':
      'Poster for the classic standard popularized by Frank Sinatra & Count Basie.',
    'Arte Único Branca 2023||Poster · 2023':
      'Poster entered in the "LEGADO BRANCA" category for Fernet Branca\'s Arte Único 2023 contest.',
    'Del Bardo al Arte||Premios Diente · 2025':
      'Final project & thesis: branding, visual identity, and a full design project created together for Premios DIENTE 2025.',
    'Wonder||Proyecto · 2025':
      'Final project & thesis: branding and full visual identity created together for a graphic design agency.',
    'Desembarco||Proyecto · 2024': 'Full cover art for a rap LP.',
    'Kentucky Vegano||Campaña · 2024':
      'Fictional 360° advertising campaign concept for Kentucky.',
    'Nogal Poster||Poster · 2024': 'Conceptual poster for Nogal Producciones.',
    'Kalisi||Ilustración · 2025': 'Kali ❤️.',
    'Polar Bear||Ilustración · 2025':
      'Illustration of my favorite animal, capturing its violent nature and fantastical aesthetic.',
    'Ilustración Bowie||Ilustración · 2022': ''
  };

  var CAT_MAP = {
    'Social Media': 'Social Media',
    Branding: 'Branding',
    Poster: 'Poster',
    Proyecto: 'Project',
    Campaña: 'Campaign',
    Ilustración: 'Illustration',
    'Premios Diente': 'Premios Diente',
    Redes: 'Social',
    Proyectos: 'Projects',
    Posters: 'Posters',
    Ilustraciones: 'Illustration',
    Infografías: 'Infographics',
    Revistas: 'Magazines',
    'Modelos 3D': '3D Models'
  };

  var lang = 'es';

  function t(key) {
    var row = dict[key];
    if (!row) return key;
    return row[lang] != null ? row[lang] : row.es;
  }

  function translateCategory(raw) {
    if (!raw || lang === 'es') return raw;
    return String(raw).replace(
      /Social Media|Branding|Poster|Proyecto|Campaña|Ilustración|Premios Diente/g,
      function (m) {
        return CAT_MAP[m] || m;
      }
    );
  }

  function descEn(title, category, fallbackEs) {
    if (lang === 'es') return fallbackEs;
    var k1 = title + '||' + category;
    if (Object.prototype.hasOwnProperty.call(DESCS_EN, k1)) return DESCS_EN[k1];
    // try title-only match
    var keys = Object.keys(DESCS_EN);
    for (var i = 0; i < keys.length; i++) {
      if (keys[i].indexOf(title + '||') === 0) return DESCS_EN[keys[i]];
    }
    return fallbackEs;
  }

  function detect() {
    try {
      var q = new URLSearchParams(window.location.search).get('lang');
      if (q === 'en' || q === 'es') return q;
    } catch (e) {}
    try {
      var s = localStorage.getItem(STORAGE_KEY);
      if (s === 'en' || s === 'es') return s;
    } catch (e2) {}
    return 'es';
  }

  function setToggleUI() {
    document.querySelectorAll('[data-lang-switch]').forEach(function (btn) {
      var code = btn.getAttribute('data-lang-switch');
      btn.setAttribute('aria-pressed', code === lang ? 'true' : 'false');
      btn.classList.toggle('is-active', code === lang);
    });
  }

  function apply() {
    document.documentElement.lang = lang;
    document.documentElement.setAttribute('data-lang', lang);

    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      if (!key || !dict[key]) return;
      var mode = el.getAttribute('data-i18n-mode') || 'text';
      var val = t(key);
      if (mode === 'html') el.innerHTML = val;
      else el.textContent = val;
    });

    document.querySelectorAll('[data-i18n-aria]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-aria');
      if (dict[key]) el.setAttribute('aria-label', t(key));
    });

    document.querySelectorAll('[data-i18n-meta]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-meta');
      if (!dict[key]) return;
      if (el.tagName === 'TITLE') el.textContent = t(key);
      else el.setAttribute('content', t(key));
    });

    // qty: "N proyectos"
    document.querySelectorAll('[data-i18n-qty]').forEach(function (el) {
      var n = el.getAttribute('data-i18n-qty');
      el.textContent = n + ' ' + t('qty.unit');
    });

    // project cards: category tags + stored ES description
    document.querySelectorAll('.project-card, .project-full-card, [data-title]').forEach(function (card) {
      if (!card.getAttribute) return;
      var title = card.getAttribute('data-title');
      var cat = card.getAttribute('data-category');
      if (!title) return;

      if (!card.getAttribute('data-description-es') && card.getAttribute('data-description') != null) {
        card.setAttribute('data-description-es', card.getAttribute('data-description') || '');
      }
      if (!card.getAttribute('data-category-es') && cat) {
        card.setAttribute('data-category-es', cat);
      }

      var catEs = card.getAttribute('data-category-es') || cat || '';
      var descEs = card.getAttribute('data-description-es') || '';
      var catOut = translateCategory(catEs);
      var descOut = descEn(title, catEs, descEs);

      card.setAttribute('data-category', catOut);
      if (card.hasAttribute('data-description') || descEs || descOut) {
        card.setAttribute('data-description', descOut);
      }

      var tag = card.querySelector('.project-card__tag, .project-full-card__tag');
      if (tag && catEs) {
        // keep year; translate left token if matches category pattern
        tag.textContent = translateCategory(tag.getAttribute('data-tag-es') || (function () {
          if (!tag.getAttribute('data-tag-es')) tag.setAttribute('data-tag-es', tag.textContent.trim());
          return tag.getAttribute('data-tag-es');
        })());
      }
    });

    // open modal live fields if present
    var md = document.getElementById('modalDescription');
    var mc = document.getElementById('modalCategory');
    if (md && md.getAttribute('data-es')) {
      var ttitle = md.getAttribute('data-title') || '';
      var tcat = md.getAttribute('data-cat-es') || '';
      md.textContent = descEn(ttitle, tcat, md.getAttribute('data-es'));
    }
    if (mc && mc.getAttribute('data-es')) {
      mc.textContent = translateCategory(mc.getAttribute('data-es'));
    }

    setToggleUI();
    try {
      document.dispatchEvent(new CustomEvent('tz:langchange', { detail: { lang: lang } }));
    } catch (e3) {}
  }

  function setLang(next) {
    if (next !== 'en' && next !== 'es') return;
    lang = next;
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch (e) {}
    apply();
  }

  function init() {
    lang = detect();
    apply();
    document.querySelectorAll('[data-lang-switch]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        setLang(btn.getAttribute('data-lang-switch'));
      });
    });
  }

  global.TZI18n = {
    t: t,
    getLang: function () {
      return lang;
    },
    setLang: setLang,
    apply: apply,
    init: init,
    translateCategory: translateCategory,
    descEn: descEn
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(window);
