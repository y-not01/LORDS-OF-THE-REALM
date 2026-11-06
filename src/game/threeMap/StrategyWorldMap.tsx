import React, { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { Territory, Army, BattleState, RivalLord, PlayerHouse } from '../../types/game';
import {
  createParchmentTexture,
  createMedievalCastleGroup,
  createSettlementGroup,
  createMountainPeak,
  createPineTree,
  createArmyFigure,
  createBattleClashMarker,
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

  // Store mutable refs to synchronize with animation frame
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

  // Camera animation state
  const cameraTargetRef = useRef(new THREE.Vector3(0, 0, 0));
  const cameraPosRef = useRef(new THREE.Vector3(0, 16, 12));
  const isUserDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const mousePosRef = useRef(new THREE.Vector2());

  // Focus camera on selected territory
  useEffect(() => {
    if (!selectedTerritoryId) return;
    const t = territories.find((item) => item.id === selectedTerritoryId);
    if (t) {
      cameraTargetRef.current.set(t.position.x, 0, t.position.z);
      cameraPosRef.current.set(t.position.x, 11, t.position.z + 8.5);
    }
  }, [selectedTerritoryId, territories]);

  const resetCamera = useCallback(() => {
    cameraTargetRef.current.set(0, 0, 0);
    cameraPosRef.current.set(0, 17, 13);
  }, []);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Detect software GL
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

    const width = container.clientWidth;
    const height = container.clientHeight;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.copy(cameraPosRef.current);
    camera.lookAt(cameraTargetRef.current);

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

    container.appendChild(renderer.domElement);

    // Environment map for authentic metallic & stone reflections
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // Studio Lighting Rig
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
      const d = 16;
      dirLight.shadow.camera.left = -d;
      dirLight.shadow.camera.right = d;
      dirLight.shadow.camera.top = d;
      dirLight.shadow.camera.bottom = -d;
      dirLight.shadow.bias = -0.0005;
      dirLight.shadow.normalBias = 0.02;
    }
    scene.add(dirLight);

    // Warm rim light
    const rimLight = new THREE.DirectionalLight(0xcaa462, 0.5);
    rimLight.position.set(-15, 10, -12);
    scene.add(rimLight);

    // 1. Parchment Map Base Mesh
    const mapWidth = 26;
    const mapHeight = 24;
    const parchmentTexture = createParchmentTexture();

    const groundGeo = new THREE.PlaneGeometry(mapWidth, mapHeight, 64, 64);
    groundGeo.rotateX(-Math.PI / 2);

    // Procedural terrain elevation relief
    const posAttr = groundGeo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const vx = posAttr.getX(i);
      const vz = posAttr.getZ(i);
      // Subtle hills and coastline contours
      const elev =
        Math.sin(vx * 0.35) * Math.cos(vz * 0.3) * 0.35 +
        Math.sin(vx * 0.8 + vz * 0.4) * 0.18 +
        (Math.abs(vx) > 9 || Math.abs(vz) > 8 ? -0.4 : 0);
      posAttr.setY(i, Math.max(-0.25, elev));
    }
    groundGeo.computeVertexNormals();

    const groundMat = new THREE.MeshStandardMaterial({
      map: parchmentTexture,
      roughness: 0.88,
      metalness: 0.08,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.receiveShadow = !isSoftwareGl;
    scene.add(ground);

    // Map Border Frame (Ornate carved wood and gold trim)
    const frameGeo = new THREE.BoxGeometry(mapWidth + 0.8, 0.4, mapHeight + 0.8);
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x22170d,
      roughness: 0.7,
      metalness: 0.3,
    });
    const frame = new THREE.Mesh(frameGeo, frameMat);
    frame.position.y = -0.22;
    scene.add(frame);

    // Gold inner rim
    const goldRimGeo = new THREE.BoxGeometry(mapWidth + 0.1, 0.15, mapHeight + 0.1);
    const goldRimMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      metalness: 0.85,
      roughness: 0.25,
    });
    const goldRim = new THREE.Mesh(goldRimGeo, goldRimMat);
    goldRim.position.y = 0.02;
    scene.add(goldRim);

    // Territory Containers & Raycasting Objects
    const territoryMeshesGroup = new THREE.Group();
    scene.add(territoryMeshesGroup);

    // Dynamic objects groups
    const castlesGroup = new THREE.Group();
    scene.add(castlesGroup);

    const sceneryGroup = new THREE.Group();
    scene.add(sceneryGroup);

    const roadLinesGroup = new THREE.Group();
    scene.add(roadLinesGroup);

    const armiesGroup = new THREE.Group();
    scene.add(armiesGroup);

    const battlesGroup = new THREE.Group();
    scene.add(battlesGroup);

    // Helper to get owner color
    const getLordColor = (ownerId: string) => {
      if (ownerId === 'player') return stateRef.current.playerHouse.color;
      const rival = stateRef.current.rivalLords.find((r) => r.id === ownerId);
      return rival ? rival.color : '#64748b'; // Slate gray for neutral
    };

    const getLordSigil = (ownerId: string) => {
      if (ownerId === 'player') return '⚔️';
      const rival = stateRef.current.rivalLords.find((r) => r.id === ownerId);
      return rival ? rival.portraitIcon : '🛡️';
    };

    // Draw connecting trade roads
    const drawnRoads = new Set<string>();
    stateRef.current.territories.forEach((t) => {
      t.connectedTo.forEach((neighborId) => {
        const key = [t.id, neighborId].sort().join('--');
        if (drawnRoads.has(key)) return;
        drawnRoads.add(key);

        const target = stateRef.current.territories.find((item) => item.id === neighborId);
        if (!target) return;

        const points = [
          new THREE.Vector3(t.position.x, 0.05, t.position.z),
          new THREE.Vector3(
            (t.position.x + target.position.x) / 2,
            0.08,
            (t.position.z + target.position.z) / 2
          ),
          new THREE.Vector3(target.position.x, 0.05, target.position.z),
        ];

        const curve = new THREE.CatmullRomCurve3(points);
        const roadGeo = new THREE.TubeGeometry(curve, 16, 0.04, 5, false);
        const roadMat = new THREE.MeshStandardMaterial({
          color: 0x8b6f47,
          roughness: 0.95,
        });
        const roadMesh = new THREE.Mesh(roadGeo, roadMat);
        roadLinesGroup.add(roadMesh);
      });
    });

    // Populate Territories & Castles
    const territoryHitBoxes: THREE.Mesh[] = [];

    const buildTerritoryObjects = () => {
      // Clear previous castles and hitboxes
      while (castlesGroup.children.length > 0) {
        castlesGroup.remove(castlesGroup.children[0]);
      }
      while (territoryMeshesGroup.children.length > 0) {
        territoryMeshesGroup.remove(territoryMeshesGroup.children[0]);
      }
      territoryHitBoxes.length = 0;

      stateRef.current.territories.forEach((t) => {
        const color = getLordColor(t.ownerId);
        const sigil = getLordSigil(t.ownerId);
        const isSelected = t.id === stateRef.current.selectedTerritoryId;

        // 1. Territory Boundary Disc (Illuminated Parchment Ring)
        const discRadius = 1.9;
        const discGeo = new THREE.CylinderGeometry(discRadius, discRadius, 0.02, 32);
        const discMat = new THREE.MeshStandardMaterial({
          color: new THREE.Color(color),
          roughness: 0.6,
          metalness: 0.15,
          transparent: true,
          opacity: isSelected ? 0.45 : 0.22,
        });
        const disc = new THREE.Mesh(discGeo, discMat);
        disc.position.set(t.position.x, 0.03, t.position.z);
        disc.receiveShadow = !isSoftwareGl;
        territoryMeshesGroup.add(disc);

        // Gold illuminated border ring
        const ringGeo = new THREE.RingGeometry(discRadius - 0.06, discRadius, 32);
        ringGeo.rotateX(-Math.PI / 2);
        const ringMat = new THREE.MeshBasicMaterial({
          color: isSelected ? 0xffffff : new THREE.Color(color).lerp(new THREE.Color(0xd4af37), 0.5),
          side: THREE.DoubleSide,
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.position.set(t.position.x, 0.04, t.position.z);
        territoryMeshesGroup.add(ring);

        // 2. Castle Group
        const castleScale = t.buildings.includes('castleKeep') ? 1.05 : 0.85;
        const castle = createMedievalCastleGroup(color, sigil, castleScale);
        castle.position.set(t.position.x, 0.05, t.position.z);
        castlesGroup.add(castle);

        // 3. Surrounding Village Houses
        const village = createSettlementGroup();
        village.position.set(t.position.x + 0.95, 0.05, t.position.z + 0.65);
        village.scale.set(0.9, 0.9, 0.9);
        castlesGroup.add(village);

        // 4. Raycast hit target (Invisible cylinder for easy clicking)
        const hitGeo = new THREE.CylinderGeometry(2.1, 2.1, 2.5, 16);
        const hitMat = new THREE.MeshBasicMaterial({
          transparent: true,
          opacity: 0.0,
          depthWrite: false,
        });
        const hitBox = new THREE.Mesh(hitGeo, hitMat);
        hitBox.position.set(t.position.x, 1.25, t.position.z);
        hitBox.userData = { territoryId: t.id };
        territoryMeshesGroup.add(hitBox);
        territoryHitBoxes.push(hitBox);
      });
    };

    buildTerritoryObjects();

    // Natural scenery: Mountain ranges & Pine forests
    const mountainCoords = [
      { x: 7.2, z: 1.5, s: 1.3 },
      { x: 6.8, z: 3.2, s: 1.1 },
      { x: 8.0, z: -1.2, s: 1.4 },
      { x: -7.5, z: 2.8, s: 1.2 },
      { x: -8.2, z: 0.5, s: 1.5 },
      { x: 3.5, z: -6.0, s: 1.2 },
      { x: 4.8, z: -7.5, s: 1.4 },
    ];
    mountainCoords.forEach((m) => {
      const peak = createMountainPeak(m.s);
      peak.position.set(m.x, 0.05, m.z);
      sceneryGroup.add(peak);
    });

    // Forest clusters
    const forestCoords = [
      { x: 1.8, z: -3.5 },
      { x: 2.2, z: -2.8 },
      { x: 1.2, z: -2.2 },
      { x: 3.2, z: 4.8 },
      { x: 2.5, z: 5.4 },
      { x: -3.8, z: 4.5 },
      { x: -4.5, z: 4.8 },
    ];
    forestCoords.forEach((f) => {
      const tree = createPineTree(0.85 + Math.random() * 0.3);
      tree.position.set(f.x + (Math.random() - 0.5) * 0.6, 0.05, f.z + (Math.random() - 0.5) * 0.6);
      tree.rotation.y = Math.random() * Math.PI * 2;
      sceneryGroup.add(tree);
    });

    // Raycaster for user interaction
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerDown = (event: MouseEvent) => {
      if (event.button === 0) {
        isUserDraggingRef.current = true;
        dragStartRef.current = { x: event.clientX, y: event.clientY };
      }
    };

    const handlePointerMove = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      mousePosRef.current.copy(mouse);

      // Pan with drag
      if (isUserDraggingRef.current && event.buttons === 1) {
        const dx = event.clientX - dragStartRef.current.x;
        const dy = event.clientY - dragStartRef.current.y;
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
          const panSpeed = 0.022;
          cameraTargetRef.current.x -= dx * panSpeed;
          cameraTargetRef.current.z -= dy * panSpeed;
          cameraPosRef.current.x -= dx * panSpeed;
          cameraPosRef.current.z -= dy * panSpeed;
          dragStartRef.current = { x: event.clientX, y: event.clientY };
        }
      }
    };

    const handlePointerUp = (event: MouseEvent) => {
      if (event.button === 0) {
        const dx = Math.abs(event.clientX - dragStartRef.current.x);
        const dy = Math.abs(event.clientY - dragStartRef.current.y);
        isUserDraggingRef.current = false;

        // Clean click without drag
        if (dx < 5 && dy < 5) {
          const rect = renderer.domElement.getBoundingClientRect();
          mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
          mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

          raycaster.setFromCamera(mouse, camera);
          const intersects = raycaster.intersectObjects(territoryHitBoxes);

          if (intersects.length > 0) {
            const hit = intersects[0];
            const tId = hit.object.userData?.territoryId;
            if (tId) {
              // If dispatching an army
              if (
                stateRef.current.isDispatchingArmy &&
                stateRef.current.selectedTerritoryId &&
                stateRef.current.onDispatchArmy
              ) {
                stateRef.current.onDispatchArmy(stateRef.current.selectedTerritoryId, tId);
              } else {
                stateRef.current.onSelectTerritory(tId);
              }
            }
          }
        }
      }
    };

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      const zoomFactor = event.deltaY * 0.015;
      const targetPos = cameraPosRef.current;
      const targetCenter = cameraTargetRef.current;

      const direction = targetPos.clone().sub(targetCenter).normalize();
      const currentDist = targetPos.distanceTo(targetCenter);
      const newDist = THREE.MathUtils.clamp(currentDist + zoomFactor, 7, 30);

      targetPos.copy(targetCenter).add(direction.multiplyScalar(newDist));
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', handlePointerDown);
    dom.addEventListener('mousemove', handlePointerMove);
    dom.addEventListener('mouseup', handlePointerUp);
    dom.addEventListener('wheel', handleWheel, { passive: false });

    // Armies rendering dictionary
    const armyMeshes = new Map<string, THREE.Group>();

    // Animation & Render Loop
    let animationFrameId = 0;
    const clock = new THREE.Clock();

    function tick() {
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Smooth Camera Damping
      camera.position.lerp(cameraPosRef.current, THREE.MathUtils.clamp(delta * 5, 0, 1));
      const currentLook = new THREE.Vector3();
      camera.getWorldDirection(currentLook);
      const targetDir = cameraTargetRef.current.clone().sub(camera.position).normalize();
      camera.lookAt(
        cameraTargetRef.current.x,
        cameraTargetRef.current.y,
        cameraTargetRef.current.z
      );

      // Animate Armies
      const currentArmies = stateRef.current.armies;
      const activeIds = new Set<string>();

      currentArmies.forEach((army) => {
        activeIds.add(army.id);
        let mesh = armyMeshes.get(army.id);
        if (!mesh) {
          const color = getLordColor(army.ownerId);
          mesh = createArmyFigure(color, army.size);
          armiesGroup.add(mesh);
          armyMeshes.set(army.id, mesh);
        }

        // Update position
        mesh.position.set(army.position.x, 0.08, army.position.z);

        // Marching bobbing animation
        if (army.isMarching) {
          mesh.position.y = 0.08 + Math.abs(Math.sin(elapsed * 6)) * 0.06;
          mesh.rotation.y = Math.sin(elapsed * 4) * 0.15;
        } else {
          mesh.position.y = 0.08;
          mesh.rotation.y = 0;
        }
      });

      // Remove vanished armies
      armyMeshes.forEach((mesh, id) => {
        if (!activeIds.has(id)) {
          armiesGroup.remove(mesh);
          armyMeshes.delete(id);
        }
      });

      // Animate Active Battles (Spinning crossed swords)
      while (battlesGroup.children.length > 0) {
        battlesGroup.remove(battlesGroup.children[0]);
      }
      stateRef.current.activeBattles.forEach((battle) => {
        const t = stateRef.current.territories.find((item) => item.id === battle.territoryId);
        if (t) {
          const battleMarker = createBattleClashMarker();
          battleMarker.position.set(t.position.x, 0.8, t.position.z);
          battleMarker.rotation.y = elapsed * 1.8;
          battlesGroup.add(battleMarker);
        }
      });

      renderer.render(scene, camera);

      if (isSoftwareGl) {
        const gl = renderer.getContext() as WebGL2RenderingContext;
        const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
        gl.flush();
        const poll = () => {
          const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
          if (state === gl.UNSIGNALED) {
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

    // Window Resize Handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      clearTimeout(animationFrameId);

      dom.removeEventListener('mousedown', handlePointerDown);
      dom.removeEventListener('mousemove', handlePointerMove);
      dom.removeEventListener('mouseup', handlePointerUp);
      dom.removeEventListener('wheel', handleWheel);

      if (container.contains(dom)) {
        container.removeChild(dom);
      }

      renderer.dispose();
      groundGeo.dispose();
      groundMat.dispose();
      parchmentTexture.dispose();
    };
  }, []);

  return (
    <div className="relative w-full h-full overflow-hidden select-none bg-[#090d16]">
      {/* 3D WebGL Canvas Container */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Floating 3D Map Helper Controls */}
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

      {/* Territory Mini Map Markers in Viewport */}
      <div className="pointer-events-none absolute bottom-4 left-6 z-10 text-[11px] text-[#e2d5b8]/70 bg-[#090d16]/80 px-3 py-1.5 rounded border border-[#d4af37]/30">
        {t.mapInstructions}
      </div>
    </div>
  );
};
