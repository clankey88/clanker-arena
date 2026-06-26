import * as THREE from "three";

export class FrontsVisual {
  tiles: THREE.Mesh[] = [];
  labels: THREE.Sprite[] = [];
  private scene: THREE.Scene;
  private cols: number;
  private rows: number;
  private arenaHalf: number;
  private gridGroup: THREE.Group;
  private tileSize: number;
  private borderLines: THREE.Line[] = [];

  constructor(scene: THREE.Scene, cols = 5, rows = 5, arenaHalf = 9) {
    this.scene = scene;
    this.cols = cols;
    this.rows = rows;
    this.arenaHalf = arenaHalf;
    this.tileSize = (arenaHalf * 2) / Math.max(cols, rows);

    this.gridGroup = new THREE.Group();
    scene.add(this.gridGroup);

    const tileMat = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = -arenaHalf + this.tileSize * c + this.tileSize / 2;
        const z = -arenaHalf + this.tileSize * r + this.tileSize / 2;
        const geom = new THREE.PlaneGeometry(this.tileSize - 0.08, this.tileSize - 0.08);
        const mat = tileMat.clone();
        mat.color.setHex(0x888888);
        const mesh = new THREE.Mesh(geom, mat);
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.set(x, 0.01, z);
        mesh.userData = { col: c, row: r, ownerIdx: null };
        this.gridGroup.add(mesh);
        this.tiles.push(mesh);
      }
    }

    const lineMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.15 });

    for (let i = 0; i <= cols; i++) {
      const x = -arenaHalf + this.tileSize * i;
      const pts = [new THREE.Vector3(x, 0.015, -arenaHalf), new THREE.Vector3(x, 0.015, arenaHalf)];
      const geom = new THREE.BufferGeometry().setFromPoints(pts);
      const line = new THREE.Line(geom, lineMat);
      this.gridGroup.add(line);
      this.borderLines.push(line);
    }

    for (let i = 0; i <= rows; i++) {
      const z = -arenaHalf + this.tileSize * i;
      const pts = [new THREE.Vector3(-arenaHalf, 0.015, z), new THREE.Vector3(arenaHalf, 0.015, z)];
      const geom = new THREE.BufferGeometry().setFromPoints(pts);
      const line = new THREE.Line(geom, lineMat);
      this.gridGroup.add(line);
      this.borderLines.push(line);
    }
  }

  updateTileOwnership(tileStates: { x: number; y: number; ownerIdx: number | null }[]) {
    for (const state of tileStates) {
      const idx = state.y * this.cols + state.x;
      if (idx < 0 || idx >= this.tiles.length) continue;
      const mesh = this.tiles[idx];
      if (state.ownerIdx === null) {
        (mesh.material as THREE.MeshBasicMaterial).color.setHex(0x888888);
      } else {
        const teamColors = [0xff6b35, 0x4ecdc4, 0xff3d7f, 0x9b5de5, 0x00bfff, 0xffd700];
        const col = teamColors[state.ownerIdx % teamColors.length];
        (mesh.material as THREE.MeshBasicMaterial).color.setHex(col);
      }
      mesh.userData.ownerIdx = state.ownerIdx;
    }
  }

  dispose() {
    this.scene.remove(this.gridGroup);
    for (const mesh of this.tiles) {
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
    }
    for (const line of this.borderLines) {
      line.geometry.dispose();
      (line.material as THREE.Material).dispose();
    }
    this.tiles = [];
    this.borderLines = [];
    this.labels = [];
  }
}

export class KothVisual {
  hillRing: THREE.Mesh;
  captureBar: THREE.Mesh;
  innerGlow: THREE.Mesh;
  private scene: THREE.Scene;
  private group: THREE.Group;
  private baseColor: THREE.Color;
  private captureBarMaxScale: number;
  private pulsePhase = 0;

  constructor(scene: THREE.Scene, hillX: number, hillZ: number, hillRadius: number) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.group.position.set(hillX, 0, hillZ);
    scene.add(this.group);

    this.baseColor = new THREE.Color(0xffd700);

