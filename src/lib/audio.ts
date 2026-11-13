/**
 * MOTEUR SONORE — tout est synthétisé dans le navigateur (Web Audio API).
 * Aucun fichier audio : rien à télécharger, rien à créditer.
 *
 * - une ambiance ("mood") par chapitre, avec fondu enchaîné de 1,5 s ;
 * - des micro-sons d'interface (tick, buzz, whoosh…) ;
 * - un piano synthétique avec réverbération.
 *
 * Le contexte audio n'est créé qu'après un premier geste du visiteur.
 */
import { local } from "./store";

export type Mood =
  | "silence"
  | "boot"
  | "identite"
  | "strates"
  | "frequences"
  | "fragment"
  | "chronique"
  | "fichier"
  | "journal"
  | "connexion"
  | "deep";

export type Sfx =
  | "tick"
  | "whisper"
  | "buzz"
  | "whoosh"
  | "bip"
  | "crack"
  | "tictac"
  | "door"
  | "decode"
  | "brouhaha"
  | "cut"
  | "explode"
  | "rec";

type MoodHandle = { out: GainNode; wet: GainNode; stop: () => void };

const VOLUME = 0.4;
const FADE = 1.5;

class AudioEngine {
  ctx: AudioContext | null = null;
  private master!: GainNode;
  private bus!: GainNode;
  private reverb!: ConvolverNode;
  private noiseBuf!: AudioBuffer;
  private current: { name: Mood; handle: MoodHandle } | null = null;
  private wanted: Mood = "silence";
  private resumeMood: Mood | null = null;
  muted = false;
  private listeners = new Set<() => void>();

  constructor() {
    if (typeof window !== "undefined") this.muted = local.get("sys.muted") === "1";
  }

  get ready() {
    return !!this.ctx && this.ctx.state === "running";
  }

  subscribe(fn: () => void) {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }
  private emit() {
    this.listeners.forEach((f) => f());
  }

  /** À appeler dans un gestionnaire de clic / touche. */
  unlock() {
    if (typeof window === "undefined") return;
    if (!this.ctx) {
      const AC: typeof AudioContext | undefined =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      try {
        this.ctx = new AC();
      } catch {
        return;
      }
      const c = this.ctx;
      this.master = c.createGain();
      this.master.gain.value = this.muted ? 0 : VOLUME;
      const limiter = c.createDynamicsCompressor();
      limiter.threshold.value = -10;
      limiter.ratio.value = 6;
      this.master.connect(limiter).connect(c.destination);
      this.bus = c.createGain();
      this.bus.connect(this.master);
      this.noiseBuf = this.makeNoise(2);
      this.reverb = c.createConvolver();
      this.reverb.buffer = this.makeImpulse(3.2, 2.4);
      const wet = c.createGain();
      wet.gain.value = 0.55;
      this.reverb.connect(wet).connect(this.bus);
      this.emit();
    }
    if (this.ctx.state === "suspended") {
      void this.ctx.resume().then(() => this.emit());
    }
    if (this.wanted !== (this.current?.name ?? "silence")) this.setMood(this.wanted);
  }

  setMuted(m: boolean) {
    this.muted = m;
    local.set("sys.muted", m ? "1" : "0");
    if (this.ctx) {
      const t = this.ctx.currentTime;
      this.master.gain.cancelScheduledValues(t);
      this.master.gain.setTargetAtTime(m ? 0 : VOLUME, t, 0.08);
    }
    this.emit();
  }

