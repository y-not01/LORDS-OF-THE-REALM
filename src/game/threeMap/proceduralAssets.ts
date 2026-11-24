import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { BuildingType } from '../../types/game';

export const MAP_WIDTH = 26;
export const MAP_HEIGHT = 24;

/** Same displacement used by the parchment mesh, rivers, and props. */
export function terrainHeight(x: number, z: number): number {
  const elev =
    Math.sin(x * 0.35) * Math.cos(z * 0.3) * 0.35 +
    Math.sin(x * 0.8 + z * 0.4) * 0.18 +
    (Math.abs(x) > 9 || Math.abs(z) > 8 ? -0.4 : 0);
  return Math.max(-0.25, elev);
}

export function disposeOwnedResources(root: THREE.Object3D) {
  const geos = new Set<THREE.BufferGeometry>();
  const mats = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (mesh.geometry?.userData?.dispose) geos.add(mesh.geometry);
    const material = mesh.material as THREE.Material | THREE.Material[] | undefined;
    if (!material) return;
    const list = Array.isArray(material) ? material : [material];
    for (const mat of list) {
      if (!mat?.userData?.dispose) continue;
      mats.add(mat);
      const mapped = mat as THREE.MeshStandardMaterial;
      if (mapped.map?.userData?.dispose) textures.add(mapped.map);
    }
  });
  geos.forEach((geo) => geo.dispose());
  textures.forEach((tex) => tex.dispose());
  mats.forEach((mat) => mat.dispose());
}

function ownedGeo<T extends THREE.BufferGeometry>(geo: T): T {
  geo.userData.dispose = true;
  return geo;
}

export function createParchmentTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createRadialGradient(512, 512, 100, 512, 512, 700);
  grad.addColorStop(0, '#f5edd6');
  grad.addColorStop(0.6, '#e8dcba');
  grad.addColorStop(1, '#c9b990');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 1024);

  for (let i = 0; i < 3500; i++) {
    const x = Math.random() * 1024;
    const y = Math.random() * 1024;
    const radius = Math.random() * 2 + 0.5;
    ctx.fillStyle = Math.random() > 0.5 ? 'rgba(160, 130, 90, 0.05)' : 'rgba(255, 255, 255, 0.04)';
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.strokeStyle = 'rgba(140, 110, 70, 0.08)';
  ctx.lineWidth = 1;
  for (let x = 64; x < 1024; x += 128) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 1024);
    ctx.stroke();
  }
  for (let y = 64; y < 1024; y += 128) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(1024, y);
    ctx.stroke();
  }

  ctx.save();
  ctx.translate(880, 140);
  ctx.strokeStyle = 'rgba(130, 95, 50, 0.28)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, 0, 70, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, 50, 0, Math.PI * 2);
  ctx.stroke();
  for (let p = 0; p < 8; p++) {
    const angle = (p * Math.PI * 2) / 8 - Math.PI / 2;
    const len = p % 2 === 0 ? 65 : 45;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(angle) * len, Math.sin(angle) * len);
    ctx.stroke();
  }
  ctx.restore();

  const vignette = ctx.createRadialGradient(512, 512, 420, 512, 512, 720);
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(0.8, 'rgba(80, 50, 20, 0.18)');
  vignette.addColorStop(1, 'rgba(40, 25, 10, 0.55)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, 1024, 1024);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.userData.dispose = true;
  return texture;
}

export function createParchmentGround(): THREE.Mesh {
  const geo = ownedGeo(new THREE.PlaneGeometry(MAP_WIDTH, MAP_HEIGHT, 64, 64));
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    pos.setY(i, terrainHeight(pos.getX(i), pos.getZ(i)));
  }
  geo.computeVertexNormals();

  const mat = new THREE.MeshStandardMaterial({
    map: createParchmentTexture(),
    roughness: 0.88,
    metalness: 0.08,
  });
  mat.userData.dispose = true;
  return new THREE.Mesh(geo, mat);
}

