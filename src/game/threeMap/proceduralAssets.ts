import * as THREE from 'three';

// Procedural aged parchment texture generator
export function createParchmentTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  // Base parchment warm parchment color
  const grad = ctx.createRadialGradient(512, 512, 100, 512, 512, 700);
  grad.addColorStop(0, '#f5edd6');
  grad.addColorStop(0.6, '#e8dcba');
  grad.addColorStop(1, '#c9b990');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 1024);

  // Subtle parchment noise and fibers
  for (let i = 0; i < 3500; i++) {
    const x = Math.random() * 1024;
    const y = Math.random() * 1024;
    const radius = Math.random() * 2 + 0.5;
    ctx.fillStyle = Math.random() > 0.5 ? 'rgba(160, 130, 90, 0.05)' : 'rgba(255, 255, 255, 0.04)';
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  // Faint cartographic grid lines
  ctx.strokeStyle = 'rgba(140, 110, 70, 0.06)';
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

  // Faint nautical compass rose at corner
  ctx.save();
  ctx.translate(880, 140);
  ctx.strokeStyle = 'rgba(130, 95, 50, 0.2)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, 0, 70, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, 50, 0, Math.PI * 2);
  ctx.stroke();
  // Compass points
  const points = 8;
  for (let p = 0; p < points; p++) {
    const angle = (p * Math.PI * 2) / points;
    const len = p % 2 === 0 ? 65 : 45;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(angle) * len, Math.sin(angle) * len);
    ctx.stroke();
  }
  ctx.restore();

  // Medieval edge vignette / burnt border
  const vignette = ctx.createRadialGradient(512, 512, 420, 512, 512, 720);
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(0.8, 'rgba(80, 50, 20, 0.25)');
  vignette.addColorStop(1, 'rgba(40, 25, 10, 0.7)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, 1024, 1024);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

// Procedural heraldic banner flag texture
export function createBannerTexture(colorHex: string, sigilText: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = colorHex;
  ctx.fillRect(0, 0, 128, 256);

  // Gold or dark border
  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 6;
  ctx.strokeRect(3, 3, 122, 250);

  // Chevron swallowtail cut at bottom
  ctx.fillStyle = '#111';
  ctx.beginPath();
  ctx.moveTo(0, 256);
  ctx.lineTo(64, 210);
  ctx.lineTo(128, 256);
  ctx.lineTo(128, 256);
  ctx.closePath();
  ctx.globalCompositeOperation = 'destination-out';
  ctx.fill();
  ctx.globalCompositeOperation = 'source-over';

  // Sigil in center
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 48px serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(sigilText, 64, 100);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Composite 3-12 part procedural medieval Castle Group
export function createMedievalCastleGroup(factionColor: string, sigil: string, scale = 1.0): THREE.Group {
  const castleGroup = new THREE.Group();
  castleGroup.name = 'CastleGroup';

  const stoneMat = new THREE.MeshStandardMaterial({
    color: 0x8a8479,
    roughness: 0.85,
    metalness: 0.1,
  });

  const darkStoneMat = new THREE.MeshStandardMaterial({
    color: 0x615b52,
    roughness: 0.9,
    metalness: 0.15,
  });

  const roofMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(factionColor).multiplyScalar(0.7),
    roughness: 0.5,
    metalness: 0.2,
  });

  const goldTrimMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    roughness: 0.35,
    metalness: 0.8,
  });

  // 1. Central Keep Tower (Octagonal / Cylinder)
  const keepGeo = new THREE.CylinderGeometry(0.38, 0.44, 1.1, 8);
  const keep = new THREE.Mesh(keepGeo, stoneMat);
  keep.position.y = 0.55;
  keep.castShadow = true;
  keep.receiveShadow = true;
  castleGroup.add(keep);

  // 2. High Conical Roof on Central Tower
  const roofGeo = new THREE.ConeGeometry(0.48, 0.8, 8);
  const roof = new THREE.Mesh(roofGeo, roofMat);
  roof.position.y = 1.1 + 0.4;
  roof.castShadow = true;
  castleGroup.add(roof);

  // 3. Central Keep Gold Spire Finial
  const spireGeo = new THREE.CylinderGeometry(0.02, 0.04, 0.35, 6);
  const spire = new THREE.Mesh(spireGeo, goldTrimMat);
  spire.position.y = 1.9 + 0.15;
  castleGroup.add(spire);

  // 4-7. Four Corner Bastions with crenellations
  const cornerRadius = 0.58;
  const bastionGeo = new THREE.CylinderGeometry(0.18, 0.22, 0.85, 8);
  const bastionRoofGeo = new THREE.ConeGeometry(0.24, 0.45, 8);

  const angles = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2];
  angles.forEach((angle) => {
    const x = Math.cos(angle) * cornerRadius;
    const z = Math.sin(angle) * cornerRadius;

    const bastion = new THREE.Mesh(bastionGeo, darkStoneMat);
    bastion.position.set(x, 0.425, z);
    bastion.castShadow = true;
    bastion.receiveShadow = true;
    castleGroup.add(bastion);

    const bRoof = new THREE.Mesh(bastionRoofGeo, roofMat);
    bRoof.position.set(x, 0.85 + 0.225, z);
    bRoof.castShadow = true;
    castleGroup.add(bRoof);
  });

  // 8. Curtain Walls connecting corners
  const wallGeoX = new THREE.BoxGeometry(0.9, 0.55, 0.12);
  const wall1 = new THREE.Mesh(wallGeoX, stoneMat);
  wall1.position.set(0, 0.275, cornerRadius);
  wall1.castShadow = true;
  castleGroup.add(wall1);

  const wall2 = new THREE.Mesh(wallGeoX, stoneMat);
  wall2.position.set(0, 0.275, -cornerRadius);
  wall2.castShadow = true;
  castleGroup.add(wall2);

  const wallGeoZ = new THREE.BoxGeometry(0.12, 0.55, 0.9);
  const wall3 = new THREE.Mesh(wallGeoZ, stoneMat);
  wall3.position.set(cornerRadius, 0.275, 0);
  wall3.castShadow = true;
  castleGroup.add(wall3);

  const wall4 = new THREE.Mesh(wallGeoZ, stoneMat);
  wall4.position.set(-cornerRadius, 0.275, 0);
  wall4.castShadow = true;
  castleGroup.add(wall4);

  // 9. Gatehouse archway
  const gateGeo = new THREE.BoxGeometry(0.3, 0.38, 0.16);
  const gateMat = new THREE.MeshStandardMaterial({ color: 0x3d2817, roughness: 0.9 });
  const gate = new THREE.Mesh(gateGeo, gateMat);
  gate.position.set(0, 0.19, cornerRadius + 0.02);
  castleGroup.add(gate);

  // 10. Heraldic Banner on central keep
  const bannerMat = new THREE.MeshStandardMaterial({
    map: createBannerTexture(factionColor, sigil),
    roughness: 0.6,
    metalness: 0.1,
    side: THREE.DoubleSide,
    transparent: true,
  });
  const bannerGeo = new THREE.PlaneGeometry(0.32, 0.55);
  const banner = new THREE.Mesh(bannerGeo, bannerMat);
  banner.position.set(0.2, 1.85, 0);
  banner.rotation.y = Math.PI / 4;
  castleGroup.add(banner);

  castleGroup.scale.set(scale, scale, scale);
  return castleGroup;
}

