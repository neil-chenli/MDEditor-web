/* ============================================
   MDEditor 官网 - 前端逻辑
   ============================================ */

// Pages.dev 作为主下载源，阿里云正式站作为备用下载源。
const PRIMARY_DL_BASE = 'https://mdeditor-web.pages.dev/downloads/';
const BACKUP_DL_BASE = 'https://md.shuyu.com/downloads/';

document.addEventListener('DOMContentLoaded', () => {
  initTopbar();
  initStarlink();
  initCosmosBeams();
  initDownload();
  initAutoDownload();
  initShowcase();
  initAiDesign();
});

/* 顶栏滚动后显示分隔线 */
function initTopbar() {
  const bar = document.querySelector('.topbar');
  if (!bar) return;

  const sync = () => {
    bar.classList.toggle('is-stuck', window.scrollY > 8);
  };

  sync();
  window.addEventListener('scroll', sync, { passive: true });
}

/* 根据对象和核心的实际位置，实时生成连接线路 */
function initCosmosBeams() {
  const cosmos = document.querySelector('.cosmos');
  const core = cosmos?.querySelector('.core');
  const svg = cosmos?.querySelector('.cosmos-beams');
  if (!cosmos || !core || !svg) return;

  const sides = [
    {
      planets: [...cosmos.querySelectorAll('.orbit-in .planet')],
      staticGroup: svg.querySelector('.js-beam-in-static'),
      pulseGroup: svg.querySelector('.js-beam-in-pulse'),
      incoming: true
    },
    {
      planets: [...cosmos.querySelectorAll('.orbit-out .planet')],
      staticGroup: svg.querySelector('.js-beam-out-static'),
      pulseGroup: svg.querySelector('.js-beam-out-pulse'),
      incoming: false
    }
  ];

  const makePath = () => {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('pathLength', '526');
    return path;
  };

  sides.forEach(side => {
    side.staticGroup.replaceChildren(...side.planets.map(makePath));
    side.pulseGroup.replaceChildren(...side.planets.map(makePath));
  });

  const update = () => {
    const cosmosRect = cosmos.getBoundingClientRect();
    const coreRect = core.getBoundingClientRect();
    svg.setAttribute('viewBox', `0 0 ${Math.max(1, cosmosRect.width)} ${Math.max(1, cosmosRect.height)}`);

    sides.forEach(({ planets, staticGroup, pulseGroup, incoming }) => {
      const corePoint = {
        x: (incoming ? coreRect.left : coreRect.right) - cosmosRect.left,
        y: coreRect.top + coreRect.height / 2 - cosmosRect.top
      };

      planets.forEach((planet, index) => {
        const rect = planet.querySelector('.planet-body').getBoundingClientRect();
        const planetPoint = {
          x: (incoming ? rect.right : rect.left) - cosmosRect.left,
          y: rect.top + rect.height / 2 - cosmosRect.top
        };
        const start = incoming ? planetPoint : corePoint;
        const end = incoming ? corePoint : planetPoint;
        const direction = Math.sign(end.x - start.x) || 1;
        const bend = Math.max(42, Math.abs(end.x - start.x) * 0.42);
        const d = `M ${start.x} ${start.y} C ${start.x + bend * direction} ${start.y}, ${end.x - bend * direction} ${end.y}, ${end.x} ${end.y}`;
        staticGroup.children[index].setAttribute('d', d);
        pulseGroup.children[index].setAttribute('d', d);
      });
    });
  };

  let frame = requestAnimationFrame(function tick() {
    update();
    frame = requestAnimationFrame(tick);
  });

  document.addEventListener('visibilitychange', () => {
    cancelAnimationFrame(frame);
    if (!document.hidden) {
      frame = requestAnimationFrame(function tick() {
        update();
        frame = requestAnimationFrame(tick);
      });
    }
  });
}

let downloadInfoPromise;

