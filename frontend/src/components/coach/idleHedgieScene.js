import * as THREE from 'three';
import {
  addLighting,
  createHedgehog,
  createShadow,
  disposeHedgieScene,
  isolateHedgieResources,
} from '../hedgie/model.js';

const FRAME_INTERVAL = 1000 / 30;
// Leave room for the swept quills while Hedgie looks around and lifts off the ground.
const FRAMING_HALF_HEIGHT = 2.08;

export function mountIdleHedgie(viewport, onContextLost) {
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = .97;

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-FRAMING_HALF_HEIGHT, FRAMING_HALF_HEIGHT, FRAMING_HALF_HEIGHT, -FRAMING_HALF_HEIGHT, .1, 25);
  camera.position.set(0, 2.65, 10);
  camera.lookAt(0, 1.67, 0);
  addLighting(scene);
  const { root, body, head, eyes, arms, feet, openMouth } = createHedgehog(scene);
  const shadow = createShadow(scene);
  isolateHedgieResources(scene);

  openMouth.visible = false;
  for (const eye of eyes) eye.smile.visible = false;

  const canvas = renderer.domElement;
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const listeners = new AbortController();
  const listenerOptions = { signal: listeners.signal };
  const gaze = new THREE.Vector2();
  const target = new THREE.Vector2();
  const travel = new THREE.Vector2();
  const travelTarget = new THREE.Vector2();
  const previousCenter = new THREE.Vector2();
  let pointer;
  let hasPreviousCenter = false;
  let active = false;
  let onScreen = false;
  let lift = 0;
  let time = 0;
  let lastFrame = performance.now();

  function draw() {
    root.position.y = lift * .18;
    root.rotation.set(travel.y * lift * .10, gaze.x * .14, -travel.x * lift * .20);
    body.scale.y = 1 + Math.sin(time * 2) * .014;
    head.rotation.set(gaze.y * .22, gaze.x * .34, Math.sin(time * 1.25) * .025);
    for (const [index, arm] of arms.entries()) {
      const side = index === 0 ? -1 : 1;
      arm.rotation.set(-lift * .30, 0, side * (.24 + lift * .50));
      feet[index].rotation.x = lift * (.17 + side * travel.x * .14);
    }
    shadow.scale.setScalar(1 - lift * .12);
    shadow.material.opacity = 1 - lift * .45;
    const blink = 1 - .94 * (1 - THREE.MathUtils.smoothstep(Math.abs(time % 4.4 - 2.6), 0, .11));
    for (const eye of eyes) {
      eye.open.scale.y = blink;
      eye.pupil.position.set(gaze.x * .023, -gaze.y * .018, 0);
    }
    renderer.render(scene, camera);
  }

  function animate(now) {
    const dragging = viewport.dataset.dragging === 'true';
    const elapsed = now - lastFrame;
    if (!dragging && lift < .01 && elapsed < FRAME_INTERVAL * .9) return;
    lastFrame = now;
    const delta = Math.min(elapsed / 1000, .1);
    time += delta;
    const rect = viewport.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    if (dragging && hasPreviousCenter && delta > 0) {
      travelTarget.set(
        THREE.MathUtils.clamp((centerX - previousCenter.x) / (delta * 650), -1, 1),
        THREE.MathUtils.clamp((centerY - previousCenter.y) / (delta * 650), -1, 1),
      );
    } else {
      travelTarget.set(0, 0);
    }
    previousCenter.set(centerX, centerY);
    hasPreviousCenter = true;

    lift = THREE.MathUtils.damp(lift, dragging ? 1 : 0, 12, delta);
    travel.lerp(travelTarget, 1 - Math.exp(-delta * 14));
    if (dragging) {
      target.set(travel.x * .85, travel.y * .65);
    } else if (pointer) {
      target.set(
        THREE.MathUtils.clamp((pointer.x - centerX) / 180, -1, 1),
        THREE.MathUtils.clamp((pointer.y - centerY) / 150, -1, 1),
      );
    } else {
      target.set(0, 0);
    }
    gaze.lerp(target, 1 - Math.exp(-delta * 8));
    draw();
  }

  function updateLoop() {
    lastFrame = performance.now();
    hasPreviousCenter = false;
    renderer.setAnimationLoop(active && onScreen && !document.hidden && !motion.matches ? animate : null);
    if (active && onScreen && motion.matches) {
      time = 0;
      lift = 0;
      gaze.set(0, 0);
      travel.set(0, 0);
      draw();
    }
  }

  function resize() {
    const { clientWidth: width, clientHeight: height } = viewport;
    if (!width || !height) return;
    const aspect = width / height;
    const halfHeight = FRAMING_HALF_HEIGHT * Math.max(1, 1 / aspect);
    Object.assign(camera, {
      left: -halfHeight * aspect, right: halfHeight * aspect, top: halfHeight, bottom: -halfHeight,
    });
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    draw();
  }

  function forgetPointer() {
    pointer = undefined;
  }

  const sizeObserver = new ResizeObserver(resize);
  const visibilityObserver = new IntersectionObserver(([entry]) => {
    onScreen = entry.isIntersecting && entry.intersectionRect.width > 0 && entry.intersectionRect.height > 0;
    updateLoop();
  });

  function dispose() {
    listeners.abort();
    sizeObserver.disconnect();
    visibilityObserver.disconnect();
    canvas.remove();
    disposeHedgieScene(scene, renderer);
  }

  try {
    canvas.addEventListener('webglcontextlost', () => {
      dispose();
      onContextLost();
    }, listenerOptions);
    window.addEventListener('pointermove', (event) => {
      if (event.pointerType !== 'touch') pointer = { x: event.clientX, y: event.clientY };
    }, listenerOptions);
    document.documentElement.addEventListener('pointerleave', forgetPointer, listenerOptions);
    window.addEventListener('blur', forgetPointer, listenerOptions);
    document.addEventListener('visibilitychange', updateLoop, listenerOptions);
    motion.addEventListener('change', updateLoop, listenerOptions);
    viewport.append(canvas);
    resize();
    sizeObserver.observe(viewport);
    visibilityObserver.observe(viewport);
  } catch (error) {
    dispose();
    throw error;
  }
  return {
    setActive(nextActive) {
      active = nextActive;
      updateLoop();
    },
    dispose,
  };
}
