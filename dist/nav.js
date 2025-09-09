(function () {
  const nav = document.querySelector('.navbar #mainNav .menu-center[data-nav-pill]');
  if (!nav) return;

  // buat indikator bila belum ada
  let indicator = nav.querySelector('.nav-pill-indicator');
  if (!indicator) {
    indicator = document.createElement('span');
    indicator.className = 'nav-pill-indicator';
    nav.prepend(indicator);
  }

  const links = Array.from(nav.querySelectorAll('.nav-link'));
  const collapseEl = document.getElementById('mainNav');

  // pilih aktif berdasar URL
  function setActiveByURL() {
    const path = (location.pathname || '').toLowerCase();
    links.forEach(l => l.classList.remove('active'));

    // heuristik: jika mengandung 'digital-book' -> Digital Book, selain itu -> Beranda
    let target =
      path.includes('digital-book') ? links.find(l => /digital/i.test(l.textContent)) :
      links.find(l => /beranda/i.test(l.textContent));

    // fallback kalau tak ketemu
    if (!target) target = links[0];
    target.classList.add('active');
    return target;
  }

  // hitung & pindahkan indikator
  function moveTo(el){
    if (!el) return;
    // jika collapse tertutup (display:none), tunda
    const isHidden = getComputedStyle(nav).display === 'none';
    if (isHidden) return;

    const nr = nav.getBoundingClientRect();
    const lr = el.getBoundingClientRect();

    const left = lr.left - nr.left + nav.scrollLeft;
    const top  = lr.top  - nr.top  + nav.scrollTop;

    indicator.style.opacity = '1';
    indicator.style.transform = `translate(${left}px, ${top}px)`;
    indicator.style.width  = `${lr.width}px`;
    indicator.style.height = `${lr.height}px`;
  }

  let active = setActiveByURL();
  // pertama kali posisikan setelah font siap (agar ukuran akurat)
  (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(() => {
    requestAnimationFrame(() => moveTo(active));
  });

  // hover/focus: geser sementara
  links.forEach(link => {
    link.addEventListener('mouseenter', () => moveTo(link));
    link.addEventListener('focus', () => moveTo(link));

    // klik: jadikan aktif, tutup menu mobile
    link.addEventListener('click', (e) => {
      links.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      active = link;

      // ripple kecil
      const r = document.createElement('span');
      r.className = 'ripple';
      const rect = link.getBoundingClientRect();
      r.style.left = (e.clientX - rect.left) + 'px';
      r.style.top  = (e.clientY - rect.top)  + 'px';
      link.appendChild(r);
      setTimeout(() => r.remove(), 650);

      // jika di mobile: tutup collapse
      if (window.bootstrap && collapseEl) {
        (bootstrap.Collapse.getInstance(collapseEl) ||
          new bootstrap.Collapse(collapseEl, {toggle:false})
        ).hide();
      }

      // re-posisi (misal pindah halaman SPA atau anchor)
      requestAnimationFrame(() => moveTo(active));
    }, {passive:true});
  });

  // saat mouse keluar dari UL, balik ke aktif
  nav.addEventListener('mouseleave', () => moveTo(active));

  // reflow saat resize/orientasi
  const refresh = () => moveTo(active);
  window.addEventListener('resize', refresh, {passive:true});
  window.addEventListener('orientationchange', refresh);

  // ketika collapse dibuka/ditutup, hitung ulang
  collapseEl?.addEventListener('shown.bs.collapse', refresh);
  collapseEl?.addEventListener('hidden.bs.collapse', refresh);
})();

(() => {
  const links = Array.from(document.querySelectorAll('.navbar .nav-link'));
  if (!links.length) return;

  // Bootstrap collapse (mobile)
  const collapseEl = document.getElementById('mainNav');
  const bsCollapse = collapseEl
    ? bootstrap.Collapse.getOrCreateInstance(collapseEl, { toggle: false })
    : null;

  // Set active by URL (index.html vs digital-book.html)
  function setActiveByURL() {
    const path = (location.pathname || '').toLowerCase();
    const page = (path.split('/').pop() || 'index.html') || 'index.html';

    // cari link dengan href yang diakhiri nama file
    let target = links.find(a => {
      const href = (a.getAttribute('href') || '').toLowerCase();
      return href.endsWith(page);
    });

    // fallback heuristik
    if (!target) {
      if (path.includes('digital-book')) {
        target = links.find(a => /digital-book/i.test(a.getAttribute('href') || ''));
      } else {
        target = links.find(a => /index\.html$/i.test(a.getAttribute('href') || '')) || links[0];
      }
    }

    links.forEach(a => a.classList.remove('active'));
    if (target) target.classList.add('active');

    // Kick underline animation once fonts loaded (biar ukurannya akurat)
    if (document.fonts?.ready && target) {
      document.fonts.ready.then(() => {
        // trigger reflow kecil supaya background-size transisi terlihat
        target.style.backgroundSize = '0% 2px';
        requestAnimationFrame(() => target.style.backgroundSize = '100% 2px');
      });
    }
  }

  setActiveByURL();

  // Saat diklik: pindahkan active ke link tsb + tutup menu mobile
  links.forEach(link => {
    link.addEventListener('click', () => {
      links.forEach(a => a.classList.remove('active'));
      link.classList.add('active');
      if (bsCollapse) bsCollapse.hide();
    }, { passive: true });
  });

  // Jika user resize/rotate, kita biarkan CSS yang handle; tidak perlu JS extra
})();
