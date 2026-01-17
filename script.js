(() => {
  let cols = 24;
  let rows = 16;
  const getTargetTileSize = () => {
    const shortSide = Math.min(window.innerWidth, window.innerHeight);
    const minSize = 64;
    const maxSize = 256;
    const minSide = 600;
    const maxSide = 1400;
    const ratio = (shortSide - minSide) / Math.max(1, maxSide - minSide);
    const t = Math.min(1, Math.max(0, ratio));
    return Math.round(minSize + (maxSize - minSize) * t);
  };
const pages = [
  {
    title: "Welcome",
    subtitle: "A developer who enjoys building things",
    gradient: ["#0b1e3f", "#1e5f8f"],
    accent: "#f6c56f",
    text: "#f9f4e8",
  },
  {
    title: "Background",
    subtitle: "Experience shaped by real-world systems",
    gradient: ["#2a1b3d", "#5b2c83"],
    accent: "#d7b9ff",
    text: "#f6f0ff",
  },
  {
    title: "Skills",
    subtitle: "From backend logic to product thinking",
    gradient: ["#102c2a", "#2f8f7c"],
    accent: "#9de3c2",
    text: "#e8fff6",
  },
  {
    title: "Mindset",
    subtitle: "Clean code, clear ideas",
    gradient: ["#1b2430", "#4b6b88"],
    accent: "#a9d1e6",
    text: "#edf6fb",
  },
  {
    title: "Projects",
    subtitle: "Learning through building",
    gradient: ["#3a1a1a", "#b34b2f"],
    accent: "#f4d3a1",
    text: "#fff1de",
  },
  {
    title: "Collaboration",
    subtitle: "Good communication matters",
    gradient: ["#1a2a1f", "#3a7d44"],
    accent: "#b8f2c0",
    text: "#effff1",
  },
  {
    title: "Contact",
    subtitle: "chendacheng@gmail.com",
    gradient: ["#111a21", "#3b5463"],
    accent: "#a9d1e6",
    text: "#edf6fb",
  },
];

  const app = document.getElementById("app");
  const stage = document.getElementById("stage");
  const grid = document.getElementById("grid");
  const fade = document.getElementById("fade");
  const tiles = [];

  let currentIndex = 0;
  let isAnimating = false;
  let pageImages = [];
  let pendingDirection = 0;
  let wheelAccumulator = 0;
  let wheelTimeoutId = null;

  const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  let reducedMotion = mediaQuery.matches;
  document.body.classList.toggle("reduced-motion", reducedMotion);
  mediaQuery.addEventListener("change", (event) => {
    reducedMotion = event.matches;
    document.body.classList.toggle("reduced-motion", reducedMotion);
  });

  const seededRandom = (seed) => {
    const x = Math.sin(seed * 12.9898) * 43758.5453;
    return x - Math.floor(x);
  };

  const escapeXML = (value) =>
    value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");

  const createPageDataURL = (page, width, height) => {
    const shortSide = Math.min(width, height);
    const titleSize = Math.max(48, Math.round(shortSide * 0.12));
    const subSize = Math.max(18, Math.round(shortSide * 0.04));
    const titleY = Math.round(height * 0.52);
    const subtitleY = Math.round(titleY + subSize * 1.4);
    const subtitleLines = page.subtitle ? page.subtitle.split("\n") : [];

    const subtitleSpans = subtitleLines
      .map((line, index) => {
        const dy = index === 0 ? 0 : Math.round(subSize * 1.2);
        return `<tspan x="50%" dy="${dy}">${escapeXML(line)}</tspan>`;
      })
      .join("");

    const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${page.gradient[0]}"/>
      <stop offset="100%" stop-color="${page.gradient[1]}"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#bg)" />
  <circle cx="${Math.round(width * 0.84)}" cy="${Math.round(
      height * 0.2
    )}" r="${Math.round(shortSide * 0.2)}" fill="${
      page.accent
    }" fill-opacity="0.16" />
  <circle cx="${Math.round(width * 0.16)}" cy="${Math.round(
      height * 0.76
    )}" r="${Math.round(shortSide * 0.28)}" fill="${
      page.accent
    }" fill-opacity="0.12" />
  <g fill="${
    page.text
  }" font-family="Georgia, Times New Roman, serif" text-anchor="middle">
    <text x="50%" y="${titleY}" font-size="${titleSize}" font-weight="700" letter-spacing="2">
      ${escapeXML(page.title)}
    </text>
    ${
      subtitleSpans
        ? `<text x="50%" y="${subtitleY}" font-size="${subSize}" font-weight="500" opacity="0.82">${subtitleSpans}</text>`
        : ""
    }
  </g>
