import { useEffect, useRef, useState, useCallback } from "preact/hooks";
import * as THREE from "three";
import type { Match, Bot } from "../types/index.ts";

const ARENA_HALF = 9;
const BOT_RADIUS = 0.38;

const TEAMS = [
  { hex: 0xff6b35, css: "#ff6b35", name: "BLAZE" },
  { hex: 0x4ecdc4, css: "#4ecdc4", name: "TIDE" },
  { hex: 0xff3d7f, css: "#ff3d7f", name: "PUNCH" },
  { hex: 0x9b5de5, css: "#9b5de5", name: "VOID" },
  { hex: 0x00bfff, css: "#00bfff", name: "FROST" },
  { hex: 0xffd700, css: "#ffd700", name: "GOLD" },
];
const SPAWNS = [[-6.5, -6.5], [6.5, 6.5], [6.5, -6.5], [-6.5, 6.5], [0, -6], [0, 6]];

const CARD_POOL = [
  { id: "heal", label: "REPAIR KIT", icon: "❤️", desc: "+25 HP", cooldown: 10 },
  { id: "bigheal", label: "NANITE SURGE", icon: "🧬", desc: "+50 HP", cooldown: 22 },
  { id: "speed", label: "OVERDRIVE", icon: "⚡", desc: "+60% speed 5s", cooldown: 16, duration: 5, mult: 1.6 },
  { id: "turbo", label: "TURBO BOOST", icon: "🏎️", desc: "+100% speed 3s", cooldown: 20, duration: 3, mult: 2.0 },
  { id: "damage", label: "OVERCLOCK", icon: "💪", desc: "+50% dmg 6s", cooldown: 16, duration: 6, mult: 1.5 },
  { id: "shield", label: "SHIELD", icon: "🛡️", desc: "blocks next hit", cooldown: 18 },
  { id: "stun", label: "STUN PULSE", icon: "🌀", desc: "stuns nearest 2s", cooldown: 18, duration: 2 },
  { id: "adrenaline", label: "ADRENALINE", icon: "💉", desc: "+20 HP & speed", cooldown: 18, duration: 4, mult: 1.3 },
  { id: "lucky", label: "LUCKY CRIT", icon: "🍀", desc: "next shot crits", cooldown: 16 },
  { id: "barrier", label: "BARRIER", icon: "🧿", desc: "blocks all 3s", cooldown: 26, duration: 3 },
  { id: "ironskin", label: "IRON PLATING", icon: "🪨", desc: "-50% dmg 5s", cooldown: 20, duration: 5 },
  { id: "slowfield", label: "SLOW FIELD", icon: "🐌", desc: "slow foe 4s", cooldown: 18, duration: 4 },
  { id: "rapidreload", label: "RAPID RELOAD", icon: "🔃", desc: "fast fire 4s", cooldown: 18, duration: 4 },
  { id: "focus", label: "FOCUS LENS", icon: "🔭", desc: "+50% range 5s", cooldown: 16, duration: 5 },
  { id: "berserk", label: "BERSERK", icon: "🔥", desc: "+100% dmg 3s", cooldown: 22, duration: 3, mult: 2.0 },
  { id: "secondwind", label: "SECOND WIND", icon: "🌅", desc: "heal if low", cooldown: 24 },
];

function rand(min: number, max: number) { return Math.random() * (max - min) + min; }

interface ArenaViewerProps {
  matchId: string;
  userId: string;
  matchData?: Match;
}

