/* ============================================================
   PROYECTOS — galería modular (filtros + viewer + motion)
   ============================================================ */
(function () {
  'use strict';

  const cells = Array.from(document.querySelectorAll('.pg-cell[data-title]'));
  const sections = Array.from(document.querySelectorAll('.pg-section'));
  const filterBtns = Array.from(document.querySelectorAll('.pg-filter__btn'));
  const totalEl = document.getElementById('pgTotalCount');
  const filterBar = document.getElementById('pgFilter');

  const viewer = document.getElementById('pgViewer');
  const backdrop = document.getElementById('pgViewerBackdrop');
  const closeBtn = document.getElementById('pgViewerClose');
  const prevBtn = document.getElementById('pgViewerPrev');
  const nextBtn = document.getElementById('pgViewerNext');
  const vImg = document.getElementById('pgViewerImg');
  const vVideo = document.getElementById('pgViewerVideo');
  const vTitle = document.getElementById('pgViewerTitle');
  const vCat = document.getElementById('pgViewerCat');
  const vDesc = document.getElementById('pgViewerDesc');
  const vIdx = document.getElementById('pgViewerIdx');
  const vActions = document.getElementById('pgViewerActions');
  const mediaZoom = (typeof createMediaZoom === 'function') ? createMediaZoom({
    stage: document.getElementById('pgZoomStage'),
    target: vImg,
    controls: document.getElementById('pgZoomControls'),
    levelEl: document.getElementById('pgZoomLevel')
  }) : null;

  let activeFilter = 'all';
  let visibleCells = cells.slice();
  let currentIndex = -1;

  function updateCount() {
    if (totalEl) {
      const n = visibleCells.length;
      totalEl.textContent = n + (n === 1 ? ' pieza' : ' piezas');
    }
  }

  function applyFilter(key) {
    activeFilter = key;
    filterBtns.forEach((b) => b.classList.toggle('is-active', b.dataset.filter === key));

    visibleCells = [];
    sections.forEach((sec) => {
      const secKey = sec.dataset.section;
      const showSec = key === 'all' || key === secKey;
      const secCells = Array.from(sec.querySelectorAll('.pg-cell[data-title]'));
      let shown = 0;
      secCells.forEach((cell) => {
        const on = showSec;
        cell.classList.toggle('is-hidden', !on);
        cell.setAttribute('aria-hidden', on ? 'false' : 'true');
        if (on) {
          shown += 1;
          visibleCells.push(cell);
        }
      });
      sec.classList.toggle('is-hidden', !showSec || shown === 0);
    });

    // re-stagger visible
    visibleCells.forEach((c, i) => {
      c.style.setProperty('--stagger', (i % 8) * 40 + 'ms');
      c.classList.remove('is-in');
      // force reflow for re-anim when filtering
      void c.offsetWidth;
      requestAnimationFrame(() => c.classList.add('is-in'));
    });

    updateCount();
  }

  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      applyFilter(btn.dataset.filter || 'all');
      // smooth scroll to first visible section if filtered
      if ((btn.dataset.filter || 'all') !== 'all') {
        const target = document.getElementById('sec-' + btn.dataset.filter);
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        const main = document.getElementById('pgMain');
        if (main) main.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  /* sticky filter shadow on scroll */
  if (filterBar) {
    const onScroll = () => {
      filterBar.classList.toggle('is-stuck', window.scrollY > 120);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* reveal on scroll */
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );

  cells.forEach((c, i) => {
    c.style.setProperty('--stagger', (i % 8) * 45 + 'ms');
    io.observe(c);
  });
  document.querySelectorAll('.pg-section__head, .pg-hero__title, .pg-hero__sub, .pg-cell--quote').forEach((el) => {
    io.observe(el);
  });

  /* video hover play inside cells */
  document.querySelectorAll('.pg-cell video').forEach((video) => {
    const cell = video.closest('.pg-cell');
    if (!cell) return;
    cell.addEventListener('mouseenter', () => {
      video.currentTime = 0;
      video.play().catch(() => {});
    });
    cell.addEventListener('mouseleave', () => {
      video.pause();
      video.currentTime = 0;
    });
  });

  /* subtle magnetic hover on frames (desktop) */
  if (window.matchMedia('(hover: hover)').matches) {
    cells.forEach((cell) => {
      const frame = cell.querySelector('.pg-cell__frame');
      if (!frame) return;
      cell.addEventListener('mousemove', (e) => {
        const r = frame.getBoundingClientRect();
        const x = ((e.clientX - r.left) / r.width - 0.5) * 6;
        const y = ((e.clientY - r.top) / r.height - 0.5) * 6;
        frame.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) scale(1.01)`;
      });
      cell.addEventListener('mouseleave', () => {
        frame.style.transform = '';
      });
    });
  }

  function clearViewerMedia() {
    vVideo.pause();
    vVideo.removeAttribute('src');
    vVideo.load();
    vVideo.style.display = 'none';
    vImg.removeAttribute('src');
    vImg.style.display = 'none';
    if (mediaZoom) mediaZoom.setEnabled(false);
  }

  function openViewer(cell) {
    if (!viewer || !cell) return;
    visibleCells = cells.filter((c) => !c.classList.contains('is-hidden'));
    currentIndex = visibleCells.indexOf(cell);
    if (currentIndex < 0) {
      visibleCells = cells.slice();
      currentIndex = visibleCells.indexOf(cell);
    }

    const title = cell.dataset.title || '';
    const cat = cell.dataset.cat || '';
    const desc = cell.dataset.desc || '';
    const behance = cell.dataset.behance || '';
    const type = cell.dataset.type || 'image';
    const media = cell.dataset.media || '';
    const poster = cell.dataset.poster || '';
    const extraVideo = cell.dataset.video || '';
    const idxLabel = cell.querySelector('.pg-cell__idx');

    clearViewerMedia();

    let showingVideo = false;
    // Prefer explicit motion if present when opening posters with +motion
    if (type === 'video' || (extraVideo && type === 'image' && cell.querySelector('.pg-cell__badge'))) {
      const src = type === 'video' ? media : extraVideo;
      vVideo.style.display = 'block';
      if (poster) vVideo.poster = poster;
      vVideo.src = src;
      vVideo.play().catch(() => {});
      showingVideo = true;
    } else if (type === 'video') {
      vVideo.style.display = 'block';
      if (poster) vVideo.poster = poster;
      vVideo.src = media;
      vVideo.play().catch(() => {});
      showingVideo = true;
    } else {
      vImg.style.display = 'block';
      vImg.src = media;
      vImg.alt = title;
      if (mediaZoom) mediaZoom.setEnabled(!!media);
    }

    vTitle.textContent = title;
    vCat.textContent = cat;
    vDesc.textContent = desc;
    vIdx.textContent = idxLabel ? idxLabel.textContent : String(currentIndex + 1).padStart(2, '0');

    vActions.innerHTML = '';
    if (behance) {
      const a = document.createElement('a');
      a.href = behance;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.className = 'pg-viewer__link';
      a.textContent = 'Ver en Behance →';
      vActions.appendChild(a);
    }
    if (extraVideo && type !== 'video') {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'pg-viewer__link pg-viewer__link--ghost';
      b.textContent = 'Ver motion →';
      b.addEventListener('click', () => {
        vImg.style.display = 'none';
        vVideo.style.display = 'block';
        vVideo.src = extraVideo;
        vVideo.play().catch(() => {});
        if (mediaZoom) mediaZoom.setEnabled(false);
      });
      vActions.appendChild(b);
    }

    if (prevBtn) prevBtn.disabled = currentIndex <= 0;
    if (nextBtn) nextBtn.disabled = currentIndex >= visibleCells.length - 1;

    viewer.classList.add('is-open');
    viewer.setAttribute('aria-hidden', 'false');
    document.body.classList.add('pg-viewer-open');
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
  }

  function closeViewer() {
    if (!viewer) return;
    viewer.classList.remove('is-open');
    viewer.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('pg-viewer-open');
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
    clearViewerMedia();
  }

  function navigate(dir) {
    if (currentIndex < 0) return;
    const next = currentIndex + dir;
    if (next < 0 || next >= visibleCells.length) return;
    openViewer(visibleCells[next]);
  }

  cells.forEach((cell) => {
    cell.addEventListener('click', (e) => {
      e.preventDefault();
      openViewer(cell);
    });
    cell.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openViewer(cell);
      }
    });
  });

  if (closeBtn) closeBtn.addEventListener('click', closeViewer);
  if (backdrop) backdrop.addEventListener('click', closeViewer);
  if (prevBtn) prevBtn.addEventListener('click', () => navigate(-1));
  if (nextBtn) nextBtn.addEventListener('click', () => navigate(1));

  document.addEventListener('keydown', (e) => {
    if (!viewer || !viewer.classList.contains('is-open')) return;
    if (e.key === 'Escape') closeViewer();
    if (e.key === 'ArrowLeft') navigate(-1);
    if (e.key === 'ArrowRight') navigate(1);
  });

  // init
  applyFilter('all');
  // mark hero in immediately
  document.querySelectorAll('.pg-hero__title, .pg-hero__sub').forEach((el) => el.classList.add('is-in'));

  console.log('▦ Galería modular lista —', cells.length, 'piezas');
})();