export function createPictureFrame(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'MapFrame';
  const wood = new THREE.MeshStandardMaterial({ color: 0x22170d, roughness: 0.7, metalness: 0.3 });
  wood.userData.dispose = true;
  const gold = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.85, roughness: 0.25 });
  gold.userData.dispose = true;

  const w = MAP_WIDTH;
  const h = MAP_HEIGHT;
  const t = 0.48;
  const beams: [number, number, number, number, number, number, THREE.Material][] = [
    [0, -0.02, h / 2 + t / 2, w + t * 2, 0.42, t, wood],
    [0, -0.02, -(h / 2 + t / 2), w + t * 2, 0.42, t, wood],
    [w / 2 + t / 2, -0.02, 0, t, 0.42, h, wood],
    [-(w / 2 + t / 2), -0.02, 0, t, 0.42, h, wood],
    [0, -0.08, h / 2 - 0.16, w - 0.55, 0.14, 0.2, gold],
    [0, -0.08, -(h / 2 - 0.16), w - 0.55, 0.14, 0.2, gold],
    [w / 2 - 0.16, -0.08, 0, 0.2, 0.14, h - 0.9, gold],
    [-(w / 2 - 0.16), -0.08, 0, 0.2, 0.14, h - 0.9, gold],
  ];

  for (const [x, y, z, sx, sy, sz, mat] of beams) {
    const geo = ownedGeo(new THREE.BoxGeometry(sx, sy, sz));
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    group.add(mesh);
  }
  return group;
}

const stoneMat = new THREE.MeshStandardMaterial({ color: 0x8a8479, roughness: 0.86, metalness: 0.08 });
const darkStoneMat = new THREE.MeshStandardMaterial({ color: 0x5e584f, roughness: 0.9, metalness: 0.12 });
const woodMat = new THREE.MeshStandardMaterial({ color: 0x5a4228, roughness: 0.9 });
const thatchMat = new THREE.MeshStandardMaterial({ color: 0x8f7d57, roughness: 0.85 });
const clothMat = new THREE.MeshStandardMaterial({ color: 0x8c3a3a, roughness: 0.78 });
const goldTrimMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.35, metalness: 0.8 });
const gateMat = new THREE.MeshStandardMaterial({ color: 0x3d2817, roughness: 0.9 });
const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4a3525, roughness: 0.9 });
const needleMat = new THREE.MeshStandardMaterial({ color: 0x244a2b, roughness: 0.85, flatShading: true });
const rockMat = new THREE.MeshStandardMaterial({ color: 0x524e49, roughness: 0.95, metalness: 0.05, flatShading: true });
const snowMat = new THREE.MeshStandardMaterial({ color: 0xedebe8, roughness: 0.8, metalness: 0.05, flatShading: true });
const horseMat = new THREE.MeshStandardMaterial({ color: 0x3d2817, roughness: 0.8 });
const metalMat = new THREE.MeshStandardMaterial({ color: 0xb7bdc7, metalness: 0.8, roughness: 0.28 });

export const hitMaterial = new THREE.MeshBasicMaterial({
  transparent: true,
  opacity: 0,
  depthWrite: false,
  colorWrite: false,
});

export const riverMaterial = new THREE.MeshStandardMaterial({
  color: 0x2f86b8,
  emissive: 0x14384e,
  emissiveIntensity: 0.45,
  roughness: 0.22,
  metalness: 0.08,
  transparent: true,
  opacity: 0.94,
  depthWrite: false,
  side: THREE.DoubleSide,
  polygonOffset: true,
  polygonOffsetFactor: -4,
  polygonOffsetUnits: -4,
});

export const coastMaterial = new THREE.MeshStandardMaterial({
  color: 0x1f6f9a,
  emissive: 0x0e3048,
  emissiveIntensity: 0.4,
  roughness: 0.3,
  metalness: 0.1,
  transparent: true,
  opacity: 0.88,
  depthWrite: false,
  side: THREE.DoubleSide,
  polygonOffset: true,
  polygonOffsetFactor: -3,
  polygonOffsetUnits: -3,
});

