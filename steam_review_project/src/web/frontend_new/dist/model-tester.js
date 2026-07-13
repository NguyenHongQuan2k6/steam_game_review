// 1. Three.js Interactive 3D Background Wave Scene
const bgCanvas = document.getElementById('bg-canvas');
const scene = new THREE.Scene();

// Camera setup
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 5, 22);
camera.lookAt(0, 0, 0);

// Renderer setup
const renderer = new THREE.WebGLRenderer({ canvas: bgCanvas, alpha: true, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// Waving Particle Field Configuration
const particlesCount = 2000;
const particleGeometry = new THREE.BufferGeometry();
const positions = new Float32Array(particlesCount * 3);

// Distribute particles in a 3D grid layout
const gridWidth = 50;
const gridDepth = 40;
const spacing = 1.0;

for (let i = 0; i < particlesCount; i++) {
  const gridX = i % gridWidth;
  const gridZ = Math.floor(i / gridWidth);
  
  const x = (gridX - gridWidth / 2) * spacing;
  const z = (gridZ - gridDepth / 2) * spacing;
  const y = 0; // Height will animate in loop

  positions[i * 3] = x;
  positions[i * 3 + 1] = y;
  positions[i * 3 + 2] = z;
}

particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

// Helper to create a soft round glowing circle texture dynamically
function createCircleTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 16;
  canvas.height = 16;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.7)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 16, 16);
  return new THREE.CanvasTexture(canvas);
}
const circleTexture = createCircleTexture();

// Particle material with soft purple glow
const particleMaterial = new THREE.PointsMaterial({
  color: 0xa78bfa, // Purple-400
  size: 0.25,
  map: circleTexture,
  transparent: true,
  opacity: 0.35,
  blending: THREE.AdditiveBlending,
  depthWrite: false
});

const particleSystem = new THREE.Points(particleGeometry, particleMaterial);
scene.add(particleSystem);

// Floating Space Dust (Nebula Orbs)
const dustCount = 40;
const dustGeometry = new THREE.BufferGeometry();
const dustPositions = new Float32Array(dustCount * 3);
const dustSpeeds = [];

for (let i = 0; i < dustCount; i++) {
  dustPositions[i * 3] = (Math.random() - 0.5) * 40;
  dustPositions[i * 3 + 1] = (Math.random() - 0.5) * 20;
  dustPositions[i * 3 + 2] = (Math.random() - 0.5) * 30;
  dustSpeeds.push({
    x: (Math.random() - 0.5) * 0.015,
    y: (Math.random() - 0.5) * 0.015,
    z: (Math.random() - 0.5) * 0.015
  });
}

dustGeometry.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));

const dustMaterial = new THREE.PointsMaterial({
  color: 0x818cf8, // Indigo-400
  size: 1.5,
  map: circleTexture,
  transparent: true,
  opacity: 0.15,
  blending: THREE.AdditiveBlending,
  depthWrite: false
});

const dustSystem = new THREE.Points(dustGeometry, dustMaterial);
scene.add(dustSystem);

// Mouse input mapping
const mouse = { x: 0, y: 0, targetX: 0, targetY: 0, rawX: window.innerWidth / 2, rawY: window.innerHeight / 2 };

window.addEventListener('mousemove', (event) => {
  // Normalize coordinates between -1 and 1
  mouse.targetX = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.targetY = -(event.clientY / window.innerHeight) * 2 + 1;
  
  // Keep raw coordinates for card relative tracking
  mouse.rawX = event.clientX;
  mouse.rawY = event.clientY;
});

// Resize handler
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  // Re-center main card if resized
  initializeCardPositions();
});


// 2. Drag & Drop + Individual 3D Mouse Tracking Coordinates
const workspace = document.getElementById('workspace');
const cards = [];
let activeDragCard = null;
let dragStartX = 0;
let dragStartY = 0;
let dragStartLeft = 0;
let dragStartTop = 0;
let maxZIndex = 50;

// Track position and rotation states for all draggable cards
const cardStates = new Map();

