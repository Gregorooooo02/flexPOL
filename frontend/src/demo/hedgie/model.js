import * as THREE from 'three';

// Procedural model adapted from zgjezyk/v2/model.js.
const sphere = new THREE.SphereGeometry(1, 28, 20);
const v3 = (x, y, z) => new THREE.Vector3(x, y, z);
const clay = (color, roughness = .79) => new THREE.MeshStandardMaterial({ color, roughness });
const fur = clay('#885339');
const darkFur = clay('#714331');
const biscuit = clay('#dfa778');
const vanilla = clay('#ffe2ab');
const coral = clay('#ed9a83');
const ink = clay('#311d24', .29);
const brow = clay('#834937');
const mouth = clay('#6d3236');
const tongue = clay('#f49685');
const gold = clay('#ffbc22', .61);
const amber = clay('#dc9021');
const glint = new THREE.MeshBasicMaterial({ color: 0xfff6df });

function group(parent, x = 0, y = 0, z = 0) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  parent.add(g);
  return g;
}

function mesh(parent, geometry, material, at = [0, 0, 0]) {
  const part = new THREE.Mesh(geometry, material);
  part.position.set(...at);
  part.castShadow = true;
  part.receiveShadow = true;
  parent.add(part);
  return part;
}

function oval(parent, material, at, scale) {
  const part = mesh(parent, sphere, material, at);
  part.scale.set(...scale);
  return part;
}

function curve(parent, material, points, radius) {
  const path = new THREE.CatmullRomCurve3(points.map(p => v3(...p)));
  const line = mesh(parent, new THREE.TubeGeometry(path, 20, radius, 10, false), material);
  for (const end of [points[0], points.at(-1)]) oval(line, material, end, [radius, radius, radius]);
  return line;
}

// One soft, swept quill. The rounded section narrows and bends toward the tip.
const quill = new THREE.LatheGeometry([
  [0, -.19], [.65, -.12], [.92, 0], [1, .17], [.97, .32], [.85, .49],
  [.67, .65], [.46, .8], [.26, .91], [.12, .98], [0, 1.005],
].map(([r, h]) => new THREE.Vector2(r, h)), 24);
const quillPosition = quill.attributes.position;
const tipColors = [];
for (let i = 0; i < quillPosition.count; i++) {
  const t = Math.max(0, quillPosition.getY(i));
  quillPosition.setZ(i, quillPosition.getZ(i) - t * t * .48);
  const tip = THREE.MathUtils.smoothstep(t, .62, .95);
  tipColors.push(.79 + tip * .48, .76 + tip * .62, .73 + tip * .63);
}
quill.setAttribute('color', new THREE.Float32BufferAttribute(tipColors, 3));
quill.computeVertexNormals();

function makeCoat(head) {
  const coat = group(head, 0, .075, -.12);
  oval(coat, darkFur, [0, 0, -.02], [1.06, .88, .77]);
  const transforms = [];
  const colors = [];
  const shades = ['#a46643', '#955b3f', '#8d563d', '#a06343', '#975b3c'];
  const furMark = clay('#be885e');
  // Staggered rows wrap away from the face. The first row defines the silhouette.
  const rows = [[62, 15], [89, 16], [117, 14], [144, 9], [168, 4]];
  for (const [row, [degrees, count]] of rows.entries()) {
    const polar = THREE.MathUtils.degToRad(degrees);
    for (let i = 0; i < count; i++) {
      const a = Math.PI * 2 * (i + .22 + row * .46) / count;
      const x = Math.sin(polar) * Math.cos(a);
      const y = Math.sin(polar) * Math.sin(a);
      const z = Math.cos(polar);
      const sweep = Math.max(y, 0);
      const dir = v3(x * .69 + sweep * .52, y * .76 - .25 * Math.abs(x), z * .73 - .63).normalize();
      const cross = v3(-Math.sin(a), Math.cos(a), 0);
      const normal = cross.clone().cross(dir).normalize();
      cross.copy(dir).cross(normal).normalize();
      const transform = new THREE.Matrix4().makeBasis(cross, dir, normal);
      const length = .52 + .13 * sweep + .06 * Math.sin(i * 2 + row);
      transform.scale(v3(.256 + row * .006, length, .22));
      transform.setPosition(x * 1.035, y * .88, z * .75);
      transforms.push(transform);
      colors.push(new THREE.Color(shades[(i + row * 2) % shades.length]));
      if (row === 0 && y > .18 && i % 3 !== 1) {
        const points = [[.18,.36,-.99],[.22,.49,-.951],[.25,.59,-.878],[.27,.67,-.817]]
          .map(p => v3(...p).applyMatrix4(transform).toArray());
        curve(coat, furMark, points, .012);
      }
    }
  }
  const spines = new THREE.InstancedMesh(quill, new THREE.MeshStandardMaterial({vertexColors: true, roughness: .82}), transforms.length);
  spines.castShadow = spines.receiveShadow = true;
  transforms.forEach((transform, i) => {
    spines.setMatrixAt(i, transform);
    spines.setColorAt(i, colors[i]);
  });
  coat.add(spines);
}