// Composite 3D Village / Settlement Group
export function createSettlementGroup(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'SettlementGroup';

  const woodMat = new THREE.MeshStandardMaterial({ color: 0x5a4228, roughness: 0.9 });
  const thatchMat = new THREE.MeshStandardMaterial({ color: 0x8f7d57, roughness: 0.85 });

  // 3 small houses arranged organically
  const houseOffsets = [
    { x: -0.25, z: -0.2, rot: 0.2 },
    { x: 0.3, z: 0.15, rot: -0.4 },
    { x: -0.1, z: 0.35, rot: 0.8 },
  ];

  houseOffsets.forEach((h) => {
    const hGroup = new THREE.Group();
    hGroup.position.set(h.x, 0, h.z);
    hGroup.rotation.y = h.rot;

    const baseGeo = new THREE.BoxGeometry(0.22, 0.16, 0.3);
    const base = new THREE.Mesh(baseGeo, woodMat);
    base.position.y = 0.08;
    base.castShadow = true;
    hGroup.add(base);

    const roofGeo = new THREE.ConeGeometry(0.24, 0.18, 4);
    roofGeo.rotateY(Math.PI / 4);
    const roof = new THREE.Mesh(roofGeo, thatchMat);
    roof.position.y = 0.16 + 0.09;
    roof.scale.set(1, 1, 1.3);
    roof.castShadow = true;
    hGroup.add(roof);

    group.add(hGroup);
  });

  return group;
}

