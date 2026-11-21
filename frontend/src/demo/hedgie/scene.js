import * as THREE from 'three';
import {
  addLighting,
  createHedgehog,
  createMedal,
  createShadow,
  disposeHedgieScene,
  isolateHedgieResources,
} from '../../components/hedgie/model.js';
import {
  isWrongAnswerSpeaking,
  poseWrongAnswer,
  WRONG_ANSWER_DURATION,
  WRONG_ANSWER_STILL_FRAME,
} from './wrongAnswerAnimation.js';

const smooth = THREE.MathUtils.smoothstep;
const arc = (t, start, end) => t > start && t < end ? Math.sin(Math.PI * (t - start) / (end - start)) : 0;
const bump = (t, at, width) => 1 - smooth(Math.abs(t - at), 0, width);

function poseCelebration(model, time, elapsed, gaze) {
  const { root, body, head, arms, eyes, ears, feet, neutralMouth, openMouth, frown } = model;
  const cheer = 1 - smooth(elapsed, 1.78, 2.35);
  const liftPaw = smooth(elapsed, 0, .45) * cheer;
  const jump = arc(elapsed, .32, 1.06);
  const smallHop = arc(elapsed, 1.16, 1.51);
  const squash = .105 * bump(elapsed, .26, .15) + .09 * bump(elapsed, 1.08, .105) + .045 * bump(elapsed, 1.52, .09);
  const breath = Math.sin(time * 2.05) * .014;
  root.position.y = .53 * jump + .14 * smallHop;
  root.rotation.set(0, -.35 + gaze.x * .23 - jump * .24, -.022 - jump * .09);
  body.scale.set(1 + squash * .68 - jump * .024, 1 - squash + jump * .054 + breath, 1 + squash * .42);
  head.rotation.set(
    .012 + gaze.y * .12 - jump * .077,
    gaze.x * .14,
    .042 + Math.sin(time * 1.55) * .035,
  );
  arms[0].rotation.set(-.42 - cheer * .13, -.12, -.30 - liftPaw * 1.52 - jump * .29);
  arms[1].rotation.set(-.32, .08, .35 + cheer * .21 + jump * 1.23);
  const blink = 1 - .95 * bump(time % 4.6, 3.17, .108);
  const smiling = jump > .42 || smallHop > .75;
  for (const [i, eye] of eyes.entries()) {
    eye.open.visible = !smiling;
    eye.smile.visible = smiling;
    eye.open.scale.y = blink;
    eye.pupil.position.set(gaze.x * .022, -gaze.y * .014, 0);
    eye.brow.rotation.z = eye.side * .02;
    eye.brow.position.y = .37 + jump * .025;
    eye.brow.scale.setScalar(1);
    ears[i].rotation.z = -eye.side * (.45 + jump * .17 + Math.sin(time * 2.1 + i) * .02);
    feet[i].rotation.x = jump * (i ? -.40 : .35);
  }
  neutralMouth.visible = cheer < .5;
  openMouth.visible = !neutralMouth.visible;
  frown.visible = false;
}

function paperBurst(scene) {
  const geometry = new THREE.BoxGeometry(.047, .13, .018);
  const palette = ['#f5a20a','#fff4c9','#bf7247','#f4bc36'].map(color => new THREE.MeshBasicMaterial({ color }));
  return Array.from({ length: 22 }, (_, i) => {
    const part = new THREE.Mesh(geometry, palette[i % 4]);
    scene.add(part);
    return part;
  });
}