export const roadMaterial = new THREE.MeshStandardMaterial({ color: 0x8b6f47, roughness: 0.95 });

const roofCache = new Map<string, THREE.MeshStandardMaterial>();
const bannerCache = new Map<string, THREE.MeshStandardMaterial>();
const armorCache = new Map<string, THREE.MeshStandardMaterial>();
const pennantCache = new Map<string, THREE.MeshBasicMaterial>();

function roofMaterial(color: string) {
  let mat = roofCache.get(color);
  if (!mat) {
    mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(color).multiplyScalar(0.72),
      roughness: 0.48,
      metalness: 0.18,
    });
    roofCache.set(color, mat);
  }
  return mat;
}

function armorMaterial(color: string) {
  let mat = armorCache.get(color);
  if (!mat) {
    mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(color),
      metalness: 0.28,
      roughness: 0.48,
    });
    armorCache.set(color, mat);
  }
  return mat;
}

function pennantMaterial(color: string) {
  let mat = pennantCache.get(color);
  if (!mat) {
    mat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(color),
      side: THREE.DoubleSide,
    });
    pennantCache.set(color, mat);
  }
  return mat;
}

function drawCharge(ctx: CanvasRenderingContext2D, sigil: string) {
  const key = sigil.toLowerCase();
  ctx.save();
  ctx.translate(64, 112);
  ctx.strokeStyle = '#f6edd4';
  ctx.fillStyle = '#f6edd4';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (key.includes('eagle') || key.includes('raven') || key.includes('swan')) {
    ctx.beginPath();
    ctx.moveTo(-40, 10);
    ctx.quadraticCurveTo(-22, -34, 0, -4);
    ctx.quadraticCurveTo(22, -34, 40, 10);
    ctx.quadraticCurveTo(0, 2, -40, 10);
    ctx.fill();
    if (key.includes('swan')) {
      ctx.beginPath();
      ctx.moveTo(8, 6);
      ctx.quadraticCurveTo(22, 18, 8, 28);
      ctx.stroke();
    }
  } else if (key.includes('dragon')) {
    ctx.beginPath();
    ctx.moveTo(0, -36);
    ctx.lineTo(18, 22);
    ctx.lineTo(0, 6);
    ctx.lineTo(-18, 22);
    ctx.closePath();
    ctx.fill();
  } else if (key.includes('stag')) {
    ctx.beginPath();
    ctx.moveTo(0, 26);
    ctx.lineTo(0, -6);
    ctx.moveTo(0, 0);
    ctx.lineTo(-26, -30);
    ctx.moveTo(0, 0);
    ctx.lineTo(26, -30);
    ctx.moveTo(-6, 6);
    ctx.lineTo(-22, -8);
    ctx.moveTo(6, 6);
    ctx.lineTo(22, -8);
    ctx.stroke();
  } else if (key.includes('boar')) {
    ctx.beginPath();
    ctx.moveTo(-22, 18);
    ctx.quadraticCurveTo(-8, -24, 0, 4);
    ctx.quadraticCurveTo(8, -24, 22, 18);
    ctx.stroke();
  } else if (key.includes('crown')) {
    ctx.beginPath();
    ctx.moveTo(-30, 16);
    ctx.lineTo(-30, -4);
    ctx.lineTo(-15, 10);
    ctx.lineTo(0, -20);
    ctx.lineTo(15, 10);
    ctx.lineTo(30, -4);
    ctx.lineTo(30, 16);
    ctx.closePath();
    ctx.fill();
  } else {
    ctx.font = '700 54px Cinzel, Palatino, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(sigil.slice(0, 1).toUpperCase(), 0, 4);
  }
  ctx.restore();
}