export default function ArenaViewer({ matchId, userId }: ArenaViewerProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<any>(null);

  const [phase, setPhase] = useState<"betting" | "draft" | "match">("betting");
  const [selectedBotIdx, setSelectedBotIdx] = useState<number | null>(null);
  const [bettedBotIdx, setBettedBotIdx] = useState<number | null>(null);
  const [draftSelection, setDraftSelection] = useState<string[]>([]);
  const [dealt, setDealt] = useState(false);
  const [activeCards, setActiveCards] = useState<typeof CARD_POOL>([]);
  const [autoOrbit, setAutoOrbit] = useState(true);
  const [followCam, setFollowCam] = useState(false);
  const [winnerInfo, setWinnerInfo] = useState<{ name: string; color: string; won: boolean } | null>(null);
  const [, setUiTick] = useState(0);
  const [wsConnected, setWsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const overlayStyle: Record<string, string> = {
    position: "absolute", inset: "0", background: "radial-gradient(circle at 50% 30%, #2c5fa3dd, #0d1530ee)",
    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: "20", padding: "20px",
  };
  const titleStyle: Record<string, string> = {
    fontFamily: "'Baloo 2'", fontWeight: "800", letterSpacing: "1", fontSize: "26px", textAlign: "center",
    color: "#ffd23f", textShadow: "0 3px 0 #00000055, 0 0 18px #ffd23f55", WebkitTextStroke: "2px #1b1530",
  };

  useEffect(() => {
    const mountEl = mountRef.current!;
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x2f7fd6, 22, 42);

    const camera = new THREE.PerspectiveCamera(42, mountEl.clientWidth / mountEl.clientHeight, 0.1, 200);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mountEl.clientWidth, mountEl.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    mountEl.appendChild(renderer.domElement);

    function handleResize() {
      camera.aspect = mountEl.clientWidth / mountEl.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mountEl.clientWidth, mountEl.clientHeight);
    }
    window.addEventListener("resize", handleResize);

    scene.add(new THREE.AmbientLight(0xffffff, 0.65));
    const sun = new THREE.DirectionalLight(0xffffff, 0.9);
    sun.position.set(10, 18, 8);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.left = -16; sun.shadow.camera.right = 16;
    sun.shadow.camera.top = 16; sun.shadow.camera.bottom = -16;
    scene.add(sun);

    const groundMat = new THREE.MeshStandardMaterial({ color: 0x4fae3d, roughness: 0.9 });
    const ground = new THREE.Mesh(new THREE.BoxGeometry(ARENA_HALF * 2, 0.5, ARENA_HALF * 2), groundMat);
    ground.position.y = -0.25; ground.receiveShadow = true;
    scene.add(ground);

    const grid = new THREE.GridHelper(ARENA_HALF * 2, 18, 0x2f8f2a, 0x2f8f2a);
    grid.position.y = 0.005; grid.material.opacity = 0.25; grid.material.transparent = true;
    scene.add(grid);

    const wallMat = new THREE.MeshStandardMaterial({ color: 0x8a5a3b, roughness: 0.8 });
    const wallH = 1.0, wallT = 0.6;
    [[0, -ARENA_HALF - wallT / 2, ARENA_HALF * 2 + wallT * 2, wallT],
     [0, ARENA_HALF + wallT / 2, ARENA_HALF * 2 + wallT * 2, wallT],
     [-ARENA_HALF - wallT / 2, 0, wallT, ARENA_HALF * 2 + wallT * 2],
     [ARENA_HALF + wallT / 2, 0, wallT, ARENA_HALF * 2 + wallT * 2]].forEach(([x, z, w, d]) => {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(w as number, wallH, d as number), wallMat);
      wall.position.set(x as number, wallH / 2 - 0.25, z as number);
      wall.castShadow = true; wall.receiveShadow = true;
      scene.add(wall);
    });

    function makeNameplate(name: string, hexColor: string) {
      const canvas = document.createElement("canvas");
      canvas.width = 256; canvas.height = 80;
      const ctx = canvas.getContext("2d")!;
      const texture = new THREE.CanvasTexture(canvas);
      const material = new THREE.SpriteMaterial({ map: texture, depthTest: false, transparent: true });
      const sprite = new THREE.Sprite(material);
      sprite.scale.set(1.5, 0.5, 1);
      function redraw(hpFrac: number, alive: boolean) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.font = "700 30px Baloo 2, sans-serif";
        ctx.textAlign = "center";
        ctx.fillStyle = alive ? "#ffffff" : "#999999";
        ctx.strokeStyle = "#14172b"; ctx.lineWidth = 5;
        ctx.strokeText(name, 128, 32); ctx.fillText(name, 128, 32);
        const barW = 200, barH = 14, barX = 28, barY = 46;
        ctx.fillStyle = "#00000055"; ctx.fillRect(barX - 2, barY - 2, barW + 4, barH + 4);
        ctx.fillStyle = "#ffffff22"; ctx.fillRect(barX, barY, barW, barH);
        ctx.fillStyle = alive ? hexColor : "#666666";
        ctx.fillRect(barX, barY, barW * Math.max(0, hpFrac), barH);
        texture.needsUpdate = true;
      }
      redraw(1, true);
      return { sprite, redraw };
    }

    function buildBot(colorHex: number) {
      const g = new THREE.Group();
      const body = new THREE.Mesh(
        new THREE.SphereGeometry(BOT_RADIUS, 20, 20),
        new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.35, metalness: 0.15, emissive: colorHex, emissiveIntensity: 0.18 }),
      );
      body.castShadow = true; g.add(body);
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 12), new THREE.MeshStandardMaterial({ color: 0xffffff }));
      eye.position.set(0, 0.05, 0.34); g.add(eye);
      const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), new THREE.MeshStandardMaterial({ color: 0x14172b }));
      pupil.position.set(0, 0.05, 0.4); g.add(pupil);
      g.position.y = BOT_RADIUS;
      g.userData.body = body;
      return g;
    }

    const betRing = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.05, 10, 32), new THREE.MeshBasicMaterial({ color: 0xffd23f }));
    betRing.rotation.x = Math.PI / 2; betRing.visible = false;
    scene.add(betRing);

    const game: any = {
      scene, camera, renderer, betRing,
      bots: [], projectiles: [], particles: [],
      match: { aliveCount: 0, finished: false, started: false },
      ws: null as WebSocket | null,
      activeCards: [],
      cardState: {} as Record<string, { remaining: number }>,
      cam: { theta: 0.8, phi: 0.62, radius: 15, dragging: false, lastX: 0, lastY: 0 },
      autoOrbit: true, followCam: false,
      followTarget: new THREE.Vector3(0, 0.5, 0),
      feed: [] as string[],
      interpolate: true,
    };
    gameRef.current = game;

    function feedLine(text: string) {
      game.feed.push(text);
      if (game.feed.length > 40) game.feed.shift();
    }

    function pulseBot(bot: any) {
      const mat = bot.mesh.userData.body.material;
      const orig = mat.emissiveIntensity;
      mat.emissiveIntensity = 1.4;
      setTimeout(() => { if (mat) mat.emissiveIntensity = orig; }, 200);
    }

    function spawnHitParticles(x: number, z: number, color: number | string, count?: number) {
      for (let i = 0; i < (count || 6); i++) {
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), new THREE.MeshStandardMaterial({ color }));
        mesh.position.set(x, 0.4, z);
        scene.add(mesh);
        const ang = Math.random() * Math.PI * 2;
        const speed = rand(1.5, 3.5);
        game.particles.push({
          mesh, vx: Math.cos(ang) * speed, vz: Math.sin(ang) * speed,
          vy: rand(2, 4), life: 0, maxLife: rand(0.4, 0.7),
        });
      }
    }

    function damageBot(bot: any, amount: number) {
      if (!bot.alive) return;
      bot.hp -= amount;
      bot.nameplate.redraw(Math.max(0, bot.hp) / bot.maxHp, true);
      spawnHitParticles(bot.x, bot.z, bot.css);
      if (bot.hp <= 0) eliminateBot(bot);
    }

    function eliminateBot(bot: any) {
      bot.alive = false;
      game.match.aliveCount--;
      feedLine(`${bot.name} eliminated!`);
      spawnHitParticles(bot.x, bot.z, bot.css, 9);

      const startScale = bot.mesh.scale.x;
      const start = performance.now();
      function shrink() {
        const p = Math.min(1, (performance.now() - start) / 450);
        const s = startScale * (1 - p);
        bot.mesh.scale.set(s, s, s);
        bot.mesh.position.y = BOT_RADIUS - p * 0.4;
        if (p < 1) requestAnimationFrame(shrink);
        else { bot.mesh.visible = false; bot.nameplate.sprite.visible = false; }
      }
      shrink();

      if (game.match.aliveCount <= 1) {
        const winner = game.bots.find((b: any) => b.alive);
        if (winner) {
          game.match.finished = true;
          game.betRing.visible = false;
          feedLine(`${winner.name} wins!`);
          setWinnerInfo({
            name: winner.name,
            color: winner.css,
            won: winner.idx === game.bettedBotIdx,
          });
        }
      }
    }

    function spawnProjectile(x: number, z: number, dx: number, dz: number, speed: number, color: number) {
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.09, 10, 10),
        new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 1.3 }),
      );
      mesh.position.set(x, 0.32, z);
      scene.add(mesh);
      game.projectiles.push({
        mesh, x, z, dx, dz, speed,
        traveled: 0, maxTravel: 10,
        trailTimer: 0, color,
      });
    }

    /* ---- WebSocket connection ---- */
    function connectWs() {
      const protocol = location.protocol === "https:" ? "wss:" : "ws:";
      const ws = new WebSocket(`${protocol}//${location.host}/api/ws/match/${matchId}`);
      game.ws = ws;

      ws.onopen = () => {
        setWsConnected(true);
        setConnectionError(null);
        ws.send(JSON.stringify({ type: "join", userId, backerBotId: undefined }));
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === "state_snapshot" && msg.bots) {
            const g = game;
            if (!g.match.started) {
              g.match.started = true;
              if (g.bots.length === 0) {
                msg.bots.forEach((sb: any, i: number) => {
                  const team = TEAMS[i % TEAMS.length];
                  const mesh = buildBot(team.hex);
                  mesh.position.set(sb.x, BOT_RADIUS, sb.z);
                  scene.add(mesh);
                  const nameplate = makeNameplate(team.name, team.css);
                  nameplate.sprite.position.set(sb.x, 1.05, sb.z);
                  scene.add(nameplate.sprite);
                  g.bots.push({
                    idx: i, name: team.name, mesh, nameplate, css: team.css,
                    hp: sb.health, maxHp: sb.maxHealth, alive: !sb.isDead,
                    x: sb.x, z: sb.z, score: sb.score, kills: sb.kills,
                    fireCooldown: rand(0.4, 1.2), strafeDir: 1, strafeTimer: 0,
                    speedBoostTimer: 0, damageBoostTimer: 0, luckyCharm: false,
                    barrierTimer: 0, stunTimer: 0, shield: false, ironSkin: 0,
                  });
                });
                g.match.aliveCount = msg.bots.length;
              }
            }

            msg.bots.forEach((sb: any) => {
              const bot = g.bots.find((b: any) => b.idx === msg.bots.indexOf(sb));
              if (!bot) return;
              const prevX = bot.x, prevZ = bot.z;
              bot.x = sb.x; bot.z = sb.z;
              bot.hp = sb.health; bot.maxHp = sb.maxHealth;
              bot.alive = !sb.isDead;
              bot.score = sb.score; bot.kills = sb.kills;

              if (g.interpolate) {
                bot.prevX = prevX; bot.prevZ = prevZ;
              }

              bot.mesh.position.x = sb.x;
              bot.mesh.position.z = sb.z;
              bot.nameplate.sprite.position.set(sb.x, 1.05, sb.z);
              bot.nameplate.redraw(Math.max(0, bot.hp) / bot.maxHp, bot.alive);

              if (bot.idx === g.bettedBotIdx) {
                g.betRing.position.set(sb.x, 0.04, sb.z);
                g.betRing.visible = true;
              }
            });
          } else if (msg.type === "match_event") {
            const ev = msg.event;
            feedLine(`event: ${ev.type}`);
            if (ev.type === "attack") {
              const shooter = game.bots.find((b: any) => b.idx === game.bots.findIndex((_: any, i: number) => ev.botId === `bot_${i}`));
              if (shooter) {
                const dx = Math.cos(shooter.mesh.rotation.y);
                const dz = Math.sin(shooter.mesh.rotation.y);
                spawnProjectile(shooter.x, shooter.z, dx, dz, 13, shooter.mesh.userData.body.material.color.getHex());
              }
            }
            if (ev.type === "kill") {
              const victim = game.bots.find((b: any) => b.idx === game.bots.findIndex((_: any, i: number) => ev.victimId === `bot_${i}`));
              if (victim && victim.alive) {
                damageBot(victim, victim.hp);
              }
            }
          } else if (msg.type === "match_end") {
            game.match.finished = true;
            game.betRing.visible = false;
            const winner = game.bots.find((b: any) => b.alive);
            if (winner) {
              setWinnerInfo({
                name: winner.name,
                color: winner.css,
                won: winner.idx === game.bettedBotIdx,
              });
            }
          } else if (msg.type === "card_played" && msg.success) {
            game.cardState[msg.cardId] = { remaining: 30 };
          }
        } catch { /* ignore */ }
      };

      ws.onclose = () => {
        setWsConnected(false);
        setTimeout(() => {
          if (game.match.started && !game.match.finished) connectWs();
        }, 2000);
      };

      ws.onerror = () => {
        setConnectionError("WebSocket error");
      };
    }

    /* ---- camera controls ---- */
    const dom = renderer.domElement;
    function startDrag(x: number, y: number) {
      game.cam.dragging = true; game.cam.lastX = x; game.cam.lastY = y;
      game.autoOrbit = false; setAutoOrbit(false);
    }
    function moveDrag(x: number, y: number) {
      if (!game.cam.dragging) return;
      const dx = x - game.cam.lastX, dy = y - game.cam.lastY;
      game.cam.lastX = x; game.cam.lastY = y;
      game.cam.theta -= dx * 0.005;
      game.cam.phi -= dy * 0.004;
      game.cam.phi = Math.max(0.35, Math.min(0.95, game.cam.phi));
    }
    function endDrag() { game.cam.dragging = false; }
    function onMouseDown(e: MouseEvent) { startDrag(e.clientX, e.clientY); }
    function onMouseMove(e: MouseEvent) { moveDrag(e.clientX, e.clientY); }
    function onTouchStart(e: TouchEvent) { startDrag(e.touches[0].clientX, e.touches[0].clientY); }
    function onTouchMove(e: TouchEvent) { moveDrag(e.touches[0].clientX, e.touches[0].clientY); }
    function onWheel(e: WheelEvent) {
      game.cam.radius += e.deltaY * 0.012;
      game.cam.radius = Math.max(8, Math.min(24, game.cam.radius));
    }
    dom.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", endDrag);
    window.addEventListener("mousemove", onMouseMove);
    dom.addEventListener("touchstart", onTouchStart);
    window.addEventListener("touchend", endDrag);
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    dom.addEventListener("wheel", onWheel, { passive: true });

    function updateCamera(dt: number) {
      if (game.autoOrbit) game.cam.theta += dt * 0.1;
      let desired: THREE.Vector3;
      if (game.followCam) {
        const bot = game.bots[game.bettedBotIdx];
        desired = (bot && bot.alive) ? new THREE.Vector3(bot.x, 0.5, bot.z) : new THREE.Vector3(0, 0.5, 0);
      } else {
        desired = new THREE.Vector3(0, 0.5, 0);
      }
      game.followTarget.lerp(desired, Math.min(1, dt * 4));
      const { theta, phi, radius } = game.cam;
      camera.position.set(
        game.followTarget.x + radius * Math.sin(phi) * Math.cos(theta),
        game.followTarget.y + radius * Math.cos(phi),
        game.followTarget.z + radius * Math.sin(phi) * Math.sin(theta),
      );
      camera.lookAt(game.followTarget);
    }

    function updateProjectiles(dt: number) {
      for (let i = game.projectiles.length - 1; i >= 0; i--) {
        const p = game.projectiles[i];
        p.x += p.dx * p.speed * dt;
        p.z += p.dz * p.speed * dt;
        p.traveled += p.speed * dt;
        p.mesh.position.x = p.x;
        p.mesh.position.z = p.z;

        p.trailTimer -= dt;
        if (p.trailTimer <= 0) {
          p.trailTimer = 0.03;
          const trailMesh = new THREE.Mesh(
            new THREE.SphereGeometry(0.05, 6, 6),
            new THREE.MeshBasicMaterial({ color: p.color, transparent: true, opacity: 0.6 }),
          );
          trailMesh.position.set(p.x, p.mesh.position.y, p.z);
          scene.add(trailMesh);
          game.particles.push({ mesh: trailMesh, isTrail: true, life: 0, maxLife: 0.25 });
        }

        let resolved = false;
        for (const bot of game.bots) {
          if (!bot.alive || bot.idx === i) continue;
          const d = Math.hypot(bot.x - p.x, bot.z - p.z);
          if (d < 0.5) {
            damageBot(bot, rand(7, 12));
            resolved = true; break;
          }
        }
        if (resolved || p.traveled > p.maxTravel || Math.abs(p.x) > ARENA_HALF + 1 || Math.abs(p.z) > ARENA_HALF + 1) {
          scene.remove(p.mesh);
          game.projectiles.splice(i, 1);
        }
      }
    }

    function updateParticles(dt: number) {
      for (let i = game.particles.length - 1; i >= 0; i--) {
        const pt = game.particles[i];
        pt.life += dt;
        if (pt.isTrail) {
          const k = Math.max(0, 1 - pt.life / pt.maxLife);
          pt.mesh.scale.set(k, k, k);
          pt.mesh.material.opacity = k * 0.6;
        } else {
          pt.mesh.position.x += pt.vx * dt;
          pt.mesh.position.z += pt.vz * dt;
          pt.vy -= 9 * dt;
          pt.mesh.position.y += pt.vy * dt;
          if (pt.mesh.position.y < 0.1) { pt.mesh.position.y = 0.1; pt.vy = 0; }
          const k = Math.max(0, 1 - pt.life / pt.maxLife);
          pt.mesh.scale.set(k, k, k);
        }
        if (pt.life >= pt.maxLife) { scene.remove(pt.mesh); game.particles.splice(i, 1); }
      }
    }

    let lastT = performance.now();
    let rafId: number;

    function animate() {
      rafId = requestAnimationFrame(animate);
      const now = performance.now();
      const dt = Math.min(0.05, (now - lastT) / 1000);
      lastT = now;

      updateCamera(dt);
      updateProjectiles(dt);
      updateParticles(dt);

      renderer.render(scene, camera);
    }

    connectWs();
    animate();

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mouseup", endDrag);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("touchend", endDrag);
      window.removeEventListener("touchmove", onTouchMove);
      dom.removeEventListener("mousedown", onMouseDown);
      dom.removeEventListener("touchstart", onTouchStart);
      dom.removeEventListener("wheel", onWheel);
      if (game.ws) game.ws.close();
      if (mountEl.contains(renderer.domElement)) mountEl.removeChild(renderer.domElement);
      renderer.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId, userId]);

  const game = gameRef.current;
  const bots = game ? game.bots : [];
  const sortedBots = [...bots].sort((a: any, b: any) => {
    if (a.alive !== b.alive) return a.alive ? -1 : 1;
    return b.hp - a.hp;
  });
  const feedLines = game ? game.feed : [];
  const matchStarted = game ? game.match.started : false;
  const matchFinished = game ? game.match.finished : false;
  const aliveCount = game ? game.match.aliveCount : 0;

  function handlePickBot(i: number) { setSelectedBotIdx(i); }

  function handleStartMatch() {
    if (selectedBotIdx === null) return;
    const shuffled = [...CARD_POOL].sort(() => Math.random() - 0.5);
    setDraftSelection([]);
    setDealt(false);
    setPhase("draft");
    requestAnimationFrame(() => requestAnimationFrame(() => setDealt(true)));
  }

  function handleToggleDraftCard(id: string) {
    setDraftSelection((prev: string[]) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 4) return prev;
      return [...prev, id];
    });
  }

  function handleConfirmHand() {
    if (draftSelection.length !== 4 || selectedBotIdx === null) return;
    const chosen = draftSelection.map((id) => CARD_POOL.find((c) => c.id === id)!);
    setActiveCards(chosen);
    setBettedBotIdx(selectedBotIdx);
    const g = gameRef.current;
    if (g && g.ws) {
      const botId = `bot_${selectedBotIdx}`;
      g.ws.send(JSON.stringify({ type: "join", userId, backerBotId: botId }));
      g.bettedBotIdx = selectedBotIdx;
      if (g.bots.length > 0) {
        g.match.started = true;
      }
    }
    g.activeCards = chosen;
    g.cardState = {};
    chosen.forEach((c: any) => { g.cardState[c.id] = { remaining: 0 }; });
    setPhase("match");
  }

  function handleUseCard(card: typeof CARD_POOL[0]) {
    const g = gameRef.current;
    if (!g || g.match.finished) return;
    const state = g.cardState[card.id];
    if (!state || state.remaining > 0) return;
    state.remaining = card.cooldown;

    const bot = g.bots[g.bettedBotIdx];
    if (!bot || !bot.alive) return;

    switch (card.id) {
      case "heal": bot.hp = Math.min(bot.maxHp, bot.hp + 25); break;
      case "bigheal": bot.hp = Math.min(bot.maxHp, bot.hp + 50); break;
      case "speed": case "turbo": bot.speedBoostTimer = card.duration ?? 0; break;
      case "damage": case "berserk": bot.damageBoostTimer = card.duration ?? 0; break;
      case "shield": bot.shield = true; break;
      case "barrier": bot.barrierTimer = card.duration ?? 0; break;
      case "ironskin": bot.ironSkin = card.duration ?? 0; break;
      case "stun": bot.stunTimer = card.duration ?? 0; break;
      case "slowfield": bot.slowTimer = card.duration ?? 0; break;
      case "adrenaline": bot.hp = Math.min(bot.maxHp, bot.hp + 20); bot.speedBoostTimer = card.duration ?? 0; break;
      case "lucky": bot.luckyCharm = true; break;
      case "secondwind": bot.hp = Math.min(bot.maxHp, bot.hp + (bot.hp < 50 ? 50 : 15)); break;
    }
    bot.nameplate.redraw(Math.max(0, bot.hp) / bot.maxHp, bot.alive);
  }

  function handleRebet() {
    window.location.reload();
  }

  return (
    <div style={{
      position: "relative", width: "100%", height: "100vh", overflow: "hidden",
      background: "linear-gradient(180deg, #6fc8ff, #2f7fd6)",
      fontFamily: "'Space Mono', monospace", color: "#f3f6ff",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700;800&family=Space+Mono:wght@400;700&display=swap');
        .panel{ background:#171b34ee; border:3px solid #0b0e1f; border-radius:14px; padding:10px 14px; box-shadow:0 4px 0 #00000033; }
        .lb-row{ display:flex; align-items:center; gap:8px; padding:3px 0; font-size:11px; }
        .lb-dot{ width:12px; height:12px; border-radius:50%; flex:none; border:2px solid #0b0e1f; }
        .lb-hpbar-bg{ width:55px; height:7px; background:#ffffff1c; border-radius:4px; overflow:hidden; flex:none; }
        .lb-hpbar{ height:100%; transition:width .2s ease; }
        .lb-row.dead{ opacity:0.35; text-decoration:line-through; }
        .bet-card, .draft-card{ cursor:pointer; }
        button.gamebtn{ font-family:'Baloo 2'; font-size:13px; letter-spacing:1px; font-weight:700; background:#ffffff; color:#171b34; border:3px solid #0b0e1f; border-radius:10px; padding:8px 18px; cursor:pointer; box-shadow:0 4px 0 #00000044; transition:transform .1s ease; }
        button.gamebtn:hover{ transform:translateY(-2px); }
        button.gamebtn:active{ transform:translateY(1px); }
        button.gamebtn:disabled{ opacity:0.4; cursor:not-allowed; }
        button.gamebtn.primary{ background:#ffd23f; }
        .help-card{ width:84px; background:#171b34ee; border:3px solid #0b0e1f; border-radius:12px; padding:8px 6px 7px; text-align:center; cursor:pointer; position:relative; box-shadow:0 4px 0 #00000033; transition:transform .12s ease; }
        .help-card:hover{ transform:translateY(-3px); }
        .help-card.disabled{ cursor:not-allowed; filter:grayscale(0.7); opacity:0.55; }
        .feed::-webkit-scrollbar{ width:4px; }
        .feed::-webkit-scrollbar-thumb{ background:#ffffff33; border-radius:4px; }
      `}</style>

      <div ref={mountRef} style={{ position: "absolute", inset: 0 }} />

      {!wsConnected && !game?.match.started && (
        <div style={{ position: "absolute", top: 16, right: 16, zIndex: 30 }}>
          <div class="panel" style={{ fontSize: 11, color: "#ffd23f" }}>
            {connectionError ? `WS Error: ${connectionError}` : "Connecting..."}
          </div>
        </div>
      )}

      {phase === "betting" && (
        <div style={overlayStyle}>
          <div style={titleStyle}>CLANKER ARENA</div>
          <div style={{ textAlign: "center", fontSize: 11, color: "#ffffffcc", letterSpacing: 2, marginTop: 2, marginBottom: 22, textShadow: "0 1px 2px #00000088" }}>
            PICK A BOT TO BACK — CHOOSE WISELY
          </div>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center", maxWidth: 900 }}>
            {TEAMS.slice(0, 4).map((team, i) => (
              <div
                key={i}
                class={`bet-card ${selectedBotIdx === i ? "selected" : ""}`}
                style={{
                  width: 190, background: "#171b34ee", border: `4px solid ${selectedBotIdx === i ? "#ffd23f" : "#0b0e1f"}`,
                  borderRadius: 16, padding: "14px 12px", textAlign: "center",
                  boxShadow: selectedBotIdx === i ? "0 8px 0 #00000044, 0 0 18px #ffd23f88" : "0 6px 0 #00000033",
                  transform: selectedBotIdx === i ? "translateY(-6px)" : "none",
                  transition: "transform .12s ease, border-color .12s ease, box-shadow .12s ease",
                }}
                onClick={() => handlePickBot(i)}
              >
                <div style={{ width: 54, height: 54, borderRadius: "50%", margin: "0 auto 8px", border: "3px solid #0b0e1f", background: team.css }} />
                <div style={{ fontFamily: "'Baloo 2'", fontWeight: 800, fontSize: 16, letterSpacing: 1 }}>{team.name}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 22, display: "flex", gap: 14, alignItems: "center" }}>
            <span style={{ fontSize: 11, color: "#dbe4ff", letterSpacing: 1 }}>
              {selectedBotIdx === null ? "no bot selected" : `betting on ${TEAMS[selectedBotIdx].name}`}
            </span>
            <button class="gamebtn primary" disabled={selectedBotIdx === null} onClick={handleStartMatch}>
              CONTINUE TO DRAFT
            </button>
          </div>
        </div>
      )}

      {phase === "draft" && (
        <div style={overlayStyle}>
          <div style={titleStyle}>CHOOSE YOUR CARDS</div>
          <div style={{ textAlign: "center", fontSize: 11, color: "#ffffffcc", letterSpacing: 2, marginTop: 2, marginBottom: 22 }}>
            PICK 4 CARDS TO SUPPORT YOUR BOT
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 86px)", gap: 12, justifyContent: "center" }}>
            {CARD_POOL.map((card, i) => {
              const selected = draftSelection.includes(card.id);
              const locked = !selected && draftSelection.length >= 4;
              return (
                <div
                  key={card.id}
                  style={{
                    width: 86, height: 112, cursor: locked ? "not-allowed" : "pointer",
                    perspective: 700,
                    transform: dealt ? "translate(0,0) rotate(0deg)" : `translate(${rand(-200, 200)}px, ${rand(-150, 150)}px) rotate(${rand(-45, 45)}deg)`,
                    opacity: dealt ? (locked ? 0.35 : 1) : 0,
                    transition: `transform .6s cubic-bezier(.2,.8,.2,1) ${i * 0.04}s, opacity .4s ease ${i * 0.04}s`,
                  }}
                  onClick={() => !locked && handleToggleDraftCard(card.id)}
                >
                  <div style={{
                    width: "100%", height: "100%", borderRadius: 12,
                    border: selected ? "3px solid #ffd23f" : "3px solid #0b0e1f",
                    background: "#171b34ee", display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center", padding: 4, textAlign: "center",
                    boxShadow: selected ? "0 0 14px #ffd23f88" : "none",
                    transform: selected ? "rotateY(0deg)" : "none",
                  }}>
                    <div style={{ fontSize: 22 }}>{card.icon}</div>
                    <div style={{ fontFamily: "'Baloo 2'", fontSize: 9, color: "#ffd23f", marginTop: 3 }}>{card.label}</div>
                    <div style={{ fontSize: 7, color: "#9aa3c9", marginTop: 2 }}>{card.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 22, display: "flex", gap: 14, alignItems: "center" }}>
            <span style={{ fontSize: 11, color: "#dbe4ff" }}>{draftSelection.length} / 4</span>
            <button class="gamebtn primary" disabled={draftSelection.length !== 4} onClick={handleConfirmHand}>
              CONFIRM & ENTER MATCH
            </button>
          </div>
        </div>
      )}

      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 16 }}>
        <div style={{ pointerEvents: "auto" }}>
          <div style={{ fontFamily: "'Baloo 2'", fontWeight: 800, fontSize: 20, color: "#ffd23f", textShadow: "0 3px 0 #00000055", WebkitTextStroke: "1.5px #1b1530" }}>
            CLANKER ARENA
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 16, marginTop: 10 }}>
            <div class="panel" style={{ width: 230 }}>
              <div style={{ fontFamily: "'Baloo 2'", fontSize: 13, color: "#ffd23f", letterSpacing: 1, marginBottom: 6 }}>STANDINGS</div>
              {sortedBots.map((b: any) => (
                <div key={b.idx} class={`lb-row${b.alive ? "" : " dead"}`}>
                  <div class="lb-dot" style={{ background: b.css }} />
                  <div style={{ flex: 1, fontWeight: 700, fontSize: 11 }}>{b.name}</div>
                  <div style={{ fontSize: 13 }}>{b.idx === bettedBotIdx ? "⭐" : ""}</div>
                  <div class="lb-hpbar-bg"><div class="lb-hpbar" style={{ width: `${Math.max(0, b.hp)}%`, background: b.css }} /></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, pointerEvents: "auto" }}>
          <div class="panel feed" style={{ width: 320, maxHeight: 120, overflowY: "auto", fontSize: 11, lineHeight: 1.7 }}>
            <div style={{ fontFamily: "'Baloo 2'", fontSize: 12, color: "#ffd23f", letterSpacing: 1, marginBottom: 4 }}>// LIVE FEED</div>
            {feedLines.map((line: string, i: number) => <div key={i} style={{ color: "#dfe4ff" }}>{line}</div>)}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
            <button class="gamebtn ghost" style={{ background: "#ffffff22", color: "#fff" }} onClick={() => { setAutoOrbit(!autoOrbit); if (gameRef.current) gameRef.current.autoOrbit = !autoOrbit; }}>
              ORBIT: {autoOrbit ? "ON" : "OFF"}
            </button>
            <button class="gamebtn ghost" style={{ background: "#ffffff22", color: "#fff" }} onClick={() => { setFollowCam(!followCam); if (gameRef.current) gameRef.current.followCam = !followCam; }}>
              FOLLOW: {followCam ? "ON" : "OFF"}
            </button>
            <div style={{ fontSize: 9, color: "#ffffffaa", textAlign: "right", letterSpacing: 1 }}>drag=rotate · wheel=zoom</div>
          </div>
        </div>
      </div>

      {phase === "match" && (
        <div style={{ position: "absolute", bottom: 128, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 10, zIndex: 5 }}>
          {activeCards.map((card) => {
            const remaining = game?.cardState?.[card.id]?.remaining ?? 0;
            const bot = game?.bots?.[bettedBotIdx ?? -1];
            const disabled = !game || matchFinished || !bot?.alive || remaining > 0;
            return (
              <div
                key={card.id}
                class={`help-card${disabled ? " disabled" : ""}`}
                onClick={() => !disabled && handleUseCard(card)}
              >
                <div style={{ fontSize: 24, lineHeight: 1 }}>{card.icon}</div>
                <div style={{ fontFamily: "'Baloo 2'", fontSize: 10, color: "#ffd23f", marginTop: 3 }}>{card.label}</div>
                <div style={{ fontSize: 8, color: "#9aa3c9", marginTop: 2 }}>{card.desc}</div>
                {remaining > 0 && (
                  <div style={{ position: "absolute", inset: 0, borderRadius: 12, background: "#00000099", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Baloo 2'", fontSize: 18, color: "#fff" }}>
                    {Math.ceil(remaining)}s
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {winnerInfo && (
        <div style={{
          position: "absolute", top: "35%", left: "50%", transform: "translate(-50%,-50%)",
          fontFamily: "'Baloo 2'", fontWeight: 800, fontSize: 34, textAlign: "center",
          WebkitTextStroke: "3px #1b1530", textShadow: "0 4px 0 #00000055",
          color: winnerInfo.color, zIndex: 25,
        }}>
          {winnerInfo.name} WINS!
          <div style={{ fontFamily: "'Baloo 2'", fontSize: 16, marginTop: 8, WebkitTextStroke: "1.5px #1b1530", color: winnerInfo.won ? "#7CFF8A" : "#ff7a7a" }}>
            {winnerInfo.won ? "YOU WON YOUR BET!" : "YOUR BOT LOST"}
          </div>
          <button class="gamebtn primary" style={{ marginTop: 16 }} onClick={handleRebet}>PLAY AGAIN</button>
        </div>
      )}
    </div>
  );
}