/* 顶部下载按钮按当前系统直接下载对应安装包 */
function initAutoDownload() {
  const button = document.querySelector('.topbar .btn-sm');
  if (!button) return;

  button.addEventListener('click', async event => {
    event.preventDefault();
    const info = await downloadInfoPromise;
    const filename = isMacOS() ? info?.downloads?.macos : info?.downloads?.windows;
    if (!filename) return;

    const link = document.createElement('a');
    link.href = PRIMARY_DL_BASE + filename;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
  });
}

function isMacOS() {
  return /Macintosh|Mac OS X/i.test(navigator.userAgent);
}

/* 读 version.json，填下载链接和版本信息 */
async function initDownload() {
  const winBtns = document.querySelectorAll('.js-dl-win');
  const macBtns = document.querySelectorAll('.js-dl-mac');
  const winBackupBtns = document.querySelectorAll('.js-dl-win-backup');
  const macBackupBtns = document.querySelectorAll('.js-dl-mac-backup');
  const metaEls = document.querySelectorAll('.js-version');

  downloadInfoPromise = fetch('/version.json?t=' + Date.now())
    .then(res => res.ok ? res.json() : null)
    .catch(() => null);

  const info = await downloadInfoPromise;

  if (!info || !info.downloads) {
    markOff(winBtns);
    markOff(macBtns);
    markOff(winBackupBtns);
    markOff(macBackupBtns);
    metaEls.forEach(el => {
      el.textContent = '下载信息加载失败，请稍后重试';
    });
    return;
  }

  applyLink(winBtns, info.downloads.windows, PRIMARY_DL_BASE);
  applyLink(macBtns, info.downloads.macos, PRIMARY_DL_BASE);
  applyLink(winBackupBtns, info.downloads.windows, BACKUP_DL_BASE);
  applyLink(macBackupBtns, info.downloads.macos, BACKUP_DL_BASE);

  if (info.latestVersion && info.latestVersion !== 'unknown') {
    const ver = `v${info.latestVersion}`;
    [...winBtns, ...macBtns].forEach(btn => {
      const small = btn.querySelector('small');
      if (small) small.textContent = ver;
    });
    const date = info.releaseDate ? ` · ${info.releaseDate}` : '';
    metaEls.forEach(el => {
      el.textContent = `${ver}${date} · 免费下载，支持 Windows 与 macOS`;
    });
  }
}

function applyLink(nodes, filename, base) {
  if (!filename) {
    markOff(nodes);
    return;
  }
  nodes.forEach(el => {
    el.setAttribute('href', base + filename);
    el.classList.remove('is-off');
  });
}

function markOff(nodes) {
  nodes.forEach(el => {
    el.classList.add('is-off');
    el.removeAttribute('href');
  });
}