export function prepareHedgieScene() {
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = .97;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.setClearColor(0x000000, 0);
  const canvas = renderer.domElement;
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-2, 2, 2, -2, .1, 25);
  camera.position.set(0, 2.93, 10);
  camera.lookAt(0, 1.65, 0);
  addLighting(scene);
  const hedgie = createHedgehog(scene);
  const shadow = createShadow(scene);
  const medal = createMedal(scene);
  const confetti = paperBurst(scene);
  isolateHedgieResources(scene);
  const gaze = new THREE.Vector2();
  const pointer = new THREE.Vector2();
  const lifetime = new AbortController();
  let unmountViewport;
  let reaction;
  let reactionStartedAt = 0;
  let reactionElapsed = 0;
  let speaking = false;
  let onScreen = false;
  let time = 0;
  let elapsed = 0;
  let then = performance.now();

  function frameHedgie(lift) {
    const zoom = 1 - lift * .205;
    if (camera.zoom !== zoom) {
      camera.zoom = zoom;
      camera.position.y = 2.93 + lift * .40;
      camera.updateProjectionMatrix();
    }
    shadow.scale.setScalar(1 - lift * .23);
    shadow.material.opacity = .94 - lift * .63;
  }

  function drawCelebration(now) {
    const dt = Math.max(0, (now - then) / 1000);
    then = now;
    time += dt;
    elapsed += dt;
    gaze.lerp(pointer, 1 - Math.exp(-dt * 8));
    poseCelebration(hedgie, time, elapsed, gaze);
    frameHedgie(hedgie.root.position.y);
    const toss = arc(elapsed, .43, 1.48);
    medal.position.set(-.015, -.52, .185);
    hedgie.arms[0].localToWorld(medal.position);
    medal.position.x -= .055 + .15 * toss;
    medal.position.y += .165 + .97 * toss;
    medal.position.z += .14;
    medal.rotation.set(-.12, -.34 + 2 * Math.PI * smooth(elapsed, .43, 1.48), -.15 + .23 * toss);
    const medalSize = smooth(elapsed, .07, .32) * (1 - smooth(elapsed, 1.78, 2.32));
    medal.visible = medalSize > 0;
    medal.scale.setScalar(.96 * medalSize);
    for (const [i, part] of confetti.entries()) {
      const a = i * 2.39996;
      const p = (elapsed - .61 - (i % 4) * .051) / 1.37;
      part.visible = p > 0 && p < 1;
      if (!part.visible) continue;
      const reach = Math.sin(Math.PI * p / 2);
      part.position.set(Math.cos(a) * (1.1 + (i % 3) * .32) * reach,
        1.77 + (.94 + (i % 5) * .26) * Math.sin(Math.PI * p) - p * .47, .12 + Math.sin(a) * .54);
      part.rotation.set(a + p * 6, p * 5 + a, a + p * 3);
      part.scale.setScalar(Math.min(1, p * 10, (1 - p) * 7));
    }
    renderer.render(scene, camera);
  }

  function drawWrongAnswer() {
    const poseTime = reaction.reducedMotion ? WRONG_ANSWER_STILL_FRAME : reactionElapsed;
    poseWrongAnswer(hedgie, poseTime, camera.right, reaction.gesture);
    renderer.render(scene, camera);
  }

  function finishWrongAnswer() {
    const { onSpeech, onFinish } = reaction;
    unmountViewport?.();
    onSpeech(false);
    onFinish();
  }

  function advanceWrongAnswer(now) {
    reactionElapsed = Math.max(0, (now - reactionStartedAt) / 1000);
    if (reactionElapsed >= WRONG_ANSWER_DURATION) {
      finishWrongAnswer();
      return;
    }
    drawWrongAnswer();
    const showSpeech = isWrongAnswerSpeaking(reactionElapsed);
    if (speaking !== showSpeech) {
      speaking = showSpeech;
      reaction.onSpeech(speaking);
    }
  }

  function updateLoop() {
    then = performance.now();
    const draw = reaction
      ? (reaction.reducedMotion ? null : advanceWrongAnswer)
      : (onScreen ? drawCelebration : null);
    renderer.setAnimationLoop(document.hidden ? null : draw);
  }
  function resize() {
    const viewport = canvas.parentElement;
    if (!viewport) return;
    const { clientWidth: w, clientHeight: h } = viewport;
    if (!w || !h) return;
    const aspect = w / h;
    const framingHeight = reaction ? 3.85 : 3.72;
    const half = Math.max(framingHeight, 3.54 / aspect) / 2;
    Object.assign(camera, { left: -half * aspect, right: half * aspect, top: half, bottom: -half });
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
    if (reaction) drawWrongAnswer();
    else drawCelebration(then);
  }
  const resizeObserver = new ResizeObserver(resize);
  const visibilityObserver = new IntersectionObserver(([entry]) => {
    if (entry?.target !== canvas.parentElement) return;
    onScreen = entry.isIntersecting;
    updateLoop();
  });

  function dispose() {
    if (lifetime.signal.aborted) return;
    unmountViewport?.();
    lifetime.abort();
    disposeHedgieScene(scene, renderer);
  }

  canvas.addEventListener('webglcontextlost', dispose, { signal: lifetime.signal });
  renderer.debug.onShaderError = (gl, program) => {
    console.warn('Could not compile a Hedgie 3D shader.', gl.getProgramInfoLog(program));
    queueMicrotask(dispose);
  };

  // Draw once offscreen to prepare GPU resources before the completion screen.
  const ready = Promise.resolve()
    .then(() => renderer.compileAsync(scene, camera))
    .then(() => {
      if (lifetime.signal.aborted) return;
      then = performance.now();
      drawCelebration(then);
    });

  return {
    ready,
    signal: lifetime.signal,
    mount(viewport, nextReaction) {
      lifetime.signal.throwIfAborted();
      unmountViewport?.();
      reaction = nextReaction;
      reactionElapsed = 0;
      speaking = false;
      renderer.shadowMap.enabled = !reaction;
      shadow.visible = !reaction;
      if (reaction) {
        frameHedgie(0);
        medal.visible = false;
        for (const part of confetti) part.visible = false;
      }
      const listeners = new AbortController();
      const listenerOptions = { signal: listeners.signal };
      let finishTimer;

      function unmount() {
        if (unmountViewport !== unmount) return;
        unmountViewport = undefined;
        reaction = undefined;
        window.clearTimeout(finishTimer);
        resizeObserver.disconnect();
        visibilityObserver.disconnect();
        listeners.abort();
        onScreen = false;
        renderer.setAnimationLoop(null);
        canvas.remove();
      }
      unmountViewport = unmount;

      try {
        if (!reaction) {
          elapsed = 0;
          hedgie.root.position.x = 0;
          gaze.set(0, 0);
          pointer.set(0, 0);
          then = performance.now();
          viewport.addEventListener('pointermove', (event) => {
            if (event.pointerType === 'touch') return;
            const rect = viewport.getBoundingClientRect();
            pointer.set(
              2 * (event.clientX - rect.left) / rect.width - 1,
              2 * (event.clientY - rect.top) / rect.height - 1,
            );
          }, listenerOptions);
          viewport.addEventListener('pointerleave', () => pointer.set(0, 0), listenerOptions);
          visibilityObserver.observe(viewport);
        }
        viewport.append(canvas);
        resize();
        resizeObserver.observe(viewport);
        document.addEventListener('visibilitychange', updateLoop, listenerOptions);

        if (reaction) {
          if (reaction.reducedMotion) reaction.onSpeech(true);
          reactionStartedAt = performance.now();
          finishTimer = window.setTimeout(finishWrongAnswer, WRONG_ANSWER_DURATION * 1000);
        }
        updateLoop();
      } catch (error) {
        unmount();
        throw error;
      }
      return unmount;
    },
    celebrate() {
      elapsed = .16;
    },
    dispose,
  };
}
