/* ============================================
   MDEditor 官网 - 前端逻辑
   ============================================ */

// 下载地址前缀。
// CDN 未就绪时用相对路径；download.shuyu.com 通了之后
// 改成 'https://download.shuyu.com/' 即可，其他代码不用动。
const DL_BASE = 'downloads/';

document.addEventListener('DOMContentLoaded', () => {
  initTopbar();
  initCosmosBeams();
  initDownload();
  initAutoDownload();
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

  downloadInfoPromise = fetch('version.json?t=' + Date.now())
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