function initializeCardPositions() {
  const ww = window.innerWidth;
  const wh = window.innerHeight - 80; // Minus navbar height

  // 1. Position Main Card exactly at center
  const mainCard = document.getElementById('main-card');
  if (mainCard) {
    const mcw = 640; // Max-width 2xl is 672px, fallback to 640
    const mch = 520;
    const mcLeft = Math.max((ww - mcw) / 2, 20);
    const mcTop = Math.max((wh - mch) / 2 - 20, 20);
    setCardState(mainCard, mcLeft, mcTop, 0); // Flat on the screen
  }

  // 2. Position Side Cards symmetrically
  const card1 = document.getElementById('card-1');
  if (card1) setCardState(card1, 60, 60, 0);

  const card2 = document.getElementById('card-2');
  if (card2) setCardState(card2, 60, wh - 260, 0);

  const card3 = document.getElementById('card-3');
  if (card3) setCardState(card3, ww - 380, 60, 0);

  const card4 = document.getElementById('card-4');
  if (card4) setCardState(card4, ww - 380, wh - 260, 0);
}

function setCardState(el, left, top, z = 0) {
  el.style.left = left + 'px';
  el.style.top = top + 'px';
  
  if (!cardStates.has(el.id)) {
    cardStates.set(el.id, {
      x: left,
      y: top,
      z: 0, // Keep flat by default
      currentX: left,
      currentY: top,
      rotX: 0,
      rotY: 0,
      targetRotX: 0,
      targetRotY: 0,
      isHovered: false
    });
    cards.push(el);
    registerDragEvents(el);
  } else {
    // Update existing positions
    const state = cardStates.get(el.id);
    state.x = left;
    state.y = top;
    state.z = 0;
    state.currentX = left;
    state.currentY = top;
  }
}

// Drag functionality setup
function registerDragEvents(el) {
  el.addEventListener('mousedown', (e) => {
    // Avoid dragging when interacting with input elements
    if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'BUTTON' || e.target.tagName === 'A' || e.target.closest('a')) {
      return;
    }
    
    activeDragCard = el;
    maxZIndex++;
    el.style.zIndex = maxZIndex;
    
    // Get mouse offsets relative to the element's current left/top
    const rect = el.getBoundingClientRect();
    const workspaceRect = workspace.getBoundingClientRect();
    
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    
    const state = cardStates.get(el.id);
    dragStartLeft = state.currentX;
    dragStartTop = state.currentY;
    
    e.preventDefault();
  });

  el.addEventListener('mouseenter', () => {
    const state = cardStates.get(el.id);
    if (state) state.isHovered = true;
  });

  el.addEventListener('mouseleave', () => {
    const state = cardStates.get(el.id);
    if (state) state.isHovered = false;
  });
}

// Global window mouse events for dragging
window.addEventListener('mousemove', (e) => {
  if (activeDragCard) {
    const dx = e.clientX - dragStartX;
    const dy = e.clientY - dragStartY;
    
    const state = cardStates.get(activeDragCard.id);
    if (state) {
      // Calculate boundaries to keep cards inside the workspace viewport
      const ww = window.innerWidth;
      const wh = window.innerHeight - 80;
      const rect = activeDragCard.getBoundingClientRect();
      
      let nextLeft = dragStartLeft + (dx / zoomLevel);
      let nextTop = dragStartTop + (dy / zoomLevel);
      
      // Clamp values
      nextLeft = Math.max(-50, Math.min(ww - rect.width + 50, nextLeft));
      nextTop = Math.max(-50, Math.min(wh - rect.height + 50, nextTop));
      
      state.x = nextLeft;
      state.y = nextTop;
    }
  }
});

window.addEventListener('mouseup', () => {
  activeDragCard = null;
});

// Initialize placements on start
initializeCardPositions();

// Zoom state variables for workspace deck and camera
let zoomLevel = 1.0;
let targetZoomLevel = 1.0;
let cameraZ = 22;
let targetCameraZ = 22;
const sandboxDeck = document.getElementById('sandbox-deck');

// Listen to mouse wheel scrolls on workspace for zooming
workspace.addEventListener('wheel', (e) => {
  e.preventDefault();
  targetZoomLevel += e.deltaY * -0.0008;
  targetZoomLevel = Math.max(0.4, Math.min(1.8, targetZoomLevel));
  targetCameraZ = 22 / targetZoomLevel;
}, { passive: false });

// Map rotation state variables for 360 rotation
let isRotatingMap = false;
let mapDragStartX = 0;
let mapDragStartY = 0;
let targetMapRotX = 0;
let targetMapRotY = 0;
let mapRotX = 0;
let mapRotY = 0;

// Prevent browser context menu inside workspace so right-click drag is clean
window.addEventListener('contextmenu', (e) => {
  if (e.target.closest('#workspace')) {
    e.preventDefault();
  }
});