function bannerMaterial(colorHex: string, sigil: string) {
  const key = `${colorHex}|${sigil}`;
  let mat = bannerCache.get(key);
  if (mat) return mat;

  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = colorHex;
  ctx.fillRect(0, 0, 128, 256);
  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 8;
  ctx.strokeRect(6, 6, 116, 244);
  ctx.fillStyle = 'rgba(255,255,255,0.14)';
  ctx.fillRect(18, 78, 92, 70);
  drawCharge(ctx, sigil);

  ctx.globalCompositeOperation = 'destination-out';
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.moveTo(0, 256);
  ctx.lineTo(64, 214);
  ctx.lineTo(128, 256);
  ctx.closePath();
  ctx.fill();
  ctx.globalCompositeOperation = 'source-over';

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  mat = new THREE.MeshStandardMaterial({
    map: texture,
    roughness: 0.62,
    metalness: 0.08,
    side: THREE.DoubleSide,
    transparent: true,
    alphaTest: 0.35,
  });
  bannerCache.set(key, mat);
  return mat;
}

const keepGeo = new THREE.CylinderGeometry(0.36, 0.44, 1.15, 8);
const keepRoofGeo = new THREE.ConeGeometry(0.5, 0.78, 8);
const spireGeo = new THREE.CylinderGeometry(0.02, 0.045, 0.36, 6);
const hallGeo = new THREE.BoxGeometry(0.78, 0.5, 0.78);
const hallRoofGeo = new THREE.ConeGeometry(0.58, 0.38, 4);
const bastionGeo = new THREE.CylinderGeometry(0.16, 0.21, 0.82, 8);
const bastionRoofGeo = new THREE.ConeGeometry(0.24, 0.4, 8);
const wallGeo = new THREE.BoxGeometry(0.86, 0.5, 0.11);
const outerWallGeo = new THREE.BoxGeometry(1.25, 0.7, 0.13);
const outerBastionGeo = new THREE.CylinderGeometry(0.14, 0.18, 0.96, 6);
const gateGeo = new THREE.BoxGeometry(0.28, 0.36, 0.16);
const poleGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.7, 5);
const bannerGeo = new THREE.PlaneGeometry(0.3, 0.52);
const stallGeo = new THREE.BoxGeometry(0.42, 0.22, 0.28);
const awningGeo = new THREE.BoxGeometry(0.5, 0.08, 0.36);
const barracksGeo = new THREE.BoxGeometry(0.7, 0.28, 0.34);
const barracksRoofGeo = new THREE.BoxGeometry(0.76, 0.1, 0.4);
const siloGeo = new THREE.CylinderGeometry(0.2, 0.22, 0.55, 8);
const siloRoofGeo = new THREE.ConeGeometry(0.26, 0.28, 8);

const houseBaseGeo = new THREE.BoxGeometry(0.22, 0.16, 0.3);
houseBaseGeo.translate(0, 0.08, 0);
const houseRoofGeo = new THREE.ConeGeometry(0.24, 0.18, 4);
houseRoofGeo.rotateY(Math.PI / 4);
houseRoofGeo.translate(0, 0.25, 0);

const trunkGeo = new THREE.CylinderGeometry(0.045, 0.07, 0.32, 5);
trunkGeo.translate(0, 0.16, 0);
const treeTierGeos = [
  { r: 0.24, h: 0.34, y: 0.34 },
  { r: 0.18, h: 0.3, y: 0.5 },
  { r: 0.12, h: 0.24, y: 0.66 },
].map((tier) => {
  const geo = new THREE.ConeGeometry(tier.r, tier.h, 6);
  geo.translate(0, tier.y, 0);
  return geo;
});

const peakGeo = new THREE.ConeGeometry(0.65, 1.4, 5);
peakGeo.translate(0, 0.7, 0);
const snowCapGeo = new THREE.ConeGeometry(0.32, 0.48, 5);
snowCapGeo.translate(0, 0.24, 0);
const subPeakAGeo = new THREE.ConeGeometry(0.4, 0.85, 4);
subPeakAGeo.translate(0, 0.42, 0);
const subPeakBGeo = new THREE.ConeGeometry(0.34, 0.7, 4);
subPeakBGeo.translate(0, 0.35, 0);