// Composite 3D Mountain Peak Group
export function createMountainPeak(scale = 1.0): THREE.Group {
  const group = new THREE.Group();
  group.name = 'MountainGroup';

  const rockMat = new THREE.MeshStandardMaterial({
    color: 0x524e49,
    roughness: 0.95,
    metalness: 0.05,
    flatShading: true,
  });

  const snowMat = new THREE.MeshStandardMaterial({
    color: 0xedebe8,
    roughness: 0.8,
    metalness: 0.1,
    flatShading: true,
  });

  // Main peak
  const coneGeo = new THREE.ConeGeometry(0.65, 1.4, 5);
  const mainPeak = new THREE.Mesh(coneGeo, rockMat);
  mainPeak.position.y = 0.7;
  mainPeak.castShadow = true;
  mainPeak.receiveShadow = true;
  group.add(mainPeak);

  // Snow cap
  const snowGeo = new THREE.ConeGeometry(0.32, 0.5, 5);
  const snow = new THREE.Mesh(snowGeo, snowMat);
  snow.position.y = 1.15;
  group.add(snow);

  // Secondary sub-crags
  const subCone1 = new THREE.ConeGeometry(0.4, 0.85, 4);
  const sub1 = new THREE.Mesh(subCone1, rockMat);
  sub1.position.set(0.35, 0.425, 0.25);
  sub1.rotation.y = 0.5;
  group.add(sub1);

  const subCone2 = new THREE.ConeGeometry(0.35, 0.7, 4);
  const sub2 = new THREE.Mesh(subCone2, rockMat);
  sub2.position.set(-0.3, 0.35, -0.2);
  sub2.rotation.y = -0.3;
  group.add(sub2);

  group.scale.set(scale, scale, scale);
  return group;
}

// Composite 3D Pine Tree
export function createPineTree(scale = 1.0): THREE.Group {
  const group = new THREE.Group();
  group.name = 'PineTree';

  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4a3525, roughness: 0.9 });
  const needleMat = new THREE.MeshStandardMaterial({ color: 0x244a2b, roughness: 0.85, flatShading: true });

  const trunkGeo = new THREE.CylinderGeometry(0.04, 0.06, 0.3, 5);
  const trunk = new THREE.Mesh(trunkGeo, trunkMat);
  trunk.position.y = 0.15;
  group.add(trunk);

  const tiers = [
    { r: 0.24, h: 0.35, y: 0.3 },
    { r: 0.18, h: 0.3, y: 0.45 },
    { r: 0.12, h: 0.25, y: 0.6 },
  ];

  tiers.forEach((t) => {
    const geo = new THREE.ConeGeometry(t.r, t.h, 6);
    const foliage = new THREE.Mesh(geo, needleMat);
    foliage.position.y = t.y;
    foliage.castShadow = true;
    group.add(foliage);
  });

  group.scale.set(scale, scale, scale);
  return group;
}

