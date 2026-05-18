document.addEventListener('DOMContentLoaded', async () => {
  const addParticleEffect = () => {
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:0;opacity:0.5;display:block;';
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    const particles = [];
    const particleCount = 30;
    let animationId = null;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();

    let resizeTimer = null;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 150);
    });

    class Particle {
      constructor() {
        this.reset();
      }
      reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2 + 0.5;
        this.speedX = (Math.random() - 0.5) * 0.3;
        this.speedY = (Math.random() - 0.5) * 0.3;
        this.opacity = Math.random() * 0.5 + 0.2;
      }
      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) {
          this.reset();
        }
      }
      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(80, 80, 80, ${this.opacity})`;
        ctx.fill();
      }
    }

    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.update();
        p.draw();
      });
      animationId = requestAnimationFrame(animate);
    };

    const start = () => {
      if (!animationId) animate();
    };

    const stop = () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
      }
    };

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        stop();
      } else {
        start();
      }
    });

    start();
  };

  addParticleEffect();

  const isMobile = () => {
    const ua = navigator.userAgent.toLowerCase();
    return /android|iphone|ipod|opera mini|iemobile|windows phone/i.test(ua) ||
           (navigator.maxTouchPoints > 1 && /mac/i.test(ua) && window.innerWidth < 768);
  };

  const showToast = (message) => {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('visible');
    setTimeout(() => toast.classList.remove('visible'), 2500);
  };

  const loadVersionInfo = async () => {
    try {
      const response = await fetch('/version.json?t=' + Date.now());
      if (!response.ok) return null;
      return await response.json();
    } catch {
      return null;
    }
  };

  const versionInfo = await loadVersionInfo();

  if (versionInfo) {
    const windowsBtn = document.querySelector('.download-btn.windows-btn');
    const macBtn = document.querySelector('.download-btn.macos-btn');

    if (windowsBtn && versionInfo.downloads.windows) {
      windowsBtn.setAttribute('href', 'downloads/' + versionInfo.downloads.windows);
    }
    if (macBtn && versionInfo.downloads.macos) {
      macBtn.setAttribute('href', 'downloads/' + versionInfo.downloads.macos);
    }

    // 更新 Windows 版本信息
    const windowsVersionEl = document.querySelector('.windows-version');
    if (windowsVersionEl) {
      const windowsFile = versionInfo.files.find(f => f.platform === 'windows' && f.filename === versionInfo.downloads.windows);
      if (windowsFile) {
        const versionEl = windowsVersionEl.querySelector('.version-number');
        const dateEl = windowsVersionEl.querySelector('.version-date');
        
        if (versionEl) {
          versionEl.textContent = windowsFile.version !== 'unknown' ? 'v' + windowsFile.version : 'v1.0.17';
        }
        if (dateEl) {
          const date = new Date(windowsFile.modified);
          dateEl.textContent = date.getFullYear() + '-' + (date.getMonth() + 1) + '.' + date.getDate();
        }
      }
    }

    // 更新 macOS 版本信息
    const macosVersionEl = document.querySelector('.macos-version');
    if (macosVersionEl) {
      const macFile = versionInfo.files.find(f => f.platform === 'macos' && f.filename === versionInfo.downloads.macos);
      if (macFile) {
        const versionEl = macosVersionEl.querySelector('.version-number');
        const dateEl = macosVersionEl.querySelector('.version-date');
        
        if (versionEl) {
          versionEl.textContent = macFile.version !== 'unknown' ? 'v' + macFile.version : 'v1.0.17';
        }
        if (dateEl) {
          const date = new Date(macFile.modified);
          dateEl.textContent = date.getFullYear() + '-' + (date.getMonth() + 1) + '.' + date.getDate();
        }
      }
    }
  }

  document.querySelectorAll('.download-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      if (isMobile()) {
        e.preventDefault();
        showToast('本产品为桌面端应用，请在电脑上使用');
        return;
      }

      const href = btn.getAttribute('href');
      try {
        const response = await fetch(href, { method: 'HEAD' });
        if (!response.ok) {
          e.preventDefault();
          showToast('下载文件暂未上传，请稍后再试');
        }
      } catch {
        e.preventDefault();
        showToast('网络请求失败，请检查网络连接');
      }
    });
  });
});