// Listen to right-click drag events on workspace for 360-degree rotation
workspace.addEventListener('mousedown', (e) => {
  if (e.button === 2) { // Right click
    isRotatingMap = true;
    mapDragStartX = e.clientX;
    mapDragStartY = e.clientY;
    workspace.style.cursor = 'move';
    e.preventDefault();
  }
});

window.addEventListener('mousemove', (e) => {
  if (isRotatingMap) {
    const dx = e.clientX - mapDragStartX;
    const dy = e.clientY - mapDragStartY;

    targetMapRotY += dx * 0.22; // Horizontal rotation sensitivity
    targetMapRotX -= dy * 0.18; // Vertical rotation sensitivity

    // Clamp vertical rotation to avoid upside-down flip (-65deg to 65deg)
    targetMapRotX = Math.max(-65, Math.min(65, targetMapRotX));

    mapDragStartX = e.clientX;
    mapDragStartY = e.clientY;
  }
});

window.addEventListener('mouseup', (e) => {
  if (e.button === 2) {
    isRotatingMap = false;
    workspace.style.cursor = 'default';
  }
});

// 3. Animation loop: 3D waves + card tilt rotations + position interpolations
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const time = clock.getElapsedTime();
  const positionAttr = particleGeometry.attributes.position;

  // Animate particle grid heights based on sin/cos waves
  for (let i = 0; i < particlesCount; i++) {
    const x = positionAttr.getX(i);
    const z = positionAttr.getZ(i);

    // Dynamic wave equation
    const y = Math.sin(x * 0.15 + time * 1.2) * Math.cos(z * 0.15 + time * 0.8) * 1.5;
    positionAttr.setY(i, y);
  }
  
  positionAttr.needsUpdate = true;

  // Smoothly interpolate map rotation
  mapRotX += (targetMapRotX - mapRotX) * 0.1;
  mapRotY += (targetMapRotY - mapRotY) * 0.1;

  // Smooth mouse coordinates for Three.js scene
  mouse.x += (mouse.targetX - mouse.x) * 0.08;
  mouse.y += (mouse.targetY - mouse.y) * 0.08;

  // Tilt the particle wave to "look at" mouse + include map rotation
  const rotYRad = THREE.MathUtils.degToRad(mapRotY);
  const rotXRad = THREE.MathUtils.degToRad(mapRotX);

  particleSystem.rotation.y = rotYRad + mouse.x * 0.25;
  particleSystem.rotation.x = rotXRad - mouse.y * 0.15 + 0.15; // default tilt offset

  // Animate floating space dust
  const dustPosAttr = dustGeometry.attributes.position;
  for (let i = 0; i < dustCount; i++) {
    let dx = dustPosAttr.getX(i) + dustSpeeds[i].x;
    let dy = dustPosAttr.getY(i) + dustSpeeds[i].y;
    let dz = dustPosAttr.getZ(i) + dustSpeeds[i].z;

    // Reset positions if they drift too far
    if (Math.abs(dx) > 25) dx = -dx;
    if (Math.abs(dy) > 15) dy = -dy;
    if (Math.abs(dz) > 20) dz = -dz;

    dustPosAttr.setXYZ(i, dx, dy, dz);
  }
  dustPosAttr.needsUpdate = true;
  dustSystem.rotation.y = rotYRad + mouse.x * 0.12;
  dustSystem.rotation.x = rotXRad - mouse.y * 0.08;

  // Smoothly interpolate zoom and apply to DOM and Three.js camera
  zoomLevel += (targetZoomLevel - zoomLevel) * 0.1;
  if (sandboxDeck) {
    sandboxDeck.style.transform = `scale(${zoomLevel}) rotateX(${mapRotX}deg) rotateY(${mapRotY}deg)`;
  }
  cameraZ += (targetCameraZ - cameraZ) * 0.1;
  camera.position.z = cameraZ;
  camera.lookAt(0, 0, 0);

  // Render Three.js scene
  renderer.render(scene, camera);

  // Update card coordinates and compute individual 3D tilts facing cursor
  cards.forEach(card => {
    const state = cardStates.get(card.id);
    if (!state) return;

    // Smoothly interpolate positions (lerp) for dragging
    state.currentX += (state.x - state.currentX) * 0.15;
    state.currentY += (state.y - state.currentY) * 0.15;

    // Update actual element left/top positions
    card.style.left = `${state.currentX}px`;
    card.style.top = `${state.currentY}px`;

    const hoverScale = state.isHovered ? 1.02 : 1.0;

    if (card.id === 'main-card') {
      // Main card is outside sandbox-deck: stays perfectly flat (no 3D tilt/drift), but scales with zoom
      const finalScale = zoomLevel * hoverScale;
      card.style.transform = `perspective(1000px) translate3d(0, 0, 0) rotateX(0deg) rotateY(0deg) scale(${finalScale})`;
      state.transX = 0;
      state.transY = 0;
    } else {
      // Other cards are inside sandbox-deck: they tilt towards the mouse and drift, but don't need manual zoom scale
      // Calculate center coordinates of card
      const cardRect = card.getBoundingClientRect();
      const cx = cardRect.left + cardRect.width / 2;
      const cy = cardRect.top + cardRect.height / 2;

      // Compute direction vector from card center to mouse pointer
      const dx = mouse.rawX - cx;
      const dy = mouse.rawY - cy;

      // Apply tilt values proportional to mouse distance (Max 12 deg tilt)
      const distance = Math.max(1, Math.sqrt(dx * dx + dy * dy));
      const influenceLimit = 600; // Cursor distance influence radius
      const scaleFactor = Math.max(0, 1 - distance / influenceLimit);

      state.targetRotY = (dx / ww_half_fallback()) * 18 * scaleFactor;
      state.targetRotX = (dy / wh_half_fallback()) * 15 * scaleFactor;

      // Fast return to flat if mouse is far, otherwise follow mouse
      state.rotX += (state.targetRotX - state.rotX) * 0.1;
      state.rotY += (state.targetRotY - state.rotY) * 0.1;

      // Compute magnetic translation offset (drift towards mouse)
      const maxTranslation = 20; // max 20px drift
      const transX = (dx / ww_half_fallback()) * maxTranslation * scaleFactor;
      const transY = (dy / wh_half_fallback()) * maxTranslation * scaleFactor;

      state.transX = transX;
      state.transY = transY;

      // Combine position and rotation transform matrix with 3D Z-depth
      card.style.transform = `perspective(1000px) translate3d(${transX}px, ${transY}px, ${state.z || 0}px) rotateX(${state.rotX}deg) rotateY(${state.rotY}deg) scale(${hoverScale})`;
    }
  });

  // Update curved connection lines between matching groups
  updateConnectionLines();
}