const horseBodyGeo = new THREE.BoxGeometry(0.18, 0.16, 0.4);
const horseHeadGeo = new THREE.BoxGeometry(0.1, 0.2, 0.16);
const torsoGeo = new THREE.CylinderGeometry(0.075, 0.09, 0.22, 6);
const helmGeo = new THREE.SphereGeometry(0.07, 8, 8);
const lanceGeo = new THREE.CylinderGeometry(0.012, 0.016, 0.85, 5);
const pennantGeo = new THREE.PlaneGeometry(0.16, 0.1);
const shieldGeo = new THREE.BoxGeometry(0.025, 0.16, 0.12);

export const sharedScenery = {
  houseBaseGeo,
  houseRoofGeo,
  woodMat,
  thatchMat,
  trunkGeo,
  trunkMat,
  treeTierGeos,
  needleMat,
  peakGeo,
  snowCapGeo,
  subPeakAGeo,
  subPeakBGeo,
  rockMat,
  snowMat,
};

type BakePart = { geo: THREE.BufferGeometry; mat: THREE.Material; matrix: THREE.Matrix4 };

function bakeParts(parts: BakePart[], shadowMats: Set<THREE.Material>) {
  const grouped = new Map<THREE.Material, THREE.BufferGeometry[]>();
  for (const part of parts) {
    const geo = part.geo.clone();
    geo.applyMatrix4(part.matrix);
    const list = grouped.get(part.mat) ?? [];
    list.push(geo);
    grouped.set(part.mat, list);
  }

  const group = new THREE.Group();
  for (const [mat, geos] of grouped) {
    const merged = mergeGeometries(geos, false);
    geos.forEach((geo) => geo.dispose());
    if (!merged) continue;
    merged.userData.dispose = true;
    const mesh = new THREE.Mesh(merged, mat);
    mesh.castShadow = shadowMats.has(mat);
    mesh.receiveShadow = shadowMats.has(mat);
    group.add(mesh);
  }
  return group;
}

function place(
  parts: BakePart[],
  geo: THREE.BufferGeometry,
  mat: THREE.Material,
  x: number,
  y: number,
  z: number,
  rotY = 0,
  sx = 1,
  sy = 1,
  sz = 1,
) {
  const matrix = new THREE.Matrix4().compose(
    new THREE.Vector3(x, y, z),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(0, rotY, 0)),
    new THREE.Vector3(sx, sy, sz),
  );
  parts.push({ geo, mat, matrix });
}