// Sculpt the forehead cleft, full cheeks and projecting muzzle into one surface.
function facePoint(nx, ny, nz) {
  const x = 1.04 * nx * (1 - .09 * ny);
  const y = .75 * ny - .23 * Math.max(0, ny) ** 3 * Math.exp(-nx * nx / .08);
  const muzzle = .43 * Math.exp(-((x / .39) ** 2) - ((y + .16) / .28) ** 2);
  return [x, y, .25 + .68 * nz + muzzle * Math.max(0, nz)];
}

function faceDepth(x, y) {
  let ny = y / .75;
  let nx = x / 1.04;
  for (let i = 0; i < 5; i++) {
    nx = x / (1.04 * (1 - .09 * ny));
    ny += (y - facePoint(nx, ny, 0)[1]) / .75;
  }
  return facePoint(nx, ny, Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny)))[2];
}

const faceGeometry = new THREE.SphereGeometry(1, 96, 64);
const facePositions = faceGeometry.attributes.position;
const furTint = [];
const creamTone = new THREE.Color('#f8d197');
const snoutTone = new THREE.Color('#ffe7b9');
const blushTone = new THREE.Color('#e99a7e');
for (let i = 0; i < facePositions.count; i++) {
  const nz = facePositions.getZ(i);
  const [x, y, z] = facePoint(facePositions.getX(i), facePositions.getY(i), nz);
  facePositions.setXYZ(i, x, y, z);
  const muzzle = Math.exp(-((x / .47) ** 4) - ((y + .21) / .27) ** 4) * Math.max(0, nz);
  const blush = Math.exp(-(((Math.abs(x) - .705) / .155) ** 4) - ((y + .139) / .075) ** 4);
  const color = creamTone.clone().lerp(snoutTone, muzzle).lerp(blushTone, nz > 0 ? blush : 0);
  furTint.push(color.r, color.g, color.b);
}
faceGeometry.setAttribute('color', new THREE.Float32BufferAttribute(furTint, 3));
faceGeometry.computeVertexNormals();

function faceStroke(parent, material, xy, radius, lift = .012) {
  return curve(parent, material, xy.map(([x, y]) => [x, y, faceDepth(x, y) + lift]), radius);
}