const connectionLinesSvg = document.getElementById('connection-lines');

function updateConnectionLines() {
  if (!connectionLinesSvg) return;
  connectionLinesSvg.innerHTML = '';

  const groups = {
    'POS': [],
    'NEG': [],
    'NEU': []
  };

  // Group active cards by sentiment class (excluding the main center console)
  cards.forEach(card => {
    if (card.id === 'main-card') return;
    
    let type = null;
    if (card.querySelector('.badge-pos')) type = 'POS';
    else if (card.querySelector('.badge-neg')) type = 'NEG';
    else if (card.querySelector('.badge-neu')) type = 'NEU';

    if (type && groups[type]) {
      groups[type].push(card);
    }
  });

  // Draw sagged glowing bezier paths connecting cards in chains
  Object.keys(groups).forEach(type => {
    const list = groups[type];
    if (list.length < 2) return;

    for (let i = 0; i < list.length - 1; i++) {
      const c1 = list[i];
      const c2 = list[i + 1];

      const state1 = cardStates.get(c1.id);
      const state2 = cardStates.get(c2.id);
      if (!state1 || !state2) continue;

      const r1 = c1.getBoundingClientRect();
      const r2 = c2.getBoundingClientRect();

      // Compute centers
      const x1 = state1.currentX + r1.width / 2 + (state1.transX || 0);
      const y1 = state1.currentY + r1.height / 2 + (state1.transY || 0);

      const x2 = state2.currentX + r2.width / 2 + (state2.transX || 0);
      const y2 = state2.currentY + r2.height / 2 + (state2.transY || 0);

      const dx = x2 - x1;
      const dy = y2 - y1;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Hanging physical sag
      const sag = Math.min(100, dist * 0.18);
      const midX = (x1 + x2) / 2;
      const midY = (y1 + y2) / 2 + sag;

      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', `M ${x1} ${y1} Q ${midX} ${midY} ${x2} ${y2}`);
      path.setAttribute('class', `connection-line line-${type.toLowerCase()}`);
      connectionLinesSvg.appendChild(path);
    }
  });
}