</svg>`;

    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  };

  const setAppBackground = (pageIndex) => {
    app.style.background = "#000";
    app.style.backgroundColor = "#000";
  };

  const calculateGrid = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const targetTileSize = getTargetTileSize();
    const approxCols = Math.max(1, Math.round(width / targetTileSize));
    const approxRows = Math.max(1, Math.round(height / targetTileSize));
    const tileSize = Math.max(
      1,
      Math.ceil(Math.max(width / approxCols, height / approxRows))
    );
    const nextCols = Math.max(1, Math.ceil(width / tileSize));
    const nextRows = Math.max(1, Math.ceil(height / tileSize));
    const gridW = tileSize * nextCols;
    const gridH = tileSize * nextRows;

    return { cols: nextCols, rows: nextRows, gridW, gridH };
  };

  const buildGrid = () => {
    grid.innerHTML = "";
    tiles.length = 0;
    grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    grid.style.gridTemplateRows = `repeat(${rows}, 1fr)`;

    const fragment = document.createDocumentFragment();
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        const tile = document.createElement("div");
        tile.className = "tile";

        const card = document.createElement("div");
        card.className = "card";

        const front = document.createElement("div");
        front.className = "face front";

        const back = document.createElement("div");
        back.className = "face back";

        card.append(front, back);
        tile.appendChild(card);
        fragment.appendChild(tile);

        const seed = row * cols + col + 1;
        const delay = Math.floor(seededRandom(seed) * 250);
        const duration = Math.floor(800 + seededRandom(seed + 999) * 700);

        tiles.push({ row, col, card, front, back, delay, duration });
      }
    }
    grid.appendChild(fragment);
  };

  const getMetrics = () => {
    const rect = grid.getBoundingClientRect();
    const gridW = rect.width || window.innerWidth;
    const gridH = rect.height || window.innerHeight;
    return {
      gridW,
      gridH,
      tileW: gridW / cols,
      tileH: gridH / rows,
    };
  };

  const renderPageImages = () => {
    const { gridW, gridH } = getMetrics();
    pageImages = pages.map((page) => createPageDataURL(page, gridW, gridH));
    fade.style.backgroundSize = `${gridW}px ${gridH}px`;
  };

  const setFace = (face, pageIndex, metrics, col, row) => {
    face.style.backgroundImage = `url("${pageImages[pageIndex]}")`;
    face.style.backgroundSize = `${metrics.gridW}px ${metrics.gridH}px`;
    face.style.backgroundPosition = `${-col * metrics.tileW}px ${
      -row * metrics.tileH
    }px`;
  };

  const paintFaces = (frontIndex, backIndex) => {
    const metrics = getMetrics();
    tiles.forEach(({ front, back, col, row }) => {
      setFace(front, frontIndex, metrics, col, row);
      if (backIndex === null) {
        back.style.backgroundImage = "none";
      } else {
        setFace(back, backIndex, metrics, col, row);
      }
    });
  };

  const resetCards = () => {
    tiles.forEach(({ card }) => {
      card.style.transitionDelay = "0ms";
      card.style.transitionDuration = "0ms";
      card.classList.remove("flipped");
    });
  };

  const finishFlip = (targetIndex) => {
    currentIndex = targetIndex;
    setAppBackground(currentIndex);
    paintFaces(currentIndex, null);

    resetCards();

    void grid.offsetHeight;
    isAnimating = false;
    if (pendingDirection !== 0) {
      const direction = pendingDirection;
      pendingDirection = 0;
      requestNavigation(direction);
    }
  };

  const goToPage = (targetIndex) => {
    if (isAnimating || targetIndex < 0 || targetIndex >= pages.length) {
      return;
    }
    if (targetIndex === currentIndex) {
      return;
    }

    const direction = targetIndex > currentIndex ? 180 : -180;
    grid.style.setProperty("--flip-angle", `${direction}deg`);
    setAppBackground(targetIndex);

    if (reducedMotion) {
      const { gridW, gridH } = getMetrics();
      fade.style.backgroundImage = `url("${pageImages[targetIndex]}")`;
      fade.style.backgroundSize = `${gridW}px ${gridH}px`;
      fade.style.opacity = "0";
      isAnimating = true;

      requestAnimationFrame(() => {
        fade.style.opacity = "1";
      });

      window.setTimeout(() => {
        currentIndex = targetIndex;
        setAppBackground(currentIndex);
        paintFaces(currentIndex, null);
        fade.style.opacity = "0";

        window.setTimeout(() => {
          isAnimating = false;
          if (pendingDirection !== 0) {
            const direction = pendingDirection;
            pendingDirection = 0;
            requestNavigation(direction);
          }
        }, 360);
      }, 360);
      return;
    }

    isAnimating = true;
    paintFaces(currentIndex, targetIndex);

    let maxTime = 0;
    tiles.forEach(({ card, delay, duration }) => {
      card.style.transitionDelay = `${delay}ms`;
      card.style.transitionDuration = `${duration}ms`;
      maxTime = Math.max(maxTime, delay + duration);
    });

    void grid.offsetHeight;
    tiles.forEach(({ card }) => card.classList.add("flipped"));

    window.setTimeout(() => finishFlip(targetIndex), maxTime + 50);
  };

  const goNext = () => {
    const nextIndex = (currentIndex + 1) % pages.length;
    goToPage(nextIndex);
  };
  const goPrev = () => {
    const prevIndex = (currentIndex - 1 + pages.length) % pages.length;
    goToPage(prevIndex);
  };

  const requestNavigation = (direction) => {
    if (direction === 0) {
      return;
    }
    if (isAnimating) {
      pendingDirection = direction;
      return;
    }
    if (direction > 0) {
      goNext();
    } else {
      goPrev();
    }
  };

  const handleWheel = (event) => {
    event.preventDefault();
    const threshold = 40;
    const delta =
      event.deltaMode === 1
        ? event.deltaY * 16
        : event.deltaMode === 2
          ? event.deltaY * window.innerHeight
          : event.deltaY;
    wheelAccumulator += delta;
    if (Math.abs(wheelAccumulator) >= threshold) {
      requestNavigation(wheelAccumulator > 0 ? 1 : -1);
      wheelAccumulator = 0;
    }
    if (wheelTimeoutId !== null) {
      window.clearTimeout(wheelTimeoutId);
    }
    wheelTimeoutId = window.setTimeout(() => {
      wheelAccumulator = 0;
      wheelTimeoutId = null;
    }, 160);
  };

  const handleKeyDown = (event) => {
    if (event.key === "ArrowDown" || event.key === "PageDown") {
      event.preventDefault();
      requestNavigation(1);
    } else if (event.key === "ArrowUp" || event.key === "PageUp") {
      event.preventDefault();
      requestNavigation(-1);
    }
  };

  let touchStartY = 0;
  let touchStartX = 0;
  let suppressClick = false;

  const handleTouchStart = (event) => {
    if (event.touches.length !== 1) {
      return;
    }
    touchStartY = event.touches[0].clientY;
    touchStartX = event.touches[0].clientX;
  };

  const handleTouchEnd = (event) => {
    if (event.changedTouches.length !== 1) {
      return;
    }
    const endY = event.changedTouches[0].clientY;
    const endX = event.changedTouches[0].clientX;
    const deltaY = touchStartY - endY;
    const deltaX = touchStartX - endX;
    const minDistance = 50;
    const tapDistance = 10;

    if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > minDistance) {
      suppressClick = true;
      window.setTimeout(() => {
        suppressClick = false;
      }, 360);
      if (deltaY > 0) {
        requestNavigation(1);
      } else {
        requestNavigation(-1);
      }
    } else if (
      Math.abs(deltaY) < tapDistance &&
      Math.abs(deltaX) < tapDistance
    ) {
      suppressClick = true;
      window.setTimeout(() => {
        suppressClick = false;
      }, 360);
      requestNavigation(1);
    }
  };

  const handleTouchMove = (event) => {
    event.preventDefault();
  };

  const handleClick = () => {
    if (suppressClick) {
      return;
    }
    requestNavigation(1);
  };

  const setStageSize = (width, height) => {
    stage.style.width = `${width}px`;
    stage.style.height = `${height}px`;
    const overflowX = Math.max(0, width - window.innerWidth);
    const overflowY = Math.max(0, height - window.innerHeight);
    const offsetX = Math.floor(overflowX / 2);
    const offsetY = Math.floor(overflowY / 2);

    stage.style.marginLeft = `${-offsetX}px`;
    stage.style.marginRight = `${-offsetX}px`;
    stage.style.marginTop = `${-offsetY}px`;
    stage.style.marginBottom = `${-offsetY}px`;
  };

  const applyLayout = (forceRebuild = false) => {
    const next = calculateGrid();
    const gridChanged = next.cols !== cols || next.rows !== rows;
    cols = next.cols;
    rows = next.rows;

    if (forceRebuild || gridChanged) {
      isAnimating = false;
      buildGrid();
    }
    setStageSize(next.gridW, next.gridH);
    renderPageImages();
    if (!isAnimating) {
      setAppBackground(currentIndex);
      resetCards();
      paintFaces(currentIndex, null);
    }
  };

  const handleResize = () => {
    applyLayout();
  };

  applyLayout(true);

  grid.addEventListener("wheel", handleWheel, { passive: false });
  window.addEventListener("keydown", handleKeyDown);
  grid.addEventListener("touchstart", handleTouchStart, { passive: true });
  grid.addEventListener("touchend", handleTouchEnd);
  grid.addEventListener("touchmove", handleTouchMove, { passive: false });
  grid.addEventListener("click", handleClick);
  window.addEventListener("resize", handleResize);
})();