export function createMedievalCastleGroup(
  factionColor: string,
  sigil: string,
  buildings: BuildingType[],
): THREE.Group {
  const hasKeep = buildings.includes('castleKeep');
  const hasWalls = buildings.includes('stoneWalls');
  const roof = roofMaterial(factionColor);
  const parts: BakePart[] = [];
  const cornerR = hasKeep ? 0.72 : 0.62;

  if (hasKeep) {
    place(parts, keepGeo, stoneMat, 0, 0.58, 0);
    place(parts, keepRoofGeo, roof, 0, 1.54, 0);
    place(parts, spireGeo, goldTrimMat, 0, 2.08, 0);
  } else {
    place(parts, hallGeo, stoneMat, 0, 0.25, 0);
    place(parts, hallRoofGeo, roof, 0, 0.66, 0, Math.PI / 4);
  }

  const angles = [Math.PI / 4, (3 * Math.PI) / 4, (5 * Math.PI) / 4, (7 * Math.PI) / 4];
  for (const angle of angles) {
    const x = Math.cos(angle) * cornerR;
    const z = Math.sin(angle) * cornerR;
    const bastionH = hasKeep ? 0.82 : 0.64;
    place(parts, bastionGeo, darkStoneMat, x, bastionH / 2, z, 0, 1, hasKeep ? 1 : 0.78, 1);
    place(parts, bastionRoofGeo, roof, x, bastionH + 0.16, z);
  }

  const wallY = hasKeep ? 0.26 : 0.2;
  place(parts, wallGeo, stoneMat, 0, wallY, cornerR);
  place(parts, wallGeo, stoneMat, 0, wallY, -cornerR);
  place(parts, wallGeo, stoneMat, cornerR, wallY, 0, Math.PI / 2);
  place(parts, wallGeo, stoneMat, -cornerR, wallY, 0, Math.PI / 2);
  place(parts, gateGeo, gateMat, 0, 0.18, cornerR + 0.02);

  if (hasWalls) {
    const outer = cornerR + 0.42;
    place(parts, outerWallGeo, darkStoneMat, 0, 0.36, outer);
    place(parts, outerWallGeo, darkStoneMat, 0, 0.36, -outer);
    place(parts, outerWallGeo, darkStoneMat, outer, 0.36, 0, Math.PI / 2);
    place(parts, outerWallGeo, darkStoneMat, -outer, 0.36, 0, Math.PI / 2);
    for (const angle of angles) {
      place(
        parts,
        outerBastionGeo,
        darkStoneMat,
        Math.cos(angle) * outer,
        0.48,
        Math.sin(angle) * outer,
      );
    }
  }

  if (buildings.includes('marketSquare')) {
    place(parts, stallGeo, woodMat, 0.05, 0.12, cornerR + 0.48);
    place(parts, awningGeo, clothMat, 0.05, 0.3, cornerR + 0.48);
  }
  if (buildings.includes('barracks')) {
    place(parts, barracksGeo, woodMat, -cornerR - 0.48, 0.16, -0.05);
    place(parts, barracksRoofGeo, thatchMat, -cornerR - 0.48, 0.34, -0.05);
  }
  if (buildings.includes('granary')) {
    place(parts, siloGeo, stoneMat, cornerR + 0.46, 0.28, -0.42);
    place(parts, siloRoofGeo, roof, cornerR + 0.46, 0.66, -0.42);
  }

  const poleY = hasKeep ? 1.55 : 0.78;
  place(parts, poleGeo, goldTrimMat, 0.34, poleY, 0);

  const group = bakeParts(parts, new Set([stoneMat, darkStoneMat]));
  group.name = 'CastleGroup';

  const banner = new THREE.Mesh(bannerGeo, bannerMaterial(factionColor, sigil));
  banner.name = 'banner';
  banner.position.set(0.36, hasKeep ? 1.95 : 1.12, 0);
  banner.rotation.y = Math.PI / 5;
  banner.userData.baseRot = banner.rotation.y;
  group.add(banner);

  group.scale.setScalar(hasKeep ? 1 : 0.88);
  return group;
}

function fanGeometry(cx: number, cz: number, radius: number, lift: number) {
  const segments = 48;
  const positions: number[] = [0, terrainHeight(cx, cz) + lift, 0];
  const indices: number[] = [];
  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    const lx = Math.cos(angle) * radius;
    const lz = Math.sin(angle) * radius;
    positions.push(lx, terrainHeight(cx + lx, cz + lz) + lift, lz);
  }
  for (let i = 0; i < segments; i++) {
    indices.push(0, i + 1, ((i + 1) % segments) + 1);
  }
  const geo = ownedGeo(new THREE.BufferGeometry());
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

export function createTerritoryDisc(cx: number, cz: number, color: THREE.Color) {
  const geo = fanGeometry(cx, cz, 1.72, 0.045);
  const mat = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.2,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  mat.userData.dispose = true;
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(cx, 0, cz);
  mesh.renderOrder = 2;
  return mesh;
}

