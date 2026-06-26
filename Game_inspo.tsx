import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";

/* ------------------------------------------------------------------
   Pure data + helpers (no React/Preact-specific APIs below this point
   except the component itself — everything is hooks-only so porting
   this file to Preact is just swapping the two imports above).
------------------------------------------------------------------- */

const ARENA_HALF = 9;
const BOT_RADIUS = 0.38;

const WEAPONS = {
  blaster: { type: "blaster", label: "BLASTER", icon: "🔫", dmgMin: 7, dmgMax: 12, cdMin: 0.5, cdMax: 0.9, range: 7, speed: 13, pips: { s: 4, d: 2, r: 3 } },
  shotgun: { type: "shotgun", label: "SHOTGUN", icon: "💥", dmgMin: 6, dmgMax: 10, cdMin: 1.1, cdMax: 1.6, range: 5, speed: 10, pelletCount: 3, spread: 0.22, pips: { s: 3, d: 4, r: 2 } },
  sniper: { type: "sniper", label: "SNIPER", icon: "🎯", dmgMin: 20, dmgMax: 28, cdMin: 1.9, cdMax: 2.6, range: 11, speed: 20, pips: { s: 2, d: 5, r: 5 } },
  rocket: { type: "rocket", label: "ROCKET", icon: "🚀", dmgMin: 14, dmgMax: 19, cdMin: 1.5, cdMax: 2.1, range: 7, speed: 8, splashRadius: 1.9, pips: { s: 2, d: 4, r: 3 } },
};

const TEAM_COLORS = [
  { hex: 0xff6b35, css: "#ff6b35", name: "BLAZE", weapon: WEAPONS.blaster },
  { hex: 0x4ecdc4, css: "#4ecdc4", name: "TIDE", weapon: WEAPONS.shotgun },
  { hex: 0xff3d7f, css: "#ff3d7f", name: "PUNCH", weapon: WEAPONS.sniper },
  { hex: 0x9b5de5, css: "#9b5de5", name: "VOID", weapon: WEAPONS.rocket },
];
const SPAWNS = [[-6.5, -6.5], [6.5, 6.5], [6.5, -6.5], [-6.5, 6.5]];

const CARD_POOL = [
  { id: "heal", label: "REPAIR", icon: "❤️", desc: "+25 HP now", cooldown: 10 },
  { id: "bigheal", label: "NANITE SURGE", icon: "🧬", desc: "+50 HP now", cooldown: 22 },
  { id: "speed", label: "OVERDRIVE", icon: "⚡", desc: "+60% speed 5s", cooldown: 16, duration: 5, multValue: 1.6 },
  { id: "turbo", label: "TURBO BOOST", icon: "🏎️", desc: "+100% speed 3s", cooldown: 20, duration: 3, multValue: 2.0 },
  { id: "damage", label: "OVERCLOCK", icon: "💪", desc: "+50% dmg 6s", cooldown: 16, duration: 6, multValue: 1.5 },
  { id: "berserk", label: "BERSERK MODE", icon: "🔥", desc: "+100% dmg 3s", cooldown: 22, duration: 3, multValue: 2.0 },
  { id: "shield", label: "SHIELD", icon: "🛡️", desc: "blocks next hit", cooldown: 18 },
  { id: "barrier", label: "BARRIER", icon: "🧿", desc: "blocks all dmg 3s", cooldown: 26, duration: 3 },
  { id: "ironskin", label: "IRON PLATING", icon: "🪨", desc: "-50% dmg taken 5s", cooldown: 20, duration: 5 },
  { id: "stun", label: "STUN PULSE", icon: "🌀", desc: "stuns nearest foe 2s", cooldown: 18, duration: 2 },
  { id: "slowfield", label: "SLOW FIELD", icon: "🐌", desc: "-50% foe speed 4s", cooldown: 18, duration: 4 },
  { id: "adrenaline", label: "ADRENALINE", icon: "💉", desc: "+20 HP & speed 4s", cooldown: 18, duration: 4, multValue: 1.3 },
  { id: "rapidreload", label: "RAPID RELOAD", icon: "🔃", desc: "faster firing 4s", cooldown: 18, duration: 4 },
  { id: "focus", label: "FOCUS LENS", icon: "🔭", desc: "+50% range 5s", cooldown: 16, duration: 5 },
  { id: "lucky", label: "LUCKY STRIKE", icon: "🍀", desc: "next shot crits x2", cooldown: 16 },
  { id: "secondwind", label: "SECOND WIND", icon: "🌅", desc: "big heal if low HP", cooldown: 24 },
];

function rand(min, max) { return Math.random() * (max - min) + min; }
function pipsArr(value) { return Array.from({ length: 5 }, (_, i) => i < value); }