function ww_half_fallback() { return window.innerWidth / 2 || 600; }
function wh_half_fallback() { return window.innerHeight / 2 || 400; }

// Start rendering loop
animate();


// 4. UI logic for Sandbox Sentiment Scanner
const ariaTextarea = document.getElementById('aria-textarea');
const ariaCharCount = document.getElementById('aria-char-count');
const ariaSubmitBtn = document.getElementById('aria-submit-btn');
const scannerFrame = document.getElementById('scanner-frame');
const predStatus = document.getElementById('prediction-status');

ariaTextarea.addEventListener('input', () => {
  const len = ariaTextarea.value.length;
  ariaCharCount.textContent = `BUFFER: ${len} / 1000 CHARS`;
});

// Submit review to backend classifier API
ariaSubmitBtn.addEventListener('click', () => {
  const text = ariaTextarea.value.trim();
  if (!text) return;
  
  predictSentiment(text);
});

// Console elements
const consoleOutput = document.getElementById('console-output');
const outputBadge = document.getElementById('output-badge');
const outputConfidence = document.getElementById('output-confidence');
const outputText = document.getElementById('output-text');
const outputLogId = document.getElementById('output-log-id');

async function predictSentiment(text) {
  ariaSubmitBtn.disabled = true;
  ariaSubmitBtn.textContent = "CLASSIFYING DATA STREAM...";
  predStatus.textContent = "SCANNING...";
  predStatus.className = "text-[#a78bfa] animate-pulse";
  scannerFrame.classList.add('scanning');
  consoleOutput.classList.remove('visible'); // Clear/slide closed previous result instantly for visual feedback

  try {
    const response = await fetch('/api/predict', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text })
    });

    if (response.ok) {
      const result = await response.json();
      setTimeout(() => {
        renderPrediction(result);
      }, 800); // Slight delay for visual immersion of scanner
    } else {
      console.error("Classifier endpoint returned error status");
      predStatus.textContent = "ERROR";
      predStatus.className = "text-rose-400";
    }
  } catch (err) {
    console.error("Failed to connect to classifier API:", err);
    predStatus.textContent = "CONNECTION ERROR";
    predStatus.className = "text-rose-400";
  } finally {
    setTimeout(() => {
      ariaSubmitBtn.disabled = false;
      ariaSubmitBtn.textContent = "Analyze Sentiment";
      scannerFrame.classList.remove('scanning');
    }, 800);
  }
}

function renderPrediction(result) {
  const label = result.label; // TÍCH CỰC, TRUNG TÍNH, TIÊU CỰC
  const confidence = result.confidence;
  const text = result.text;

  let badgeText = 'NEUTRAL';
  let badgeClass = 'badge-neu';
  
  if (label === 'TÍCH CỰC') {
    badgeText = 'POSITIVE';
    badgeClass = 'badge-pos';
  } else if (label === 'TIÊU CỰC') {
    badgeText = 'NEGATIVE';
    badgeClass = 'badge-neg';
  }

  // Update Console Output display
  outputBadge.className = `text-[11px] font-mono font-bold px-2.5 py-1 rounded border tracking-widest uppercase ${badgeClass}`;
  outputBadge.textContent = `${badgeText} ${confidence.toFixed(1)}% CONF`;
  outputConfidence.innerHTML = `confidence: <span class="${label === 'TÍCH CỰC' ? 'text-emerald-400 font-bold' : label === 'TIÊU CỰC' ? 'text-rose-400 font-bold' : 'text-amber-400 font-bold'}">${confidence.toFixed(1)}%</span>`;
  
  // Clean quote wrapper
  outputText.innerHTML = `"${text}"`;
  
  const randNum = Math.floor(100 + Math.random() * 900);
  outputLogId.textContent = `ID: #STM-DIAG-${randNum}`;

  consoleOutput.classList.add('visible'); // Slide open with transition
  predStatus.textContent = "COMPLETE";
  predStatus.className = "text-emerald-400";

  // Push new card out to side columns
  pushReviewToSides(label, confidence, text);
}