    const ringGeom = new THREE.RingGeometry(hillRadius - 0.3, hillRadius, 48);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xffd700,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide,
    });
    this.hillRing = new THREE.Mesh(ringGeom, ringMat);
    this.hillRing.rotation.x = -Math.PI / 2;
    this.hillRing.position.y = 0.015;
    this.group.add(this.hillRing);

    const glowGeom = new THREE.CircleGeometry(hillRadius - 0.5, 48);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xffd700,
      transparent: true,
      opacity: 0.15,
      side: THREE.DoubleSide,
    });
    this.innerGlow = new THREE.Mesh(glowGeom, glowMat);
    this.innerGlow.rotation.x = -Math.PI / 2;
    this.innerGlow.position.y = 0.01;
    this.group.add(this.innerGlow);

    const barGeom = new THREE.PlaneGeometry(1.6, 0.12);
    const barBg = new THREE.MeshBasicMaterial({ color: 0x222244, transparent: true, opacity: 0.6, depthWrite: false });
    const barBgMesh = new THREE.Mesh(barGeom.clone(), barBg);
    barBgMesh.rotation.x = -Math.PI / 2;
    barBgMesh.position.set(0, 0.8, 0);
    this.group.add(barBgMesh);

    const fillGeom = new THREE.PlaneGeometry(1.5, 0.08);
    const fillMat = new THREE.MeshBasicMaterial({ color: 0xffd700, transparent: true, opacity: 0.9, depthWrite: false });
    this.captureBar = new THREE.Mesh(fillGeom, fillMat);
    this.captureBar.rotation.x = -Math.PI / 2;
    this.captureBar.position.set(0, 0.802, 0);
    this.captureBar.scale.x = 0;
    this.captureBarMaxScale = 1;
    this.group.add(this.captureBar);

    const postGeom = new THREE.CylinderGeometry(0.02, 0.03, 0.3, 6);
    const postMat = new THREE.MeshBasicMaterial({ color: 0x888899 });
    for (const ox of [-0.82, 0.82]) {
      const post = new THREE.Mesh(postGeom, postMat);
      post.position.set(ox, 0.8, 0);
      this.group.add(post);
    }
  }

  updateCaptureProgress(frac: number, ownerTeamColor?: string) {
    this.captureBar.scale.x = Math.max(0, Math.min(1, frac)) * this.captureBarMaxScale;

    if (ownerTeamColor) {
      const col = new THREE.Color(ownerTeamColor);
      (this.captureBar.material as THREE.MeshBasicMaterial).color.copy(col);
      (this.hillRing.material as THREE.MeshBasicMaterial).color.copy(col);
      (this.innerGlow.material as THREE.MeshBasicMaterial).color.copy(col);
    } else {
      const neutral = new THREE.Color(0xffd700);
      (this.captureBar.material as THREE.MeshBasicMaterial).color.copy(neutral);
      (this.hillRing.material as THREE.MeshBasicMaterial).color.copy(neutral);
      (this.innerGlow.material as THREE.MeshBasicMaterial).color.copy(neutral);
    }
  }

  pulse(dt: number) {
    this.pulsePhase += dt * 2.5;
    const glow = 0.12 + 0.08 * Math.sin(this.pulsePhase);
    (this.innerGlow.material as THREE.MeshBasicMaterial).opacity = glow;

    const ringPulse = 0.55 + 0.15 * Math.sin(this.pulsePhase * 0.7);
    (this.hillRing.material as THREE.MeshBasicMaterial).opacity = ringPulse;
  }

  dispose() {
    this.scene.remove(this.group);
    const meshes: THREE.Mesh[] = [];
    this.group.traverse((child) => {
      if (child instanceof THREE.Mesh) meshes.push(child);
    });
    for (const m of meshes) {
      m.geometry.dispose();
      (m.material as THREE.Material).dispose();
    }
  }
}

export class FfaVisual {
  stormRing: THREE.Mesh;
  stormWall: THREE.Mesh;
  dangerZone: THREE.Mesh;
  private scene: THREE.Scene;
  private group: THREE.Group;
  private centerX: number;
  private centerZ: number;
  private currentRadius: number;
  private pulsePhase = 0;
  private wallHeight = 4;

  constructor(scene: THREE.Scene, centerX: number, centerZ: number, initialRadius: number) {
    this.scene = scene;
    this.centerX = centerX;
    this.centerZ = centerZ;
    this.currentRadius = initialRadius;

    this.group = new THREE.Group();
    this.group.position.set(centerX, 0, centerZ);
    scene.add(this.group);

    const ringGeom = new THREE.RingGeometry(initialRadius - 0.08, initialRadius + 0.08, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xff3333,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
    });
    this.stormRing = new THREE.Mesh(ringGeom, ringMat);
    this.stormRing.rotation.x = -Math.PI / 2;
    this.stormRing.position.y = 0.02;
    this.group.add(this.stormRing);

    const wallGeom = new THREE.CylinderGeometry(initialRadius, initialRadius, this.wallHeight, 64, 1, true);
    const wallMat = new THREE.MeshBasicMaterial({
      color: 0xff2222,
      transparent: true,
      opacity: 0.15,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    this.stormWall = new THREE.Mesh(wallGeom, wallMat);
    this.stormWall.position.y = this.wallHeight / 2;
    this.group.add(this.stormWall);

    const dangerGeom = new THREE.CircleGeometry(initialRadius + 4, 64);
    const dangerMat = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      transparent: true,
      opacity: 0.04,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    this.dangerZone = new THREE.Mesh(dangerGeom, dangerMat);
    this.dangerZone.rotation.x = -Math.PI / 2;
    this.dangerZone.position.y = 0.005;
    this.group.add(this.dangerZone);

    this.rebuildStorm(initialRadius);
  }

  private rebuildStorm(radius: number) {
    const r = Math.max(0.1, radius);

    this.stormRing.geometry.dispose();
    this.stormRing.geometry = new THREE.RingGeometry(r - 0.08, r + 0.08, 64);

    this.stormWall.geometry.dispose();
    this.stormWall.geometry = new THREE.CylinderGeometry(r, r, this.wallHeight, 64, 1, true);

    this.dangerZone.geometry.dispose();
    this.dangerZone.geometry = new THREE.CircleGeometry(r + 4, 64);
  }

  setRadius(radius: number) {
    this.currentRadius = radius;
    this.rebuildStorm(radius);
  }

  setCenter(x: number, z: number) {
    this.centerX = x;
    this.centerZ = z;
    this.group.position.set(x, 0, z);
  }

  update(dt: number) {
    this.pulsePhase += dt * 4;
    const pulse = 0.6 + 0.25 * Math.sin(this.pulsePhase);
    (this.stormRing.material as THREE.MeshBasicMaterial).opacity = pulse;

    const wallFlicker = 0.12 + 0.06 * Math.sin(this.pulsePhase * 1.7);
    (this.stormWall.material as THREE.MeshBasicMaterial).opacity = wallFlicker;

    const ringScale = 1 + 0.02 * Math.sin(this.pulsePhase * 0.5);
    this.stormRing.scale.set(ringScale, ringScale, ringScale);
  }

  dispose() {
    this.scene.remove(this.group);
    const meshes: THREE.Mesh[] = [];
    this.group.traverse((child) => {
      if (child instanceof THREE.Mesh) meshes.push(child);
    });
    for (const m of meshes) {
      m.geometry.dispose();
      (m.material as THREE.Material).dispose();
    }
  }
}