const overlayStyle = { position: "absolute", inset: 0, background: "radial-gradient(circle at 50% 30%, #2c5fa3dd, #0d1530ee)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 20, padding: 20 };
const titleStyle = { fontFamily: "'Baloo 2'", fontWeight: 800, letterSpacing: 1, fontSize: 26, textAlign: "center", color: "#ffd23f", textShadow: "0 3px 0 #00000055, 0 0 18px #ffd23f55", WebkitTextStroke: "2px #1b1530" };
const subStyle = { textAlign: "center", fontSize: 11, color: "#ffffffcc", letterSpacing: 2, marginTop: 2, marginBottom: 22, textShadow: "0 1px 2px #00000088" };

export default function OrbBrawlArena() {
  const mountRef = useRef(null);
  const gameRef = useRef(null);

  const [phase, setPhase] = useState("betting"); // betting | draft | match
  const [selectedBotId, setSelectedBotId] = useState(null);
  const [bettedBotId, setBettedBotId] = useState(null);
  const [draftLayout, setDraftLayout] = useState([]);
  const [draftSelection, setDraftSelection] = useState([]);
  const [dealt, setDealt] = useState(false);
  const [activeCards, setActiveCards] = useState([]);
  const [autoOrbit, setAutoOrbit] = useState(true);
  const [followCam, setFollowCam] = useState(false);
  const [winnerInfo, setWinnerInfo] = useState(null);
  const [, setUiTick] = useState(0);

  /* ---------------- THREE.JS MOUNT (runs once) ---------------- */
  useEffect(() => {
    const mountEl = mountRef.current;
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
      const wall = new THREE.Mesh(new THREE.BoxGeometry(w, wallH, d), wallMat);
      wall.position.set(x, wallH / 2 - 0.25, z);
      wall.castShadow = true; wall.receiveShadow = true;
      scene.add(wall);
    });

    const obstacles = [];
    function addCrate(x, z) {
      const crate = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.1, 1.1), new THREE.MeshStandardMaterial({ color: 0xc98a3e, roughness: 0.7 }));
      crate.position.set(x, 0.3, z); crate.castShadow = true; crate.receiveShadow = true;
      scene.add(crate);
      obstacles.push({ x, z, radius: 1.0 });
    }
    function addBush(x, z) {
      const bush = new THREE.Mesh(new THREE.IcosahedronGeometry(0.75, 0), new THREE.MeshStandardMaterial({ color: 0x2f9b3a, roughness: 0.9 }));
      bush.position.set(x, 0.5, z); bush.castShadow = true; bush.receiveShadow = true;
      scene.add(bush);
      obstacles.push({ x, z, radius: 0.85 });
    }
    addCrate(2.2, 2.2); addCrate(-2.2, -2.2); addCrate(2.2, -2.2); addCrate(-2.2, 2.2);
    addBush(0, 4.2); addBush(0, -4.2); addBush(4.2, 0); addBush(-4.2, 0);
    addCrate(0, 0);

    function makeNameplate(name, hexColor) {
      const canvas = document.createElement("canvas");
      canvas.width = 256; canvas.height = 96;
      const ctx = canvas.getContext("2d");
      const texture = new THREE.CanvasTexture(canvas);
      const material = new THREE.SpriteMaterial({ map: texture, depthTest: false, transparent: true });
      const sprite = new THREE.Sprite(material);
      sprite.scale.set(1.5, 0.56, 1);
      function redraw(hpFrac, alive) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.font = "700 34px Baloo 2, sans-serif";
        ctx.textAlign = "center";
        ctx.fillStyle = alive ? "#ffffff" : "#999999";
        ctx.strokeStyle = "#14172b"; ctx.lineWidth = 6;
        ctx.strokeText(name, 128, 38); ctx.fillText(name, 128, 38);
        const barW = 200, barH = 16, barX = 28, barY = 52;
        ctx.fillStyle = "#00000055"; ctx.fillRect(barX - 3, barY - 3, barW + 6, barH + 6);
        ctx.fillStyle = "#ffffff22"; ctx.fillRect(barX, barY, barW, barH);
        ctx.fillStyle = alive ? hexColor : "#666666";
        ctx.fillRect(barX, barY, barW * Math.max(0, hpFrac), barH);
        texture.needsUpdate = true;
      }
      redraw(1, true);
      return { sprite, redraw };
    }

    function buildBot(colorHex) {
      const g = new THREE.Group();
      const body = new THREE.Mesh(
        new THREE.SphereGeometry(BOT_RADIUS, 20, 20),
        new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.35, metalness: 0.15, emissive: colorHex, emissiveIntensity: 0.18 })
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

    /* ---- mutable game state lives off React, in a plain object ---- */
    const game = {
      scene, camera, renderer, obstacles, betRing,
      bots: [], projectiles: [], particles: [],
      match: { aliveCount: 4, finished: false, started: false },
      bettedBotId: null,
      activeCards: [],
      cardState: {},
      cam: { theta: 0.8, phi: 0.62, radius: 15, dragging: false, lastX: 0, lastY: 0 },
      autoOrbit: true,
      followCam: false,
      followTarget: new THREE.Vector3(0, 0.5, 0),
      feed: [],
    };
    gameRef.current = game;

    function feedLine(text) {
      game.feed.push(text);
      if (game.feed.length > 40) game.feed.shift();
    }

    function pulseBot(bot) {
      const mat = bot.mesh.userData.body.material;
      const orig = mat.emissiveIntensity;
      mat.emissiveIntensity = 1.4;
      setTimeout(() => { if (mat) mat.emissiveIntensity = orig; }, 200);
    }

    function newMatch() {
      game.bots.forEach(b => { scene.remove(b.mesh); scene.remove(b.nameplate.sprite); });
      game.projectiles.forEach(p => scene.remove(p.mesh));
      game.particles.forEach(p => scene.remove(p.mesh));
      game.bots = []; game.projectiles = []; game.particles = [];
      game.feed = [];
      setWinnerInfo(null);

      TEAM_COLORS.forEach((team, i) => {
        const mesh = buildBot(team.hex);
        const [sx, sz] = SPAWNS[i];
        mesh.position.x = sx; mesh.position.z = sz;
        scene.add(mesh);
        const nameplate = makeNameplate(team.name, team.css);
        nameplate.sprite.position.set(sx, 1.05, sz);
        scene.add(nameplate.sprite);

        game.bots.push({
          id: i, mesh, nameplate, css: team.css, weapon: team.weapon,
          hp: 100, maxHp: 100, alive: true, x: sx, z: sz,
          fireCooldown: rand(0.4, 1.2),
          strafeDir: Math.random() < 0.5 ? 1 : -1,
          strafeTimer: rand(1.5, 3),
          speedBoostTimer: 0, speedMultValue: 1,
          damageBoostTimer: 0, damageMultValue: 1,
          shieldActive: false, barrierTimer: 0, ironSkinTimer: 0,
          stunTimer: 0, slowTimer: 0, rapidTimer: 0, rangeBoostTimer: 0,
          luckyCharm: false,
        });
      });

      game.match = { aliveCount: 4, finished: false, started: false };
      game.bettedBotId = null;
      game.betRing.visible = false;
    }

    function startMatch(betId, cards) {
      game.bettedBotId = betId;
      game.activeCards = cards;
      game.cardState = {};
      cards.forEach(c => { game.cardState[c.id] = { remaining: 0 }; });
      game.match.started = true;
      game.betRing.visible = true;
      const name = TEAM_COLORS[betId].name;
      feedLine("All 4 bots dropped into the arena.");
      feedLine(`You placed your bet on ${name}.`);
    }

    function nearestEnemy(bot) {
      let best = null, bestD = Infinity;
      game.bots.forEach(o => {
        if (o.id === bot.id || !o.alive) return;
        const d = Math.hypot(o.x - bot.x, o.z - bot.z);
        if (d < bestD) { bestD = d; best = o; }
      });
      return best;
    }

    function useCard(cardId) {
      const bot = game.bots.find(b => b.id === game.bettedBotId);
      if (!bot || !bot.alive || game.match.finished) return;
      const state = game.cardState[cardId];
      if (!state || state.remaining > 0) return;
      const card = game.activeCards.find(c => c.id === cardId);
      if (!card) return;
      state.remaining = card.cooldown;
      const teamName = TEAM_COLORS[bot.id].name;
      const enemy = nearestEnemy(bot);

      switch (cardId) {
        case "heal":
          bot.hp = Math.min(bot.maxHp, bot.hp + 25);
          bot.nameplate.redraw(bot.hp / bot.maxHp, true);
          feedLine(`You repair ${teamName}! +25 HP`);
          break;
        case "bigheal":
          bot.hp = Math.min(bot.maxHp, bot.hp + 50);
          bot.nameplate.redraw(bot.hp / bot.maxHp, true);
          feedLine(`Nanite Surge restores ${teamName} for 50 HP!`);
          break;
        case "speed":
        case "turbo":
          bot.speedBoostTimer = card.duration; bot.speedMultValue = card.multValue;
          feedLine(`${card.label}! ${teamName} speeds up.`);
          break;
        case "damage":
        case "berserk":
          bot.damageBoostTimer = card.duration; bot.damageMultValue = card.multValue;
          feedLine(`${card.label}! ${teamName} hits harder.`);
          break;
        case "shield":
          bot.shieldActive = true;
          feedLine(`A shield protects ${teamName}.`);
          break;
        case "barrier":
          bot.barrierTimer = card.duration;
          feedLine(`Barrier raised around ${teamName}!`);
          break;
        case "ironskin":
          bot.ironSkinTimer = card.duration;
          feedLine(`Iron Plating reinforces ${teamName}.`);
          break;
        case "stun":
          if (enemy) { enemy.stunTimer = card.duration; feedLine(`${TEAM_COLORS[enemy.id].name} is stunned!`); }
          break;
        case "slowfield":
          if (enemy) { enemy.slowTimer = card.duration; feedLine(`${TEAM_COLORS[enemy.id].name} is slowed!`); }
          break;
        case "adrenaline":
          bot.hp = Math.min(bot.maxHp, bot.hp + 20);
          bot.nameplate.redraw(bot.hp / bot.maxHp, true);
          bot.speedBoostTimer = card.duration; bot.speedMultValue = card.multValue;
          feedLine(`Adrenaline rush for ${teamName}!`);
          break;
        case "rapidreload":
          bot.rapidTimer = card.duration;
          feedLine(`${teamName} reloads in a flash.`);
          break;
        case "focus":
          bot.rangeBoostTimer = card.duration;
          feedLine(`${teamName} extends its range.`);
          break;
        case "lucky":
          bot.luckyCharm = true;
          feedLine(`${teamName} feels lucky...`);
          break;
        case "secondwind":
          if (bot.hp < 50) { bot.hp = 50; feedLine(`Second Wind revives ${teamName} to 50 HP!`); }
          else { bot.hp = Math.min(bot.maxHp, bot.hp + 15); feedLine(`Second Wind tops up ${teamName}.`); }
          bot.nameplate.redraw(bot.hp / bot.maxHp, true);
          break;
        default: break;
      }
      pulseBot(bot);
    }

    function spawnHitParticles(x, z, color, count) {
      for (let i = 0; i < (count || 6); i++) {
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), new THREE.MeshStandardMaterial({ color }));
        mesh.position.set(x, 0.4, z);
        scene.add(mesh);
        const ang = Math.random() * Math.PI * 2;
        const speed = rand(1.5, 3.5);
        game.particles.push({ mesh, vx: Math.cos(ang) * speed, vz: Math.sin(ang) * speed, vy: rand(2, 4), life: 0, maxLife: rand(0.4, 0.7) });
      }
    }

    function spawnTrailParticle(x, y, z, colorCss) {
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 6), new THREE.MeshBasicMaterial({ color: colorCss, transparent: true, opacity: 0.7 }));
      mesh.position.set(x, y, z);
      scene.add(mesh);
      game.particles.push({ mesh, isTrail: true, life: 0, maxLife: 0.28 });
    }

    function spawnProjectile(shooter, dirx, dirz, damage, w, kind) {
      let geo;
      if (kind === "sniper") geo = new THREE.SphereGeometry(0.07, 8, 8);
      else if (kind === "rocket") geo = new THREE.SphereGeometry(0.17, 10, 10);
      else if (kind === "pellet") geo = new THREE.SphereGeometry(0.06, 8, 8);
      else geo = new THREE.SphereGeometry(0.09, 10, 10);

      const colorCss = TEAM_COLORS[shooter.id].css;
      const mat = new THREE.MeshStandardMaterial({ color: shooter.mesh.userData.body.material.color, emissive: shooter.mesh.userData.body.material.color, emissiveIntensity: 1.3 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(shooter.x, 0.32, shooter.z);
      scene.add(mesh);

      game.projectiles.push({
        mesh, x: shooter.x, z: shooter.z, dx: dirx, dz: dirz, speed: w.speed,
        owner: shooter.id, traveled: 0, maxTravel: w.range + 2, damage,
        hitRadius: kind === "rocket" ? 0.55 : 0.38,
        isRocket: kind === "rocket", splashRadius: w.splashRadius || 0,
        colorCss, trailTimer: 0,
      });
    }

    function fireProjectile(shooter, target) {
      const w = shooter.weapon;
      let dmgMult = shooter.damageBoostTimer > 0 ? shooter.damageMultValue : 1;
      let crit = false;
      if (shooter.luckyCharm) { dmgMult *= 2; crit = true; shooter.luckyCharm = false; }
      const baseDamage = rand(w.dmgMin, w.dmgMax) * dmgMult;
      const dx = target.x - shooter.x, dz = target.z - shooter.z;
      const len = Math.hypot(dx, dz) || 1;
      const bx = dx / len, bz = dz / len;
      shooter.mesh.rotation.y = Math.atan2(bx, bz);

      if (w.type === "shotgun") {
        for (let i = 0; i < w.pelletCount; i++) {
          const angle = (i - (w.pelletCount - 1) / 2) * w.spread;
          const dirx = bx * Math.cos(angle) - bz * Math.sin(angle);
          const dirz = bx * Math.sin(angle) + bz * Math.cos(angle);
          spawnProjectile(shooter, dirx, dirz, baseDamage * 0.7, w, "pellet");
        }
      } else if (w.type === "sniper") {
        spawnProjectile(shooter, bx, bz, baseDamage, w, "sniper");
      } else if (w.type === "rocket") {
        spawnProjectile(shooter, bx, bz, baseDamage, w, "rocket");
      } else {
        const spread = rand(-0.05, 0.05);
        const dirx = bx * Math.cos(spread) - bz * Math.sin(spread);
        const dirz = bx * Math.sin(spread) + bz * Math.cos(spread);
        spawnProjectile(shooter, dirx, dirz, baseDamage, w, "blaster");
      }
      if (crit) feedLine(`${TEAM_COLORS[shooter.id].name} lines up a LUCKY CRIT!`);
      pulseBot(shooter);
    }

    function explodeRocket(x, z, damage, colorCss) {
      spawnHitParticles(x, z, colorCss, 12);
      game.bots.forEach(b => {
        if (!b.alive) return;
        const d = Math.hypot(b.x - x, b.z - z);
        if (d < 1.9) damageBot(b, damage);
      });
    }

    function damageBot(bot, amount) {
      if (!bot.alive) return;
      if (bot.barrierTimer > 0) {
        spawnHitParticles(bot.x, bot.z, "#9ad7ff", 6);
        return;
      }
      if (bot.shieldActive) {
        bot.shieldActive = false;
        feedLine(`${TEAM_COLORS[bot.id].name}'s shield blocks the hit!`);
        spawnHitParticles(bot.x, bot.z, "#ffffff", 8);
        return;
      }
      let dmg = amount;
      if (bot.ironSkinTimer > 0) dmg *= 0.5;
      bot.hp -= dmg;
      bot.nameplate.redraw(Math.max(0, bot.hp) / bot.maxHp, true);
      spawnHitParticles(bot.x, bot.z, bot.css);
      if (bot.hp <= 0) eliminateBot(bot);
    }

    function eliminateBot(bot) {
      bot.alive = false;
      game.match.aliveCount--;
      feedLine(`${TEAM_COLORS[bot.id].name} has been eliminated!`);
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
        const winner = game.bots.find(b => b.alive);
        endMatch(winner);
      }
    }

    function endMatch(winner) {
      game.match.finished = true;
      game.betRing.visible = false;
      if (winner) {
        feedLine(`${TEAM_COLORS[winner.id].name} takes the win.`);
        setWinnerInfo({
          name: TEAM_COLORS[winner.id].name,
          color: winner.css,
          won: winner.id === game.bettedBotId,
        });
      }
    }

    function updateBotAI(bot, dt) {
      if (!bot.alive) return;
      if (bot.stunTimer > 0) return;
      const target = nearestEnemy(bot);
      if (!target) return;

      const dx = target.x - bot.x, dz = target.z - bot.z;
      const dist = Math.hypot(dx, dz) || 0.001;
      const ndx = dx / dist, ndz = dz / dist;

      const rangeNow = bot.weapon.range * (bot.rangeBoostTimer > 0 ? 1.5 : 1);
      const desired = rangeNow * 0.55;
      let moveX = 0, moveZ = 0;
      let speedMult = 1;
      if (bot.speedBoostTimer > 0) speedMult *= bot.speedMultValue;
      if (bot.slowTimer > 0) speedMult *= 0.5;
      const speed = 2.0 * speedMult;

      if (dist > desired + 1.2) {
        moveX += ndx; moveZ += ndz;
      } else if (dist < desired - 1.2) {
        moveX -= ndx; moveZ -= ndz;
      } else {
        bot.strafeTimer -= dt;
        if (bot.strafeTimer <= 0) { bot.strafeDir *= -1; bot.strafeTimer = rand(1.2, 2.6); }
        moveX += -ndz * bot.strafeDir;
        moveZ += ndx * bot.strafeDir;
      }

      obstacles.forEach(o => {
        const odx = bot.x - o.x, odz = bot.z - o.z;
        const od = Math.hypot(odx, odz);
        const margin = o.radius + 0.55;
        if (od < margin && od > 0.001) {
          const push = (margin - od) / margin;
          moveX += (odx / od) * push * 2.2;
          moveZ += (odz / od) * push * 2.2;
        }
      });

      const mlen = Math.hypot(moveX, moveZ) || 1;
      bot.x += (moveX / mlen) * speed * dt;
      bot.z += (moveZ / mlen) * speed * dt;

      const lim = ARENA_HALF - 0.6;
      bot.x = Math.max(-lim, Math.min(lim, bot.x));
      bot.z = Math.max(-lim, Math.min(lim, bot.z));

      bot.mesh.position.x = bot.x;
      bot.mesh.position.z = bot.z;
      bot.mesh.position.y = BOT_RADIUS + Math.abs(Math.sin(performance.now() * 0.006 + bot.id)) * 0.04;
      bot.nameplate.sprite.position.set(bot.x, 1.05, bot.z);

      if (mlen > 0.05) bot.mesh.rotation.y = Math.atan2(moveX, moveZ);

      if (bot.id === game.bettedBotId) game.betRing.position.set(bot.x, 0.04, bot.z);

      bot.fireCooldown -= dt;
      if (bot.fireCooldown <= 0 && dist < rangeNow + 1.5) {
        let cd = rand(bot.weapon.cdMin, bot.weapon.cdMax);
        if (bot.rapidTimer > 0) cd *= 0.3;
        bot.fireCooldown = cd;
        fireProjectile(bot, target);
      }
    }

    function updateProjectiles(dt) {
      for (let i = game.projectiles.length - 1; i >= 0; i--) {
        const p = game.projectiles[i];
        p.x += p.dx * p.speed * dt;
        p.z += p.dz * p.speed * dt;
        p.traveled += p.speed * dt;
        p.mesh.position.x = p.x;
        p.mesh.position.z = p.z;

        p.trailTimer -= dt;
        if (p.trailTimer <= 0) {
          p.trailTimer = 0.025;
          spawnTrailParticle(p.x, p.mesh.position.y, p.z, p.colorCss);
        }

        let resolved = false;
        for (const bot of game.bots) {
          if (!bot.alive || bot.id === p.owner) continue;
          const d = Math.hypot(bot.x - p.x, bot.z - p.z);
          if (d < p.hitRadius) {
            if (p.isRocket) explodeRocket(p.x, p.z, p.damage, p.colorCss);
            else damageBot(bot, p.damage);
            resolved = true;
            break;
          }
        }
        const outOfBounds = Math.abs(p.x) > ARENA_HALF + 1 || Math.abs(p.z) > ARENA_HALF + 1;
        if (!resolved && p.isRocket && (p.traveled > p.maxTravel || outOfBounds)) {
          explodeRocket(p.x, p.z, p.damage, p.colorCss);
          resolved = true;
        }
        if (resolved || (!p.isRocket && (p.traveled > p.maxTravel || outOfBounds))) {
          scene.remove(p.mesh);
          game.projectiles.splice(i, 1);
        }
      }
    }

    function updateParticles(dt) {
      for (let i = game.particles.length - 1; i >= 0; i--) {
        const pt = game.particles[i];
        pt.life += dt;
        if (pt.isTrail) {
          const k = Math.max(0, 1 - pt.life / pt.maxLife);
          pt.mesh.scale.set(k, k, k);
          pt.mesh.material.opacity = k * 0.7;
        } else {
          pt.mesh.position.x += pt.vx * dt;
          pt.mesh.position.z += pt.vz * dt;
          pt.vy -= 9 * dt;
          pt.mesh.position.y += pt.vy * dt;
          if (pt.mesh.position.y < 0.1) { pt.mesh.position.y = 0.1; pt.vy = 0; }
          const k = Math.max(0, 1 - pt.life / pt.maxLife);
          pt.mesh.scale.set(k, k, k);
        }
        if (pt.life >= pt.maxLife) {
          scene.remove(pt.mesh);
          game.particles.splice(i, 1);
        }
      }
    }

    function updateBoosts(dt) {
      game.bots.forEach(b => {
        b.speedBoostTimer = Math.max(0, b.speedBoostTimer - dt);
        b.damageBoostTimer = Math.max(0, b.damageBoostTimer - dt);
        b.barrierTimer = Math.max(0, b.barrierTimer - dt);
        b.ironSkinTimer = Math.max(0, b.ironSkinTimer - dt);
        b.stunTimer = Math.max(0, b.stunTimer - dt);
        b.slowTimer = Math.max(0, b.slowTimer - dt);
        b.rapidTimer = Math.max(0, b.rapidTimer - dt);
        b.rangeBoostTimer = Math.max(0, b.rangeBoostTimer - dt);
      });
      Object.keys(game.cardState).forEach(id => {
        const s = game.cardState[id];
        if (s.remaining > 0) s.remaining = Math.max(0, s.remaining - dt);
      });
    }

    /* ---- camera drag / zoom (manual orbit, no OrbitControls in r128) ---- */
    const dom = renderer.domElement;
    function startDrag(x, y) {
      game.cam.dragging = true; game.cam.lastX = x; game.cam.lastY = y;
      game.autoOrbit = false; setAutoOrbit(false);
    }
    function moveDrag(x, y) {
      if (!game.cam.dragging) return;
      const dx = x - game.cam.lastX, dy = y - game.cam.lastY;
      game.cam.lastX = x; game.cam.lastY = y;
      game.cam.theta -= dx * 0.005;
      game.cam.phi -= dy * 0.004;
      game.cam.phi = Math.max(0.35, Math.min(0.95, game.cam.phi));
    }
    function endDrag() { game.cam.dragging = false; }
    function onMouseDown(e) { startDrag(e.clientX, e.clientY); }
    function onMouseMove(e) { moveDrag(e.clientX, e.clientY); }
    function onTouchStart(e) { startDrag(e.touches[0].clientX, e.touches[0].clientY); }
    function onTouchMove(e) { moveDrag(e.touches[0].clientX, e.touches[0].clientY); }
    function onWheel(e) {
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

    function updateCamera(dt) {
      if (game.autoOrbit) game.cam.theta += dt * 0.1;
      let desired;
      if (game.followCam) {
        const bot = game.bots.find(b => b.id === game.bettedBotId);
        desired = (bot && bot.alive) ? new THREE.Vector3(bot.x, 0.5, bot.z) : new THREE.Vector3(0, 0.5, 0);
      } else {
        desired = new THREE.Vector3(0, 0.5, 0);
      }
      game.followTarget.lerp(desired, Math.min(1, dt * 4));
      const { theta, phi, radius } = game.cam;
      const x = game.followTarget.x + radius * Math.sin(phi) * Math.cos(theta);
      const z = game.followTarget.z + radius * Math.sin(phi) * Math.sin(theta);
      const y = game.followTarget.y + radius * Math.cos(phi);
      camera.position.set(x, y, z);
      camera.lookAt(game.followTarget);
    }

    /* ---- main loop ---- */
    let lastT = performance.now();
    let uiAccum = 0;
    let rafId;
    function animate() {
      rafId = requestAnimationFrame(animate);
      const now = performance.now();
      const dt = Math.min(0.05, (now - lastT) / 1000);
      lastT = now;

      updateCamera(dt);
      if (game.match.started && !game.match.finished) {
        game.bots.forEach(b => updateBotAI(b, dt));
        updateBoosts(dt);
      }
      updateProjectiles(dt);
      updateParticles(dt);

      uiAccum += dt;
      if (uiAccum > 0.15) {
        uiAccum = 0;
        setUiTick(t => (t + 1) % 1000000);
      }

      renderer.render(scene, camera);
    }

    game.api = { newMatch, startMatch, useCard };
    newMatch();
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
      if (mountEl.contains(renderer.domElement)) mountEl.removeChild(renderer.domElement);
      renderer.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------------- derived render data (read from the mutable game ref) ---------------- */
  const game = gameRef.current;
  const bots = game ? game.bots : [];
  const sortedBots = [...bots].sort((a, b) => {
    if (a.alive !== b.alive) return a.alive ? -1 : 1;
    return b.hp - a.hp;
  });
  const feedLines = game ? game.feed : [];
  const matchStarted = game ? game.match.started : false;
  const matchFinished = game ? game.match.finished : false;
  const aliveCount = game ? game.match.aliveCount : 4;

  function handlePickBot(i) { setSelectedBotId(i); }

  function handleStartMatch() {
    if (selectedBotId === null) return;
    const shuffled = [...CARD_POOL].sort(() => Math.random() - 0.5);
    const layout = shuffled.map(card => ({ card, dx: rand(-260, 260), dy: rand(-180, 180), rot: rand(-50, 50) }));
    setDraftLayout(layout);
    setDraftSelection([]);
    setDealt(false);
    setPhase("draft");
    requestAnimationFrame(() => requestAnimationFrame(() => setDealt(true)));
  }

  function handleToggleDraftCard(id) {
    setDraftSelection(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= 4) return prev;
      return [...prev, id];
    });
  }

  function handleConfirmHand() {
    if (draftSelection.length !== 4 || selectedBotId === null) return;
    const chosen = draftSelection.map(id => CARD_POOL.find(c => c.id === id));
    setActiveCards(chosen);
    setBettedBotId(selectedBotId);
    gameRef.current.api.startMatch(selectedBotId, chosen);
    setPhase("match");
  }

  function handleRebet() {
    gameRef.current.api.newMatch();
    setPhase("betting");
    setSelectedBotId(null);
    setBettedBotId(null);
    setDraftSelection([]);
    setActiveCards([]);
    setWinnerInfo(null);
  }

  function toggleAutoOrbit() {
    const next = !autoOrbit;
    setAutoOrbit(next);
    if (gameRef.current) gameRef.current.autoOrbit = next;
  }
  function toggleFollowCam() {
    const next = !followCam;
    setFollowCam(next);
    if (gameRef.current) {
      gameRef.current.followCam = next;
      if (next) gameRef.current.cam.radius = Math.min(gameRef.current.cam.radius, 9);
    }
  }

  return (
    <div style={{ position: "relative", width: "100%", height: "100vh", overflow: "hidden", background: "linear-gradient(180deg, #6fc8ff, #2f7fd6)", fontFamily: "'Space Mono', monospace", color: "#f3f6ff" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700;800&family=Space+Mono:wght@400;700&display=swap');
        .panel{ background:#171b34ee; border:3px solid #0b0e1f; border-radius:14px; padding:10px 14px; box-shadow:0 4px 0 #00000033; }
        .lb-row{ display:flex; align-items:center; gap:8px; padding:3px 0; font-size:11px; }
        .lb-dot{ width:12px; height:12px; border-radius:50%; flex:none; border:2px solid #0b0e1f; }
        .lb-hpbar-bg{ width:55px; height:7px; background:#ffffff1c; border-radius:4px; overflow:hidden; flex:none; }
        .lb-hpbar{ height:100%; transition:width .2s ease; }
        .lb-row.dead{ opacity:0.35; text-decoration:line-through; }
        button.gamebtn{ font-family:'Baloo 2'; font-size:13px; letter-spacing:1px; font-weight:700; background:#ffffff; color:#171b34; border:3px solid #0b0e1f; border-radius:10px; padding:8px 18px; cursor:pointer; box-shadow:0 4px 0 #00000044; transition:transform .1s ease; }
        button.gamebtn:hover{ transform:translateY(-2px); }
        button.gamebtn:active{ transform:translateY(1px); box-shadow:0 2px 0 #00000044; }
        button.gamebtn:disabled{ opacity:0.4; cursor:not-allowed; transform:none; }
        button.gamebtn.primary{ background:#ffd23f; }
        button.gamebtn.ghost{ background:#ffffff22; color:#fff; }
        .help-card{ width:84px; background:#171b34ee; border:3px solid #0b0e1f; border-radius:12px; padding:8px 6px 7px; text-align:center; cursor:pointer; position:relative; box-shadow:0 4px 0 #00000033; transition:transform .12s ease; }
        .help-card:hover{ transform:translateY(-3px); }
        .help-card.disabled{ cursor:not-allowed; filter:grayscale(0.7); opacity:0.55; transform:none; }
        .bet-card{ width:190px; background:#171b34ee; border:4px solid #0b0e1f; border-radius:16px; padding:14px 12px; cursor:pointer; text-align:center; box-shadow:0 6px 0 #00000033; transition:transform .12s ease, border-color .12s ease; }
        .bet-card:hover{ transform:translateY(-4px); }
        .bet-card.selected{ border-color:#ffd23f; transform:translateY(-6px); box-shadow:0 8px 0 #00000044, 0 0 18px #ffd23f88; }
        .pip{ width:11px; height:6px; border-radius:2px; background:#ffffff22; }
        .pip.filled{ background:#ffd23f; }
        .draft-card{ width:86px; height:112px; perspective:700px; cursor:pointer; }
        .draft-card.locked{ cursor:not-allowed; opacity:0.35; }
        .card-inner{ position:relative; width:100%; height:100%; transition:transform .5s; transform-style:preserve-3d; }
        .draft-card.flipped .card-inner{ transform:rotateY(180deg); }
        .card-face{ position:absolute; inset:0; backface-visibility:hidden; border-radius:12px; border:3px solid #0b0e1f; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:4px; text-align:center; }
        .card-back{ background:linear-gradient(145deg,#2a3360,#171b34); }
        .card-back::after{ content:'?'; font-family:'Baloo 2'; font-size:30px; color:#ffd23f; }
        .card-front{ background:#171b34ee; transform:rotateY(180deg); }
        .draft-card.selected .card-face{ border-color:#ffd23f; box-shadow:0 0 14px #ffd23f88; }
        .winner-banner{ position:absolute; top:40%; left:50%; transform:translate(-50%,-50%); font-family:'Baloo 2'; font-weight:800; font-size:38px; letter-spacing:1px; text-align:center; -webkit-text-stroke:3px #1b1530; text-shadow:0 4px 0 #00000055; }
        .feed::-webkit-scrollbar{ width:4px; }
        .feed::-webkit-scrollbar-thumb{ background:#ffffff33; border-radius:4px; }
      `}</style>

      <div ref={mountRef} style={{ position: "absolute", inset: 0 }} />

      {phase === "betting" && (
        <div style={overlayStyle}>
          <div style={titleStyle}>ORB BRAWL ARENA</div>
          <div style={subStyle}>PLACE YOUR BET — PICK A BOT TO BACK</div>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center", maxWidth: 900 }}>
            {TEAM_COLORS.map((team, i) => (
              <div key={i} className={`bet-card${selectedBotId === i ? " selected" : ""}`} onClick={() => handlePickBot(i)}>
                <div style={{ width: 54, height: 54, borderRadius: "50%", margin: "0 auto 8px", border: "3px solid #0b0e1f", background: team.css }} />
                <div style={{ fontFamily: "'Baloo 2'", fontWeight: 800, fontSize: 16, letterSpacing: 1 }}>{team.name}</div>
                <div style={{ fontSize: 11, color: "#9aa3c9", margin: "3px 0 10px" }}>{team.weapon.icon} {team.weapon.label}</div>
                {["s", "d", "r"].map(k => (
                  <div key={k} style={{ display: "flex", alignItems: "center", gap: 6, margin: "3px 0", fontSize: 9, color: "#9aa3c9" }}>
                    <div style={{ width: 14, textAlign: "left", fontWeight: 700 }}>{k.toUpperCase()}</div>
                    <div style={{ display: "flex", gap: 2 }}>
                      {pipsArr(team.weapon.pips[k]).map((filled, pi) => (
                        <div key={pi} className={`pip${filled ? " filled" : ""}`} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div style={{ marginTop: 22, display: "flex", gap: 14, alignItems: "center" }}>
            <div style={{ fontSize: 11, color: "#dbe4ff", letterSpacing: 1 }}>
              {selectedBotId === null ? "no bot selected yet" : `betting on ${TEAM_COLORS[selectedBotId].name}`}
            </div>
            <button className="gamebtn primary" disabled={selectedBotId === null} onClick={handleStartMatch}>START MATCH</button>
          </div>
        </div>
      )}

      {phase === "draft" && (
        <div style={overlayStyle}>
          <div style={titleStyle}>CHOOSE YOUR HELP CARDS</div>
          <div style={subStyle}>TAP 4 OF THE 16 CARDS TO BUILD YOUR HAND</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 86px)", gap: 12, justifyContent: "center" }}>
            {draftLayout.map(({ card, dx, dy, rot }, i) => {
              const selected = draftSelection.includes(card.id);
              const locked = !selected && draftSelection.length >= 4;
              return (
                <div
                  key={card.id}
                  className={`draft-card${selected ? " selected flipped" : ""}${locked ? " locked" : ""}`}
                  style={{
                    transform: dealt ? "translate(0,0) rotate(0deg)" : `translate(${dx}px,${dy}px) rotate(${rot}deg)`,
                    opacity: dealt ? 1 : 0,
                    transition: `transform .6s cubic-bezier(.2,.8,.2,1) ${i * 0.04}s, opacity .4s ease ${i * 0.04}s`,
                  }}
                  onClick={() => !locked && handleToggleDraftCard(card.id)}
                >
                  <div className="card-inner">
                    <div className="card-face card-back" />
                    <div className="card-face card-front">
                      <div style={{ fontSize: 22 }}>{card.icon}</div>
                      <div style={{ fontFamily: "'Baloo 2'", fontSize: 9, color: "#ffd23f", marginTop: 3, letterSpacing: 0.5 }}>{card.label}</div>
                      <div style={{ fontSize: 7, color: "#9aa3c9", marginTop: 2, lineHeight: 1.25 }}>{card.desc}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 22, display: "flex", gap: 14, alignItems: "center" }}>
            <div style={{ fontSize: 11, color: "#dbe4ff", letterSpacing: 1 }}>{draftSelection.length} / 4 selected</div>
            <button className="gamebtn primary" disabled={draftSelection.length !== 4} onClick={handleConfirmHand}>CONFIRM HAND</button>
          </div>
        </div>
      )}

      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 16 }}>
        <div style={{ pointerEvents: "auto" }}>
          <div style={titleStyle}>ORB BRAWL ARENA</div>
          <div style={subStyle}>SPECTATOR MODE · BOTS FIGHT THEMSELVES · DRAG TO ORBIT · SCROLL TO ZOOM</div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginTop: 10 }}>
            <div className="panel" style={{ width: 230 }}>
              <div style={{ fontFamily: "'Baloo 2'", fontSize: 13, color: "#ffd23f", letterSpacing: 1, marginBottom: 6 }}>STANDINGS</div>
              {sortedBots.map(b => (
                <div key={b.id} className={`lb-row${b.alive ? "" : " dead"}`}>
                  <div className="lb-dot" style={{ background: b.css }} />
                  <div style={{ flex: 1, fontWeight: 700 }}>{TEAM_COLORS[b.id].name}</div>
                  <div style={{ fontSize: 13 }}>{b.id === bettedBotId ? "⭐" : ""}</div>
                  <div className="lb-hpbar-bg"><div className="lb-hpbar" style={{ width: `${Math.max(0, b.hp)}%`, background: b.css }} /></div>
                </div>
              ))}
            </div>
            <div className="panel" style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "'Baloo 2'", fontSize: 14, color: "#ffd23f", letterSpacing: 1 }}>
                {matchFinished ? "MATCH OVER" : matchStarted ? `BOTS REMAINING: ${aliveCount}` : "BOTS REMAINING: 4"}
              </div>
              <div style={{ fontSize: 10, color: "#9aa3c9", marginTop: 2 }}>
                {matchFinished ? "tap REBET to play again" : matchStarted ? `you bet on ${bettedBotId !== null ? TEAM_COLORS[bettedBotId].name : ""}` : "place a bet to begin"}
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 16, pointerEvents: "auto" }}>
          <div className="panel feed" style={{ width: 320, maxHeight: 120, overflowY: "auto", fontSize: 11, lineHeight: 1.7 }}>
            <div style={{ fontFamily: "'Baloo 2'", fontSize: 12, color: "#ffd23f", letterSpacing: 1, marginBottom: 4 }}>// LIVE FEED</div>
            {feedLines.map((line, i) => (<div key={i} style={{ color: "#dfe4ff" }}>{line}</div>))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
            <button className="gamebtn primary" onClick={handleRebet}>REBET / NEW MATCH</button>
            <button className="gamebtn ghost" onClick={toggleAutoOrbit}>AUTO-ORBIT: {autoOrbit ? "ON" : "OFF"}</button>
            <button className="gamebtn ghost" onClick={toggleFollowCam}>FOLLOW CAM: {followCam ? "ON" : "OFF"}</button>
            <div style={{ fontSize: 9, color: "#ffffffaa", textAlign: "right", letterSpacing: 1 }}>drag = rotate · wheel = zoom</div>
          </div>
        </div>
      </div>

      {phase === "match" && (
        <div style={{ position: "absolute", bottom: 128, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 10, zIndex: 5 }}>
          {activeCards.map(card => {
            const remaining = game && game.cardState[card.id] ? game.cardState[card.id].remaining : 0;
            const bot = game ? game.bots.find(b => b.id === bettedBotId) : null;
            const disabled = !game || matchFinished || !bot || !bot.alive || remaining > 0;
            return (
              <div key={card.id} className={`help-card${disabled ? " disabled" : ""}`} onClick={() => !disabled && gameRef.current.api.useCard(card.id)}>
                <div style={{ fontSize: 24, lineHeight: 1 }}>{card.icon}</div>
                <div style={{ fontFamily: "'Baloo 2'", fontSize: 10, letterSpacing: 0.5, color: "#ffd23f", marginTop: 3 }}>{card.label}</div>
                <div style={{ fontSize: 8, color: "#9aa3c9", marginTop: 2, lineHeight: 1.3 }}>{card.desc}</div>
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

      {winnerInfo && phase === "match" && (
        <div className="winner-banner" style={{ color: winnerInfo.color }}>
          {winnerInfo.name} WINS!
          <div style={{ fontFamily: "'Baloo 2'", fontSize: 16, marginTop: 6, WebkitTextStroke: "1.5px #1b1530", color: winnerInfo.won ? "#7CFF8A" : "#ff7a7a" }}>
            {winnerInfo.won ? "YOU WON YOUR BET! 🎉" : "YOUR BOT LOST THE BET"}
          </div>
        </div>
      )}
    </div>
  );
}