// Spawns a floating draggable review card on sandbox workspace
function pushReviewToSides(label, confidence, text) {
  const ww = window.innerWidth;
  const wh = window.innerHeight - 80;

  const newCard = document.createElement('div');
  const cardId = `dyn-card-${Date.now()}`;
  newCard.id = cardId;
  newCard.className = 'draggable sub-card-3d rounded-2xl p-6 border border-white/[0.03] w-[320px] cursor-grab active:cursor-grabbing opacity-0';
  
  let badgeClass = 'badge-neu';
  let badgeText = 'NEUTRAL';
  if (label === 'TÍCH CỰC') {
    badgeText = 'POS';
    badgeClass = 'badge-pos';
  } else if (label === 'TIÊU CỰC') {
    badgeText = 'NEG';
    badgeClass = 'badge-neg';
  }

  newCard.innerHTML = `
    <div class="drag-grip mb-3.5">
      <span class="w-1.5 h-1.5 rounded-full bg-white/40"></span>
      <span class="w-1.5 h-1.5 rounded-full bg-white/40"></span>
      <span class="w-1.5 h-1.5 rounded-full bg-white/40"></span>
    </div>
    <div class="flex justify-between items-center mb-4">
      <span class="text-[11px] font-mono font-bold px-2.5 py-1 rounded border tracking-widest uppercase ${badgeClass}">${badgeText} ${confidence.toFixed(1)}%</span>
      <span class="text-[11px] font-mono text-zinc-500">ID: #STM-${Math.floor(100 + Math.random() * 900)}</span>
    </div>
    <p class="text-[14px] text-zinc-300 leading-relaxed italic">"${text}"</p>
  `;

  // Spawn near center console, then push outward dynamically
  const startLeft = ww / 2 - 160;
  const startTop = wh / 2 - 100;
  
  sandboxDeck.appendChild(newCard);

  // Determine spawn coordinates (left or right side floating area)
  const isLeftSide = (label === 'TIÊU CỰC' || (label === 'TRUNG TÍNH' && Math.random() > 0.5));
  const targetLeft = isLeftSide ? Math.random() * 120 + 40 : ww - 380 - Math.random() * 120;
  const targetTop = Math.random() * (wh - 240) + 40;

  // Set initial state
  newCard.style.left = startLeft + 'px';
  newCard.style.top = startTop + 'px';
  maxZIndex++;
  newCard.style.zIndex = maxZIndex;

  cardStates.set(cardId, {
    x: targetLeft,
    y: targetTop,
    z: 0,
    currentX: startLeft,
    currentY: startTop,
    rotX: 0,
    rotY: 0,
    targetRotX: 0,
    targetRotY: 0,
    isHovered: false
  });
  cards.push(newCard);
  registerDragEvents(newCard);

  // Transition animate opacity to 1
  requestAnimationFrame(() => {
    setTimeout(() => {
      newCard.classList.remove('opacity-0');
      // Set target to float out
      const state = cardStates.get(cardId);
      if (state) {
        state.x = targetLeft;
        state.y = targetTop;
      }
    }, 50);
  });

  // Limit total floating cards on screen (Max 10) to preserve memory and view clean
  const maxFloating = 10;
  const dynamicCards = cards.filter(c => c.id.startsWith('dyn-card-'));
  if (dynamicCards.length > maxFloating) {
    const oldest = dynamicCards[0];
    const index = cards.indexOf(oldest);
    if (index > -1) {
      cards.splice(index, 1);
    }
    cardStates.delete(oldest.id);
    oldest.remove();
  }
}

// Collapsible console button action
const toggleConsoleBtn = document.getElementById('toggle-console-btn');
const mainCardEl = document.getElementById('main-card');
const toggleIconEl = document.getElementById('toggle-icon');

if (toggleConsoleBtn && mainCardEl) {
  toggleConsoleBtn.addEventListener('click', (e) => {
    e.stopPropagation(); // Avoid triggering any drag/drop states
    mainCardEl.classList.toggle('collapsed');
    const isCollapsed = mainCardEl.classList.contains('collapsed');
    
    if (isCollapsed) {
      // Switch to Plus (expand) icon
      toggleIconEl.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />`;
      toggleConsoleBtn.setAttribute('title', 'Expand Console');
    } else {
      // Switch to Minus (minimize) icon
      toggleIconEl.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />`;
      toggleConsoleBtn.setAttribute('title', 'Minimize Console');
    }
  });
}

// --- Hand Gesture Control Implementation ---
let isGestureActive = false;
let handsInstance = null;
let cameraInstance = null;

