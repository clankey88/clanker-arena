import * as THREE from "three";

interface Particle {
  mesh: THREE.Mesh;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
  active: boolean;
  trail?: boolean;
  startOpacity?: number;
}

const BOT_Y = 0.38;

export class ParticlePool {
  scene: THREE.Scene;
  particles: Particle[] = [];
  pool: Particle[] = [];

  constructor(scene: THREE.Scene, count: number = 120) {
    this.scene = scene;
    const boxGeo = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    const sphereGeo = new THREE.SphereGeometry(0.05, 6, 6);
    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(
        i < count * 0.7 ? boxGeo.clone() : sphereGeo.clone(),
        new THREE.MeshStandardMaterial({ transparent: true }),
      );
      mesh.visible = false;
      scene.add(mesh);
      const p: Particle = { mesh, vx: 0, vy: 0, vz: 0, life: 0, maxLife: 1, active: false };
      this.pool.push(p);
    }
  }

  private acquire(): Particle | null {
    for (const p of this.pool) {
      if (!p.active) return p;
    }
    return null;
  }

  spawnHitParticles(x: number, z: number, color: number | string, count: number = 6): void {
    const c = typeof color === "string" ? color : `#${color.toString(16).padStart(6, "0")}`;
    for (let i = 0; i < count; i++) {
      const p = this.acquire();
      if (!p) break;
      p.active = true;
      p.life = 0;
      p.maxLife = 0.3 + Math.random() * 0.4;
      p.trail = false;
      const mat = p.mesh.material as THREE.MeshStandardMaterial;
      mat.color.set(c);
      mat.opacity = 1;
      p.mesh.visible = true;
      p.mesh.position.set(x, 0.4, z);
      p.mesh.scale.set(1, 1, 1);
      const ang = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 2;
      p.vx = Math.cos(ang) * speed;
      p.vz = Math.sin(ang) * speed;
      p.vy = 2 + Math.random() * 2;
    }
  }

  spawnTrailParticle(x: number, y: number, z: number, color: number | string, opacity: number = 0.6): void {
    const p = this.acquire();
    if (!p) return;
    p.active = true;
    p.life = 0;
    p.maxLife = 0.3;
    p.trail = true;
    p.startOpacity = opacity;
    const c = typeof color === "string" ? color : `#${color.toString(16).padStart(6, "0")}`;
    const mat = p.mesh.material as THREE.MeshStandardMaterial;
    mat.color.set(c);
    mat.opacity = opacity;
    p.mesh.visible = true;
    p.mesh.position.set(x, y, z);
    p.mesh.scale.set(1, 1, 1);
    p.vx = 0;
    p.vy = 0;
    p.vz = 0;
  }

  update(dt: number): void {
    for (const p of this.pool) {
      if (!p.active) continue;
      p.life += dt;
      const k = Math.max(0, 1 - p.life / p.maxLife);
      if (p.trail) {
        const s = k;
        p.mesh.scale.set(s, s, s);
        (p.mesh.material as THREE.MeshStandardMaterial).opacity = k * (p.startOpacity ?? 0.6);
      } else {
        p.mesh.position.x += p.vx * dt;
        p.mesh.position.z += p.vz * dt;
        p.vy -= 9 * dt;
        p.mesh.position.y += p.vy * dt;
        if (p.mesh.position.y < 0.1) {
          p.mesh.position.y = 0.1;
          p.vy = 0;
        }
        p.mesh.scale.set(k, k, k);
        (p.mesh.material as THREE.MeshStandardMaterial).opacity = k;
      }
      if (p.life >= p.maxLife) {
        p.active = false;
        p.mesh.visible = false;
      }
    }
  }

  clear(): void {
    for (const p of this.pool) {
      p.active = false;
      p.mesh.visible = false;
    }
  }
}