// Raised markings follow the muzzle even in a three-quarter view.
function facePatch(head, material, shape, lift) {
  const outline = shape.getPoints(16);
  const vertices = [];
  // Subdivide long interior triangles so the smile sits flush on the curved snout.
  function conform(a, b, c, level) {
    if (level === 0) {
      for (const p of [a, b, c]) vertices.push(p.x, p.y, faceDepth(p.x, p.y) + lift);
      return;
    }
    const ab = a.clone().lerp(b, .5), bc = b.clone().lerp(c, .5), ca = c.clone().lerp(a, .5);
    conform(a, ab, ca, level - 1);
    conform(ab, b, bc, level - 1);
    conform(ca, bc, c, level - 1);
    conform(ab, bc, ca, level - 1);
  }
  for (const [a, b, c] of THREE.ShapeUtils.triangulateShape(outline, [])) {
    conform(outline[a], outline[b], outline[c], 3);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.computeVertexNormals();
  return mesh(head, geometry, material);
}

function makeEye(head, side) {
  const x = side * .415;
  const y = .122;
  const eye = group(head, x, y, faceDepth(x, y) + .025);
  const dx = (faceDepth(x + .01, y) - faceDepth(x - .01, y)) / .02;
  const dy = (faceDepth(x, y + .01) - faceDepth(x, y - .01)) / .02;
  eye.quaternion.setFromUnitVectors(v3(0,0,1), v3(-dx, -dy, 1).normalize());
  const open = group(eye);
  const pupil = group(open);
  oval(pupil, ink, [0, 0, .012], [.16, .204, .08]);
  oval(pupil, glint, [-.046, .069, .074], [.044, .048, .019]);
  oval(pupil, glint, [.047, -.052, .077], [.017, .017, .009]);
  const smile = curve(eye, ink, [[-.142,-.016,.043],[-.076,.056,.063],[0,.078,.066],[.079,.054,.063],[.14,-.017,.043]], .029);
  const eyebrow = group(head, x, .37, faceDepth(x, .37));
  eyebrow.rotation.y = side * .22;
  const arch = oval(eyebrow, brow, [0, 0, 0], [.103, .031, .031]);
  arch.rotation.z = -side * .14;
  return { side, open, pupil, smile, brow: eyebrow };
}

function makeScarf(body) {
  const scarf = group(body, 0, 1.08, .09);
  // The hem drops into a rounded triangular kerchief at the front.
  const geometry = new THREE.CylinderGeometry(1, 1, 1, 96, 10, true);
  const p = geometry.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i), t = .5 - p.getY(i);
    const tip = Math.max(0, z) ** 3 * Math.exp(-Math.abs(x + .14) * 2.65);
    const depth = .125 + tip * .33;
    p.setXYZ(i, x * (.64 + .036 * Math.sin(Math.PI * t)), .105 - t * depth, z * (.58 + .13 * t + .027 * Math.sin(Math.PI * t)));
  }
  geometry.computeVertexNormals();
  const fabric = gold.clone();
  fabric.side = THREE.DoubleSide;
  mesh(scarf, geometry, fabric);
  const knot = oval(scarf, amber, [.56, -.012, .3], [.144, .12, .13]);
  knot.rotation.z = -.38;
  const tail = oval(scarf, gold, [.692, -.09, .20], [.12, .237, .079]);
  tail.rotation.z = .81;
  const second = oval(scarf, gold, [.70, .046, .21], [.087, .168, .067]);
  second.rotation.z = -.96;
  return scarf;
}

export function createHedgehog(scene) {
  const root = group(scene);
  const body = group(root);
  const head = group(body, 0, 1.76, .025);
  makeCoat(head);
  oval(body, fur, [0, .89, -.28], [.83, .77, .66]);
  oval(body, biscuit, [0, .76, .075], [.71, .67, .63]);
  oval(body, vanilla, [0, .72, .28], [.584, .57, .47]);
  makeScarf(body);

  const ears = [-1, 1].map(side => {
    const ear = group(head, side * .83, .423, .34);
    ear.rotation.z = -side * .45;
    ear.rotation.y = side * .21;
    oval(ear, biscuit, [0, .025, 0], [.204, .222, .132]);
    oval(ear, coral, [0, .035, .084], [.128, .145, .062]);
    return ear;
  });
  mesh(head, faceGeometry, new THREE.MeshStandardMaterial({vertexColors: true, roughness: .85}));
  for (const s of [-1, 1]) {
    const x = s * .718;
    for (const [dx, dy] of [[-.054, .017], [.018, .035], [.068, -.002]]) {
      const fx = x + s * dx, fy = -.145 + dy;
      oval(head, brow, [fx, fy, faceDepth(fx, fy) + .006], [.012, .012, .009]);
    }
  }
  const eyes = [-1, 1].map(side => makeEye(head, side));
  const noseGeometry = sphere.clone();
  const n = noseGeometry.attributes.position;
  for (let i = 0; i < n.count; i++) n.setX(i, n.getX(i) * (1 + .28 * n.getY(i)));
  noseGeometry.computeVertexNormals();
  const nose = mesh(head, noseGeometry, ink, [0, -.112, faceDepth(0, -.112) + .012]);
  nose.scale.set(.19, .125, .122);
  const neutralMouth = faceStroke(head, mouth, [[-.137,-.275],[-.082,-.312],[-.005,-.327],[.076,-.307],[.144,-.258]], .018);
  const frown = faceStroke(head, mouth, [[-.196,-.365],[-.10,-.311],[0,-.288],[.10,-.311],[.196,-.365]], .026);
  frown.visible = false;
  const grin = new THREE.Shape();
  grin.moveTo(-.166,-.271);
  grin.bezierCurveTo(-.073,-.318,.071,-.315,.166,-.254);
  grin.bezierCurveTo(.15,-.476,-.103,-.518,-.166,-.271);
  const openMouth = facePatch(head, mouth, grin, .023);
  const lip = new THREE.Shape();
  lip.moveTo(-.076,-.399);
  lip.bezierCurveTo(-.039,-.363,.052,-.368,.08,-.399);
  lip.bezierCurveTo(.039,-.434,-.036,-.444,-.076,-.399);
  facePatch(openMouth, tongue, lip, .033);
  const arms = [-1, 1].map(side => {
    const arm = group(body, side * .605, .94, .40);
    oval(arm, biscuit, [0, -.21, .045], [.155, .32, .16]);
    oval(arm, biscuit, [-side * .106, -.286, .135], [.075, .109, .079]);
    return arm;
  });
  const feet = [-1, 1].map(side => {
    const foot = group(body, side * .383, .165, .16);
    foot.rotation.y = side * .21;
    oval(foot, biscuit, [0, 0, .085], [.247, .165, .327]);
    for (const x of [-.058, .053]) {
      curve(foot, brow, [[x,.102,.334],[x,.082,.357],[x,.064,.372]], .009);
    }
    return foot;
  });
  return { root, body, head, eyes, ears, arms, feet, neutralMouth, openMouth, frown };
}