export function createTerritoryRing(cx: number, cz: number, color: THREE.Color) {
  const segments = 72;
  const radius = 1.86;
  const width = 0.11;
  const positions: number[] = [];
  const indices: number[] = [];
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    const ix = c * (radius - width);
    const iz = s * (radius - width);
    const ox = c * radius;
    const oz = s * radius;
    positions.push(ix, terrainHeight(cx + ix, cz + iz) + 0.07, iz);
    positions.push(ox, terrainHeight(cx + ox, cz + oz) + 0.08, oz);
  }
  for (let i = 0; i < segments; i++) {
    const a = i * 2;
    indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
  }
  const geo = ownedGeo(new THREE.BufferGeometry());
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  const mat = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.92,
    depthWrite: false,
    side: THREE.DoubleSide,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });
  mat.userData.dispose = true;
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(cx, 0, cz);
  mesh.renderOrder = 3;
  return mesh;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function createProvinceLabel(name: string) {
  const canvas = document.createElement('canvas');
  const measure = canvas.getContext('2d')!;
  const font = '600 44px Cinzel, Palatino, Times, serif';
  measure.font = font;
  const textWidth = measure.measureText(name).width;
  canvas.width = Math.ceil(Math.max(180, textWidth + 56));
  canvas.height = 84;
  const ctx = canvas.getContext('2d')!;
  ctx.font = font;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  roundRect(ctx, 6, 12, canvas.width - 12, 60, 16);
  ctx.fillStyle = 'rgba(16, 12, 8, 0.68)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(212, 175, 55, 0.9)';
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.fillStyle = '#f6edd6';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(name, canvas.width / 2, 44);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.userData.dispose = true;
  const mat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: true });
  mat.userData.dispose = true;
  const sprite = new THREE.Sprite(mat);
  const worldW = canvas.width / 230;
  const worldH = canvas.height / 230;
  sprite.scale.set(worldW, worldH, 1);
  sprite.userData.baseScaleX = worldW;
  sprite.userData.baseScaleY = worldH;
  sprite.renderOrder = 4;
  return sprite;
}

export function createRiverRibbon(points: { x: number; z: number }[], halfWidth: number) {
  const curve = new THREE.CatmullRomCurve3(
    points.map((p) => new THREE.Vector3(p.x, 0, p.z)),
    false,
    'catmullrom',
    0.35,
  );
  const spaced = curve.getSpacedPoints(36);
  const positions: number[] = [];
  const indices: number[] = [];
  for (let i = 0; i < spaced.length; i++) {
    const prev = spaced[Math.max(0, i - 1)];
    const next = spaced[Math.min(spaced.length - 1, i + 1)];
    let dx = next.x - prev.x;
    let dz = next.z - prev.z;
    const len = Math.hypot(dx, dz) || 1;
    dx /= len;
    dz /= len;
    const x = spaced[i].x;
    const z = spaced[i].z;
    const y = terrainHeight(x, z) + 0.09;
    positions.push(x + -dz * halfWidth, y, z + dx * halfWidth);
    positions.push(x - -dz * halfWidth, y, z - dx * halfWidth);
  }
  for (let i = 0; i < spaced.length - 1; i++) {
    const a = i * 2;
    indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
  }
  const geo = ownedGeo(new THREE.BufferGeometry());
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

export function createCoastWashGeometry(cx: number, cz: number, rx: number, rz: number) {
  const segments = 28;
  const y = terrainHeight(cx, cz) + 0.08;
  const positions: number[] = [0, y, 0];
  const indices: number[] = [];
  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    positions.push(Math.cos(angle) * rx, y, Math.sin(angle) * rz);
  }
  for (let i = 0; i < segments; i++) {
    indices.push(0, i + 1, ((i + 1) % segments) + 1);
  }
  const geo = ownedGeo(new THREE.BufferGeometry());
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

const FORMATION = [
  [0, 0.28],
  [-0.32, -0.02],
  [0.32, -0.02],
  [0, -0.34],
  [-0.38, -0.4],
  [0.38, -0.4],
  [0, -0.7],
];

function matrixFromEuler(x: number, y: number, z: number, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) {
  return new THREE.Matrix4().compose(
    new THREE.Vector3(x, y, z),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)),
    new THREE.Vector3(sx, sy, sz),
  );
}

