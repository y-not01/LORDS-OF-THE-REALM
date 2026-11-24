import React, { useCallback, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { Territory, Army, BattleState, RivalLord, PlayerHouse } from '../../types/game';
import {
  MAP_WIDTH,
  MAP_HEIGHT,
  terrainHeight,
  disposeOwnedResources,
  createParchmentGround,
  createPictureFrame,
  createMedievalCastleGroup,
  createTerritoryDisc,
  createTerritoryRing,
  createProvinceLabel,
  createRiverRibbon,
  createCoastWashGeometry,
  createArmyFormation,
  createBattleClashMarker,
  createRoadGeometry,
  hitMaterial,
  riverMaterial,
  coastMaterial,
  roadMaterial,
  sharedScenery,
} from './proceduralAssets';
import { Language, TRANSLATIONS } from '../../i18n/translations';

interface StrategyWorldMapProps {
  territories: Territory[];
  armies: Army[];
  activeBattles: BattleState[];
  selectedTerritoryId: string | null;
  playerHouse: PlayerHouse;
  rivalLords: RivalLord[];
  onSelectTerritory: (territoryId: string) => void;
  onDispatchArmy?: (originTerritoryId: string, targetTerritoryId: string) => void;
  isDispatchingArmy?: boolean;
  language?: Language;
}

const DEFAULT_PHI = 0.74;
const DEFAULT_THETA = 0.48;
const DEFAULT_RADIUS = 34;
const GOLD_LIGHT = new THREE.Color('#ffe7a3');

const NORTH_RIVER = [
  { x: -8.4, z: 3.4 },
  { x: -5.4, z: 4.55 },
  { x: -2.4, z: 4.9 },
  { x: -0.2, z: 6.55 },
];

const NORTH_SPUR = [
  { x: -5.4, z: 4.55 },
  { x: -4.7, z: 3.75 },
];

const SOUTH_RIVER = [
  { x: 0.9, z: -5.35 },
  { x: -1.5, z: -6.9 },
  { x: -3.4, z: -7.65 },
];

const SOUTH_SPUR = [
  { x: 0.9, z: -5.35 },
  { x: -0.35, z: -5.05 },
];

const FOREST = [
  { x: 1.8, z: -3.5 },
  { x: 2.2, z: -2.8 },
  { x: 1.2, z: -2.2 },
  { x: 3.2, z: 4.8 },
  { x: 2.5, z: 5.4 },
  { x: -3.8, z: 4.5 },
  { x: -4.5, z: 4.8 },
].map((tree, index) => ({
  x: tree.x + Math.sin(index * 12.3) * 0.28,
  z: tree.z + Math.cos(index * 4.7) * 0.28,
  rot: (index * 1.7) % (Math.PI * 2),
  scale: 0.86 + ((index * 37) % 28) / 100,
}));

const MOUNTAINS = [
  { x: 7.2, z: 1.5, s: 1.3, rot: 0.4 },
  { x: 6.8, z: 3.2, s: 1.1, rot: 1.1 },
  { x: 8.0, z: -1.2, s: 1.4, rot: 0.2 },
  { x: -7.5, z: 2.8, s: 1.2, rot: 2.1 },
  { x: -8.2, z: 0.5, s: 1.5, rot: 0.8 },
  { x: 3.5, z: -6.0, s: 1.2, rot: 1.6 },
  { x: 4.8, z: -7.5, s: 1.4, rot: 0.3 },
];

const HOUSE_OFFSETS = [
  { x: 0.78, z: 0.42, rot: 0.2 },
  { x: 1.12, z: 0.78, rot: -0.45 },
  { x: 0.88, z: 1.12, rot: 0.85 },
];

type MapView = {
  target: THREE.Vector3;
  radius: number;
  phi: number;
  theta: number;
};

function poseFromView(view: MapView, out: THREE.Vector3) {
  const sinPhi = Math.sin(view.phi);
  out.set(
    view.target.x + view.radius * sinPhi * Math.sin(view.theta),
    view.target.y + view.radius * Math.cos(view.phi),
    view.target.z + view.radius * sinPhi * Math.cos(view.theta),
  );
  return out;
}

function territorySignature(territories: Territory[], playerHouse: PlayerHouse, rivals: RivalLord[]) {
  const colors = `${playerHouse.color}:${playerHouse.sigil}|${rivals.map((rival) => `${rival.id}:${rival.color}`).join(',')}`;
  const body = territories
    .map((territory) =>
      `${territory.id}:${territory.ownerId}:${territory.position.x}:${territory.position.z}:${territory.buildings.join('+')}:${territory.name}`,
    )
    .join('|');
  return `${colors}#${body}`;
}

function hashString(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i++) hash = (hash * 31 + value.charCodeAt(i)) | 0;
  return Math.abs(hash);
}