export function addLighting(scene) {
  scene.add(new THREE.HemisphereLight(0xfff6e8, 0xeac3a5, 1.47));
  for (const [color, power, xyz] of [
    [0xfff2dd, 2.54, [-3.5, 6, 5]], [0xffe3aa, 2.5, [2.4, 4, -3]], [0xf3f5ff, .65, [3, 2, 4]],
  ]) {
    const light = new THREE.DirectionalLight(color, power);
    light.position.set(...xyz);
    if (xyz[0] < 0) {
      light.castShadow = true;
      light.shadow.mapSize.set(512, 512);
      Object.assign(light.shadow.camera, { left: -2.45, right: 2.45, top: 3.8, bottom: -1.5, near: .1, far: 14 });
      light.shadow.camera.updateProjectionMatrix();
      light.shadow.normalBias = .023;
      light.shadow.bias = -.0003;
      light.shadow.radius = 3;
      light.shadow.intensity = .32;
    }
    scene.add(light);
  }
}

export function createShadow(scene) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 63);
  gradient.addColorStop(0, '#80512a94');
  gradient.addColorStop(.32, '#95622970');
  gradient.addColorStop(.68, '#99581b27');
  gradient.addColorStop(1, '#99581b00');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  const shadow = mesh(scene, new THREE.PlaneGeometry(3.17, 2.11), new THREE.MeshBasicMaterial({ map, transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2;
  return shadow;
}

export function createMedal(scene) {
  const medal = group(scene);
  const edge = clay('#d8810d', .48);
  const lightGold = clay('#ffcf45', .52);
  const ribbon = new THREE.Shape();
  ribbon.moveTo(-.062, 0);
  ribbon.lineTo(.061, 0);
  ribbon.lineTo(.064, -.192);
  ribbon.lineTo(0, -.153);
  ribbon.lineTo(-.066, -.192);
  ribbon.closePath();
  const ribbonGeometry = new THREE.ExtrudeGeometry(ribbon, {depth: .012, bevelEnabled: false});
  for (const side of [-1, 1]) {
    const tail = mesh(medal, ribbonGeometry, amber, [side * .066, -.153, -.037]);
    tail.rotation.z = side * .26;
  }
  const disk = mesh(medal, new THREE.CylinderGeometry(.233, .233, .068, 64), [edge, lightGold, gold]);
  disk.rotation.x = Math.PI / 2;
  mesh(medal, new THREE.TorusGeometry(.197, .012, 10, 56), gold, [0,0,.035]);
  curve(medal, amber, [[-.091,.004,.043],[-.036,-.051,.043],[.093,.075,.043]], .023);
  return medal;
}