const gToggleBtn = document.getElementById('gesture-toggle-btn');
const gBtnDot = document.getElementById('gesture-btn-dot');
const gBtnText = document.getElementById('gesture-btn-text');
const gHudCard = document.getElementById('gesture-hud-card');
const gStatusDot = document.getElementById('gesture-status-dot');
const gStatusText = document.getElementById('gesture-status-text');
const gVideo = document.getElementById('gesture-video');
const gCanvas = document.getElementById('gesture-canvas');
const gCoordX = document.getElementById('gesture-coord-x');
const gCoordY = document.getElementById('gesture-coord-y');
const gVirtualCursor = document.getElementById('gesture-virtual-cursor');
const gDwellProgress = document.getElementById('gesture-dwell-progress');
const gDwellText = document.getElementById('gesture-dwell-text');
const gScanningOverlay = document.getElementById('gesture-scanning-overlay');

let dwellProgressVal = 0;
let lastCursorPos = { x: 0, y: 0 };
let stillStartTime = null;
let lastDwellClickTime = 0;

function updateGestureUI(isTracking, xVal, yVal) {
  if (isTracking) {
    gStatusDot.style.background = '#10b981';
    gStatusText.textContent = 'TRACKING';
    gStatusText.style.color = '#10b981';
    gStatusText.classList.add('animate-pulse');
    gCoordX.textContent = xVal.toFixed(2);
    gCoordY.textContent = yVal.toFixed(2);
    gScanningOverlay.style.display = 'none';
    gVirtualCursor.style.display = 'block';
  } else {
    gStatusDot.style.background = '#ef4444';
    gStatusText.textContent = 'STANDBY';
    gStatusText.style.color = '#71717a';
    gStatusText.classList.remove('animate-pulse');
    gScanningOverlay.style.display = 'flex';
    gVirtualCursor.style.display = 'none';
    setProgressProgress(0);
    stillStartTime = null;
  }
}

function setProgressProgress(val) {
  dwellProgressVal = val;
  const radius = 18;
  const circumference = 2 * Math.PI * radius; // 113.1px
  const offset = circumference * (1 - val);
  gDwellProgress.style.strokeDashoffset = offset;
  
  if (val > 0.05) {
    gDwellText.style.display = 'block';
    gDwellText.textContent = `DWELL: ${Math.ceil(5 - val * 5)}s`;
  } else {
    gDwellText.style.display = 'none';
  }
}