export function flashDamage(bot: any): void {
  const body = bot.mesh?.userData?.body;
  if (!body) return;
  const mat = body.material as THREE.MeshStandardMaterial;
  const origEmissive = mat.emissive ? mat.emissive.getHex() : 0;
  const origIntensity = mat.emissiveIntensity;
  mat.emissive.setHex(0xff0000);
  mat.emissiveIntensity = 2.0;
  const start = performance.now();
  function revert() {
    const elapsed = performance.now() - start;
    if (elapsed >= 150) {
      mat.emissive.setHex(origEmissive);
      mat.emissiveIntensity = origIntensity;
      return;
    }
    const t = elapsed / 150;
    mat.emissiveIntensity = origIntensity + (2.0 - origIntensity) * (1 - t);
    requestAnimationFrame(revert);
  }
  requestAnimationFrame(revert);
}

export class BuffGlow {
  mesh: THREE.Mesh;
  private parentBot: any;
  private baseY: number;

  constructor(color: number, parentBot: any) {
    this.parentBot = parentBot;
    const geo = new THREE.TorusGeometry(0.55, 0.04, 12, 32);
    const mat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.7,
      depthWrite: false,
    });
    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.rotation.x = Math.PI / 2;
    this.baseY = BOT_Y + 0.05;
    this.mesh.position.set(parentBot.x, this.baseY, parentBot.z);
    parentBot.mesh.parent?.add(this.mesh);
  }

  update(dt: number): void {
    if (!this.parentBot.alive) {
      this.mesh.visible = false;
      return;
    }
    this.mesh.visible = true;
    this.mesh.position.set(this.parentBot.x, this.baseY, this.parentBot.z);
    const pulse = 0.5 + 0.5 * Math.sin(performance.now() * 0.004);
    (this.mesh.material as THREE.MeshBasicMaterial).opacity = 0.3 + 0.5 * pulse;
    this.mesh.scale.setScalar(1 + 0.08 * pulse);
  }

  dispose(): void {
    this.mesh.parent?.remove(this.mesh);
    this.mesh.geometry.dispose();
    (this.mesh.material as THREE.MeshBasicMaterial).dispose();
  }
}

export class ShieldBubble {
  mesh: THREE.Mesh;
  private parentBot: any;
  private baseY: number;
  private time: number = 0;

  constructor(color: number, parentBot: any) {
    this.parentBot = parentBot;
    const geo = new THREE.SphereGeometry(0.45, 24, 24);
    const mat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.2,
      depthWrite: false,
      side: THREE.DoubleSide,
      wireframe: false,
    });
    this.mesh = new THREE.Mesh(geo, mat);
    this.baseY = BOT_Y;
    this.mesh.position.set(parentBot.x, this.baseY, parentBot.z);
    parentBot.mesh.parent?.add(this.mesh);
  }

  update(dt: number): void {
    this.time += dt;
    if (!this.parentBot.alive || (!this.parentBot.shield && !this.parentBot.barrierTimer)) {
      this.mesh.visible = false;
      return;
    }
    this.mesh.visible = true;
    this.mesh.position.set(this.parentBot.x, this.baseY + 0.03 * Math.sin(this.time * 2), this.parentBot.z);
    const pulse = 0.15 + 0.08 * Math.sin(this.time * 3);
    (this.mesh.material as THREE.MeshBasicMaterial).opacity = pulse;
  }

  dispose(): void {
    this.mesh.parent?.remove(this.mesh);
    this.mesh.geometry.dispose();
    (this.mesh.material as THREE.MeshBasicMaterial).dispose();
  }
}

export class StunIndicator {
  mesh: THREE.Group;
  private ring: THREE.Mesh;
  private parentBot: any;
  private baseY: number;