/* 第二屏的成果类型切换与横向展廊 */
async function initShowcase() {
  const showcase = document.querySelector('.showcase-section');
  if (!showcase) return;

  const modesContainer = showcase.querySelector('.showcase-modes');
  const modeTabs = [...showcase.querySelectorAll('.mode-tab')];
  const gallery = showcase.querySelector('.showcase-gallery');
  const pageGallery = showcase.querySelector('.showcase-page-empty');
  let showPpt = true;

  // 创建滑动指示器
  const indicator = document.createElement('span');
  indicator.className = 'mode-indicator';
  modesContainer.appendChild(indicator);

  const updateIndicator = (tab) => {
    const containerRect = modesContainer.getBoundingClientRect();
    const tabRect = tab.getBoundingClientRect();
    indicator.style.width = tabRect.width + 'px';
    indicator.style.transform = `translateX(${tabRect.left - containerRect.left - 4}px)`;
  };

  // 初始定位指示器
  requestAnimationFrame(() => updateIndicator(modeTabs[0]));
  window.addEventListener('resize', () => {
    const active = modesContainer.querySelector('.mode-tab.is-active');
    if (active) updateIndicator(active);
  });

  const isMobile = window.innerWidth <= 760;

  const buildMarquee = (container, images, basePath, altPrefix, options = {}) => {
    const { rows = 1, secondsPerImage = 4 } = options;
    const createCards = (subset, loading) => subset.map((name, index) => {
      const card = document.createElement('figure');
      card.className = 'showcase-card';
      const image = document.createElement('img');
      image.src = `${basePath}${encodeURIComponent(name)}`;
      image.alt = `${altPrefix}，第 ${index + 1} 张`;
      image.draggable = false;
      image.loading = loading;
      image.onerror = () => { card.style.display = 'none'; };
      card.appendChild(image);
      return card;
    });

    const buildTrack = (subset, reverse) => {
      const track = document.createElement('div');
      track.className = 'showcase-track' + (reverse ? ' showcase-track--reverse' : '');
      const original = createCards(subset, 'eager');
      const cloned = createCards(subset, 'lazy');
      cloned.forEach(c => c.setAttribute('aria-hidden', 'true'));
      original.forEach(c => track.appendChild(c));
      cloned.forEach(c => track.appendChild(c));
      track.style.setProperty('--marquee-duration', subset.length * secondsPerImage + 's');
      return track;
    };

    container.replaceChildren();

    const effectiveRows = isMobile ? 1 : rows;
    if (effectiveRows === 2 && images.length >= 2) {
      const mid = Math.ceil(images.length / 2);
      const row1 = images.slice(0, mid);
      const row2 = images.slice(mid);
      container.appendChild(buildTrack(row1, false));
      container.appendChild(buildTrack(row2, true));
    } else {
      const track = buildTrack(images, false);
      container.appendChild(track);
    }
  };

  const setMode = activeTab => {
    showPpt = activeTab.dataset.mode === 'ppt';
    modeTabs.forEach(tab => {
      const selected = tab === activeTab;
      tab.classList.toggle('is-active', selected);
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
    });
    updateIndicator(activeTab);

    if (showPpt) {
      gallery.classList.remove('is-hidden');
      pageGallery.classList.add('is-hidden');
    } else {
      gallery.classList.add('is-hidden');
      pageGallery.classList.remove('is-hidden');
    }
  };

  modeTabs.forEach((tab, index) => {
    tab.addEventListener('click', () => setMode(tab));
    tab.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      let next = event.key === 'ArrowLeft' ? index - 1 : index + 1;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = modeTabs.length - 1;
      next = (next + modeTabs.length) % modeTabs.length;
      setMode(modeTabs[next]);
      modeTabs[next].focus();
    });
  });

  // 带超时的 fetch（手机弱网保护）
  const fetchWithTimeout = (url, ms = 5000) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ms);
    return fetch(url, { signal: controller.signal })
      .then(r => { clearTimeout(timer); return r.ok ? r.json() : null; })
      .catch(() => { clearTimeout(timer); return null; });
  };

  // 硬编码兜底图片列表（manifest.json 加载失败时使用）
  const FALLBACK_PPT = ["ppt1.jpg","ppt2.jpg","ppt3.jpg","ppt4.jpg","PPT5.jpg","ppt6.jpg","ppt7.jpg","ppt8.jpg","ppt9.jpg","ppt10.jpg","ppt11.jpg","ppt12.jpg","ppt13.jpg","ppt14.jpg","ppt15.jpg","ppt16.jpg"];

  // 并行加载 PPT 和 Page
  const cacheBust = Date.now();
  const [pptResult, pageResult] = await Promise.allSettled([
    fetchWithTimeout('assets/showcase/ppt/manifest.json?t=' + cacheBust),
    fetchWithTimeout('assets/showcase/Page/manifest.json?t=' + cacheBust)
  ]);

  // PPT
  const pptManifest = pptResult.status === 'fulfilled' ? pptResult.value : null;
  let pptImages = pptManifest && Array.isArray(pptManifest.images) ? pptManifest.images.filter(n => typeof n === 'string') : [];
  if (!pptImages.length) pptImages = FALLBACK_PPT;
  if (pptImages.length) {
    gallery.classList.add('showcase-gallery--ppt');
    buildMarquee(gallery, pptImages, 'assets/showcase/ppt/', 'AI PPT 设计成果预览', { rows: 2, secondsPerImage: isMobile ? 3 : 8 });
  } else {
    gallery.innerHTML = '<div class="showcase-gallery-status">暂无可展示的 AI PPT 成果。</div>';
  }

  // Page
  const pageManifest = pageResult.status === 'fulfilled' ? pageResult.value : null;
  const pageImages = pageManifest && Array.isArray(pageManifest.images) ? pageManifest.images.filter(n => typeof n === 'string') : [];
  if (pageImages.length) {
    pageGallery.className = 'showcase-gallery showcase-gallery--page is-hidden';
    buildMarquee(pageGallery, pageImages, 'assets/showcase/Page/', 'AI Page 设计成果预览', { secondsPerImage: isMobile ? 3 : 8 });
  }
}

