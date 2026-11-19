/**
 * BALANCE BITE — Clean Immersive Scroll Animation Engine
 * 190 1080p frames, streamed into a bounded cache for mobile memory safety.
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
  const queuedFrames = new Set();
  const MAX_ACTIVE_LOADS = window.matchMedia('(max-width: 768px)').matches ? 3 : 6;
  const MAX_CACHED_FRAMES = window.matchMedia('(max-width: 768px)').matches ? 8 : 16;
  let loadedCount = 0;
  let activeLoads = 0;
  let isReady = false;

  let currentProgress = 0;
  let targetProgress = 0;
  let currentRenderedFrame = -1;
  let desiredFrameIndex = 0;

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

  // --- 1. ON-DEMAND FRAME LOADING ---
  function trimFrameCache() {
    const cached = [];
    images.forEach((img, index) => {
      if (img && img.complete && img.naturalWidth) cached.push(index);
    });
    while (cached.length > MAX_CACHED_FRAMES) {
      let farthestPosition = -1;
      let farthestDistance = -1;
      cached.forEach((index, position) => {
        if (index === currentRenderedFrame) return;
        const distance = Math.abs(index - desiredFrameIndex);
        if (distance > farthestDistance) {
          farthestDistance = distance;
          farthestPosition = position;
        }
      });
      if (farthestPosition < 0) break;
      images[cached[farthestPosition]] = null;
      cached.splice(farthestPosition, 1);
    }
  }

  function pumpFrameQueue() {
    while (activeLoads < MAX_ACTIVE_LOADS && queuedFrames.size) {
      const nextIndex = [...queuedFrames].sort((a, b) =>
        Math.abs(a - desiredFrameIndex) - Math.abs(b - desiredFrameIndex)
      )[0];
      queuedFrames.delete(nextIndex);
      if (images[nextIndex]) continue;

      const img = new Image();
      images[nextIndex] = img;
      activeLoads++;
      img.onload = () => {
        activeLoads--;
        loadedCount++;
        trimFrameCache();
        updatePreloaderProgress();
        if (!preloader && loadedCount >= 4) finishLoading();
        if (nextIndex === desiredFrameIndex) renderFrame(nextIndex, true);
        pumpFrameQueue();
      };
      img.onerror = () => {
        activeLoads--;
        images[nextIndex] = null;
        loadedCount++;
        updatePreloaderProgress();
        if (!preloader && loadedCount >= 4) finishLoading();
        pumpFrameQueue();
      };
      img.src = getFramePath(nextIndex);
    }
  }

  function requestFrame(index) {
    if (index < 0 || index >= TOTAL_FRAMES || images[index]) return;
    queuedFrames.add(index);
    pumpFrameQueue();
  }

  function initPreloader() {
    // Warm only a short opening segment; later frames load near the scroll position.
    for (let index = 0; index < 12; index++) requestFrame(index);
  }

  function updatePreloaderProgress() {
    if (!preloaderBar || !preloaderPercent || !preloaderCount) return;
    const percent = Math.min(100, Math.round((loadedCount / TOTAL_FRAMES) * 100));
    preloaderBar.style.width = `${percent}%`;
    preloaderPercent.textContent = `${percent}%`;
    preloaderCount.textContent = `${loadedCount} / ${TOTAL_FRAMES}`;

    if (loadedCount >= 4 && preloaderSkipBtn.style.display !== 'inline-block') {
      preloaderSkipBtn.style.display = 'inline-block';
    }

    if (loadedCount >= 12) {
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
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', resizeCanvas, { passive: true });
  }

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
  targetProgress = computeScrollProgress();

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

    desiredFrameIndex = frameIndex;
    requestFrame(frameIndex);
    const direction = targetProgress >= currentProgress ? 1 : -1;
    requestFrame(frameIndex + direction);
    requestFrame(frameIndex + direction * 2);
    renderFrame(frameIndex);
    updateUIState(currentProgress);

    requestAnimationFrame(animate);
  }

  // --- INITIALIZE ---
  resizeCanvas();
  initPreloader();
  requestAnimationFrame(animate);

})();