  constructor(parentBot: any) {
    this.parentBot = parentBot;
    this.mesh = new THREE.Group();
    const geo = new THREE.TorusGeometry(0.5, 0.035, 8, 24);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xffff00,
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
    });
    this.ring = new THREE.Mesh(geo, mat);
    this.ring.rotation.x = Math.PI / 2;
    this.mesh.add(this.ring);

    const spikeGeo = new THREE.ConeGeometry(0.06, 0.15, 6);
    const spikeMat = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    for (let i = 0; i < 6; i++) {
      const ang = (i / 6) * Math.PI * 2;
      const spike = new THREE.Mesh(spikeGeo, spikeMat);
      spike.position.set(Math.cos(ang) * 0.5, 0, Math.sin(ang) * 0.5);
      spike.rotation.z = -Math.PI / 2;
      spike.lookAt(0, 0, 0);
      this.mesh.add(spike);
    }

    this.baseY = BOT_Y + 0.6;
    this.mesh.position.set(parentBot.x, this.baseY, parentBot.z);
    parentBot.mesh.parent?.add(this.mesh);
  }

  update(dt: number): void {
    if (!this.parentBot.alive || !this.parentBot.stunTimer) {
      this.mesh.visible = false;
      return;
    }
    this.mesh.visible = true;
    this.mesh.position.set(this.parentBot.x, this.baseY, this.parentBot.z);
    this.ring.rotation.z += dt * 3;
    this.mesh.rotation.y += dt * 2;
  }

  dispose(): void {
    this.mesh.parent?.remove(this.mesh);
    this.mesh.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        child.material.dispose();
      }
    });
  }
}

export class FloatingText {
  sprite: THREE.Sprite;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private texture: THREE.CanvasTexture;
  private life: number = 0;
  private maxLife: number;
  private velocity: THREE.Vector3;
  private dead: boolean = false;

  constructor(text: string, color: string, position: THREE.Vector3) {
    this.maxLife = 1.2 + Math.random() * 0.3;
    this.canvas = document.createElement("canvas");
    this.canvas.width = 128;
    this.canvas.height = 64;
    this.ctx = this.canvas.getContext("2d")!;
    this.texture = new THREE.CanvasTexture(this.canvas);
    const mat = new THREE.SpriteMaterial({
      map: this.texture,
      transparent: true,
      depthTest: false,
      opacity: 1,
    });
    this.sprite = new THREE.Sprite(mat);
    this.sprite.scale.set(0.8, 0.4, 1);
    this.sprite.position.copy(position);
    this.velocity = new THREE.Vector3(0, 1.2, 0);
    this.draw(text, color, 1);
  }

  private draw(text: string, color: string, opacity: number): void {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, 128, 64);
    ctx.font = "700 28px Baloo 2, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.globalAlpha = opacity;
    ctx.strokeStyle = "#14172b";
    ctx.lineWidth = 4;
    ctx.strokeText(text, 64, 32);
    ctx.fillStyle = color;
    ctx.fillText(text, 64, 32);
    ctx.globalAlpha = 1;
    this.texture.needsUpdate = true;
  }

  update(dt: number): void {
    if (this.dead) return;
    this.life += dt;
    const t = this.life / this.maxLife;
    this.sprite.position.add(this.velocity.clone().multiplyScalar(dt));
    this.velocity.y -= 0.3 * dt;
    const opacity = Math.max(0, 1 - t * t);
    this.sprite.material.opacity = opacity;
    if (t >= 1) {
      this.dead = true;
      this.sprite.visible = false;
    }
  }

  isDead(): boolean {
    return this.dead;
  }
}

export class CaptureRing {
  mesh: THREE.Mesh;
  private parentPos: () => { x: number; z: number };
  private progress: number = 0;
  private bufferGeo: THREE.BufferGeometry;
  private readonly maxVertices: number;

  constructor(parentPos: () => { x: number; z: number }, color: number) {
    this.parentPos = parentPos;
    this.maxVertices = 64;
    const positions = new Float32Array(this.maxVertices * 3);
    this.bufferGeo = new THREE.BufferGeometry();
    this.bufferGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    this.bufferGeo.setDrawRange(0, 0);
    const mat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    this.mesh = new THREE.Mesh(this.bufferGeo, mat);
    this.mesh.rotation.x = -Math.PI / 2;
    this.mesh.position.y = 0.02;
    this.updateGeometry(0);
  }

  setProgress(frac: number): void {
    this.progress = Math.max(0, Math.min(1, frac));
    this.updateGeometry(this.progress);
  }