/* 第三屏的叠层舞台与自然语言循环演示 */
function initAiDesign() {
  const section = document.querySelector('.ai-design-section');
  if (!section) return;

  const composerText = section.querySelector('.ai-composer .ai-command-text');
  const messages = [...section.querySelectorAll('.ai-chat-message')];
  const raw = section.querySelector('[data-result="raw"]');
  const cards = section.querySelector('[data-result="cards"]');
  const state = section.querySelector('.ai-result-state');
  const sendButton = section.querySelector('.ai-send-button');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let runId = 0;
  let isVisible = false;

  const wait = delay => new Promise(resolve => window.setTimeout(resolve, delay));
  const reset = () => {
    composerText.textContent = '';
    messages.forEach(message => message.classList.remove('is-visible'));
    raw.classList.add('is-visible');
    cards.classList.remove('is-visible', 'has-icons');
    state.textContent = 'Ready';
  };
  const typeAndSend = async (text, message, id) => {
    composerText.textContent = '';
    for (const character of text) {
      if (id !== runId || !isVisible) return false;
      composerText.textContent += character;
      await wait(68);
    }
    sendButton.classList.remove('is-sending');
    void sendButton.offsetWidth;
    sendButton.classList.add('is-sending');
    await wait(320);
    if (id !== runId || !isVisible) return false;
    composerText.textContent = '';
    message.classList.add('is-visible');
    return true;
  };
  const showCards = async id => {
    if (id !== runId || !isVisible) return false;
    state.textContent = 'Designing';
    raw.classList.remove('is-visible');
    await wait(180);
    cards.classList.add('is-visible');
    await wait(700);
    state.textContent = 'Updated';
    return id === runId && isVisible;
  };
  const showIcons = async id => {
    if (id !== runId || !isVisible) return false;
    state.textContent = 'Designing';
    await wait(220);
    cards.classList.add('has-icons');
    await wait(700);
    state.textContent = 'Updated';
    return id === runId && isVisible;
  };
  const play = async () => {
    const id = ++runId;
    reset();
    if (reduceMotion) {
      messages.forEach(message => message.classList.add('is-visible'));
      raw.classList.remove('is-visible');
      cards.classList.add('is-visible', 'has-icons');
      state.textContent = 'Updated';
      return;
    }
    await wait(650);
    if (!await typeAndSend('把内容设计为卡片', messages[0], id)) return;
    if (!await showCards(id)) return;
    await wait(1250);
    if (!await typeAndSend('增加 SVG 图标进行点缀', messages[1], id)) return;
    if (!await showIcons(id)) return;
    await wait(3000);
    if (id === runId && isVisible) play();
  };
  const observer = new IntersectionObserver(entries => {
    const visible = entries[0]?.isIntersecting ?? false;
    if (visible === isVisible) return;
    isVisible = visible;
    if (visible) play();
    else runId += 1;
  }, { threshold: 0.35 });
  observer.observe(section);
}

