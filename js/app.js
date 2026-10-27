/**
 * FERRARI F40 LB-WORKS (LIBERTY WALK JAPAN) - 3D INTERACTIVE SHOWCASE
 * Three.js WebGL Application
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

// --- LOCALIZATION DICTIONARY ---
const i18n = {
  ru: {
    showcase: "3D Интерактивный Шоурум",
    lighting: "ОСВЕЩЕНИЕ:",
    envStudio: "Белый Шоурум",
    envMonza: "Черный Шоурум",
    bgWhite: "Фон: Белый",
    bgDark: "Фон: Черный",
    paintBtn: "Палитра",
    lightsOn: "Фары: Вкл",
    lightsOff: "Фары: Выкл",
    engineRev: "Запуск Twin-Turbo",
    autorotate: "Вращение",
    cinematic: "Кино-тур",
    photo: "Фото HD",
    reset: "Сброс",
    paintTitle: "ЦВЕТ КУЗОВА",
    finishTitle: "ТИП ПОКРЫТИЯ:",
    finishGloss: "Глянец",
    finishMetallic: "Металлик",
    finishSatin: "Матовый Сатин",
    specsTitle: "СПЕЦИФИКАЦИЯ МОДЕЛИ",
    toastLightsOn: "Оптика и фары включены [L]",
    toastLightsOff: "Оптика выключена [L]",
    toastEngine: "Рев Twin-Turbo V8 Tipo F120A (8000 об/мин)!",
    toastPhoto: "Снимок сохранен в разрешении 4K [P]",
    toastTourStart: "Кинематографический тур запущен [T]",
    toastTourStop: "Кинематографический тур остановлен",
    toastRotateOn: "Авто-вращение включено [R]",
    toastRotateOff: "Авто-вращение выключено [R]",
    toastPaint: "Выбран цвет: ",
    toastBgBlack: "Включен Черный Шоурум",
    toastBgWhite: "Включен Белый Шоурум"
  },
  en: {
    showcase: "3D Interactive Showcase",
    lighting: "LIGHTING:",
    envStudio: "White Studio",
    envMonza: "Black Studio",
    bgWhite: "BG: White",
    bgDark: "BG: Black",
    paintBtn: "Paint",
    lightsOn: "Lights: On",
    lightsOff: "Lights: Off",
    engineRev: "Start Twin-Turbo",
    autorotate: "Auto-Rotate",
    cinematic: "Cine-Tour",
    photo: "Photo HD",
    reset: "Reset",
    paintTitle: "BODY PAINT COLOR",
    finishTitle: "FINISH COATING:",
    finishGloss: "Gloss",
    finishMetallic: "Metallic",
    finishSatin: "Matte Satin",
    specsTitle: "TECHNICAL SPECIFICATIONS",
    toastLightsOn: "Headlights & Optics Enabled [L]",
    toastLightsOff: "Optics Disabled [L]",
    toastEngine: "Twin-Turbo V8 F120A Revving (8,000 RPM)!",
    toastPhoto: "4K Snapshot Captured [P]",
    toastTourStart: "Cinematic Tour Started [T]",
    toastTourStop: "Cinematic Tour Stopped",
    toastRotateOn: "Auto-Rotation Enabled [R]",
    toastRotateOff: "Auto-Rotation Disabled [R]",
    toastPaint: "Selected Paint: ",
    toastBgBlack: "Black Studio Enabled",
    toastBgWhite: "White Studio Enabled"
  }
};

let currentLang = 'ru';

// --- COLOR PALETTE DEFINITIONS ---
const paintColors = [
  { id: 'rosso-corsa', nameRu: 'Rosso Corsa', nameEn: 'Rosso Corsa', hex: '#d40000' },
  { id: 'bianco-fuji', nameRu: 'Bianco Fuji LBWK', nameEn: 'Bianco Fuji LBWK', hex: '#f5f5f7' },
  { id: 'nero-daytona', nameRu: 'Nero Daytona Stealth', nameEn: 'Nero Daytona Stealth', hex: '#111215' },
  { id: 'giallo-modena', nameRu: 'Giallo Modena', nameEn: 'Giallo Modena', hex: '#f6c300' },
  { id: 'grigio-silverstone', nameRu: 'Grigio Silverstone', nameEn: 'Grigio Silverstone', hex: '#5a5e65' },
  { id: 'azzurro-dino', nameRu: 'Azzurro Dino', nameEn: 'Azzurro Dino', hex: '#2e86c1' }
];

// --- APPLICATION STATE ---
const state = {
  currentPaintHex: '#d40000',
  currentPaintId: 'rosso-corsa',
  currentFinish: 'gloss',
  currentEnv: 'dark-studio',
  currentBgTheme: 'black', // Black Studio default
  lightsOn: false,
  autoRotate: false,
  isTouring: false,
  isZen: false,
  soundMuted: false
};

// --- THREE.JS SCENE GLOBALS ---
let scene, camera, renderer, controls;
let carModel = null;
let bodyMaterials = [];
let carbonMaterials = [];
let glassMaterials = [];
let headlightMaterials = [];
let taillightMaterials = [];
let ambientLight, dirLight, rimLightL, rimLightR;
let groundMesh, contactShadowMesh, shadowPlaneMat;
let headlightSpotlights = [];
let headlightFlares = [];
let taillightFlares = [];

// Audio Synthesizer Context
let audioCtx = null;
let idleGainNode = null;
let idleOsc1 = null;
let idleOsc2 = null;

// Camera Interpolation State
let isTransitioningCamera = false;
let camStartPos = new THREE.Vector3();
let camEndPos = new THREE.Vector3();
let camStartLook = new THREE.Vector3();
let camEndLook = new THREE.Vector3();
let camTargetLook = new THREE.Vector3(0, 0.45, 0);
let camTransitionProgress = 1.0;
let camTransitionDuration = 1.6;
let camTransitionStartTime = 0;

// Camera Preset Coordinates
const cameraPresets = {
  hero: { pos: new THREE.Vector3(3.6, 1.4, 3.8), look: new THREE.Vector3(0, 0.45, 0) },
  side: { pos: new THREE.Vector3(4.8, 0.9, 0.0), look: new THREE.Vector3(0, 0.45, 0) },
  front: { pos: new THREE.Vector3(0.0, 0.8, 4.5), look: new THREE.Vector3(0, 0.45, 0.2) },
  rear: { pos: new THREE.Vector3(0.0, 1.2, -4.6), look: new THREE.Vector3(0, 0.55, -0.4) },
  top: { pos: new THREE.Vector3(0.01, 6.2, 0.01), look: new THREE.Vector3(0, 0.35, 0) },
  engine: { pos: new THREE.Vector3(1.2, 1.8, -1.2), look: new THREE.Vector3(0, 0.6, -0.8) }
};

// Cinematic Tour Waypoints
const tourWaypoints = [
  { pos: new THREE.Vector3(3.6, 1.4, 3.8), look: new THREE.Vector3(0, 0.45, 0), duration: 4500 },
  { pos: new THREE.Vector3(0.0, 0.8, 4.4), look: new THREE.Vector3(0, 0.45, 0.2), duration: 4000 },
  { pos: new THREE.Vector3(-4.6, 0.9, 0.5), look: new THREE.Vector3(0, 0.45, 0), duration: 4500 },
  { pos: new THREE.Vector3(0.0, 1.2, -4.5), look: new THREE.Vector3(0, 0.55, -0.4), duration: 4500 },
  { pos: new THREE.Vector3(1.2, 1.8, -1.2), look: new THREE.Vector3(0, 0.6, -0.8), duration: 4000 }
];
let currentTourIndex = 0;
let tourTimer = null;

// --- INITIALIZATION ENTRY POINT ---
window.addEventListener('DOMContentLoaded', () => {
  init();
});

function init() {
  const container = document.getElementById('webgl-container');

  // 1. Scene Setup
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0c10); // Black Studio Default

  // 2. Camera Setup
  camera = new THREE.PerspectiveCamera(38, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.copy(cameraPresets.hero.pos);

  // 3. WebGL Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.10;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);

  // 4. Orbit Controls
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.rotateSpeed = 0.95;
  controls.zoomSpeed = 1.2;
  controls.panSpeed = 0.8;
  controls.enableZoom = true;
  controls.enableRotate = true;
  controls.enablePan = true;
  controls.minDistance = 1.8;
  controls.maxDistance = 14.0;
  controls.maxPolarAngle = Math.PI / 2 - 0.02; // Never clip beneath floor
  controls.target.copy(camTargetLook);

  controls.addEventListener('start', () => {
    isTransitioningCamera = false;
    if (state.isTouring) {
      state.isTouring = false;
      if (tourTimer) clearTimeout(tourTimer);
      const tourBtn = document.getElementById('nav-btn-tour');
      if (tourBtn) tourBtn.classList.remove('active');
    }
  });

  // 5. Studio Environment via RoomEnvironment
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  pmremGenerator.compileEquirectangularShader();
  const roomEnv = new RoomEnvironment();
  scene.environment = pmremGenerator.fromScene(roomEnv).texture;
  pmremGenerator.dispose();
  if ('environmentIntensity' in scene) {
    scene.environmentIntensity = 0.75;
  }

  // 6. Studio Lighting
  setupLighting();

  // 7. Ground & Contact Shadow
  setupGround();

  // 8. Headlight Optics & Lens Flares
  setupHeadlightOptics();

  // 9. Load Ferrari F40 3D Model
  loadFerrariModel();

  // 10. UI Events & Listeners
  setupUIEventListeners();

  // 11. Render Loop
  requestAnimationFrame(animate);

  // 12. Window Resize
  window.addEventListener('resize', onWindowResize);
}

// --- SETUP LIGHTING RIGS ---
function setupLighting() {
  const isDark = (state.currentBgTheme === 'black');

  ambientLight = new THREE.AmbientLight(0xfff4f0, isDark ? 0.90 : 0.85);
  scene.add(ambientLight);

  // Key Top-Front Directional Light
  dirLight = new THREE.DirectionalLight(0xfffaf0, isDark ? 1.55 : 1.35);
  dirLight.position.set(3.5, 7.5, 3.5);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width = 2048;
  dirLight.shadow.mapSize.height = 2048;
  dirLight.shadow.camera.near = 0.5;
  dirLight.shadow.camera.far = 20;
  dirLight.shadow.camera.left = -3.5;
  dirLight.shadow.camera.right = 3.5;
  dirLight.shadow.camera.top = 3.5;
  dirLight.shadow.camera.bottom = -3.5;
  dirLight.shadow.bias = -0.0001;
  dirLight.shadow.normalBias = 0.02;
  scene.add(dirLight);

  // Left Softbox Fill Light
  rimLightL = new THREE.DirectionalLight(0xffffff, isDark ? 0.80 : 0.65);
  rimLightL.position.set(-6, 5, -2);
  scene.add(rimLightL);

  // Right Rear Rim Light
  rimLightR = new THREE.DirectionalLight(0xfff0ea, isDark ? 0.70 : 0.55);
  rimLightR.position.set(5, 5, -4);
  scene.add(rimLightR);

  // Headlight Spotlights (Forward beams on ground)
  const spotL = new THREE.SpotLight(0xfffae6, 0, 24, Math.PI / 5, 0.7, 1.2);
  spotL.position.set(0.7, 0.45, 1.9);
  spotL.target.position.set(0.7, -0.05, 8.0);
  scene.add(spotL);
  scene.add(spotL.target);

  const spotR = new THREE.SpotLight(0xfffae6, 0, 24, Math.PI / 5, 0.7, 1.2);
  spotR.position.set(-0.7, 0.45, 1.9);
  spotR.target.position.set(-0.7, -0.05, 8.0);
  scene.add(spotR);
  scene.add(spotR.target);

  headlightSpotlights.push(spotL, spotR);
}

// --- SETUP GROUND & PURE BLACK CONTACT SHADOW ---
function setupGround() {
  const isDark = (state.currentBgTheme === 'black');

  // Ground plane shadow catcher
  const groundGeo = new THREE.PlaneGeometry(120, 120);
  shadowPlaneMat = new THREE.ShadowMaterial({
    opacity: isDark ? 0.55 : 0.16,
    transparent: true,
    depthWrite: false
  });
  groundMesh = new THREE.Mesh(groundGeo, shadowPlaneMat);
  groundMesh.rotation.x = -Math.PI / 2;
  groundMesh.position.y = 0.001;
  groundMesh.receiveShadow = true;
  scene.add(groundMesh);

  // Soft Photorealistic Contact Shadow (Pure Black radial gradient)
  const shadowCanvas = document.createElement('canvas');
  shadowCanvas.width = 1024;
  shadowCanvas.height = 1024;
  const ctx = shadowCanvas.getContext('2d');

  const radGrad = ctx.createRadialGradient(512, 512, 50, 512, 512, 480);
  radGrad.addColorStop(0, 'rgba(0, 0, 0, 0.95)');
  radGrad.addColorStop(0.28, 'rgba(0, 0, 0, 0.70)');
  radGrad.addColorStop(0.58, 'rgba(0, 0, 0, 0.28)');
  radGrad.addColorStop(0.85, 'rgba(0, 0, 0, 0.05)');
  radGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = radGrad;
  ctx.fillRect(0, 0, 1024, 1024);

  const shadowTex = new THREE.CanvasTexture(shadowCanvas);
  const contactGeo = new THREE.PlaneGeometry(3.6, 5.8);
  const contactMat = new THREE.MeshBasicMaterial({
    map: shadowTex,
    transparent: true,
    opacity: isDark ? 0.88 : 0.75,
    depthWrite: false
  });
  contactShadowMesh = new THREE.Mesh(contactGeo, contactMat);
  contactShadowMesh.rotation.x = -Math.PI / 2;
  contactShadowMesh.position.y = 0.002;
  scene.add(contactShadowMesh);
}

// --- OPTICAL HEADLIGHT FLARES ---
function setupHeadlightOptics() {
  const flareTex = createHeadlightFlareTexture();
  const redFlareTex = createTaillightFlareTexture();

  // Front Headlight Flares
  const headlampPositions = [
    { pos: new THREE.Vector3(0.68, 0.52, 1.88), scale: 0.85 },
    { pos: new THREE.Vector3(-0.68, 0.52, 1.88), scale: 0.85 }
  ];

  headlampPositions.forEach((lamp) => {
    const mat = new THREE.SpriteMaterial({
      map: flareTex,
      color: 0xfffae0,
      blending: THREE.AdditiveBlending,
      transparent: true,
      opacity: 0,
      depthWrite: false
    });
    const sprite = new THREE.Sprite(mat);
    sprite.position.copy(lamp.pos);
    sprite.scale.set(lamp.scale, lamp.scale, 1);
    sprite.visible = false;
    scene.add(sprite);
    headlightFlares.push(sprite);
  });

  // Rear Taillight Flares (Twin round lights on each side)
  const tailPositions = [
    new THREE.Vector3(0.62, 0.65, -2.15),
    new THREE.Vector3(0.44, 0.65, -2.15),
    new THREE.Vector3(-0.44, 0.65, -2.15),
    new THREE.Vector3(-0.62, 0.65, -2.15)
  ];

  tailPositions.forEach((tPos) => {
    const mat = new THREE.SpriteMaterial({
      map: redFlareTex,
      color: 0xff1500,
      blending: THREE.AdditiveBlending,
      transparent: true,
      opacity: 0,
      depthWrite: false
    });
    const sprite = new THREE.Sprite(mat);
    sprite.position.copy(tPos);
    sprite.scale.set(0.32, 0.32, 1);
    sprite.visible = false;
    scene.add(sprite);
    taillightFlares.push(sprite);
  });
}

function createHeadlightFlareTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  const grad = ctx.createRadialGradient(128, 128, 0, 128, 128, 126);
  grad.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
  grad.addColorStop(0.15, 'rgba(255, 250, 220, 0.95)');
  grad.addColorStop(0.40, 'rgba(255, 205, 110, 0.50)');
  grad.addColorStop(0.70, 'rgba(255, 160, 50, 0.12)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  const streak = ctx.createLinearGradient(0, 128, 256, 128);
  streak.addColorStop(0, 'rgba(255, 200, 120, 0)');
  streak.addColorStop(0.4, 'rgba(255, 235, 190, 0.3)');
  streak.addColorStop(0.5, 'rgba(255, 255, 255, 0.85)');
  streak.addColorStop(0.6, 'rgba(255, 235, 190, 0.3)');
  streak.addColorStop(1, 'rgba(255, 200, 120, 0)');
  ctx.fillStyle = streak;
  ctx.fillRect(0, 124, 256, 8);

  return new THREE.CanvasTexture(canvas);
}

function createTaillightFlareTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 62);
  grad.addColorStop(0, 'rgba(255, 120, 100, 1.0)');
  grad.addColorStop(0.2, 'rgba(255, 25, 0, 0.9)');
  grad.addColorStop(0.5, 'rgba(200, 10, 0, 0.4)');
  grad.addColorStop(0.8, 'rgba(100, 0, 0, 0.1)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);

  return new THREE.CanvasTexture(canvas);
}

// --- LOAD FERRARI F40 LB-WORKS 3D MODEL ---
function loadFerrariModel() {
  const loader = new GLTFLoader();
  const modelUrl = './public/model/ferrari_f40.glb';

  const progressFill = document.getElementById('progress-fill');
  const loadPercentText = document.getElementById('load-percent-text');
  const loadStatusText = document.getElementById('load-status-text');

  loader.load(
    modelUrl,
    (gltf) => {
      carModel = gltf.scene;

      // 1. Compute bounding box and normalize scale & center
      const rawBox = new THREE.Box3().setFromObject(carModel);
      const rawSize = new THREE.Vector3();
      rawBox.getSize(rawSize);

      // Ferrari F40 real length is ~4.4 meters
      const maxHorizontal = Math.max(rawSize.x, rawSize.z);
      if (maxHorizontal > 8.0) {
        const targetScale = 4.4 / maxHorizontal;
        carModel.scale.set(targetScale, targetScale, targetScale);
      }

      // Re-center after scaling so bottom of tires sits on y = 0
      const box = new THREE.Box3().setFromObject(carModel);
      const center = new THREE.Vector3();
      box.getCenter(center);

      carModel.position.x = -center.x;
      carModel.position.y = -box.min.y;
      carModel.position.z = -center.z;

      // 2. Materials Tuning & Enhancements
      let sharedBodyMat = null;

      carModel.traverse((node) => {
        if (node.isMesh) {
          node.castShadow = true;
          node.receiveShadow = true;

          const mat = node.material;
          if (mat) {
            const matName = (mat.name || '').toLowerCase();
            const nodeName = (node.name || '').toLowerCase();

            // Body paint materials
            if (matName === 'paint' || matName.includes('paint') || nodeName.includes('paint')) {
              if (!sharedBodyMat) {
                // Rosso Corsa Lacquer: deep vibrant red, smooth gloss, no harsh laser beam
                sharedBodyMat = new THREE.MeshPhysicalMaterial({
                  map: mat.map,
                  normalMap: mat.normalMap,
                  color: new THREE.Color(0xd40000), // Ferrari Rosso Corsa
                  roughness: 0.16,
                  metalness: 0.0,
                  clearcoat: 0.70,
                  clearcoatRoughness: 0.18,
                  ior: 1.45,
                  reflectivity: 0.5,
                  envMapIntensity: 0.55
                });
                bodyMaterials.push(sharedBodyMat);
              }
              node.material = sharedBodyMat;
            }

            // Carbon Fiber aero parts (LBWK Splitter, Wing, Diffuser)
            if (matName.includes('carbon')) {
              mat.roughness = 0.35;
              mat.metalness = 0.20;
              mat.envMapIntensity = 0.9;
              carbonMaterials.push(mat);
            }

            // Tinted Windows & Windshield
            if (matName.includes('window') || (matName.includes('glass') && !matName.includes('rear') && !matName.includes('back'))) {
              mat.transparent = true;
              mat.opacity = 0.40;
              mat.roughness = 0.05;
              mat.metalness = 0.05;
              mat.envMapIntensity = 1.0;
              glassMaterials.push(mat);
            }

            // Louvered Lexan Rear Engine Deck Cover
            if (matName.includes('glassback') || matName.includes('glass.back')) {
              mat.transparent = true;
              mat.opacity = 0.45;
              mat.roughness = 0.08;
              mat.metalness = 0.05;
              mat.envMapIntensity = 1.1;
            }

            // Headlights
            if (matName.includes('headlight') || matName.includes('hl inside') || matName.includes('ll shell')) {
              headlightMaterials.push(mat);
            }

            // Taillights
            if (matName.includes('rearlight')) {
              taillightMaterials.push(mat);
            }

            // Brembo Calipers & Brakes
            if (matName.includes('brembo') || matName.includes('brake')) {
              mat.metalness = 0.75;
              mat.roughness = 0.25;
            }

            // Wheels / Custom LBWK Rims
            if (matName.includes('material') || matName.includes('rim')) {
              mat.metalness = 0.85;
              mat.roughness = 0.18;
              mat.envMapIntensity = 1.2;
            }

            // Tires (Toyo Proxes / Pirelli)
            if (matName.includes('tire') || matName.includes('tyre')) {
              mat.roughness = 0.85;
              mat.metalness = 0.05;
            }
          }
        }
      });

      scene.add(carModel);

      // Hide loading screen smoothly
      setTimeout(() => {
        const loaderScreen = document.getElementById('loader-screen');
        if (loaderScreen) loaderScreen.classList.add('hidden');
      }, 500);
    },
    (xhr) => {
      const knownTotal = 27503604; // 27.5 MB exact model size
      const total = (xhr.lengthComputable && xhr.total > 0) ? xhr.total : knownTotal;
      const percent = Math.min(Math.round((xhr.loaded / total) * 100), 100);
      const loadedMB = (xhr.loaded / (1024 * 1024)).toFixed(1);
      const totalMB = (total / (1024 * 1024)).toFixed(1);

      if (progressFill) progressFill.style.width = `${percent}%`;
      if (loadPercentText) loadPercentText.textContent = `${percent}%`;
      if (loadStatusText) {
        loadStatusText.textContent = currentLang === 'ru'
          ? `Загрузка 3D модели: ${loadedMB} / ${totalMB} МБ`
          : `Loading 3D Model: ${loadedMB} / ${totalMB} MB`;
      }
    },
    (err) => {
      console.error('Error loading Ferrari model:', err);
      if (loadStatusText) {
        loadStatusText.textContent = currentLang === 'ru' ? 'Ошибка загрузки модели' : 'Error loading 3D model';
      }
    }
  );
}

// --- PAINT & COLOR CUSTOMIZATION ---
function setBodyColor(hex, id, name) {
  state.currentPaintHex = hex;
  state.currentPaintId = id;
  const col = new THREE.Color(hex);

  bodyMaterials.forEach((mat) => {
    mat.color.copy(col);
    mat.needsUpdate = true;
  });

  document.querySelectorAll('.color-swatch-item').forEach((item) => {
    item.classList.toggle('active', item.dataset.colorId === id);
  });

  showToast(`${i18n[currentLang].toastPaint}${name}`);
}

function setPaintFinish(finish) {
  state.currentFinish = finish;
  bodyMaterials.forEach((mat) => {
    if (finish === 'gloss') {
      mat.roughness = 0.16;
      mat.metalness = 0.0;
      mat.clearcoat = 0.70;
      mat.clearcoatRoughness = 0.18;
      mat.ior = 1.45;
      mat.envMapIntensity = 0.55;
    } else if (finish === 'metallic') {
      mat.roughness = 0.20;
      mat.metalness = 0.55;
      mat.clearcoat = 0.70;
      mat.clearcoatRoughness = 0.18;
      mat.ior = 1.45;
      mat.envMapIntensity = 0.65;
    } else if (finish === 'satin') {
      mat.roughness = 0.48;
      mat.metalness = 0.10;
      mat.clearcoat = 0.15;
      mat.clearcoatRoughness = 0.35;
      mat.ior = 1.45;
      mat.envMapIntensity = 0.45;
    }
    mat.needsUpdate = true;
  });

  document.querySelectorAll('.finish-btn').forEach((b) => {
    b.classList.toggle('active', b.dataset.finish === finish);
  });
}

// --- BACKGROUND & THEME TOGGLE (WHITE / BLACK STUDIO) ---
function toggleBgTheme() {
  const newTheme = state.currentBgTheme === 'white' ? 'black' : 'white';
  setBgTheme(newTheme);
}

function setBgTheme(theme) {
  state.currentBgTheme = theme;
  const isWhite = (theme === 'white');

  try {
    localStorage.setItem('ferrari_theme', theme);
  } catch (e) {}

  const canvasContainer = document.getElementById('webgl-container');

  if (isWhite) {
    scene.background.set(0xf2f3f5);
    if (canvasContainer) canvasContainer.style.background = '#f2f3f5';
    if (shadowPlaneMat) shadowPlaneMat.opacity = 0.16;
    if (contactShadowMesh) contactShadowMesh.material.opacity = 0.75;

    ambientLight.intensity = 0.85;
    dirLight.intensity = 1.35;
    rimLightL.intensity = 0.65;
    rimLightR.intensity = 0.55;
    if (renderer) renderer.toneMappingExposure = 1.0;
    document.body.classList.remove('dark-studio');
  } else {
    scene.background.set(0x0a0c10);
    if (canvasContainer) canvasContainer.style.background = '#0a0c10';
    if (shadowPlaneMat) shadowPlaneMat.opacity = 0.55;
    if (contactShadowMesh) contactShadowMesh.material.opacity = 0.88;

    ambientLight.intensity = 0.90;
    dirLight.intensity = 1.55;
    rimLightL.intensity = 0.80;
    rimLightR.intensity = 0.70;
    if (renderer) renderer.toneMappingExposure = 1.10;
    document.body.classList.add('dark-studio');
  }

  const bgLabel = document.getElementById('label-bg-toggle');
  if (bgLabel) {
    bgLabel.textContent = isWhite
      ? (currentLang === 'ru' ? 'Фон: Белый' : 'BG: White')
      : (currentLang === 'ru' ? 'Фон: Черный' : 'BG: Black');
  }

  const toggleBtn = document.getElementById('btn-toggle-bg');
  if (toggleBtn) toggleBtn.classList.toggle('active', !isWhite);

  const themeToggleHeader = document.getElementById('btn-theme-toggle');
  if (themeToggleHeader) {
    themeToggleHeader.classList.toggle('active', !isWhite);
    themeToggleHeader.title = isWhite
      ? (currentLang === 'ru' ? 'Переключить на черный фон [B]' : 'Switch to Black Studio [B]')
      : (currentLang === 'ru' ? 'Переключить на белый фон [B]' : 'Switch to White Studio [B]');
  }

  const btnEnvWhite = document.getElementById('btn-env-white');
  const btnEnvDark = document.getElementById('btn-env-dark');
  if (btnEnvWhite) btnEnvWhite.classList.toggle('active', isWhite);
  if (btnEnvDark) btnEnvDark.classList.toggle('active', !isWhite);

  showToast(isWhite ? i18n[currentLang].toastBgWhite : i18n[currentLang].toastBgBlack);
}

// --- LIGHTS & OPTICS TOGGLE ---
function toggleLights() {
  state.lightsOn = !state.lightsOn;
  const on = state.lightsOn;

  headlightSpotlights.forEach((spot) => {
    spot.intensity = on ? 4.5 : 0;
  });

  headlightFlares.forEach((flare) => {
    flare.visible = on;
    flare.material.opacity = on ? 0.95 : 0;
  });

  taillightFlares.forEach((flare) => {
    flare.visible = on;
    flare.material.opacity = on ? 0.90 : 0;
  });

  headlightMaterials.forEach((mat) => {
    if (on) {
      mat.emissive = new THREE.Color(0xfff5dd);
      mat.emissiveIntensity = 2.0;
    } else {
      mat.emissive = new THREE.Color(0x000000);
      mat.emissiveIntensity = 0;
    }
    mat.needsUpdate = true;
  });

  taillightMaterials.forEach((mat) => {
    if (on) {
      mat.emissive = new THREE.Color(0xff1500);
      mat.emissiveIntensity = 2.4;
    } else {
      mat.emissive = new THREE.Color(0x000000);
      mat.emissiveIntensity = 0;
    }
    mat.needsUpdate = true;
  });

  const lightsBtn = document.getElementById('btn-toggle-lights');
  const lightsLabel = document.getElementById('label-lights-status');
  if (lightsBtn) lightsBtn.classList.toggle('active', on);
  if (lightsLabel) lightsLabel.textContent = on ? i18n[currentLang].lightsOn : i18n[currentLang].lightsOff;

  showToast(on ? i18n[currentLang].toastLightsOn : i18n[currentLang].toastLightsOff);
}

// --- FERRARI TWIN-TURBO V8 SOUND SYNTHESIZER ---
function revEngineSound() {
  if (state.soundMuted) return;

  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!audioCtx) audioCtx = new AudioContext();
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const now = audioCtx.currentTime;

    // V8 Engine Rumble + Twin Turbos
    const osc1 = audioCtx.createOscillator();
    const osc2 = audioCtx.createOscillator();
    const filter = audioCtx.createBiquadFilter();
    const gain = audioCtx.createGain();

    osc1.type = 'sawtooth';
    osc2.type = 'triangle';

    // F40 Twin-Turbo V8 Pitch Curve (80Hz idle -> 340Hz 8000 RPM scream -> idle)
    osc1.frequency.setValueAtTime(85, now);
    osc1.frequency.exponentialRampToValueAtTime(320, now + 0.45);
    osc1.frequency.exponentialRampToValueAtTime(360, now + 0.7);
    osc1.frequency.exponentialRampToValueAtTime(90, now + 1.8);

    osc2.frequency.setValueAtTime(42, now);
    osc2.frequency.exponentialRampToValueAtTime(160, now + 0.45);
    osc2.frequency.exponentialRampToValueAtTime(180, now + 0.7);
    osc2.frequency.exponentialRampToValueAtTime(45, now + 1.8);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, now);
    filter.frequency.exponentialRampToValueAtTime(2800, now + 0.5);
    filter.frequency.exponentialRampToValueAtTime(500, now + 1.8);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.35, now + 0.1);
    gain.gain.setValueAtTime(0.35, now + 0.7);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 2.0);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 2.0);
    osc2.stop(now + 2.0);

    // Twin-Turbo Wastegate Blow-off Valve (BOV) Flutter at t + 0.7s
    const bovNoise = audioCtx.createBufferSource();
    const bufferSize = audioCtx.sampleRate * 0.5;
    const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    bovNoise.buffer = noiseBuffer;

    const bovFilter = audioCtx.createBiquadFilter();
    bovFilter.type = 'bandpass';
    bovFilter.frequency.setValueAtTime(1800, now + 0.7);
    bovFilter.Q.setValueAtTime(3.0, now + 0.7);

    const bovGain = audioCtx.createGain();
    bovGain.gain.setValueAtTime(0.001, now + 0.7);
    bovGain.gain.linearRampToValueAtTime(0.18, now + 0.75);
    bovGain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

    bovNoise.connect(bovFilter);
    bovFilter.connect(bovGain);
    bovGain.connect(audioCtx.destination);

    bovNoise.start(now + 0.7);
    bovNoise.stop(now + 1.25);

    showToast(i18n[currentLang].toastEngine);
  } catch (err) {
    console.warn('Audio synthesis not permitted yet:', err);
  }
}

// --- CAMERA PRESET TRANSITION ---
function transitionCameraTo(targetPos, targetLook) {
  isTransitioningCamera = true;
  camStartPos.copy(camera.position);
  camEndPos.copy(targetPos);
  camStartLook.copy(controls.target);
  camEndLook.copy(targetLook);
  camTransitionStartTime = performance.now();
  camTransitionProgress = 0;
}

// --- CINEMATIC TOUR CONTROLLER ---
function toggleCinematicTour() {
  state.isTouring = !state.isTouring;
  const tourBtn = document.getElementById('nav-btn-tour');
  if (tourBtn) tourBtn.classList.toggle('active', state.isTouring);

  if (state.isTouring) {
    currentTourIndex = 0;
    playTourWaypoint();
    showToast(i18n[currentLang].toastTourStart);
  } else {
    if (tourTimer) clearTimeout(tourTimer);
    isTransitioningCamera = false;
    showToast(i18n[currentLang].toastTourStop);
  }
}

function playTourWaypoint() {
  if (!state.isTouring) return;
  const wp = tourWaypoints[currentTourIndex];
  transitionCameraTo(wp.pos, wp.look);

  tourTimer = setTimeout(() => {
    if (!state.isTouring) return;
    currentTourIndex = (currentTourIndex + 1) % tourWaypoints.length;
    playTourWaypoint();
  }, wp.duration);
}

// --- 4K SCREENSHOT CAPTURE ---
function capture4KScreenshot() {
  const currentRatio = window.innerWidth / window.innerHeight;
  const shotWidth = 3840;
  const shotHeight = Math.round(3840 / currentRatio);

  renderer.setSize(shotWidth, shotHeight, false);
  camera.aspect = shotWidth / shotHeight;
  camera.updateProjectionMatrix();

  renderer.render(scene, camera);

  const dataUrl = renderer.domElement.toDataURL('image/png', 1.0);

  renderer.setSize(window.innerWidth, window.innerHeight, true);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  const link = document.createElement('a');
  link.download = `Ferrari-F40-LB-Works-${Date.now()}.png`;
  link.href = dataUrl;
  link.click();

  showToast(i18n[currentLang].toastPhoto);
}

// --- TOAST NOTIFICATIONS ---
let toastTimeout = null;
function showToast(msg) {
  const toast = document.getElementById('toast-notify');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('visible');

  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.remove('visible');
  }, 2600);
}

// --- UI SETUP & EVENT BINDINGS ---
function setupUIEventListeners() {
  // Swatches generation
  const swatchesContainer = document.getElementById('paint-swatches');
  if (swatchesContainer) {
    swatchesContainer.innerHTML = '';
    paintColors.forEach((p) => {
      const item = document.createElement('div');
      item.className = `color-swatch-item ${p.id === state.currentPaintId ? 'active' : ''}`;
      item.dataset.colorId = p.id;
      item.dataset.hex = p.hex;

      const circle = document.createElement('div');
      circle.className = 'swatch-circle';
      circle.style.backgroundColor = p.hex;

      const name = document.createElement('span');
      name.className = 'swatch-name';
      name.textContent = currentLang === 'ru' ? p.nameRu : p.nameEn;

      item.appendChild(circle);
      item.appendChild(name);

      item.addEventListener('click', () => {
        setBodyColor(p.hex, p.id, currentLang === 'ru' ? p.nameRu : p.nameEn);
      });

      swatchesContainer.appendChild(item);
    });
  }

  // Paint modal toggle
  const openPaintBtn = document.getElementById('btn-open-paint');
  const paintPanel = document.getElementById('paint-customizer');
  const closePaintBtn = document.getElementById('btn-close-paint');

  if (openPaintBtn && paintPanel) {
    openPaintBtn.addEventListener('click', () => {
      paintPanel.classList.toggle('hidden');
    });
  }
  if (closePaintBtn && paintPanel) {
    closePaintBtn.addEventListener('click', () => {
      paintPanel.classList.add('hidden');
    });
  }

  // Finish type buttons
  document.querySelectorAll('.finish-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      setPaintFinish(btn.dataset.finish);
    });
  });

  // Background Theme Toggle buttons
  const bgToggleBtn = document.getElementById('btn-toggle-bg');
  if (bgToggleBtn) {
    bgToggleBtn.addEventListener('click', toggleBgTheme);
  }

  const themeToggleHeader = document.getElementById('btn-theme-toggle');
  if (themeToggleHeader) {
    themeToggleHeader.addEventListener('click', toggleBgTheme);
  }

  const btnEnvWhite = document.getElementById('btn-env-white');
  if (btnEnvWhite) {
    btnEnvWhite.addEventListener('click', () => setBgTheme('white'));
  }

  const btnEnvDark = document.getElementById('btn-env-dark');
  if (btnEnvDark) {
    btnEnvDark.addEventListener('click', () => setBgTheme('black'));
  }

  // Lights toggle
  const lightsBtn = document.getElementById('btn-toggle-lights');
  if (lightsBtn) {
    lightsBtn.addEventListener('click', toggleLights);
  }

  // Engine Rev
  const revBtn = document.getElementById('btn-engine-rev');
  if (revBtn) {
    revBtn.addEventListener('click', revEngineSound);
  }

  // Sound mute toggle
  const soundToggle = document.getElementById('btn-sound-toggle');
  if (soundToggle) {
    soundToggle.addEventListener('click', () => {
      state.soundMuted = !state.soundMuted;
      soundToggle.classList.toggle('active', !state.soundMuted);
    });
  }

  // Auto-rotate
  const autoRotBtn = document.getElementById('nav-btn-autorotate');
  if (autoRotBtn) {
    autoRotBtn.addEventListener('click', () => {
      state.autoRotate = !state.autoRotate;
      autoRotBtn.classList.toggle('active', state.autoRotate);
      showToast(state.autoRotate ? i18n[currentLang].toastRotateOn : i18n[currentLang].toastRotateOff);
    });
  }

  // Cinematic Tour
  const tourBtn = document.getElementById('nav-btn-tour');
  if (tourBtn) {
    tourBtn.addEventListener('click', toggleCinematicTour);
  }

  // Photo
  const photoBtn = document.getElementById('nav-btn-screenshot');
  if (photoBtn) {
    photoBtn.addEventListener('click', capture4KScreenshot);
  }

  // Camera reset
  const resetBtn = document.getElementById('nav-btn-reset');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      transitionCameraTo(cameraPresets.hero.pos, cameraPresets.hero.look);
      document.querySelectorAll('.cam-angle-btn').forEach((b) => {
        b.classList.toggle('active', b.dataset.preset === 'hero');
      });
    });
  }

  // Camera presets
  document.querySelectorAll('.cam-angle-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const presetKey = btn.dataset.preset;
      const target = cameraPresets[presetKey];
      if (target) {
        document.querySelectorAll('.cam-angle-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        transitionCameraTo(target.pos, target.look);
      }
    });
  });

  // Specs drawer
  const specsBtn = document.getElementById('btn-specs');
  const specsDrawer = document.getElementById('specs-drawer');
  const closeSpecsBtn = document.getElementById('btn-close-specs');

  if (specsBtn && specsDrawer) {
    specsBtn.addEventListener('click', () => {
      specsDrawer.classList.toggle('active');
    });
  }
  if (closeSpecsBtn && specsDrawer) {
    closeSpecsBtn.addEventListener('click', () => {
      specsDrawer.classList.remove('active');
    });
  }

  // Zen mode
  const zenBtn = document.getElementById('btn-zen-mode');
  const uiRoot = document.getElementById('ui-root');
  if (zenBtn && uiRoot) {
    zenBtn.addEventListener('click', () => {
      state.isZen = true;
      uiRoot.classList.add('zen-hidden');

      let restoreBtn = document.getElementById('zen-restore-btn');
      if (!restoreBtn) {
        restoreBtn = document.createElement('button');
        restoreBtn.id = 'zen-restore-btn';
        restoreBtn.textContent = currentLang === 'ru' ? 'Выйти из Zen-режима [U]' : 'Exit Zen Mode [U]';
        document.body.appendChild(restoreBtn);
        restoreBtn.addEventListener('click', () => {
          state.isZen = false;
          uiRoot.classList.remove('zen-hidden');
          restoreBtn.style.display = 'none';
        });
      }
      restoreBtn.style.display = 'block';
    });
  }

  // Language toggle
  const langBtn = document.getElementById('btn-lang-toggle');
  if (langBtn) {
    langBtn.addEventListener('click', () => {
      currentLang = currentLang === 'ru' ? 'en' : 'ru';
      langBtn.textContent = currentLang.toUpperCase();
      updateTranslations();
    });
  }

  // Keyboard Shortcuts
  window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    const key = e.key.toLowerCase();
    if (key === 'l' || key === 'д') toggleLights();
    if (key === ' ' || e.code === 'Space') {
      e.preventDefault();
      revEngineSound();
    }
    if (key === 'b' || key === 'и') toggleBgTheme();
    if (key === 'r' || key === 'к') {
      state.autoRotate = !state.autoRotate;
      const b = document.getElementById('nav-btn-autorotate');
      if (b) b.classList.toggle('active', state.autoRotate);
      showToast(state.autoRotate ? i18n[currentLang].toastRotateOn : i18n[currentLang].toastRotateOff);
    }
    if (key === 't' || key === 'е') toggleCinematicTour();
    if (key === 'p' || key === 'з') capture4KScreenshot();
    if (key === 'u' || key === 'г') {
      if (state.isZen) {
        const restore = document.getElementById('zen-restore-btn');
        if (restore) restore.click();
      } else {
        const zen = document.getElementById('btn-zen-mode');
        if (zen) zen.click();
      }
    }
    if (e.key === 'Escape') {
      if (paintPanel) paintPanel.classList.add('hidden');
      if (specsDrawer) specsDrawer.classList.remove('active');
    }
  });
}

function updateTranslations() {
  const dict = i18n[currentLang];
  document.querySelectorAll('.i18n-lighting').forEach(el => el.textContent = dict.lighting);
  document.querySelectorAll('.i18n-env-studio').forEach(el => el.textContent = dict.envStudio);
  document.querySelectorAll('.i18n-env-monza').forEach(el => el.textContent = dict.envMonza);
  document.querySelectorAll('.i18n-paint-btn').forEach(el => el.textContent = dict.paintBtn);
  document.querySelectorAll('.i18n-engine-rev').forEach(el => el.textContent = dict.engineRev);
  document.querySelectorAll('.i18n-autorotate').forEach(el => el.textContent = dict.autorotate);
  document.querySelectorAll('.i18n-cinematic').forEach(el => el.textContent = dict.cinematic);
  document.querySelectorAll('.i18n-photo').forEach(el => el.textContent = dict.photo);
  document.querySelectorAll('.i18n-reset').forEach(el => el.textContent = dict.reset);
  document.querySelectorAll('.i18n-paint-title').forEach(el => el.textContent = dict.paintTitle);
  document.querySelectorAll('.i18n-finish-title').forEach(el => el.textContent = dict.finishTitle);
  document.querySelectorAll('.i18n-specs-title').forEach(el => el.textContent = dict.specsTitle);

  const lightsLabel = document.getElementById('label-lights-status');
  if (lightsLabel) lightsLabel.textContent = state.lightsOn ? dict.lightsOn : dict.lightsOff;

  const bgLabel = document.getElementById('label-bg-toggle');
  if (bgLabel) {
    bgLabel.textContent = (state.currentBgTheme === 'white') ? dict.bgWhite : dict.bgDark;
  }
}

// --- ANIMATION & RENDER LOOP ---
function animate(time) {
  requestAnimationFrame(animate);

  // Smooth Camera Preset Transition
  if (isTransitioningCamera) {
    const elapsed = (time - camTransitionStartTime) / 1000;
    camTransitionProgress = Math.min(elapsed / camTransitionDuration, 1.0);

    // Smooth cubic ease-out
    const t = 1 - Math.pow(1 - camTransitionProgress, 3);
    camera.position.lerpVectors(camStartPos, camEndPos, t);
    controls.target.lerpVectors(camStartLook, camEndLook, t);

    if (camTransitionProgress >= 1.0) {
      isTransitioningCamera = false;
    }
  }

  // Smooth Auto-Rotation
  if (state.autoRotate && !isTransitioningCamera) {
    controls.autoRotate = true;
    controls.autoRotateSpeed = 1.2;
  } else {
    controls.autoRotate = false;
  }

  controls.update();
  renderer.render(scene, camera);
}

// --- WINDOW RESIZE ---
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