export const StrategyWorldMap: React.FC<StrategyWorldMapProps> = ({
  territories,
  armies,
  activeBattles,
  selectedTerritoryId,
  playerHouse,
  rivalLords,
  onSelectTerritory,
  onDispatchArmy,
  isDispatchingArmy,
  language = 'en',
}) => {
  const t = TRANSLATIONS[language];
  const mountRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<{ sync: () => void } | null>(null);
  const viewRef = useRef<MapView>({
    target: new THREE.Vector3(0, 0, 0),
    radius: DEFAULT_RADIUS,
    phi: DEFAULT_PHI,
    theta: DEFAULT_THETA,
  });
  const focusSeededRef = useRef(false);

  const stateRef = useRef({
    territories,
    armies,
    activeBattles,
    selectedTerritoryId,
    playerHouse,
    rivalLords,
    onSelectTerritory,
    onDispatchArmy,
    isDispatchingArmy,
  });

  stateRef.current = {
    territories,
    armies,
    activeBattles,
    selectedTerritoryId,
    playerHouse,
    rivalLords,
    onSelectTerritory,
    onDispatchArmy,
    isDispatchingArmy,
  };

  const resetCamera = useCallback(() => {
    viewRef.current.target.set(0, 0, 0);
    viewRef.current.phi = DEFAULT_PHI;
    viewRef.current.theta = DEFAULT_THETA;
    viewRef.current.radius = DEFAULT_RADIUS;
  }, []);

  useEffect(() => {
    if (!focusSeededRef.current) {
      focusSeededRef.current = true;
      return;
    }
    if (!selectedTerritoryId) return;
    const territory = stateRef.current.territories.find((item) => item.id === selectedTerritoryId);
    if (!territory) return;
    viewRef.current.target.set(territory.position.x, 0, territory.position.z);
    if (viewRef.current.radius > 22) viewRef.current.radius = 17;
  }, [selectedTerritoryId]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#0b101c');
    scene.fog = new THREE.FogExp2(0x0b101c, 0.022);

    const width = Math.max(container.clientWidth, 1);
    const height = Math.max(container.clientHeight, 1);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 180);
    const desiredPos = new THREE.Vector3();
    const lookAt = new THREE.Vector3();
    poseFromView(viewRef.current, desiredPos);
    camera.position.copy(desiredPos);
    lookAt.copy(viewRef.current.target);
    camera.lookAt(lookAt);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.style.touchAction = 'none';
    container.appendChild(renderer.domElement);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    const envTexture = pmremGenerator.fromScene(room, 0.04).texture;
    scene.environment = envTexture;
    pmremGenerator.dispose();
    disposeOwnedResources(room);
    room.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      mesh.geometry?.dispose();
      const material = mesh.material as THREE.Material | THREE.Material[] | undefined;
      if (!material) return;
      (Array.isArray(material) ? material : [material]).forEach((mat) => mat.dispose());
    });

    const ambientLight = new THREE.AmbientLight(0xd4af37, 0.35);
    scene.add(ambientLight);
    const hemiLight = new THREE.HemisphereLight(0xdde9f8, 0x3d3020, 0.6);
    hemiLight.position.set(0, 20, 0);
    scene.add(hemiLight);
    const dirLight = new THREE.DirectionalLight(0xfff1dc, 1.6);
    dirLight.position.set(12, 22, 14);
    dirLight.castShadow = !isSoftwareGl;
    if (!isSoftwareGl) {
      dirLight.shadow.mapSize.width = 1024;
      dirLight.shadow.mapSize.height = 1024;
      dirLight.shadow.camera.near = 0.5;
      dirLight.shadow.camera.far = 50;
      const shadowExtent = 16;
      dirLight.shadow.camera.left = -shadowExtent;
      dirLight.shadow.camera.right = shadowExtent;
      dirLight.shadow.camera.top = shadowExtent;
      dirLight.shadow.camera.bottom = -shadowExtent;
      dirLight.shadow.bias = -0.0005;
      dirLight.shadow.normalBias = 0.02;
    }
    scene.add(dirLight);
    const rimLight = new THREE.DirectionalLight(0xcaa462, 0.5);
    rimLight.position.set(-15, 10, -12);
    scene.add(rimLight);

    const ground = createParchmentGround();
    ground.receiveShadow = !isSoftwareGl;
    scene.add(ground);
    scene.add(createPictureFrame());

    const waterGroup = new THREE.Group();
    scene.add(waterGroup);
    const addWater = (
      geometry: THREE.BufferGeometry,
      material: THREE.Material,
      x = 0,
      z = 0,
    ) => {
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(x, 0, z);
      mesh.renderOrder = 2.5;
      waterGroup.add(mesh);
    };
    addWater(createRiverRibbon(NORTH_RIVER, 0.42), riverMaterial);
    addWater(createRiverRibbon(NORTH_SPUR, 0.28), riverMaterial);
    addWater(createRiverRibbon(SOUTH_RIVER, 0.4), riverMaterial);
    addWater(createRiverRibbon(SOUTH_SPUR, 0.26), riverMaterial);
    addWater(createCoastWashGeometry(-0.6, 7.7, 2.3, 1.25), coastMaterial, -0.6, 7.7);
    addWater(createCoastWashGeometry(-4.8, -8.55, 2.2, 1.15), coastMaterial, -4.8, -8.55);

    const roadGroup = new THREE.Group();
    scene.add(roadGroup);
    const drawnRoads = new Set<string>();
    stateRef.current.territories.forEach((territory) => {
      territory.connectedTo.forEach((neighborId) => {
        const key = [territory.id, neighborId].sort().join('--');
        if (drawnRoads.has(key)) return;
        drawnRoads.add(key);
        const target = stateRef.current.territories.find((item) => item.id === neighborId);
        if (!target) return;
        const points: THREE.Vector3[] = [];
        for (let step = 0; step <= 8; step++) {
          const u = step / 8;
          const x = THREE.MathUtils.lerp(territory.position.x, target.position.x, u);
          const z = THREE.MathUtils.lerp(territory.position.z, target.position.z, u);
          points.push(new THREE.Vector3(x, terrainHeight(x, z) + 0.06, z));
        }
        roadGroup.add(new THREE.Mesh(createRoadGeometry(points), roadMaterial));
      });
    });

    const dummy = new THREE.Object3D();
    const trunkMesh = new THREE.InstancedMesh(sharedScenery.trunkGeo, sharedScenery.trunkMat, FOREST.length);
    const tierMeshes = sharedScenery.treeTierGeos.map(
      (geo) => new THREE.InstancedMesh(geo, sharedScenery.needleMat, FOREST.length),
    );
    FOREST.forEach((tree, index) => {
      dummy.position.set(tree.x, terrainHeight(tree.x, tree.z), tree.z);
      dummy.rotation.set(0, tree.rot, 0);
      dummy.scale.setScalar(tree.scale);
      dummy.updateMatrix();
      trunkMesh.setMatrixAt(index, dummy.matrix);
      tierMeshes.forEach((mesh) => mesh.setMatrixAt(index, dummy.matrix));
    });
    [trunkMesh, ...tierMeshes].forEach((mesh) => {
      mesh.frustumCulled = false;
      mesh.castShadow = false;
      scene.add(mesh);
    });

    const peakMesh = new THREE.InstancedMesh(sharedScenery.peakGeo, sharedScenery.rockMat, MOUNTAINS.length);
    const snowMesh = new THREE.InstancedMesh(sharedScenery.snowCapGeo, sharedScenery.snowMat, MOUNTAINS.length);
    const subAMesh = new THREE.InstancedMesh(sharedScenery.subPeakAGeo, sharedScenery.rockMat, MOUNTAINS.length);
    const subBMesh = new THREE.InstancedMesh(sharedScenery.subPeakBGeo, sharedScenery.rockMat, MOUNTAINS.length);
    MOUNTAINS.forEach((mountain, index) => {
      const groundY = terrainHeight(mountain.x, mountain.z);
      dummy.position.set(mountain.x, groundY, mountain.z);
      dummy.rotation.set(0, mountain.rot, 0);
      dummy.scale.setScalar(mountain.s);
      dummy.updateMatrix();
      peakMesh.setMatrixAt(index, dummy.matrix);

      dummy.position.set(mountain.x, groundY + 1.02 * mountain.s, mountain.z);
      dummy.updateMatrix();
      snowMesh.setMatrixAt(index, dummy.matrix);

      dummy.position.set(mountain.x + 0.35 * mountain.s, groundY, mountain.z + 0.22 * mountain.s);
      dummy.scale.setScalar(mountain.s);
      dummy.updateMatrix();
      subAMesh.setMatrixAt(index, dummy.matrix);

      dummy.position.set(mountain.x - 0.3 * mountain.s, groundY, mountain.z - 0.18 * mountain.s);
      dummy.updateMatrix();
      subBMesh.setMatrixAt(index, dummy.matrix);
    });
    peakMesh.castShadow = !isSoftwareGl;
    peakMesh.receiveShadow = !isSoftwareGl;
    [peakMesh, snowMesh, subAMesh, subBMesh].forEach((mesh) => {
      mesh.frustumCulled = false;
      scene.add(mesh);
    });

    const houseCapacity = 48;
    const houseBaseMesh = new THREE.InstancedMesh(
      sharedScenery.houseBaseGeo,
      sharedScenery.woodMat,
      houseCapacity,
    );
    const houseRoofMesh = new THREE.InstancedMesh(
      sharedScenery.houseRoofGeo,
      sharedScenery.thatchMat,
      houseCapacity,
    );
    houseBaseMesh.frustumCulled = false;
    houseRoofMesh.frustumCulled = false;
    houseBaseMesh.count = 0;
    houseRoofMesh.count = 0;
    scene.add(houseBaseMesh);
    scene.add(houseRoofMesh);

    const territoryGroup = new THREE.Group();
    scene.add(territoryGroup);
    const armiesGroup = new THREE.Group();
    scene.add(armiesGroup);
    const battlesGroup = new THREE.Group();
    scene.add(battlesGroup);

    type TerritoryVisual = {
      id: string;
      disc: THREE.Mesh;
      ring: THREE.Mesh;
      label: THREE.Sprite;
      baseColor: THREE.Color;
    };
    let visuals: TerritoryVisual[] = [];
    let hitboxes: THREE.Mesh[] = [];
    let banners: THREE.Object3D[] = [];
    let visualSignature = '';

    const getLordColor = (ownerId: string) => {
      if (ownerId === 'player') return stateRef.current.playerHouse.color;
      const rival = stateRef.current.rivalLords.find((item) => item.id === ownerId);
      return rival ? rival.color : '#64748b';
    };

    const getLordSigil = (ownerId: string) => {
      if (ownerId === 'player') return stateRef.current.playerHouse.sigil || 'Shield';
      if (ownerId === 'lord_edmund') return 'Boar';
      if (ownerId === 'lady_eleanor') return 'Swan';
      if (ownerId === 'lord_blackwood') return 'Raven';
      if (ownerId === 'king_aldric') return 'Crown';
      return 'Shield';
    };

    const layoutHouses = (list: Territory[]) => {
      let index = 0;
      list.forEach((territory) => {
        HOUSE_OFFSETS.forEach((offset) => {
          if (index >= houseCapacity) return;
          const x = territory.position.x + offset.x;
          const z = territory.position.z + offset.z;
          dummy.position.set(x, terrainHeight(x, z), z);
          dummy.rotation.set(0, offset.rot, 0);
          dummy.scale.setScalar(0.95);
          dummy.updateMatrix();
          houseBaseMesh.setMatrixAt(index, dummy.matrix);
          houseRoofMesh.setMatrixAt(index, dummy.matrix);
          index += 1;
        });
      });
      houseBaseMesh.count = index;
      houseRoofMesh.count = index;
      houseBaseMesh.instanceMatrix.needsUpdate = true;
      houseRoofMesh.instanceMatrix.needsUpdate = true;
    };

    const syncTerritories = () => {
      const snapshot = stateRef.current;
      const nextSignature = territorySignature(snapshot.territories, snapshot.playerHouse, snapshot.rivalLords);
      if (nextSignature === visualSignature) return;
      visualSignature = nextSignature;

      for (const child of [...territoryGroup.children]) {
        territoryGroup.remove(child);
        disposeOwnedResources(child);
      }
      visuals = [];
      hitboxes = [];
      banners = [];

      snapshot.territories.forEach((territory) => {
        const faction = new THREE.Color(getLordColor(territory.ownerId));
        const ringColor = faction.clone().lerp(new THREE.Color('#d4af37'), 0.42);
        const disc = createTerritoryDisc(territory.position.x, territory.position.z, faction);
        const ring = createTerritoryRing(territory.position.x, territory.position.z, ringColor);
        const castle = createMedievalCastleGroup(
          getLordColor(territory.ownerId),
          getLordSigil(territory.ownerId),
          territory.buildings,
        );
        const groundY = terrainHeight(territory.position.x, territory.position.z);
        castle.position.set(territory.position.x, groundY, territory.position.z);
        castle.rotation.y = ((hashString(territory.id) % 500) / 1000) - 0.25;
        if (!isSoftwareGl) {
          castle.traverse((obj) => {
            const mesh = obj as THREE.Mesh;
            if (mesh.castShadow) {
              mesh.castShadow = true;
              mesh.receiveShadow = true;
            }
          });
        } else {
          castle.traverse((obj) => {
            const mesh = obj as THREE.Mesh;
            mesh.castShadow = false;
            mesh.receiveShadow = false;
          });
        }
        castle.traverse((obj) => {
          if (obj.name === 'banner') banners.push(obj);
        });

        const label = createProvinceLabel(territory.name);
        label.position.set(territory.position.x, groundY + 2.55, territory.position.z);

        const hit = new THREE.Mesh(new THREE.CylinderGeometry(1.62, 1.62, 2.8, 12), hitMaterial);
        hit.geometry.userData.dispose = true;
        hit.position.set(territory.position.x, groundY + 1.3, territory.position.z);
        hit.userData.territoryId = territory.id;

        territoryGroup.add(disc, ring, castle, label, hit);
        visuals.push({ id: territory.id, disc, ring, label, baseColor: ringColor });
        hitboxes.push(hit);
      });

      layoutHouses(snapshot.territories);
    };

    const updateHighlights = (hoverId: string | null) => {
      const selectedId = stateRef.current.selectedTerritoryId;
      visuals.forEach((visual) => {
        const selected = visual.id === selectedId;
        const hovered = visual.id === hoverId;
        const ringMat = visual.ring.material as THREE.MeshBasicMaterial;
        const discMat = visual.disc.material as THREE.MeshBasicMaterial;
        ringMat.color.copy(visual.baseColor);
        if (selected) ringMat.color.lerp(GOLD_LIGHT, 0.7);
        else if (hovered) ringMat.color.lerp(GOLD_LIGHT, 0.5);
        ringMat.opacity = selected ? 1 : hovered ? 0.98 : 0.78;
        discMat.opacity = selected ? 0.42 : hovered ? 0.34 : 0.18;
        const labelMat = visual.label.material as THREE.SpriteMaterial;
        labelMat.opacity = selected || hovered ? 1 : 0.72;
        const baseX = visual.label.userData.baseScaleX as number;
        const baseY = visual.label.userData.baseScaleY as number;
        const boost = selected || hovered ? 1.16 : 1;
        visual.label.scale.set(baseX * boost, baseY * boost, 1);
      });
    };

    syncTerritories();
    apiRef.current = { sync: syncTerritories };

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const planeHit = new THREE.Vector3();
    const panRight = new THREE.Vector3();
    const panForward = new THREE.Vector3();
    let dragging = false;
    let dragButton = -1;
    let dragAlt = false;
    let dragDistance = 0;
    let lastX = 0;
    let lastY = 0;
    let hoverId: string | null = null;

    const hoverAt = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(hitboxes, false);
      const next = hits.length > 0 ? (hits[0].object.userData.territoryId as string) : null;
      if (next !== hoverId) {
        hoverId = next;
        const cursor = next ? 'pointer' : 'grab';
        renderer.domElement.style.cursor = cursor;
        container.style.cursor = cursor;
      }
      return next;
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0 && event.button !== 2) return;
      dragging = true;
      dragButton = event.button;
      dragAlt = event.altKey || event.button === 2;
      dragDistance = 0;
      lastX = event.clientX;
      lastY = event.clientY;
      renderer.domElement.setPointerCapture(event.pointerId);
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!dragging) {
        hoverAt(event);
        return;
      }
      const dx = event.clientX - lastX;
      const dy = event.clientY - lastY;
      lastX = event.clientX;
      lastY = event.clientY;
      dragDistance += Math.abs(dx) + Math.abs(dy);
      const view = viewRef.current;
      if (dragAlt || dragButton === 2) {
        view.theta -= dx * 0.005;
        view.phi = THREE.MathUtils.clamp(view.phi + dy * 0.004, 0.32, 1.15);
        return;
      }
      const sin = Math.sin(view.theta);
      const cos = Math.cos(view.theta);
      const lookX = -sin;
      const lookZ = -cos;
      panRight.set(-lookZ, 0, lookX).normalize();
      panForward.set(lookX, 0, lookZ).normalize();
      const scale = view.radius * 0.00105;
      view.target.addScaledVector(panRight, -dx * scale);
      view.target.addScaledVector(panForward, -dy * scale);
      const limitX = MAP_WIDTH / 2 - 1.5;
      const limitZ = MAP_HEIGHT / 2 - 1.5;
      view.target.x = THREE.MathUtils.clamp(view.target.x, -limitX, limitX);
      view.target.z = THREE.MathUtils.clamp(view.target.z, -limitZ, limitZ);
      view.target.y = 0;
    };

    const onPointerUp = (event: PointerEvent) => {
      if (!dragging || event.button !== dragButton) return;
      const wasClick = dragButton === 0 && dragDistance < 6;
      dragging = false;
      dragButton = -1;
      if (renderer.domElement.hasPointerCapture(event.pointerId)) {
        renderer.domElement.releasePointerCapture(event.pointerId);
      }
      if (!wasClick) return;
      const territoryId = hoverAt(event);
      if (!territoryId) return;
      const snapshot = stateRef.current;
      if (snapshot.isDispatchingArmy && snapshot.selectedTerritoryId && snapshot.onDispatchArmy) {
        snapshot.onDispatchArmy(snapshot.selectedTerritoryId, territoryId);
      } else {
        snapshot.onSelectTerritory(territoryId);
      }
    };

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      let delta = event.deltaY;
      if (event.deltaMode === 1) delta *= 16;
      else if (event.deltaMode === 2) delta *= 400;
      const view = viewRef.current;
      const factor = Math.exp(delta * 0.00115);
      const nextRadius = THREE.MathUtils.clamp(view.radius * factor, 8, 46);
      if (factor < 1) {
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);
        if (raycaster.ray.intersectPlane(groundPlane, planeHit)) {
          view.target.lerp(planeHit, (1 - factor) * 0.55);
          const limitX = MAP_WIDTH / 2 - 1.5;
          const limitZ = MAP_HEIGHT / 2 - 1.5;
          view.target.x = THREE.MathUtils.clamp(view.target.x, -limitX, limitX);
          view.target.z = THREE.MathUtils.clamp(view.target.z, -limitZ, limitZ);
          view.target.y = 0;
        }
      }
      view.radius = nextRadius;
    };

    const onContextMenu = (event: Event) => event.preventDefault();
    const onPointerLeave = () => {
      hoverId = null;
      renderer.domElement.style.cursor = 'grab';
    };

    const dom = renderer.domElement;
    dom.addEventListener('pointerdown', onPointerDown);
    dom.addEventListener('pointermove', onPointerMove);
    dom.addEventListener('pointerup', onPointerUp);
    const onPointerCancel = () => {
      dragging = false;
      dragButton = -1;
    };
    dom.addEventListener('pointercancel', onPointerCancel);
    dom.addEventListener('wheel', onWheel, { passive: false });
    dom.addEventListener('contextmenu', onContextMenu);
    dom.addEventListener('pointerleave', onPointerLeave);

    const armyMeshes = new Map<string, THREE.Group>();
    const battlePool: THREE.Group[] = [];
    let animationFrameId = 0;
    const clock = new THREE.Clock();

    const placeArmy = (army: Army, group: THREE.Group, elapsed: number) => {
      const list = stateRef.current.territories;
      const origin = list.find((item) => item.id === army.originTerritoryId);
      const target = army.targetTerritoryId ? list.find((item) => item.id === army.targetTerritoryId) : undefined;
      let x = army.position.x;
      let z = army.position.z;
      let yaw = group.rotation.y;
      if (origin && target && army.isMarching) {
        const u = THREE.MathUtils.clamp(army.marchProgress, 0, 1);
        const x0 = origin.position.x;
        const z0 = origin.position.z;
        const x1 = target.position.x;
        const z1 = target.position.z;
        const dx = x1 - x0;
        const dz = z1 - z0;
        const len = Math.hypot(dx, dz) || 1;
        const bow = Math.min(0.65, len * 0.12);
        const mx = (x0 + x1) / 2 + (-dz / len) * bow;
        const mz = (z0 + z1) / 2 + (dx / len) * bow;
        const a = (1 - u) * (1 - u);
        const b = 2 * (1 - u) * u;
        const c = u * u;
        x = a * x0 + b * mx + c * x1;
        z = a * z0 + b * mz + c * z1;
        const tx = 2 * (1 - u) * (mx - x0) + 2 * u * (x1 - mx);
        const tz = 2 * (1 - u) * (mz - z0) + 2 * u * (z1 - mz);
        yaw = Math.atan2(tx, tz);
      }
      const bob = army.isMarching ? Math.abs(Math.sin(elapsed * 7 + x * 2)) * 0.04 : 0;
      group.position.set(x, terrainHeight(x, z) + bob, z);
      group.rotation.y = yaw;
    };

    function tick() {
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();
      updateHighlights(hoverId);

      poseFromView(viewRef.current, desiredPos);
      const damp = 1 - Math.exp(-delta * (dragging ? 16 : 6));
      camera.position.lerp(desiredPos, damp);
      lookAt.lerp(viewRef.current.target, damp);
      camera.lookAt(lookAt);

      banners.forEach((banner, index) => {
        const base = (banner.userData.baseRot as number) ?? banner.rotation.y;
        banner.rotation.y = base + Math.sin(elapsed * 1.5 + index) * 0.16;
      });

      const currentArmies = stateRef.current.armies;
      const activeIds = new Set<string>();
      currentArmies.forEach((army) => {
        activeIds.add(army.id);
        let mesh = armyMeshes.get(army.id);
        if (!mesh) {
          mesh = createArmyFormation(getLordColor(army.ownerId), army.size);
          armiesGroup.add(mesh);
          armyMeshes.set(army.id, mesh);
        }
        placeArmy(army, mesh, elapsed);
      });
      armyMeshes.forEach((mesh, id) => {
        if (activeIds.has(id)) return;
        armiesGroup.remove(mesh);
        disposeOwnedResources(mesh);
        armyMeshes.delete(id);
      });

      const battles = stateRef.current.activeBattles;
      while (battlePool.length < Math.min(battles.length, 4)) {
        const marker = createBattleClashMarker();
        battlesGroup.add(marker);
        battlePool.push(marker);
      }
      battlePool.forEach((marker, index) => {
        const battle = battles[index];
        if (!battle) {
          marker.visible = false;
          return;
        }
        const territory = stateRef.current.territories.find((item) => item.id === battle.territoryId);
        if (!territory) {
          marker.visible = false;
          return;
        }
        marker.visible = true;
        marker.position.set(
          territory.position.x,
          terrainHeight(territory.position.x, territory.position.z) + 1.15,
          territory.position.z,
        );
        marker.rotation.y = elapsed * 1.6;
        const fire = marker.getObjectByName('fire');
        if (fire) fire.scale.setScalar(1 + Math.sin(elapsed * 5 + index) * 0.12);
      });

      renderer.render(scene, camera);

      if (isSoftwareGl) {
        const gl = renderer.getContext() as WebGL2RenderingContext;
        const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
        gl.flush();
        const poll = () => {
          const status = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
          if (status === gl.UNSIGNALED) {
            animationFrameId = window.setTimeout(poll, 5);
          } else {
            if (sync) gl.deleteSync(sync);
            animationFrameId = window.setTimeout(tick, 70);
          }
        };
        animationFrameId = window.setTimeout(poll, 5);
      } else {
        animationFrameId = requestAnimationFrame(tick);
      }
    }

    tick();

    const handleResize = () => {
      const nextWidth = container.clientWidth;
      const nextHeight = container.clientHeight;
      if (nextWidth < 2 || nextHeight < 2) return;
      camera.aspect = nextWidth / nextHeight;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
      renderer.setSize(nextWidth, nextHeight);
    };
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);
    handleResize();

    return () => {
      apiRef.current = null;
      resizeObserver.disconnect();
      cancelAnimationFrame(animationFrameId);
      clearTimeout(animationFrameId);
      dom.removeEventListener('pointerdown', onPointerDown);
      dom.removeEventListener('pointermove', onPointerMove);
      dom.removeEventListener('pointerup', onPointerUp);
      dom.removeEventListener('pointercancel', onPointerCancel);
      dom.removeEventListener('wheel', onWheel);
      dom.removeEventListener('contextmenu', onContextMenu);
      dom.removeEventListener('pointerleave', onPointerLeave);
      if (container.contains(dom)) container.removeChild(dom);
      disposeOwnedResources(scene);
      envTexture.dispose();
      renderer.dispose();
    };
  }, []);

  useEffect(() => {
    apiRef.current?.sync();
  }, [territories, playerHouse, rivalLords]);

  return (
    <div className="relative w-full h-full overflow-hidden select-none bg-[#090d16]">
      <div ref={mountRef} className="w-full h-full" />

      <div className="absolute top-20 right-6 flex flex-col gap-2 z-10">
        <button
          onClick={resetCamera}
          className="px-3 py-1.5 bg-[#131c2e]/90 hover:bg-[#1a263d] text-[#e2d5b8] border border-[#d4af37]/40 rounded-lg text-xs font-semibold tracking-wide shadow-lg transition-all flex items-center gap-1.5"
          title={t.realmCenter}
        >
          <span>🧭 {t.realmCenter}</span>
        </button>

        {isDispatchingArmy && (
          <div className="px-3 py-2 bg-red-950/90 border border-red-500/70 text-red-200 rounded-lg text-xs font-medium shadow-xl flex items-center gap-2 animate-bounce">
            <span>⚔️ {t.clickTargetToMarch}</span>
          </div>
        )}
      </div>

      <div className="pointer-events-none absolute bottom-4 left-6 z-10 text-[11px] text-[#e2d5b8]/70 bg-[#090d16]/80 px-3 py-1.5 rounded border border-[#d4af37]/30">
        {t.mapInstructions}
      </div>
    </div>
  );
};
