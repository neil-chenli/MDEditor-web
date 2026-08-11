/* ============================================
   MDEditor 官网 - 前端逻辑
   ============================================ */

// 下载地址前缀。
// CDN 未就绪时用相对路径；download.shuyu.com 通了之后
// 改成 'https://download.shuyu.com/' 即可，其他代码不用动。
const DL_BASE = '/downloads/';

document.addEventListener('DOMContentLoaded', () => {
  initTopbar();
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
    link.href = DL_BASE + filename;
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
  const metaEls = document.querySelectorAll('.js-version');

  downloadInfoPromise = fetch('/version.json?t=' + Date.now())
    .then(res => res.ok ? res.json() : null)
    .catch(() => null);

  const info = await downloadInfoPromise;

  if (!info || !info.downloads) {
    markOff(winBtns);
    markOff(macBtns);
    metaEls.forEach(el => {
      el.textContent = '下载信息加载失败，请稍后重试';
    });
    return;
  }

  applyLink(winBtns, info.downloads.windows);
  applyLink(macBtns, info.downloads.macos);

  if (info.latestVersion && info.latestVersion !== 'unknown') {
    const date = info.releaseDate ? ` · ${info.releaseDate}` : '';
    metaEls.forEach(el => {
      el.textContent = `v${info.latestVersion}${date} · 免费下载，支持 Windows 与 macOS`;
    });
  }
}

function applyLink(nodes, filename) {
  if (!filename) {
    markOff(nodes);
    return;
  }
  nodes.forEach(el => {
    el.setAttribute('href', DL_BASE + filename);
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

  const buildMarquee = (container, images, basePath, altPrefix, options = {}) => {
    const { rows = 1, secondsPerImage = 4 } = options;
    const createCards = (subset) => subset.map((name, index) => {
      const card = document.createElement('figure');
      card.className = 'showcase-card';
      const image = document.createElement('img');
      image.src = `${basePath}${encodeURIComponent(name)}`;
      image.alt = `${altPrefix}，第 ${index + 1} 张`;
      image.draggable = false;
      image.loading = 'lazy';
      card.appendChild(image);
      return card;
    });

    const buildTrack = (subset, reverse) => {
      const track = document.createElement('div');
      track.className = 'showcase-track' + (reverse ? ' showcase-track--reverse' : '');
      const original = createCards(subset);
      const cloned = createCards(subset);
      cloned.forEach(c => c.setAttribute('aria-hidden', 'true'));
      original.forEach(c => track.appendChild(c));
      cloned.forEach(c => track.appendChild(c));
      track.style.setProperty('--marquee-duration', subset.length * secondsPerImage + 's');
      return track;
    };

    container.replaceChildren();

    if (rows === 2 && images.length >= 2) {
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

  // 加载 PPT
  try {
    const res = await fetch('assets/showcase/ppt/manifest.json?t=' + Date.now());
    if (!res.ok) throw new Error('ppt manifest failed');
    const manifest = await res.json();
    const images = Array.isArray(manifest.images) ? manifest.images.filter(n => typeof n === 'string') : [];
    if (images.length) {
      gallery.classList.add('showcase-gallery--ppt');
      buildMarquee(gallery, images, 'assets/showcase/ppt/', 'AI PPT 设计成果预览', { rows: 2, secondsPerImage: 8 });
    }
    else gallery.innerHTML = '<div class="showcase-gallery-status">暂无可展示的 AI PPT 成果。</div>';
  } catch {
    gallery.innerHTML = '<div class="showcase-gallery-status">暂无可展示的 AI PPT 成果。</div>';
  }

  // 加载 Page
  try {
    const res = await fetch('assets/showcase/Page/manifest.json?t=' + Date.now());
    if (!res.ok) throw new Error('page manifest failed');
    const manifest = await res.json();
    const images = Array.isArray(manifest.images) ? manifest.images.filter(n => typeof n === 'string') : [];
    if (images.length) {
      pageGallery.className = 'showcase-gallery showcase-gallery--page is-hidden';
      buildMarquee(pageGallery, images, 'assets/showcase/Page/', 'AI Page 设计成果预览', { secondsPerImage: 8 });
    }
  } catch {
    // Page 加载失败保持空状态
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