export function createArmyFormation(factionColor: string, count: number) {
  const n = count >= 160 ? 7 : count >= 120 ? 6 : count >= 80 ? 5 : count >= 45 ? 4 : 3;
  const armor = armorMaterial(factionColor);
  const pennant = pennantMaterial(factionColor);
  const parts: BakePart[] = [];

  for (let i = 0; i < n; i++) {
    const [sx, sz] = FORMATION[i];
    const shift = (local: THREE.Matrix4) => {
      const matrix = new THREE.Matrix4().makeTranslation(sx, 0, sz).multiply(local);
      return matrix;
    };
    parts.push({ geo: horseBodyGeo, mat: horseMat, matrix: shift(matrixFromEuler(0, 0.22, 0)) });
    parts.push({
      geo: horseHeadGeo,
      mat: horseMat,
      matrix: shift(matrixFromEuler(0, 0.38, 0.18, -0.35, 0, 0)),
    });
    parts.push({ geo: torsoGeo, mat: armor, matrix: shift(matrixFromEuler(0, 0.42, -0.02)) });
    parts.push({ geo: helmGeo, mat: metalMat, matrix: shift(matrixFromEuler(0, 0.56, -0.02)) });
    parts.push({
      geo: lanceGeo,
      mat: metalMat,
      matrix: shift(matrixFromEuler(0.14, 0.62, 0.08, 0.25, 0, -0.18)),
    });
    parts.push({
      geo: pennantGeo,
      mat: pennant,
      matrix: shift(matrixFromEuler(0.2, 0.98, 0.12, 0, Math.PI / 5, 0)),
    });
    parts.push({
      geo: shieldGeo,
      mat: armor,
      matrix: shift(matrixFromEuler(-0.12, 0.4, 0.02, 0, 0.25, 0)),
    });
  }

  const group = bakeParts(parts, new Set());
  group.name = 'ArmyUnitGroup';
  group.scale.setScalar(1);
  return group;
}

export function createBattleClashMarker() {
  const group = new THREE.Group();
  group.name = 'BattleClashMarker';

  const bladeMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 0.95,
    roughness: 0.1,
    emissive: 0xff4400,
    emissiveIntensity: 0.5,
  });
  bladeMat.userData.dispose = true;
  const hiltMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.9, roughness: 0.2 });
  hiltMat.userData.dispose = true;

  const makeSword = () => {
    const sword = new THREE.Group();
    const blade = new THREE.Mesh(ownedGeo(new THREE.BoxGeometry(0.06, 0.8, 0.02)), bladeMat);
    blade.position.y = 0.4;
    sword.add(blade);
    const cross = new THREE.Mesh(ownedGeo(new THREE.BoxGeometry(0.26, 0.04, 0.04)), hiltMat);
    cross.position.y = 0.15;
    sword.add(cross);
    const pommel = new THREE.Mesh(ownedGeo(new THREE.SphereGeometry(0.04, 6, 6)), hiltMat);
    pommel.position.y = -0.05;
    sword.add(pommel);
    sword.position.y = 1;
    return sword;
  };

  const left = makeSword();
  left.rotation.z = Math.PI / 4;
  group.add(left);
  const right = makeSword();
  right.rotation.z = -Math.PI / 4;
  group.add(right);

  const fireMat = new THREE.MeshBasicMaterial({
    color: 0xff6600,
    wireframe: true,
    transparent: true,
    opacity: 0.6,
  });
  fireMat.userData.dispose = true;
  const fire = new THREE.Mesh(ownedGeo(new THREE.SphereGeometry(0.25, 8, 8)), fireMat);
  fire.name = 'fire';
  fire.position.y = 1;
  group.add(fire);
  return group;
}

export function createRoadGeometry(points: THREE.Vector3[]) {
  const curve = new THREE.CatmullRomCurve3(points);
  return ownedGeo(new THREE.TubeGeometry(curve, 12, 0.045, 4, false));
}