  private updateGeometry(frac: number): void {
    const pos = this.parentPos();
    const radius = 0.65;
    const count = Math.max(3, Math.floor(this.maxVertices * frac));
    const positions = this.bufferGeo.attributes.position.array as Float32Array;
    for (let i = 0; i < count; i++) {
      const ang = (i / count) * Math.PI * 2;
      positions[i * 3] = pos.x + Math.cos(ang) * radius;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = pos.z + Math.sin(ang) * radius;
    }
    this.bufferGeo.attributes.position.needsUpdate = true;
    this.bufferGeo.setDrawRange(0, count);
  }

  update(dt: number): void {
    const pos = this.parentPos();
    this.mesh.position.x = pos.x;
    this.mesh.position.z = pos.z;
    const pulse = 0.5 + 0.5 * Math.sin(performance.now() * 0.003);
    (this.mesh.material as THREE.MeshBasicMaterial).opacity = 0.3 + 0.3 * pulse;
  }

  dispose(): void {
    this.mesh.parent?.remove(this.mesh);
    this.bufferGeo.dispose();
    (this.mesh.material as THREE.MeshBasicMaterial).dispose();
  }
}

export class StormVisual {
  ring: THREE.Mesh;
  wall: THREE.Mesh;
  private center: { x: number; z: number };
  private ringMat: THREE.MeshBasicMaterial;
  private wallMat: THREE.MeshBasicMaterial;

  constructor(center: { x: number; z: number }) {
    this.center = center;
    this.ringMat = new THREE.MeshBasicMaterial({
      color: 0x8866ff,
      transparent: true,
      opacity: 0.15,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const ringGeo = new THREE.RingGeometry(0, 1, 48);
    this.ring = new THREE.Mesh(ringGeo, this.ringMat);
    this.ring.rotation.x = -Math.PI / 2;
    this.ring.position.set(center.x, 0.01, center.z);

    this.wallMat = new THREE.MeshBasicMaterial({
      color: 0x8866ff,
      transparent: true,
      opacity: 0.08,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const wallGeo = new THREE.CylinderGeometry(1, 1, 3, 48, 1, true);
    this.wall = new THREE.Mesh(wallGeo, this.wallMat);
    this.wall.position.set(center.x, 1.5, center.z);
  }

  setRadius(radius: number): void {
    this.ring.geometry.dispose();
    this.ring.geometry = new THREE.RingGeometry(0, radius, 48);
    this.wall.geometry.dispose();
    this.wall.geometry = new THREE.CylinderGeometry(radius, radius, 3, 48, 1, true);
    this.ring.position.set(this.center.x, 0.01, this.center.z);
    this.wall.position.set(this.center.x, 1.5, this.center.z);
  }

  dispose(): void {
    this.ring.parent?.remove(this.ring);
    this.wall.parent?.remove(this.wall);
    this.ring.geometry.dispose();
    this.ringMat.dispose();
    this.wall.geometry.dispose();
    this.wallMat.dispose();
  }
}

export class AttackBeam {
  line: THREE.Line;
  private material: THREE.LineBasicMaterial;
  private elapsed: number = 0;
  private duration: number = 0.25;

  constructor(from: THREE.Vector3, to: THREE.Vector3, color: number) {
    const positions = new Float32Array(6);
    positions[0] = from.x;
    positions[1] = from.y;
    positions[2] = from.z;
    positions[3] = to.x;
    positions[4] = to.y;
    positions[5] = to.z;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    this.material = new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity: 1,
      linewidth: 1,
    });
    this.line = new THREE.Line(geo, this.material);
  }

  animate(duration: number = 0.25): void {
    this.duration = duration;
    this.elapsed = 0;
  }

  update(dt: number): boolean {
    this.elapsed += dt;
    const t = this.elapsed / this.duration;
    if (t >= 1) {
      this.material.opacity = 0;
      return false;
    }
    this.material.opacity = 1 - t * t;
    return true;
  }

  dispose(): void {
    this.line.parent?.remove(this.line);
    this.line.geometry.dispose();
    this.material.dispose();
  }
}

export function makeBarTexture(
  width: number,
  height: number,
  color: string,
  fillFrac: number,
): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#00000044";
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, width * Math.max(0, Math.min(1, fillFrac)), height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}
