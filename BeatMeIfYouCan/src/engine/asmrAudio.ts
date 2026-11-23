export type SoundPackId = 'walnut' | 'mechanical' | 'stone' | 'raindrop' | 'velvet';

class AsmrAudioEngine {
  private ctx: AudioContext | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private enabled = true;
  private externalMuted = false;
  private ambientEnabled = false;
  private ambientNode: AudioNode | null = null;
  private ambientGain: GainNode | null = null;
  private activePack: SoundPackId = 'walnut';

  private isAudible(): boolean {
    return this.enabled && !this.externalMuted;
  }

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    if (!this.noiseBuffer && this.ctx) {
      const sampleRate = this.ctx.sampleRate;
      const length = sampleRate * 2;
      const buffer = this.ctx.createBuffer(1, length, sampleRate);
      const data = buffer.getChannelData(0);
      // Pink-ish noise for warm organic ASMR foley
      let b0 = 0;
      let b1 = 0;
      let b2 = 0;
      let b3 = 0;
      let b4 = 0;
      let b5 = 0;
      let b6 = 0;
      for (let i = 0; i < length; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.969 * b2 + white * 0.153852;
        b3 = 0.8665 * b3 + white * 0.3104856;
        b4 = 0.55 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.016898;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.09;
        b6 = white * 0.115926;
      }
      this.noiseBuffer = buffer;
    }
    return this.ctx;
  }

  public setEnabled(val: boolean): void {
    this.enabled = val;
    this.syncAmbientVolume();
  }

  public setExternalMuted(muted: boolean): void {
    this.externalMuted = muted;
    this.syncAmbientVolume();
  }

  private syncAmbientVolume(): void {
    if (!this.ambientGain || !this.ctx) return;
    const now = this.ctx.currentTime;
    const target = this.ambientEnabled && !this.externalMuted ? 0.11 : 0.0001;
    this.ambientGain.gain.cancelScheduledValues(now);
    this.ambientGain.gain.setValueAtTime(Math.max(0.0001, this.ambientGain.gain.value), now);
    this.ambientGain.gain.exponentialRampToValueAtTime(target, now + 0.18);
  }

  public setPack(pack: SoundPackId): void {
    this.activePack = pack;
  }

  public toggleAmbient(turnOn: boolean): void {
    this.ambientEnabled = turnOn;
    const ctx = this.ensureContext();
    if (!ctx || !this.noiseBuffer) return;

    if (turnOn) {
      if (this.ambientNode) {
        this.syncAmbientVolume();
        return;
      }
      const source = ctx.createBufferSource();
      source.buffer = this.noiseBuffer;
      source.loop = true;

      const lowpass = ctx.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.value = 540;
      lowpass.Q.value = 0.7;

      const highpass = ctx.createBiquadFilter();
      highpass.type = 'highpass';
      highpass.frequency.value = 110;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(this.externalMuted ? 0.0001 : 0.11, ctx.currentTime + 0.8);

      source.connect(highpass);
      highpass.connect(lowpass);
      lowpass.connect(gain);
      gain.connect(ctx.destination);
      source.start();

      this.ambientNode = source;
      this.ambientGain = gain;
    } else if (this.ambientGain && this.ambientNode) {
      const now = ctx.currentTime;
      this.ambientGain.gain.cancelScheduledValues(now);
      this.ambientGain.gain.setValueAtTime(Math.max(0.0001, this.ambientGain.gain.value), now);
      this.ambientGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
      const nodeToStop = this.ambientNode as AudioBufferSourceNode;
      this.ambientNode = null;
      this.ambientGain = null;
      window.setTimeout(() => {
        try {
          nodeToStop.stop();
        } catch {
          // already stopped
        }
      }, 380);
    }
  }

  public isAmbientEnabled(): boolean {
    return this.ambientEnabled;
  }

  private playFilteredNoise(
    ctx: AudioContext,
    duration: number,
    filterType: BiquadFilterType,
    freq: number,
    q: number,
    peakGain: number,
    delay = 0
  ): void {
    if (!this.noiseBuffer) return;
    const now = ctx.currentTime + delay;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    src.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.setValueAtTime(freq, now);
    filter.Q.setValueAtTime(q, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(peakGain, now + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    src.start(now, Math.random() * 1.2);
    src.stop(now + duration + 0.02);
  }

  private playTone(
    ctx: AudioContext,
    type: OscillatorType,
    startFreq: number,
    endFreq: number,
    duration: number,
    peakGain: number,
    delay = 0
  ): void {
    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(startFreq, now);
    if (endFreq !== startFreq) {
      osc.frequency.exponentialRampToValueAtTime(endFreq, now + duration);
    }

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(peakGain, now + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  public playHover(packOverride?: SoundPackId): void {
    if (!this.isAudible()) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    const pack = packOverride ?? this.activePack;
    const jitter = 0.96 + Math.random() * 0.08;

    switch (pack) {
      case 'walnut':
        this.playFilteredNoise(ctx, 0.028, 'bandpass', 1100 * jitter, 3.2, 0.08);
        break;
      case 'mechanical':
        this.playFilteredNoise(ctx, 0.018, 'highpass', 3200 * jitter, 1.5, 0.06);
        break;
      case 'stone':
        this.playTone(ctx, 'sine', 1950 * jitter, 1850 * jitter, 0.025, 0.028);
        break;
      case 'raindrop':
        this.playTone(ctx, 'sine', 620 * jitter, 880 * jitter, 0.032, 0.03);
        break;
      case 'velvet':
        this.playFilteredNoise(ctx, 0.045, 'lowpass', 520 * jitter, 1.2, 0.07);
        break;
    }
  }

  public playLift(isBot = false, packOverride?: SoundPackId): void {
    if (!this.isAudible()) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    const pack = packOverride ?? this.activePack;
    const pitchShift = isBot ? 0.88 : 1.04;

    switch (pack) {
      case 'walnut':
        // Soft hollow wood slide & pick-up
        this.playFilteredNoise(ctx, 0.07, 'bandpass', 820 * pitchShift, 2.2, 0.24);
        this.playTone(ctx, 'triangle', 260 * pitchShift, 340 * pitchShift, 0.065, 0.12);
        break;
      case 'mechanical':
        // Tactile switch upstroke release
        this.playFilteredNoise(ctx, 0.026, 'bandpass', 2600 * pitchShift, 2.8, 0.22);
        this.playTone(ctx, 'sine', 520 * pitchShift, 680 * pitchShift, 0.04, 0.09);
        break;
      case 'stone':
        // Smooth mineral brush
        this.playFilteredNoise(ctx, 0.085, 'bandpass', 1750 * pitchShift, 4.0, 0.16);
        this.playTone(ctx, 'sine', 1180 * pitchShift, 1340 * pitchShift, 0.055, 0.06);
        break;
      case 'raindrop':
        // Subtle water surface pull
        this.playTone(ctx, 'sine', 420 * pitchShift, 710 * pitchShift, 0.075, 0.11);
        this.playTone(ctx, 'sine', 1240 * pitchShift, 1520 * pitchShift, 0.045, 0.035);
        break;
      case 'velvet':
        // Soft whisper brush
        this.playFilteredNoise(ctx, 0.11, 'bandpass', 640 * pitchShift, 1.1, 0.22);
        this.playTone(ctx, 'sine', 210 * pitchShift, 265 * pitchShift, 0.08, 0.08);
        break;
    }
  }

  public playPlace(isBot = false, packOverride?: SoundPackId): void {
    if (!this.isAudible()) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    const pack = packOverride ?? this.activePack;
    const jitter = 0.97 + Math.random() * 0.06;
    const pitchShift = (isBot ? 0.86 : 1.03) * jitter;

    switch (pack) {
      case 'walnut':
        // Deep resonant walnut knock + crisp wooden clack transient
        this.playTone(ctx, 'triangle', 195 * pitchShift, 118 * pitchShift, 0.095, 0.32);
        this.playTone(ctx, 'sine', 410 * pitchShift, 240 * pitchShift, 0.048, 0.18);
        this.playFilteredNoise(ctx, 0.042, 'bandpass', 1450 * pitchShift, 2.6, 0.34);
        // Subtle double-settle micro-clack
        this.playFilteredNoise(ctx, 0.022, 'bandpass', 1800 * pitchShift, 3.0, 0.11, 0.032);
        break;

      case 'mechanical':
        // Crisp keycap "thock" — sharp upper click + deep PBT housing bottom-out
        this.playFilteredNoise(ctx, 0.018, 'bandpass', 3400 * pitchShift, 2.2, 0.38);
        this.playTone(ctx, 'triangle', 155 * pitchShift, 92 * pitchShift, 0.08, 0.34);
        this.playTone(ctx, 'sine', 880 * pitchShift, 310 * pitchShift, 0.025, 0.14);
        this.playFilteredNoise(ctx, 0.016, 'bandpass', 2100 * pitchShift, 3.0, 0.12, 0.022);
        break;

      case 'stone':
        // Crisp Kyoto slate & ceramic stone clack
        this.playTone(ctx, 'sine', 1520 * pitchShift, 1460 * pitchShift, 0.075, 0.16);
        this.playTone(ctx, 'sine', 2680 * pitchShift, 2590 * pitchShift, 0.05, 0.09);
        this.playTone(ctx, 'triangle', 340 * pitchShift, 180 * pitchShift, 0.055, 0.22);
        this.playFilteredNoise(ctx, 0.028, 'highpass', 2200 * pitchShift, 1.8, 0.26);
        break;

      case 'raindrop':
        // Liquid resonant droplet plop + crystal glass overtone
        this.playTone(ctx, 'sine', 340 * pitchShift, 890 * pitchShift, 0.095, 0.24);
        this.playTone(ctx, 'sine', 1680 * pitchShift, 1660 * pitchShift, 0.13, 0.07, 0.012);
        this.playFilteredNoise(ctx, 0.032, 'bandpass', 1200 * pitchShift, 3.8, 0.11);
        break;

      case 'velvet':
        // Ultra-soft felt thud + muted bubble pop
        this.playTone(ctx, 'sine', 148 * pitchShift, 84 * pitchShift, 0.12, 0.34);
        this.playTone(ctx, 'sine', 320 * pitchShift, 460 * pitchShift, 0.055, 0.12, 0.01);
        this.playFilteredNoise(ctx, 0.075, 'lowpass', 720 * pitchShift, 1.4, 0.22);
        break;
    }
  }

  public playUiTap(): void {
    if (!this.isAudible()) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    this.playTone(ctx, 'triangle', 290, 175, 0.045, 0.16);
    this.playFilteredNoise(ctx, 0.022, 'bandpass', 1600, 2.8, 0.15);
  }

  public playDefeatChord(): void {
    if (!this.isAudible()) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    // Calm, hushed minor marimba cadence — satisfying even in defeat
    const notes = [329.63, 293.66, 246.94, 196.0];
    notes.forEach((freq, idx) => {
      const delay = idx * 0.11;
      this.playTone(ctx, 'triangle', freq, freq * 0.996, 0.42, 0.14, delay);
      this.playTone(ctx, 'sine', freq * 2, freq * 1.995, 0.22, 0.04, delay);
    });
  }

  public playShopUnlock(): void {
    if (!this.isAudible()) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    const notes = [392.0, 493.88, 587.33, 783.99];
    notes.forEach((freq, idx) => {
      const delay = idx * 0.075;
      this.playTone(ctx, 'sine', freq, freq, 0.32, 0.12, delay);
      this.playTone(ctx, 'triangle', freq * 0.5, freq * 0.5, 0.24, 0.07, delay);
    });
  }

  public playPackPreview(pack: SoundPackId): void {
    if (!this.isAudible()) return;
    this.playHover(pack);
    window.setTimeout(() => this.playLift(false, pack), 150);
    window.setTimeout(() => this.playPlace(false, pack), 340);
    window.setTimeout(() => this.playPlace(true, pack), 560);
  }
}

export const asmrAudio = new AsmrAudioEngine();
