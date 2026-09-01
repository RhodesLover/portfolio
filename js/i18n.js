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
    'cat.redes': { es: 'Redes Sociales', en: 'Social Media' },
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
    'gallery.back': { es: '← Volver', en: '← Back' },
    'gallery.filterAll': { es: 'Todo', en: 'All' },
    'gallery.filtersLabel': { es: 'Filtros', en: 'Filters' },
    'gallery.back': { es: '← Volver', en: '← Back' },
    'gallery.archive': { es: 'Archivo completo', en: 'Full archive' },
    'gallery.piecesOne': { es: 'pieza', en: 'piece' },
    'gallery.piecesMany': { es: 'piezas', en: 'pieces' },
    'gallery.heroLine1': { es: 'Todos los', en: 'All' },
    'gallery.heroLine2': { es: 'trabajos', en: 'work' },
    'gallery.heroSub': {
      es: 'Selección por disciplina. Abrí cada pieza, filtrá y explorá el archivo completo.',
      en: 'Browse by discipline. Open each piece, filter, and explore the full archive.'
    },
    'gallery.filterAria': { es: 'Filtrar por disciplina', en: 'Filter by discipline' },
    'sec.redes': { es: 'Social media · feeds · motion', en: 'Social media · feeds · motion' },
    'sec.branding': { es: 'Identidad · packaging · sistema', en: 'Identity · packaging · system' },
    'sec.proyectos': { es: 'Campañas · conceptual · editorial', en: 'Campaigns · conceptual · editorial' },
    'sec.posters': { es: 'Composición · tipografía · atmósfera', en: 'Composition · typography · atmosphere' },
    'sec.ilustraciones': { es: 'Trazo · textura · personaje', en: 'Line · texture · character' },
    'sec.infografias': { es: 'Dato · jerarquía · lectura', en: 'Data · hierarchy · reading' },
    'sec.revistas': { es: 'Editorial · tipografía · pliegos', en: 'Editorial · typography · spreads' },
    'sec.modelos': { es: 'Volumen · producto · render', en: 'Volume · product · render' },
    'js.processShort': { es: 'Proceso', en: 'Process' },
    'js.motionShort': { es: 'Motion', en: 'Motion' },
    'js.zoomIn': { es: 'Acercar', en: 'Zoom in' },
    'js.zoomOut': { es: 'Alejar', en: 'Zoom out' },
    'js.zoomReset': { es: 'Restablecer', en: 'Reset' },
    'js.close': { es: 'Cerrar', en: 'Close' },
    'js.cover': { es: 'Portada', en: 'Cover' },
    'js.cartaHint': {
      es: 'Zoom +/− · rueda · doble click · arrastrá · bordes · flechas',
      en: 'Zoom +/− · wheel · double-click · drag · edges · arrows'
    },
    'js.cdHint': {
      es: 'Gira sola · mantené el mouse para frenar y rotar · Abrir caja',
      en: 'Spins on its own · hold the mouse to pause and rotate · Open case'
    },
    'js.bottleHint': {
      es: 'Gira sola · mantené el mouse para frenar y rotar',
      en: 'Spins on its own · hold the mouse to pause and rotate'
    },
    'js.openCase': { es: 'Abrir caja', en: 'Open case' },

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
    'Ilustración Bowie||Ilustración · 2022': '',
    'Fantasma — Gustavo Cerati||Poster · 2026':
      'Poster inspired by the song Fantasma by Gustavo Cerati.',
    'Red Twilight||Poster · 2026':
      'Advertisement flyer for the cocktail "Red Twilight" (my own recipe), for a bar in Puerto Madero, Buenos Aires.',
    'Jordan Poster||Poster · 2025':
      'Poster of basketball\'s G.O.A.T.',
    'Tinnitus||Poster · 2025':
      'Conceptual poster about the condition of tinnitus.',
    'Wonder — Afiche||Poster · 2025':
      'Conceptual poster for Wonder.',
    'Nogal||Poster · 2024':
      'Conceptual poster for Nogal Producciones.',
    'SOUL NATURE 01||Poster · 2024':
      'Art poster inspired by Ciruelo\'s talk with Goura\'s Music on Fonograma #42.',
    'Anti-Gambling||Poster · 2023':
      'Anti-gambling poster (against gambling addiction) designed for a public-interest campaign.',
    'Arte Único Branca||Poster · 2023':
      'Poster entered in the "LEGADO BRANCA" category for Fernet Branca\'s Arte Único 2023 contest.',
    'Kill Bill||Poster · 2023':
      'Illustrated poster of the classic Quentin Tarantino film.',
    'Poster Destilería Campo||Poster · 2023':
      'Poster / product shot designed for Destilería Campo gin from Tandil.',
    'Milky\'s||Poster · 2022':
      'Piece inspired by the Coffee and TV music video by Blur.',
    'Tokyo Poster||Poster · 2022':
      'Poster designed for the Intel World Open, host of the international Street Fighter V esports tournament.',
    'Library||Ilustración · 2024':
      'Overhead illustration of an urban avenue represented through stationery objects.',
    'Eva-02||Ilustración · 2022':
      'Vector illustration of Eva-02 from the anime Neon Genesis Evangelion.',
    'Gallo Celestial||Ilustración · 2022':
      'Poster/illustration series inspired by "The Book of Imaginary Beings" by Jorge Luis Borges.',
    'La Haine||Infografía · 2024':
      'Full infographic with spoilers of the French film directed by Mathieu Kassovitz, starring Vincent Cassel, Hubert Koundé and Saïd Taghmaoui.',
    'Malaria Gin||Infografía · 2024':
      'Infographic for the artisanal gin from Mar del Plata "Malaria Gin".',
    'Historia de Gotham||Revista · Tipográfica':
      'Typographic magazine on the history of Gotham. Written and designed by me.',
    'Los Inrockuptibles — Michael Jackson||Revista · Editorial':
      'Digitization and editorial recreation of Los Inrockuptibles issue #192 (2014).',
    'NOGA Joystick||Modelo 3D · 2025':
      'Realistic 3D model of the Noganet PC/PS2/PS3 joystick. Modeled in Cinema 4D, textured with Arnold.',

  };

  var CAT_MAP = {
    Infografía: 'Infographic',
    Revista: 'Magazine',
    'Modelo 3D': '3D Model',
    Editorial: 'Editorial',
    Tipográfica: 'Typographic',
    tipográfica: 'typographic',
    editorial: 'editorial',
    Social: 'Social',
    Campaña: 'Campaign',
    Diente: 'Diente',
    Cerati: 'Cerati',

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
      /Social Media|Premios Diente|Modelo 3D|Ilustración|Infografía|Branding|Poster|Proyecto|Campaña|Revista|Editorial|Tipográfica|tipográfica|editorial|Social|Diente|Cerati/g,
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

    // project cards + gallery cells: category tags + stored ES description
    document.querySelectorAll('.project-card, .project-full-card, .pg-cell, [data-title]').forEach(function (card) {
      if (!card.getAttribute) return;
      var title = card.getAttribute('data-title');
      if (!title) return;

      var catAttr = card.hasAttribute('data-category') ? 'data-category' : (card.hasAttribute('data-cat') ? 'data-cat' : null);
      var descAttr = card.hasAttribute('data-description') ? 'data-description' : (card.hasAttribute('data-desc') ? 'data-desc' : null);
      var cat = catAttr ? card.getAttribute(catAttr) : null;

      if (descAttr && !card.getAttribute('data-description-es') && card.getAttribute(descAttr) != null) {
        card.setAttribute('data-description-es', card.getAttribute(descAttr) || '');
      }
      if (catAttr && !card.getAttribute('data-category-es') && cat) {
        card.setAttribute('data-category-es', cat);
      }

      var catEs = card.getAttribute('data-category-es') || cat || '';
      var descEs = card.getAttribute('data-description-es') || '';
      var catOut = translateCategory(catEs);
      var descOut = descEn(title, catEs, descEs);

      if (catAttr) card.setAttribute(catAttr, catOut);
      if (descAttr) card.setAttribute(descAttr, descOut);

      var tag = card.querySelector('.project-card__tag, .project-full-card__tag, .pg-cell__tag');
      if (tag) {
        if (!tag.getAttribute('data-tag-es')) tag.setAttribute('data-tag-es', tag.textContent.trim());
        tag.textContent = translateCategory(tag.getAttribute('data-tag-es'));
      }
    });

    // gallery piece count label
    var totalEl = document.getElementById('pgTotalCount');
    if (totalEl) {
      var n = totalEl.getAttribute('data-count');
      if (!n) {
        var m = (totalEl.textContent || '').match(/(\d+)/);
        n = m ? m[1] : '';
        if (n) totalEl.setAttribute('data-count', n);
      }
      if (n) {
        var unit = Number(n) === 1 ? t('gallery.piecesOne') : t('gallery.piecesMany');
        totalEl.textContent = n + ' ' + unit;
      }
    }

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
