export interface ReplayFrame {
  tick: number;
  timestamp: number;
  bots: Array<{
    id: string | number;
    x: number;
    z: number;
    health: number;
    maxHealth: number;
    kills: number;
    score: number;
    isDead: boolean;
  }>;
}

export interface ReplayEvent {
  timestamp: number;
  type: string;
  data: any;
}

export interface ReplayData {
  matchId: string;
  mode: string;
  startTime: number;
  frames: ReplayFrame[];
  events: ReplayEvent[];
  finalResult: { winnerId: string | null; botScores: Record<string, number> } | null;
}

export class ReplayRecorder {
  frames: ReplayFrame[] = [];
  events: ReplayEvent[] = [];
  startTime: number;
  matchId: string;
  mode: string;
  lastTick = 0;
  finalResult: ReplayData["finalResult"] | null = null;

  constructor(matchId: string, mode: string) {
    this.matchId = matchId;
    this.mode = mode;
    this.startTime = Date.now();
  }

  recordFrame(tick: number, bots: ReplayFrame["bots"]): void {
    this.lastTick = tick;
    this.frames.push({
      tick,
      timestamp: Date.now() - this.startTime,
      bots: bots.map((b) => ({ ...b })),
    });
  }

  recordEvent(type: string, data: any): void {
    this.events.push({
      timestamp: Date.now() - this.startTime,
      type,
      data,
    });
  }

  setFinalResult(result: ReplayData["finalResult"]): void {
    this.finalResult = result;
  }

  getData(): ReplayData {
    const lastFrame = this.frames[this.frames.length - 1];
    let botScores: Record<string, number> = {};
    if (lastFrame) {
      for (const bot of lastFrame.bots) {
        botScores[String(bot.id)] = bot.score;
      }
    }
    let winnerId: string | null = null;
    if (this.finalResult?.winnerId) {
      winnerId = this.finalResult.winnerId;
    } else if (lastFrame) {
      const alive = lastFrame.bots.filter((b) => !b.isDead);
      if (alive.length === 1) winnerId = String(alive[0].id);
    }
    return {
      matchId: this.matchId,
      mode: this.mode,
      startTime: this.startTime,
      frames: this.frames,
      events: this.events,
      finalResult: {
        winnerId,
        botScores: this.finalResult?.botScores ?? botScores,
      },
    };
  }

  toJSON(): string {
    const data = this.getData();
    return JSON.stringify(data);
  }

  static fromJSON(json: string): ReplayRecorder {
    const data: ReplayData = JSON.parse(json);
    const recorder = new ReplayRecorder(data.matchId, data.mode);
    recorder.startTime = data.startTime;
    recorder.frames = data.frames;
    recorder.events = data.events;
    if (data.frames.length > 0) {
      recorder.lastTick = data.frames[data.frames.length - 1].tick;
    }
    return recorder;
  }
}

export class ReplayPlayer {
  data: ReplayData;
  currentIndex = 0;
  startTime = 0;
  playing = false;
  speed = 1;
  onFrame: ((frame: ReplayFrame, events: ReplayEvent[]) => void) | null = null;
  onFinish: (() => void) | null = null;

  constructor(data: ReplayData) {
    this.data = data;
  }

  start(): void {
    this.currentIndex = 0;
    this.startTime = performance.now();
    this.playing = true;
  }

  pause(): void {
    this.playing = false;
  }

  resume(): void {
    this.playing = true;
  }

  seekTo(timestamp: number): void {
    let idx = this.data.frames.length - 1;
    for (let i = 0; i < this.data.frames.length; i++) {
      if (this.data.frames[i].timestamp >= timestamp) {
        idx = i;
        break;
      }
    }
    this.currentIndex = idx;
    if (this.playing) {
      const frame = this.data.frames[idx];
      if (frame) {
        this.startTime = performance.now() - frame.timestamp / this.speed;
      }
    }
  }

  getCurrentFrame(): ReplayFrame | null {
    if (this.currentIndex < 0 || this.currentIndex >= this.data.frames.length) return null;
    return this.data.frames[this.currentIndex];
  }

  getCurrentEvents(): ReplayEvent[] {
    if (this.currentIndex < 0 || this.currentIndex >= this.data.frames.length) return [];
    const currentFrame = this.data.frames[this.currentIndex];
    const frameTimestamp = currentFrame.timestamp;
    const prevTimestamp = this.currentIndex > 0
      ? this.data.frames[this.currentIndex - 1].timestamp
      : 0;
    return this.data.events.filter(
      (e) => e.timestamp >= prevTimestamp && e.timestamp < frameTimestamp,
    );
  }

  update(currentTime: number): boolean {
    if (!this.playing || this.data.frames.length === 0) return false;

    const elapsed = (currentTime - this.startTime) * this.speed;
    let nextIdx = this.currentIndex;

    for (let i = this.currentIndex; i < this.data.frames.length; i++) {
      if (this.data.frames[i].timestamp <= elapsed) {
        nextIdx = i;
      } else {
        break;
      }
    }

    const advanced = nextIdx > this.currentIndex;
    this.currentIndex = nextIdx;

    if (advanced || this.currentIndex === 0) {
      const frame = this.data.frames[this.currentIndex];
      const events = this.getCurrentEvents();
      if (this.onFrame) {
        this.onFrame(frame, events);
      }
    }

    if (this.currentIndex >= this.data.frames.length - 1) {
      this.playing = false;
      if (this.onFinish) {
        this.onFinish();
      }
      return true;
    }

    return false;
  }

  getProgress(): number {
    if (this.data.frames.length === 0) return 0;
    return this.currentIndex / (this.data.frames.length - 1);
  }
}
