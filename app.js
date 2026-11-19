/**
 * BALANCE BITE — Clean Immersive Scroll Animation Engine
 * 190 pristine 1080p Master Quality frames (99% JPEG quality).
 * No HUD, no chapters, no overlays — pure cinematic scroll experience.
 */

(function () {
  'use strict';

  // --- CONFIGURATION ---
  const START_FRAME = 1;
  const END_FRAME = 190;
  const TOTAL_FRAMES = END_FRAME - START_FRAME + 1;
  const FRAME_DIR = 'Ingredients_filling_wooden_bowl_8cbfab86_1080p_frames';

  // --- DOM ELEMENTS ---
  const preloader = document.getElementById('preloader');
  const preloaderBar = document.getElementById('preloader-bar');
  const preloaderPercent = document.getElementById('preloader-percent');
  const preloaderCount = document.getElementById('preloader-count');
  const preloaderSkipBtn = document.getElementById('preloader-skip-btn');

  const canvas = document.getElementById('animation-canvas') || document.createElement('canvas');
  canvas.id = 'animation-canvas';
  // Keep the frame sequence behind the whole site, not clipped to the intro section.
  if (canvas.parentElement !== document.body) document.body.prepend(canvas);
  const ctx = canvas.getContext('2d', { alpha: false });
  const scrollTrack = document.getElementById('scroll-track');

  const heroOverlay = document.getElementById('initial-hero-overlay');

  // --- STATE ---
  const images = new Array(TOTAL_FRAMES);
  let loadedCount = 0;
  let isReady = false;

  let currentProgress = 0;
  let targetProgress = 0;
  let currentRenderedFrame = -1;

  // --- HELPER: FRAME PATH GENERATOR ---
  function getFramePath(index) {
    const frameNum = START_FRAME + index;
    const padded = String(frameNum).padStart(3, '0');
    return `${FRAME_DIR}/frame_${padded}.jpg`;
  }

  function applyHighQualityContext() {
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
  }

  // --- 1. PRELOADING MASTER FRAMES ---
  function initPreloader() {
    let initialRendered = false;

    const firstImg = new Image();
    firstImg.src = getFramePath(0);
    images[0] = firstImg;
    firstImg.onload = () => {
      loadedCount++;
      updatePreloaderProgress();
      if (!initialRendered) {
        initialRendered = true;
        renderFrame(0, true);
      }
    };

    const remainingIndices = Array.from({ length: TOTAL_FRAMES - 1 }, (_, i) => i + 1);
    const BATCH_SIZE = 16;
    let activeIndex = 0;

    function loadNext() {
      if (activeIndex >= remainingIndices.length) return;
      const index = remainingIndices[activeIndex++];
      const img = new Image();
      img.src = getFramePath(index);
      img.onload = () => {
        images[index] = img;
        loadedCount++;
        updatePreloaderProgress();
        loadNext();
      };
      img.onerror = () => {
        images[index] = images[index - 1] || firstImg;
        loadedCount++;
        updatePreloaderProgress();
        loadNext();
      };
    }

    for (let i = 0; i < BATCH_SIZE; i++) {
      loadNext();
    }
  }

  function updatePreloaderProgress() {
    if (!preloaderBar || !preloaderPercent || !preloaderCount) return;
    const percent = Math.min(100, Math.round((loadedCount / TOTAL_FRAMES) * 100));
    preloaderBar.style.width = `${percent}%`;
    preloaderPercent.textContent = `${percent}%`;
    preloaderCount.textContent = `${loadedCount} / ${TOTAL_FRAMES}`;

    if (loadedCount >= 30 && preloaderSkipBtn.style.display !== 'inline-block') {
      preloaderSkipBtn.style.display = 'inline-block';
    }

    if (loadedCount >= TOTAL_FRAMES) {
      finishLoading();
    }
  }

  function finishLoading() {
    if (isReady) return;
    isReady = true;
    setTimeout(() => {
      if (preloader) preloader.classList.add('loaded');
      renderFrame(0, true);
    }, 200);
  }

  if (preloaderSkipBtn) preloaderSkipBtn.addEventListener('click', finishLoading);

  // --- 2. HIGH-DPI CANVAS RENDERING ---
  function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = window.innerWidth;
    const height = window.innerHeight;

    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);

    applyHighQualityContext();

    if (currentRenderedFrame >= 0) {
      renderFrame(currentRenderedFrame, true);
    }
  }

  window.addEventListener('resize', resizeCanvas, { passive: true });
  window.addEventListener('orientationchange', resizeCanvas, { passive: true });

  function renderFrame(frameIndex, forceRedraw = false) {
    if (!forceRedraw && frameIndex === currentRenderedFrame) return;

    const img = images[frameIndex];
    if (!img || !img.complete || img.naturalWidth === 0) return;

    currentRenderedFrame = frameIndex;

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    const imgWidth = img.naturalWidth || 1920;
    const imgHeight = img.naturalHeight || 1080;

    const imgRatio = imgWidth / imgHeight;
    const canvasRatio = canvasWidth / canvasHeight;

    let drawW, drawH, drawX, drawY;

    // 'cover' mode — fill the entire viewport, no black bars
    if (canvasRatio > imgRatio) {
      drawW = canvasWidth;
      drawH = canvasWidth / imgRatio;
      drawX = 0;
      drawY = (canvasHeight - drawH) / 2;
    } else {
      drawH = canvasHeight;
      drawW = canvasHeight * imgRatio;
      drawX = (canvasWidth - drawW) / 2;
      drawY = 0;
    }

    applyHighQualityContext();

    ctx.fillStyle = '#0c0d0e';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    ctx.drawImage(img, drawX, drawY, drawW, drawH);
  }

  // --- 3. SCROLL INTERACTION & LERP ENGINE ---
  function computeScrollProgress() {
    if (!scrollTrack) {
      const scrollableDistance = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollableDistance <= 0) return 0;
      return Math.max(0, Math.min(1, window.scrollY / scrollableDistance));
    }
    const rect = scrollTrack.getBoundingClientRect();
    const scrollableDistance = scrollTrack.offsetHeight - window.innerHeight;
    if (scrollableDistance <= 0) return 0;

    const progress = -rect.top / scrollableDistance;
    return Math.max(0, Math.min(1, progress));
  }

  window.addEventListener('scroll', () => {
    targetProgress = computeScrollProgress();
  }, { passive: true });

  // --- 4. UI STATE UPDATES (keep the brand over the frame sequence) ---
  function updateUIState(progress) {
    // Keep the large brand name visible over every animation frame.
    if (heroOverlay) {
      heroOverlay.classList.toggle('animating', progress > 0);
    }
  }

  // --- 5. ANIMATION LOOP ---
  function animate() {
    const lerpFactor = 0.12;
    const diff = targetProgress - currentProgress;

    if (Math.abs(diff) > 0.0001) {
      currentProgress += diff * lerpFactor;
    } else {
      currentProgress = targetProgress;
    }

    const frameIndex = Math.min(
      TOTAL_FRAMES - 1,
      Math.max(0, Math.round(currentProgress * (TOTAL_FRAMES - 1)))
    );

    renderFrame(frameIndex);
    updateUIState(currentProgress);

    requestAnimationFrame(animate);
  }

  // --- INITIALIZE ---
  resizeCanvas();
  initPreloader();
  requestAnimationFrame(animate);

})();
