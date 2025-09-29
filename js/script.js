(() => {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    initSkillSwiper();
    initSkillGauges();
    initProjectAccordion();
    initProjectReadmeButton();

    initTopButtonReveal();
    initNavSmoothScroll();
    initHeaderSmart();

    initNavTapEffect();
  });

  function initSkillSwiper() {
    if (!window.Swiper) return;
    new Swiper('.skill-swiper', {
      loop: true,
      slidesPerView: 12,
      speed: 2000,
      allowTouchMove: true,
      autoplay: { delay: 0, disableOnInteraction: false }
    });
  }

  function initSkillGauges() {
    const gauges = document.querySelectorAll('.explan .gauge');
    if (!gauges.length) return;

    const DURATION = 2000;
    const ease = t => 1 - Math.pow(1 - t, 3);
    let hasAnimated = false;

    function getLen(circle) {
      try {
        const v = circle.getTotalLength();
        if (isFinite(v) && v > 0) return v;
      } catch { }
      const rAttr = circle.getAttribute('r') || '0';
      const svg = circle.ownerSVGElement;
      const { width, height } = svg.getBoundingClientRect();
      const rPx = String(rAttr).endsWith('%')
        ? (parseFloat(rAttr) / 100) * (Math.min(width, height) / 2)
        : parseFloat(rAttr);
      return 2 * Math.PI * rPx;
    }

    function animateNumber(el, target) {
      const t0 = performance.now();
      function f(now) {
        const p = Math.min((now - t0) / DURATION, 1);
        el.textContent = `${Math.round(target * ease(p))}%`;
        if (p < 1) requestAnimationFrame(f);
      }
      requestAnimationFrame(f);
    }

    function startGaugeAnimation() {
      if (hasAnimated) return;
      hasAnimated = true;

      gauges.forEach((gauge, idx) => {
        const raw = parseInt(gauge.dataset.percent, 10);
        const percent = Number.isFinite(raw) ? Math.max(0, Math.min(100, raw)) : 0;

        const progress = gauge.querySelector('.progress');
        const bg = gauge.querySelector('.bg');
        const percentEl = gauge.querySelector('.percent');
        const labelEl = gauge.querySelector('.label');
        if (labelEl) labelEl.textContent = gauge.dataset.label || '';

        ['cx', 'cy', 'r'].forEach((attr) => {
          if (progress && !progress.getAttribute(attr)) {
            progress.setAttribute(attr, attr === 'r' ? '45%' : '50%');
          }
          if (bg && !bg.getAttribute(attr)) {
            bg.setAttribute(attr, attr === 'r' ? '45%' : '50%');
          }
        });

        setTimeout(() => {
          if (!progress) return;
          const len = getLen(progress);
          progress.style.transition = 'none';
          progress.style.strokeDasharray = `${len}`;
          progress.style.strokeDashoffset = `${len}`;
          progress.getBoundingClientRect();
          progress.style.transition = `stroke-dashoffset ${DURATION}ms cubic-bezier(0.22,1,0.36,1)`;
          requestAnimationFrame(() => {
            const finalOffset = len * (1 - percent / 100);
            progress.style.strokeDashoffset = `${finalOffset}`;
          });
          if (percentEl) animateNumber(percentEl, percent);
          if (percent === 100 && bg) {
            const onEnd = () => {
              const c = getComputedStyle(progress).stroke;
              bg.style.transition = 'stroke 200ms linear';
              bg.style.stroke = c;
              progress.removeEventListener('transitionend', onEnd);
            };
            progress.addEventListener('transitionend', onEnd);
          }
        }, idx * 200);
      });
    }

    const observer = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting && !hasAnimated) startGaugeAnimation();
      }),
      { root: null, rootMargin: '-300px 0px 0px 0px', threshold: 0 }
    );

    const skillSection = document.querySelector('#skill');
    if (skillSection) observer.observe(skillSection);

    Object.defineProperty(window, 'triggerSkillAnimation', {
      value: startGaugeAnimation, configurable: true, enumerable: false, writable: false
    });
  }

  function initProjectAccordion() {
    const root = document.getElementById('project');
    if (!root) return;

    const articles = root.querySelectorAll(':scope > article');
    if (!articles.length) return;

    const closeOthers = (except) => {
      articles.forEach((a) => {
        if (a !== except && a.getAttribute('aria-expanded') === 'true' && a._acc && typeof a._acc.close === 'function') {
          a._acc.close();
        }
      });
    };

    articles.forEach((article, index) => {
      if (article.dataset.accInit === '1') return;
      article.dataset.accInit = '1';
      if (!article.hasAttribute('tabindex')) article.setAttribute('tabindex', '0');
      article.setAttribute('aria-expanded', 'false');

      const h2 = article.querySelector(':scope > h2');
      const panel = article.querySelector(':scope > div');
      const cat = article.querySelector(':scope > img[alt="pageBtn"], :scope > img[alt="pagebtn"]');

      if (h2) {
        const hid = h2.id || `proj_h_${index}`;
        if (!h2.id) h2.id = hid;
        if (panel) {
          panel.setAttribute('role', 'region');
          panel.setAttribute('aria-labelledby', hid);
        }
      }

      if (panel) {
        panel.hidden = true;
        panel.style.maxHeight = '0px';
      }

      if (cat) {
        const href = cat.dataset.href || cat.dataset.demo || article.dataset.demo;
        if (href) {
          cat.style.cursor = 'pointer';
          cat.addEventListener('click', (e) => {
            e.stopPropagation();
            window.open(href, '_blank', 'noopener,noreferrer');
          });
        } else {
          cat.addEventListener('click', (e) => e.stopPropagation());
        }
      }

      const open = () => {
        if (!panel) return;
        panel.hidden = false;
        article.classList.add('is_open');
        article.setAttribute('aria-expanded', 'true');
        panel.style.maxHeight = `${panel.scrollHeight}px`;
        const onEnd = () => {
          panel.style.maxHeight = 'none';
          panel.removeEventListener('transitionend', onEnd);
        };
        panel.addEventListener('transitionend', onEnd);
      };

      const close = () => {
        if (!panel) return;
        const current = panel.getBoundingClientRect().height;
        panel.style.maxHeight = `${current}px`;
        requestAnimationFrame(() => { panel.style.maxHeight = '0px'; });
        const onEnd = () => {
          panel.hidden = true;
          article.classList.remove('is_open');
          article.setAttribute('aria-expanded', 'false');
          panel.removeEventListener('transitionend', onEnd);
        };
        panel.addEventListener('transitionend', onEnd);
      };

      article._acc = { open, close };

      const toggle = () => {
        const expanded = article.getAttribute('aria-expanded') === 'true';
        if (expanded) {
          close();
        } else {
          closeOthers(article);
          open();
        }
      };

      article.addEventListener('click', toggle, { passive: true });
      article.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
        if (e.key === 'Escape' && article.getAttribute('aria-expanded') === 'true') { close(); }
      });
    });
  }

  function initProjectReadmeButton() {
    const root = document.getElementById('project');
    if (!root) return;

    const href = root.dataset.readme;
    if (!href) return;

    const btn = document.createElement('a');
    btn.className = 'sh_readme_btn';
    btn.href = href;
    btn.target = '_blank';
    btn.rel = 'noopener noreferrer';
    btn.setAttribute('aria-label', 'README로 이동');
    btn.textContent = 'README';
    root.appendChild(btn);

    let ticking = false;
    let shown = false;

    const update = () => {
      ticking = false;
      const rect = root.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;
      const inView = rect.top < vh * 0.6 && rect.bottom > vh * 0.3;
      if (inView && !shown) {
        btn.classList.add('is_show');
        shown = true;
      } else if (!inView && shown) {
        btn.classList.remove('is_show');
        shown = false;
      }
    };

    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    update();
  }

  function initTopButtonReveal() {
    const topBtn = document.getElementById('topBtn');
    const skill = document.getElementById('skill');
    if (!topBtn || !skill) return;

    const header = document.querySelector('header');

    const triggerY = () => {
      const y = skill.getBoundingClientRect().top + window.pageYOffset;
      const hdrOn = document.body.classList.contains('sh_hdr_ready');
      const h = (hdrOn && header) ? header.offsetHeight : 0;
      return Math.max(0, y - h);
    };

    let th = triggerY();
    let ticking = false;

    const update = () => {
      ticking = false;
      if (window.pageYOffset >= th) {
        topBtn.classList.add('is_show');
      } else {
        topBtn.classList.remove('is_show');
      }
    };

    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    };

    const recalc = () => { th = triggerY(); update(); };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', () => { recalc(); onScroll(); }, { passive: true });
    recalc();
  }

  function initNavSmoothScroll() {
    const header = document.querySelector('header');
    const links = document.querySelectorAll('header nav a[href^="#"], #topBtn a[href^="#"]');
    if (!links.length) return;

    function offsetTopFor(el) {
      const y = el.getBoundingClientRect().top + window.pageYOffset;
      const needOffset = document.body.classList.contains('sh_hdr_ready');
      const h = (needOffset && header) ? header.offsetHeight : 0;
      return Math.max(0, y - h - 8);
    }

    function smoothTo(target) {
      const el = document.querySelector(target);
      if (!el) return;
      window.scrollTo({ top: offsetTopFor(el), behavior: 'smooth' });
    }

    links.forEach(a => {
      a.addEventListener('click', (e) => {
        const href = a.getAttribute('href') || '';
        if (href.startsWith('#')) {
          e.preventDefault();
          smoothTo(href);
        }
      });
    });
  }

  function initHeaderSmart() {
    const header = document.querySelector('header');
    const about = document.getElementById('about');
    if (!header || !about) return;

    const readyAt = () => about.getBoundingClientRect().top + window.pageYOffset;
    let lastY = window.pageYOffset;
    let idleTimer = null;

    function setState(ready, idle) {
      document.body.classList.toggle('sh_hdr_ready', !!ready);
      document.body.classList.toggle('sh_hdr_idle', !!idle);
    }

    function onScroll() {
      const y = window.pageYOffset;
      const ready = y >= (readyAt() - (header.offsetHeight || 0));
      setState(ready, false);

      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        setState(ready, true);
      }, 160);

      lastY = y;
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    onScroll();
  }

  function initNavTapEffect() {
    const links = document.querySelectorAll('header nav a');
    if (!links.length) return;
    links.forEach(a => {
      const off = () => a.classList.remove('is_nav_pressed');
      a.addEventListener('pointerdown', () => a.classList.add('is_nav_pressed'));
      a.addEventListener('pointerup', off);
      a.addEventListener('pointercancel', off);
      a.addEventListener('mouseleave', off);
      a.addEventListener('blur', off);
      a.addEventListener('click', () => {
        setTimeout(off, 150);
      });
    });
  }
})();