/* 星链粒子背景动画 */
function initStarlink() {
  const container = document.querySelector('.starfield');
  if (!container) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const canvas = document.createElement('canvas');
  container.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  const COLORS = [
    [230, 180, 50],   // 金黄
    [69, 224, 232],   // 青
    [80, 200, 120],   // 绿
    [122, 162, 255],  // 蓝
    [155, 108, 255],  // 紫
  ];

  const COUNT = Math.min(25, Math.round(window.innerWidth / 60));
  const LINK_DIST = 180;
  const SPEED = 0.12;
  let w, h, dpr;
  const particles = [];
  let time = 0;

  function resize() {
    dpr = window.devicePixelRatio || 1;
    w = container.clientWidth;
    h = container.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function createParticles() {
    particles.length = 0;
    for (let i = 0; i < COUNT; i++) {
      const color = COLORS[Math.floor(Math.random() * COLORS.length)];
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * SPEED,
        vy: (Math.random() - 0.5) * SPEED,
        r: Math.random() * 2.5 + 2,
        blur: Math.random() * 3 + 1,
        color,
        phase: Math.random() * Math.PI * 2,
        pulseSpeed: 0.005 + Math.random() * 0.008
      });
    }
  }

  let mouse = { x: -9999, y: -9999 };
  const hero = document.querySelector('.hero');
  hero.addEventListener('mousemove', e => {
    const rect = container.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  });
  hero.addEventListener('mouseleave', () => {
    mouse.x = -9999;
    mouse.y = -9999;
  });

  function draw() {
    ctx.clearRect(0, 0, w, h);
    time++;

    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < -10) p.x = w + 10;
      if (p.x > w + 10) p.x = -10;
      if (p.y < -10) p.y = h + 10;
      if (p.y > h + 10) p.y = -10;
      p.alpha = 0.12 + 0.25 * (0.5 + 0.5 * Math.sin(time * p.pulseSpeed + p.phase));
    }

    // 连线
    ctx.lineCap = 'round';
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const a = particles[i], b = particles[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < LINK_DIST) {
          const strength = (1 - dist / LINK_DIST);
          const alpha = strength * 0.18 * Math.min(a.alpha, b.alpha);
          const grad = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
          grad.addColorStop(0, `rgba(${a.color[0]},${a.color[1]},${a.color[2]},${alpha})`);
          grad.addColorStop(1, `rgba(${b.color[0]},${b.color[1]},${b.color[2]},${alpha})`);
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = grad;
          ctx.lineWidth = strength * 0.6;
          ctx.stroke();
        }
      }
    }

    // 鼠标连线
    const MOUSE_DIST = 170;
    for (const p of particles) {
      const dx = p.x - mouse.x;
      const dy = p.y - mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < MOUSE_DIST) {
        const strength = 1 - dist / MOUSE_DIST;
        const alpha = strength * 0.55;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(mouse.x, mouse.y);
        ctx.strokeStyle = `rgba(${p.color[0]},${p.color[1]},${p.color[2]},${alpha})`;
        ctx.lineWidth = strength * 1.2;
        ctx.stroke();
      }
    }

    // 粒子光球
    for (const p of particles) {
      const [r, g, b] = p.color;
      // 外圈发光环
      const ringRadius = p.r * 6;
      const ring = ctx.createRadialGradient(p.x, p.y, ringRadius * 0.55, p.x, p.y, ringRadius);
      ring.addColorStop(0, `rgba(${r},${g},${b},${p.alpha * 0.12})`);
      ring.addColorStop(0.5, `rgba(${r},${g},${b},${p.alpha * 0.06})`);
      ring.addColorStop(1, `rgba(${r},${g},${b},0)`);
      ctx.beginPath();
      ctx.arc(p.x, p.y, ringRadius, 0, Math.PI * 2);
      ctx.fillStyle = ring;
      ctx.fill();
      // 内层辉光
      const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 3);
      glow.addColorStop(0, `rgba(${r},${g},${b},${p.alpha * 0.5})`);
      glow.addColorStop(0.5, `rgba(${r},${g},${b},${p.alpha * 0.1})`);
      glow.addColorStop(1, `rgba(${r},${g},${b},0)`);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * 3, 0, Math.PI * 2);
      ctx.fillStyle = glow;
      ctx.fill();
      // 核心实心点
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${r},${g},${b},${p.alpha * 0.9})`;
      ctx.fill();
    }

    requestAnimationFrame(draw);
  }

  resize();
  createParticles();
  draw();

  window.addEventListener('resize', () => {
    resize();
    createParticles();
  });
}
