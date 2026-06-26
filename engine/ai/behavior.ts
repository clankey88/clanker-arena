import { EngineBot, EngineState, EngineEvent, PRNG } from "../core.ts";

export function behave(bot: EngineBot, state: EngineState, rng: PRNG, emit: (e: EngineEvent) => void, timeStep: number) {
  const visionRadius = bot.stats.vision * 10 + 20;
  
  let nearestEnemy: EngineBot | null = null;
  let minDist = Infinity;
  for (const other of state.bots) {
    if (other.id === bot.id || other.isDead) continue;
    const dx = other.x - bot.x;
    const dy = other.y - bot.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < visionRadius && dist < minDist) {
      minDist = dist;
      nearestEnemy = other;
    }
  }

  const attackRange = bot.stats.combat * 5 + 10;
  const attackDamage = bot.stats.combat * 2 + 5;
  const moveSpeed = bot.stats.movement * 2 + 10;
  
  if (nearestEnemy) {
    bot.targetX = nearestEnemy.x;
    bot.targetY = nearestEnemy.y;
    
    if (minDist <= attackRange) {
      if (bot.cooldown <= 0) {
        bot.cooldown = 1.0; 
        nearestEnemy.health -= attackDamage;
        emit({ type: "attack", botId: bot.id, targetId: nearestEnemy.id, damage: attackDamage });
        
        if (nearestEnemy.health <= 0) {
          nearestEnemy.health = 0;
          nearestEnemy.isDead = true;
          nearestEnemy.respawnTimer = 5.0; 
          bot.kills++;
          bot.score += 10; 
          emit({ type: "kill", killerId: bot.id, victimId: nearestEnemy.id });
        }
      }
    } else {
      const angle = Math.atan2(nearestEnemy.y - bot.y, nearestEnemy.x - bot.x);
      bot.x += Math.cos(angle) * moveSpeed * timeStep;
      bot.y += Math.sin(angle) * moveSpeed * timeStep;
      emit({ type: "move", botId: bot.id, x: bot.x, y: bot.y });
    }
  } else {
    if (bot.targetX === undefined || bot.targetY === undefined || rng.next() < 0.05) {
       bot.targetX = rng.range(0, state.mapWidth);
       bot.targetY = rng.range(0, state.mapHeight);
    }
    
    if (state.mode === "King of the Hill") {
       const hill = state.modeState?.hill;
       if (hill && bot.stats.thinking > 3) {
         bot.targetX = hill.x;
         bot.targetY = hill.y;
       }
    }

    const dx = bot.targetX - bot.x;
    const dy = bot.targetY - bot.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 1) {
      const angle = Math.atan2(dy, dx);
      bot.x += Math.cos(angle) * moveSpeed * timeStep;
      bot.y += Math.sin(angle) * moveSpeed * timeStep;
      emit({ type: "move", botId: bot.id, x: bot.x, y: bot.y });
    }
  }
  
  bot.x = Math.max(0, Math.min(state.mapWidth, bot.x));
  bot.y = Math.max(0, Math.min(state.mapHeight, bot.y));
}
