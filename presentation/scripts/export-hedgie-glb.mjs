import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as THREE from '../../frontend/node_modules/three/build/three.module.js';
import { GLTFExporter } from '../../frontend/node_modules/three/examples/jsm/exporters/GLTFExporter.js';
import { mergeGeometries } from '../../frontend/node_modules/three/examples/jsm/utils/BufferGeometryUtils.js';
import { createHedgehog } from '../../frontend/src/components/hedgie/model.js';

if (typeof globalThis.FileReader === 'undefined') {
  globalThis.FileReader = class FileReader {
    readAsArrayBuffer(blob) {
      blob.arrayBuffer().then(
        (buf) => {
          this.result = buf;
          this.onloadend?.({ target: this });
        },
        (err) => {
          this.error = err;
          this.onerror?.(err);
        },
      );
    }

    readAsDataURL(blob) {
      blob.arrayBuffer().then(
        (buf) => {
          const mime = blob.type || 'application/octet-stream';
          const b64 = Buffer.from(buf).toString('base64');
          this.result = `data:${mime};base64,${b64}`;
          this.onloadend?.({ target: this });
        },
        (err) => {
          this.error = err;
          this.onerror?.(err);
        },
      );
    }
  };
}

function bakeInstancedMeshes(root) {
  const instanced = [];
  root.traverse((obj) => {
    if (obj.isInstancedMesh) instanced.push(obj);
  });

  const matrix = new THREE.Matrix4();
  const instColor = new THREE.Color(1, 1, 1);

  for (const inst of instanced) {
    const geos = [];
    for (let i = 0; i < inst.count; i++) {
      inst.getMatrixAt(i, matrix);
      if (inst.instanceColor) {
        inst.getColorAt(i, instColor);
      } else {
        instColor.setRGB(1, 1, 1);
      }

      const geo = inst.geometry.clone();
      geo.applyMatrix4(matrix);

      const colorAttr = geo.getAttribute('color');
      if (colorAttr) {
        for (let v = 0; v < colorAttr.count; v++) {
          colorAttr.setXYZ(
            v,
            THREE.MathUtils.clamp(colorAttr.getX(v) * instColor.r, 0, 1),
            THREE.MathUtils.clamp(colorAttr.getY(v) * instColor.g, 0, 1),
            THREE.MathUtils.clamp(colorAttr.getZ(v) * instColor.b, 0, 1),
          );
        }
        colorAttr.needsUpdate = true;
      }
      geos.push(geo);
    }

    const merged = mergeGeometries(geos, false);
    for (const g of geos) g.dispose();

    const mat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.86,
      metalness: 0.0,
    });
    const mesh = new THREE.Mesh(merged, mat);
    mesh.name = 'HedgieSpines';

    const parent = inst.parent;
    if (parent) {
      parent.add(mesh);
      parent.remove(inst);
    }
    inst.dispose();
  }
}

function calibrateMaterials(root, openMouth) {
  const converted = new Map();

  root.traverse((obj) => {
    if (!obj.isMesh) return;

    const geom = obj.geometry;
    const colorAttr = geom?.getAttribute?.('color');
    if (colorAttr) {
      for (let i = 0; i < colorAttr.count; i++) {
        colorAttr.setXYZ(
          i,
          THREE.MathUtils.clamp(colorAttr.getX(i), 0, 1),
          THREE.MathUtils.clamp(colorAttr.getY(i), 0, 1),
          THREE.MathUtils.clamp(colorAttr.getZ(i), 0, 1),
        );
      }
      colorAttr.needsUpdate = true;
    }

    const remap = (mat) => {
      if (!mat) return mat;
      if (converted.has(mat)) return converted.get(mat);

      let out = mat;
      if (mat.isMeshBasicMaterial) {
        out = new THREE.MeshStandardMaterial({
          color: mat.color.clone(),
          emissive: mat.color.clone(),
          emissiveIntensity: 0.85,
          roughness: 0.15,
          metalness: 0.0,
        });
      } else if (mat.isMeshStandardMaterial) {
        out = mat.clone();
        out.metalness = 0.0;
        const lum = 0.2126 * out.color.r + 0.7152 * out.color.g + 0.0722 * out.color.b;
        if (lum < 0.04 && out.roughness < 0.4) {
          out.roughness = 0.26;
        } else if (out.side === THREE.DoubleSide || out.roughness < 0.65) {
          out.roughness = Math.max(out.roughness, 0.64);
        } else {
          out.roughness = Math.max(out.roughness, 0.85);
        }
      }

      if (obj === openMouth || obj.parent === openMouth) {
        out = out.clone();
        out.side = THREE.DoubleSide;
      }

      converted.set(mat, out);
      return out;
    };

    if (Array.isArray(obj.material)) {
      obj.material = obj.material.map(remap);
    } else {
      obj.material = remap(obj.material);
    }
  });
}

async function main() {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const outPath = path.resolve(__dirname, '../assets/hedgie.glb');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });

  const scene = new THREE.Scene();
  const hedgie = createHedgehog(scene);

  // Remove hidden facial variants so PowerPoint never shows or z-fights them.
  hedgie.neutralMouth.parent?.remove(hedgie.neutralMouth);
  hedgie.frown.parent?.remove(hedgie.frown);
  for (const eye of hedgie.eyes) {
    eye.smile.parent?.remove(eye.smile);
    eye.open.visible = true;
  }
  hedgie.openMouth.visible = true;

  // Cheerful waving pose matching the HedgeFlex mascot.
  hedgie.arms[0].rotation.set(-0.32, -0.10, -2.14);
  hedgie.arms[1].rotation.set(-0.22, 0.08, 0.28);
  hedgie.head.rotation.set(0.02, 0.0, 0.02);

  bakeInstancedMeshes(hedgie.root);
  calibrateMaterials(hedgie.root, hedgie.openMouth);

  // Center pivot and normalize height to 1.0 meter for clean PowerPoint 3D rotation.
  scene.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(hedgie.root);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const scale = 1.0 / size.y;

  hedgie.root.position.sub(center);
  const pivot = new THREE.Group();
  pivot.name = 'HedgiePivot';
  scene.add(pivot);
  pivot.add(hedgie.root);
  pivot.scale.setScalar(scale);
  scene.updateMatrixWorld(true);

  const normalizedBox = new THREE.Box3().setFromObject(pivot);
  const normalizedSize = normalizedBox.getSize(new THREE.Vector3());
  const normalizedCenter = normalizedBox.getCenter(new THREE.Vector3());

  const exporter = new GLTFExporter();
  const glb = await exporter.parseAsync(scene, { binary: true });
  const buf = Buffer.from(glb);
  fs.writeFileSync(outPath, buf);

  console.log('Exported:', outPath);
  console.log('Bytes:', buf.length, 'Magic:', buf.subarray(0, 4).toString('ascii'));
  console.log('Normalized size:', normalizedSize.toArray().map((n) => Number(n.toFixed(4))));
  console.log('Normalized center:', normalizedCenter.toArray().map((n) => Number(n.toFixed(4))));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