  /** Coupe net tout le son pendant `ms` millisecondes (frame 4 du Fragment). */
  silence(ms: number) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.bus.gain.cancelScheduledValues(t);
    this.bus.gain.setValueAtTime(0, t);
    this.bus.gain.setValueAtTime(0, t + ms / 1000);
    this.bus.gain.linearRampToValueAtTime(1, t + ms / 1000 + 0.6);
  }

  /* ------------------------------ Ambiances ------------------------------ */

  setMood(name: Mood, fade = FADE) {
    this.wanted = name;
    if (!this.ctx) return;
    if (this.current?.name === name) return;
    const c = this.ctx;
    const t = c.currentTime;
    if (this.current) {
      const old = this.current.handle;
      old.out.gain.cancelScheduledValues(t);
      old.out.gain.setValueAtTime(old.out.gain.value, t);
      old.out.gain.linearRampToValueAtTime(0, t + fade);
      old.wet.gain.cancelScheduledValues(t);
      old.wet.gain.setValueAtTime(old.wet.gain.value, t);
      old.wet.gain.linearRampToValueAtTime(0, t + fade);
      window.setTimeout(() => old.stop(), fade * 1000 + 120);
      this.current = null;
    }
    const handle = this.build(name);
    if (!handle) return;
    handle.out.gain.setValueAtTime(0, t);
    handle.out.gain.linearRampToValueAtTime(1, t + fade);
    handle.wet.gain.setValueAtTime(0, t);
    handle.wet.gain.linearRampToValueAtTime(1, t + fade);
    this.current = { name, handle };
  }

  /** Mode profond : remplace temporairement l'ambiance. */
  deep(on: boolean) {
    if (on) {
      this.resumeMood = this.wanted;
      this.setMood("deep", 0.3);
    } else if (this.resumeMood) {
      this.setMood(this.resumeMood, 1);
      this.resumeMood = null;
    }
  }

  private build(name: Mood): MoodHandle | null {
    const c = this.ctx!;
    const out = c.createGain();
    out.connect(this.bus);
    // Départ vers la réverbération, fondu en même temps que l'ambiance.
    const wet = c.createGain();
    wet.connect(this.reverb);
    const nodes: AudioScheduledSourceNode[] = [];
    const timers: number[] = [];
    const osc = (type: OscillatorType, freq: number, gain: number, dest: AudioNode = out, detune = 0) => {
      const o = c.createOscillator();
      o.type = type;
      o.frequency.value = freq;
      o.detune.value = detune;
      const g = c.createGain();
      g.gain.value = gain;
      o.connect(g).connect(dest);
      o.start();
      nodes.push(o);
      return { o, g };
    };
    const lfo = (freq: number, depth: number, param: AudioParam) => {
      const o = c.createOscillator();
      o.frequency.value = freq;
      const g = c.createGain();
      g.gain.value = depth;
      o.connect(g).connect(param);
      o.start();
      nodes.push(o);
    };
    const noise = (gain: number, type: BiquadFilterType, freq: number, q = 0.7, dest: AudioNode = out) => {
      const s = c.createBufferSource();
      s.buffer = this.noiseBuf;
      s.loop = true;
      const f = c.createBiquadFilter();
      f.type = type;
      f.frequency.value = freq;
      f.Q.value = q;
      const g = c.createGain();
      g.gain.value = gain;
      s.connect(f).connect(g).connect(dest);
      s.start();
      nodes.push(s);
      return { f, g };
    };
    const every = (fn: () => void, min: number, max = min) => {
      const loop = () => {
        fn();
        timers.push(window.setTimeout(loop, min + Math.random() * (max - min)));
      };
      timers.push(window.setTimeout(loop, min * 0.5));
    };
    const stop = () => {
      timers.forEach((t) => window.clearTimeout(t));
      nodes.forEach((n) => {
        try {
          n.stop();
        } catch {
          /* déjà arrêté */
        }
      });
      out.disconnect();
      wet.disconnect();
    };

    switch (name) {
      case "silence":
      case "fragment":
        break;

      case "boot": {
        osc("sine", 36, 0.5);
        osc("sine", 72, 0.14);
        noise(0.012, "lowpass", 1400);
        every(() => this.blip(out, 2600, 0.012, 0.035, "square"), 900);
        break;
      }

      case "identite": {
        osc("sine", 55, 0.34);
        const lp = c.createBiquadFilter();
        lp.type = "lowpass";
        lp.frequency.value = 380;
        lp.Q.value = 2;
        lfo(0.05, 160, lp.frequency);
        const pad = c.createGain();
        pad.gain.value = 0.5;
        lp.connect(pad);
        pad.connect(out);
        pad.connect(wet);
        // La mineur ouvert : nappe mélancolique
        [110, 164.81, 220, 261.63].forEach((f, i) => {
          osc("sawtooth", f, 0.035, lp, -7);
          osc("sawtooth", f, 0.035, lp, 7 + i);
        });
        break;
      }

      case "strates": {
        const shaper = c.createWaveShaper();
        const curve = new Float32Array(512);
        for (let i = 0; i < 512; i++) {
          const x = (i / 511) * 2 - 1;
          curve[i] = Math.tanh(x * 4);
        }
        shaper.curve = curve;
        const lp = c.createBiquadFilter();
        lp.type = "lowpass";
        lp.frequency.value = 150;
        const g = c.createGain();
        g.gain.value = 0.22;
        shaper.connect(lp).connect(g).connect(out);
        lfo(0.22, 0.09, g.gain);
        osc("sawtooth", 41.2, 0.5, shaper);
        osc("sine", 41.2, 0.25);
        const send = wet;
        every(
          () => this.blip(send, 2400 + Math.random() * 4200, 0.07, 0.016, "sine"),
          260,
          1300,
        );
        break;
      }

      case "frequences": {
        osc("sine", 55, 0.26);
        const { o } = osc("sine", 220, 0.03);
        lfo(0.13, 14, o.frequency);
        lfo(5.5, 3, o.frequency);
        const { o: o2 } = osc("triangle", 330, 0.012);
        lfo(0.09, 20, o2.frequency);
        const scale = [220, 261.63, 329.63, 392, 440, 523.25, 659.25];
        every(() => this.piano(scale[Math.floor(Math.random() * scale.length)], 0.1, out), 5200, 9000);
        break;
      }

      case "chronique":
      case "journal": {
        osc("sine", 49, 0.36);
        osc("sine", 98, 0.05);
        const { g } = noise(0.035, "bandpass", 520, 0.9);
        lfo(0.11, 0.03, g.gain);
        const { g: g2 } = noise(0.01, "highpass", 4200, 0.5);
        lfo(0.07, 0.009, g2.gain);
        break;
      }

      case "fichier": {
        osc("sine", 58, 0.24);
        osc("sine", 116, 0.035);
        every(
          () => {
            const n = 3 + Math.floor(Math.random() * 5);
            for (let i = 0; i < n; i++) {
              window.setTimeout(
                () => this.blip(out, 1700 + Math.random() * 900, 0.014, 0.016, "square"),
                i * 55,
              );
            }
          },
          2200,
          4600,
        );
        break;
      }

      case "connexion": {
        osc("sine", 55, 0.1);
        const notes = [220, 261.63, 329.63, 392, 329.63, 440, 261.63, 196];
        let i = 0;
        every(() => this.piano(notes[i++ % notes.length], 0.2, out), 4000);
        break;
      }

      case "deep": {
        // 15 Hz est sous le seuil d'audition : on le fait "sentir" en modulant un grave.
        const { g } = osc("sine", 30, 0.5);
        lfo(15, 0.3, g.gain);
        osc("sine", 45, 0.2);
        every(() => {
          this.thump(out, 0.9);
          window.setTimeout(() => this.thump(out, 0.55), 180);
        }, 1000);
        break;
      }
    }
    return { out, wet, stop };
  }

  /* ------------------------------ Briques ------------------------------ */

  private blip(dest: AudioNode, freq: number, dur: number, gain: number, type: OscillatorType) {
    const c = this.ctx;
    if (!c) return;
    const t = c.currentTime;
    const o = c.createOscillator();
    o.type = type;
    o.frequency.value = freq;
    const g = c.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(dest);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  private thump(dest: AudioNode, gain: number) {
    const c = this.ctx;
    if (!c) return;
    const t = c.currentTime;
    const o = c.createOscillator();
    o.frequency.setValueAtTime(70, t);
    o.frequency.exponentialRampToValueAtTime(34, t + 0.14);
    const g = c.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
    o.connect(g).connect(dest);
    o.start(t);
    o.stop(t + 0.25);
  }

  private burst(
    dur: number,
    gain: number,
    type: BiquadFilterType,
    f0: number,
    f1 = f0,
    q = 1,
    dest?: AudioNode,
  ) {
    const c = this.ctx;
    if (!c) return;
    const t = c.currentTime;
    const s = c.createBufferSource();
    s.buffer = this.noiseBuf;
    s.loopStart = Math.random();
    const f = c.createBiquadFilter();
    f.type = type;
    f.Q.value = q;
    f.frequency.setValueAtTime(f0, t);
    if (f1 !== f0) f.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(gain, t + Math.min(0.02, dur * 0.3));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f).connect(g).connect(dest ?? this.master);
    s.start(t, Math.random() * 1.5);
    s.stop(t + dur + 0.05);
  }

  /** Note de piano synthétique : partiels sinusoïdaux + marteau + réverbération. */
  piano(freq: number, gain = 0.2, dest?: AudioNode, dur = 2.2) {
    const c = this.ctx;
    if (!c) return;
    const t = c.currentTime;
    const out = c.createGain();
    out.gain.value = gain;
    out.connect(dest ?? this.master);
    const send = c.createGain();
    send.gain.value = 0.9;
    out.connect(send).connect(this.reverb);
    const partials = [1, 2.003, 3.01, 4.02, 5.04];
    const amps = [1, 0.42, 0.2, 0.1, 0.05];
    partials.forEach((p, i) => {
      const o = c.createOscillator();
      o.type = "sine";
      o.frequency.value = freq * p;
      const g = c.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(amps[i], t + 0.006);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur / (1 + i * 0.7));
      o.connect(g).connect(out);
      o.start(t);
      o.stop(t + dur + 0.1);
    });
    this.burst(0.03, 0.08 * gain * 4, "bandpass", freq * 6, freq * 6, 0.8, out);
    window.setTimeout(() => out.disconnect(), (dur + 3.5) * 1000);
  }

  /* ------------------------------ Micro-sons ------------------------------ */

  sfx(name: Sfx) {
    const c = this.ctx;
    if (!c || c.state !== "running") return;
    const m = this.master;
    switch (name) {
      case "tick":
        this.burst(0.05, 0.22, "bandpass", 2300, 1500, 2.5);
        this.blip(m, 1150, 0.03, 0.05, "square");
        break;
      case "whisper":
        this.burst(0.02, 0.035, "highpass", 6500);
        break;
      case "buzz":
        this.blip(m, 55, 0.2, 0.16, "square");
        this.blip(m, 58.5, 0.2, 0.12, "sawtooth");
        this.burst(0.2, 0.05, "bandpass", 900, 500, 4);
        break;
      case "whoosh":
        this.burst(0.34, 0.26, "bandpass", 280, 4200, 1.4);
        this.blip(m, 90, 0.3, 0.1, "sine");
        break;
      case "bip":
        this.blip(m, 110, 0.12, 0.35, "sine");
        break;
      case "crack":
        this.burst(0.2, 0.4, "lowpass", 6000, 300, 0.7);
        this.blip(m, 160, 0.05, 0.2, "square");
        break;
      case "tictac":
        [0, 400, 800].forEach((d, i) =>
          window.setTimeout(() => {
            this.burst(0.03, 0.2, "bandpass", i % 2 ? 1500 : 2100, 1200, 6);
          }, d),
        );
        break;
      case "door":
        this.burst(0.42, 0.22, "lowpass", 200, 1800, 2);
        this.blip(m, 82, 0.4, 0.22, "sine");
        break;
      case "decode":
        for (let i = 0; i < 6; i++) {
          window.setTimeout(
            () => this.blip(m, 1400 + Math.random() * 1600, 0.022, 0.03, "square"),
            i * 32,
          );
        }
        break;
      case "brouhaha":
        this.burst(0.12, 0.34, "bandpass", 800, 1400, 0.6);
        for (let i = 0; i < 5; i++) this.blip(m, 200 + Math.random() * 1400, 0.1, 0.04, "sawtooth");
        break;
      case "cut":
        this.blip(m, 880, 0.14, 0.12, "sine");
        window.setTimeout(() => this.burst(0.04, 0.35, "highpass", 3000), 140);
        break;
      case "explode":
        this.burst(0.7, 0.4, "bandpass", 3200, 180, 0.8);
        this.blip(m, 60, 0.6, 0.3, "sine");
        break;
      case "rec":
        this.blip(m, 1000, 0.08, 0.08, "sine");
        break;
    }
  }

  /* ------------------------------ Tampons ------------------------------ */

  private makeNoise(seconds: number) {
    const c = this.ctx!;
    const buf = c.createBuffer(1, c.sampleRate * seconds, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }

  private makeImpulse(seconds: number, decay: number) {
    const c = this.ctx!;
    const len = Math.floor(c.sampleRate * seconds);
    const buf = c.createBuffer(2, len, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) {
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
      }
    }
    return buf;
  }
}

export const audio = new AudioEngine();