function initHandTracking() {
  const Hands = window.Hands;
  const Camera = window.Camera;

  if (!Hands || !Camera) {
    console.warn("MediaPipe Hands or Camera scripts not loaded.");
    return;
  }

  handsInstance = new Hands({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
  });

  handsInstance.setOptions({
    maxNumHands: 1,
    modelComplexity: 1,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
  });

  handsInstance.onResults((results) => {
    const ctx = gCanvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, gCanvas.width, gCanvas.height);

    // Draw video mirrored
    ctx.save();
    ctx.translate(gCanvas.width, 0);
    ctx.scale(-1, 1);
    try {
      ctx.drawImage(gVideo, 0, 0, gCanvas.width, gCanvas.height);
    } catch(e) {}
    ctx.restore();

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      const landmarks = results.multiHandLandmarks[0];
      const indexFingertip = landmarks[8];
      
      const normX = 0.5 - indexFingertip.x;
      const normY = 0.5 - indexFingertip.y; // up is positive

      // Update global mouse coordinates directly to drive 3D workspace rotations & tilts
      mouse.targetX = normX * 2.0;
      mouse.targetY = normY * 2.0;
      
      const clientX = (normX + 0.5) * window.innerWidth;
      const clientY = (0.5 - normY) * window.innerHeight;
      
      mouse.rawX = clientX;
      mouse.rawY = clientY;

      // Position virtual cursor
      gVirtualCursor.style.left = `${clientX}px`;
      gVirtualCursor.style.top = `${clientY}px`;

      updateGestureUI(true, normX, normY);

      // Draw skeleton HUD connections
      const HAND_CONNECTIONS = [
        [0, 1], [1, 2], [2, 3], [3, 4],
        [0, 5], [5, 6], [6, 7], [7, 8],
        [0, 9], [9, 10], [10, 11], [11, 12],
        [0, 13], [13, 14], [14, 15], [15, 16],
        [0, 17], [17, 18], [18, 19], [19, 20],
        [5, 9], [9, 13], [13, 17]
      ];

      ctx.strokeStyle = 'rgba(167, 139, 250, 0.45)';
      ctx.lineWidth = 1.5;
      HAND_CONNECTIONS.forEach(([start, end]) => {
        const ptStart = landmarks[start];
        const ptEnd = landmarks[end];
        if (ptStart && ptEnd) {
          ctx.beginPath();
          ctx.moveTo((1 - ptStart.x) * gCanvas.width, ptStart.y * gCanvas.height);
          ctx.lineTo((1 - ptEnd.x) * gCanvas.width, ptEnd.y * gCanvas.height);
          ctx.stroke();
        }
      });

      // Draw joint markers
      ctx.fillStyle = '#818cf8';
      landmarks.forEach((pt) => {
        ctx.beginPath();
        ctx.arc((1 - pt.x) * gCanvas.width, pt.y * gCanvas.height, 2, 0, 2 * Math.PI);
        ctx.fill();
      });

      // Draw index fingertip reticle target
      const drawX = (1 - indexFingertip.x) * gCanvas.width;
      const drawY = indexFingertip.y * gCanvas.height;

      ctx.strokeStyle = '#c084fc';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(drawX, drawY, 8, 0, 2 * Math.PI);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(drawX - 12, drawY);
      ctx.lineTo(drawX + 12, drawY);
      ctx.moveTo(drawX, drawY - 12);
      ctx.lineTo(drawX, drawY + 12);
      ctx.stroke();

      // Dwell click computation
      const dx = clientX - lastCursorPos.x;
      const dy = clientY - lastCursorPos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      const now = performance.now();

      if (dist > 22) {
        stillStartTime = now;
        lastCursorPos = { x: clientX, y: clientY };
        setProgressProgress(0);
      } else {
        if (stillStartTime === null) {
          stillStartTime = now;
        }
        const elapsed = now - stillStartTime;
        const newProgress = Math.min(elapsed / 5000, 1);
        setProgressProgress(newProgress);

        if (elapsed >= 5000 && now - lastDwellClickTime > 1500) {
          const el = document.elementFromPoint(clientX, clientY);
          if (el) {
            const htmlEl = el;
            htmlEl.click();
            if (htmlEl.tagName === 'INPUT' || htmlEl.tagName === 'TEXTAREA') {
              htmlEl.focus();
            }
          }
          lastDwellClickTime = now;
          stillStartTime = now;
          setProgressProgress(0);
        }
      }
    } else {
      updateGestureUI(false, 0, 0);
    }
  });

  cameraInstance = new Camera(gVideo, {
    onFrame: async () => {
      if (isGestureActive && handsInstance) {
        try {
          await handsInstance.send({ image: gVideo });
        } catch(e) {}
      }
    },
    width: 320,
    height: 240
  });

  cameraInstance.start().catch((err) => console.error("Camera fail:", err));
}

function stopHandTracking() {
  if (cameraInstance) {
    try { cameraInstance.stop(); } catch(e) {}
    cameraInstance = null;
  }
  if (handsInstance) {
    try { handsInstance.close(); } catch(e) {}
    handsInstance = null;
  }
  if (gVideo.srcObject) {
    const stream = gVideo.srcObject;
    stream.getTracks().forEach(track => track.stop());
    gVideo.srcObject = null;
  }
  updateGestureUI(false, 0, 0);
}

if (gToggleBtn) {
  gToggleBtn.addEventListener('click', () => {
    isGestureActive = !isGestureActive;
    
    if (isGestureActive) {
      gBtnDot.style.background = '#10b981';
      gBtnDot.classList.add('animate-ping');
      gBtnText.textContent = 'GESTURE: ACTIVE';
      gToggleBtn.style.background = 'rgba(124, 58, 237, 0.2)';
      gToggleBtn.style.borderColor = 'rgba(167, 139, 250, 0.4)';
      gHudCard.style.display = 'block';
      initHandTracking();
    } else {
      gBtnDot.style.background = '#71717a';
      gBtnDot.classList.remove('animate-ping');
      gBtnText.textContent = 'GESTURE: DISABLED';
      gToggleBtn.style.background = 'rgba(24, 24, 27, 0.9)';
      gToggleBtn.style.borderColor = 'rgba(255, 255, 255, 0.08)';
      gHudCard.style.display = 'none';
      stopHandTracking();
    }
  });
}