// Composite 3D Army Figurine Group
export function createArmyFigure(factionColor: string, count: number): THREE.Group {
  const group = new THREE.Group();
  group.name = 'ArmyUnitGroup';

  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x9ca3af,
    metalness: 0.85,
    roughness: 0.25,
  });

  const armorMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(factionColor),
    metalness: 0.3,
    roughness: 0.5,
  });

  const horseMat = new THREE.MeshStandardMaterial({
    color: 0x3d2817,
    roughness: 0.8,
  });

  // Base circular pedestal
  const baseGeo = new THREE.CylinderGeometry(0.35, 0.4, 0.08, 16);
  const baseMat = new THREE.MeshStandardMaterial({
    color: 0x1f2937,
    roughness: 0.4,
    metalness: 0.7,
  });
  const pedestal = new THREE.Mesh(baseGeo, baseMat);
  pedestal.position.y = 0.04;
  group.add(pedestal);

  // Pedestal rim in faction color
  const rimGeo = new THREE.TorusGeometry(0.38, 0.03, 8, 24);
  rimGeo.rotateX(Math.PI / 2);
  const rimMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(factionColor),
    emissive: new THREE.Color(factionColor),
    emissiveIntensity: 0.4,
    metalness: 0.8,
  });
  const rim = new THREE.Mesh(rimGeo, rimMat);
  rim.position.y = 0.08;
  group.add(rim);

  // Horse body
  const horseBodyGeo = new THREE.BoxGeometry(0.2, 0.25, 0.45);
  const horseBody = new THREE.Mesh(horseBodyGeo, horseMat);
  horseBody.position.set(0, 0.25, 0);
  group.add(horseBody);

  // Horse neck & head
  const horseHeadGeo = new THREE.BoxGeometry(0.12, 0.28, 0.2);
  const horseHead = new THREE.Mesh(horseHeadGeo, horseMat);
  horseHead.position.set(0, 0.42, 0.2);
  horseHead.rotation.x = -0.3;
  group.add(horseHead);

  // Knight torso
  const torsoGeo = new THREE.CylinderGeometry(0.1, 0.12, 0.28, 6);
  const torso = new THREE.Mesh(torsoGeo, armorMat);
  torso.position.set(0, 0.48, -0.04);
  group.add(torso);

  // Knight helmet
  const helmGeo = new THREE.SphereGeometry(0.09, 8, 8);
  const helm = new THREE.Mesh(helmGeo, metalMat);
  helm.position.set(0, 0.68, -0.04);
  group.add(helm);

  // Knight lance / spear
  const lanceGeo = new THREE.CylinderGeometry(0.015, 0.02, 1.1, 6);
  const lance = new THREE.Mesh(lanceGeo, metalMat);
  lance.position.set(0.18, 0.65, 0.1);
  lance.rotation.x = 0.2;
  lance.rotation.z = -0.15;
  group.add(lance);

  // Spear pennant banner
  const pennantGeo = new THREE.PlaneGeometry(0.2, 0.12);
  const pennantMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(factionColor),
    side: THREE.DoubleSide,
  });
  const pennant = new THREE.Mesh(pennantGeo, pennantMat);
  pennant.position.set(0.28, 1.1, 0.15);
  pennant.rotation.y = Math.PI / 4;
  group.add(pennant);

  // Shield on left arm
  const shieldGeo = new THREE.BoxGeometry(0.03, 0.22, 0.16);
  const shield = new THREE.Mesh(shieldGeo, armorMat);
  shield.position.set(-0.15, 0.46, 0.02);
  shield.rotation.y = 0.2;
  group.add(shield);

  return group;
}

// Battle Clash Marker (Animated crossed swords & fire)
export function createBattleClashMarker(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'BattleClashMarker';

  const bladeMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 0.95,
    roughness: 0.1,
    emissive: 0xff4400,
    emissiveIntensity: 0.5,
  });

  const hiltMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    metalness: 0.9,
    roughness: 0.2,
  });

  // Sword 1
  const s1Group = new THREE.Group();
  const blade1 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.8, 0.02), bladeMat);
  blade1.position.y = 0.4;
  s1Group.add(blade1);
  const cross1 = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.04, 0.04), hiltMat);
  cross1.position.y = 0.15;
  s1Group.add(cross1);
  const pommel1 = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), hiltMat);
  pommel1.position.y = -0.05;
  s1Group.add(pommel1);

  s1Group.rotation.z = Math.PI / 4;
  s1Group.position.y = 1.0;
  group.add(s1Group);

  // Sword 2 (Crossed)
  const s2Group = s1Group.clone();
  s2Group.rotation.z = -Math.PI / 4;
  group.add(s2Group);

  // Fire / spark aura
  const fireGeo = new THREE.SphereGeometry(0.25, 8, 8);
  const fireMat = new THREE.MeshBasicMaterial({
    color: 0xff6600,
    wireframe: true,
    transparent: true,
    opacity: 0.6,
  });
  const fire = new THREE.Mesh(fireGeo, fireMat);
  fire.position.y = 1.0;
  group.add(fire);

  return group;
}
