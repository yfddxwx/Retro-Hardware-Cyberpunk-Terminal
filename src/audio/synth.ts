/**
 * Retro Hardware Cyberpunk Terminal - Pure Web Audio API Sound Engine
 * Zero external audio files. 100% synthesized in code.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private isMuted: boolean = false;
  private crtFlybackOsc: OscillatorNode | null = null;
  private crtFlybackGain: GainNode | null = null;
  private isMorsePlaying: boolean = false;
  private morseAbortController: AbortController | null = null;
  private timeDomainBuffer: Uint8Array | null = null;

  public init() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioContextClass();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.8, this.ctx.currentTime);

      // 创建实时频谱/波形分析器
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 512;
      this.analyser.smoothingTimeConstant = 0.65;
      this.timeDomainBuffer = new Uint8Array(this.analyser.fftSize);

      this.masterGain.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public getAudioLevel(): number {
    if (!this.analyser || !this.timeDomainBuffer) return 0;
    (this.analyser as unknown as { getByteTimeDomainData: (arr: Uint8Array) => void }).getByteTimeDomainData(this.timeDomainBuffer);
    let sum = 0;
    for (let i = 0; i < this.timeDomainBuffer.length; i++) {
      const v = (this.timeDomainBuffer[i] - 128) / 128;
      sum += v * v;
    }
    const rms = Math.sqrt(sum / this.timeDomainBuffer.length);
    return Math.min(1, rms * 3.5); // 适度放大供电平表灵敏响应
  }

  public getWaveformData(outputArray: Uint8Array): void {
    if (!this.analyser) {
      outputArray.fill(128);
      return;
    }
    (this.analyser as unknown as { getByteTimeDomainData: (arr: Uint8Array) => void }).getByteTimeDomainData(outputArray);
  }

  public setVolume(volume: number) {
    if (!this.ctx || !this.masterGain) return;
    const clamped = Math.max(0, Math.min(1, volume));
    this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : clamped, this.ctx.currentTime, 0.03);
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : 0.8, this.ctx.currentTime, 0.03);
    }
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  /**
   * 开机音效：大电容充电升频 + 机械电磁继电器吸合卡哒 + CRT 15.75kHz 行频低鸣
   */
  public playPowerOn() {
    this.init();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;

    // 1. 继电器机械撞击脉冲 (Relay Clack)
    const relayBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.05, this.ctx.sampleRate);
    const data = relayBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.006));
    }
    const relayNoise = this.ctx.createBufferSource();
    relayNoise.buffer = relayBuffer;

    const relayFilter = this.ctx.createBiquadFilter();
    relayFilter.type = 'bandpass';
    relayFilter.frequency.setValueAtTime(1400, t);
    relayFilter.Q.setValueAtTime(3, t);

    const relayGain = this.ctx.createGain();
    relayGain.gain.setValueAtTime(0.7, t);

    relayNoise.connect(relayFilter);
    relayFilter.connect(relayGain);
    relayGain.connect(this.masterGain);
    relayNoise.start(t);

    // 继电器低频冲击 (Thud)
    const thudOsc = this.ctx.createOscillator();
    const thudGain = this.ctx.createGain();
    thudOsc.type = 'triangle';
    thudOsc.frequency.setValueAtTime(120, t);
    thudOsc.frequency.exponentialRampToValueAtTime(35, t + 0.08);
    thudGain.gain.setValueAtTime(0.6, t);
    thudGain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    thudOsc.connect(thudGain);
    thudGain.connect(this.masterGain);
    thudOsc.start(t);
    thudOsc.stop(t + 0.09);

    // 2. 大电容充电高频升调 (Capacitor Charge Whine)
    const capOsc = this.ctx.createOscillator();
    const capGain = this.ctx.createGain();
    capOsc.type = 'sine';
    capOsc.frequency.setValueAtTime(160, t + 0.04);
    capOsc.frequency.exponentialRampToValueAtTime(3200, t + 1.2);
    capGain.gain.setValueAtTime(0.001, t);
    capGain.gain.exponentialRampToValueAtTime(0.35, t + 0.4);
    capGain.gain.exponentialRampToValueAtTime(0.001, t + 1.25);
    capOsc.connect(capGain);
    capGain.connect(this.masterGain);
    capOsc.start(t + 0.04);
    capOsc.stop(t + 1.3);

    // 3. CRT 行频持续极微弱啸叫 (15.75kHz CRT Flyback Transformer hum)
    this.startCrtFlyback();
  }

  private startCrtFlyback() {
    if (!this.ctx || !this.masterGain || this.crtFlybackOsc) return;
    try {
      this.crtFlybackOsc = this.ctx.createOscillator();
      this.crtFlybackGain = this.ctx.createGain();
      this.crtFlybackOsc.type = 'sine';
      this.crtFlybackOsc.frequency.setValueAtTime(15734, this.ctx.currentTime); // NTSC/CGA 经典行频
      this.crtFlybackGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);
      this.crtFlybackGain.gain.exponentialRampToValueAtTime(0.015, this.ctx.currentTime + 1.0); // 极轻微的背景氛围
      this.crtFlybackOsc.connect(this.crtFlybackGain);
      this.crtFlybackGain.connect(this.masterGain);
      this.crtFlybackOsc.start();
    } catch {
      // ignore
    }
  }

  /**
   * 关机音效：CRT 阳极泄放降调 + 继电器跳开
   */
  public playPowerOff() {
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;

    // 停止持续行频
    if (this.crtFlybackGain && this.crtFlybackOsc) {
      this.crtFlybackGain.gain.setTargetAtTime(0.0001, t, 0.1);
      setTimeout(() => {
        try {
          this.crtFlybackOsc?.stop();
          this.crtFlybackOsc?.disconnect();
          this.crtFlybackOsc = null;
          this.crtFlybackGain = null;
        } catch {
          // ignore
        }
      }, 300);
    }

    // 继电器跳开
    const offThud = this.ctx.createOscillator();
    const offGain = this.ctx.createGain();
    offThud.type = 'sawtooth';
    offThud.frequency.setValueAtTime(80, t);
    offThud.frequency.exponentialRampToValueAtTime(20, t + 0.12);
    offGain.gain.setValueAtTime(0.5, t);
    offGain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    offThud.connect(offGain);
    offGain.connect(this.masterGain);
    offThud.start(t);
    offThud.stop(t + 0.13);

    // 屏幕放电下潜
    const drainOsc = this.ctx.createOscillator();
    const drainGain = this.ctx.createGain();
    drainOsc.type = 'sine';
    drainOsc.frequency.setValueAtTime(800, t + 0.05);
    drainOsc.frequency.exponentialRampToValueAtTime(40, t + 0.65);
    drainGain.gain.setValueAtTime(0.25, t + 0.05);
    drainGain.gain.exponentialRampToValueAtTime(0.001, t + 0.65);
    drainOsc.connect(drainGain);
    drainGain.connect(this.masterGain);
    drainOsc.start(t + 0.05);
    drainOsc.stop(t + 0.7);
  }

  /**
   * 80s 机械键盘按键声 (微调频次方波/弹簧触底)
   */
  public playKeyClick() {
    this.init();
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;

    const baseFreq = 480 + (Math.random() * 160 - 80);
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = Math.random() > 0.5 ? 'square' : 'triangle';
    osc.frequency.setValueAtTime(baseFreq, t);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.4, t + 0.025);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1800, t);
    filter.Q.setValueAtTime(2, t);

    gain.gain.setValueAtTime(0.22, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.035);
  }

  /**
   * 机械拨动开关声音
   */
  public playToggleClick() {
    this.init();
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(240, t);
    osc.frequency.exponentialRampToValueAtTime(60, t + 0.07);

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.08);
  }

  /**
   * 计算/转换/数据流声音：软驱磁头步进 + 快速 FM 调制数据流
   */
  public playComputingStream(durationSec = 0.35) {
    this.init();
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;

    // 1. 调制解调器频移键控 FSK / FM 快速阶跃
    const fskOsc = this.ctx.createOscillator();
    const fskGain = this.ctx.createGain();
    fskOsc.type = 'square';

    // 随机频率步进模拟数据突发
    const steps = Math.floor(durationSec * 25);
    const stepDuration = durationSec / steps;
    for (let i = 0; i < steps; i++) {
      const stepFreq = 900 + Math.floor(Math.random() * 6) * 350;
      fskOsc.frequency.setValueAtTime(stepFreq, t + i * stepDuration);
    }

    fskGain.gain.setValueAtTime(0.08, t);
    fskGain.gain.setValueAtTime(0.08, t + durationSec - 0.04);
    fskGain.gain.exponentialRampToValueAtTime(0.001, t + durationSec);

    const fskFilter = this.ctx.createBiquadFilter();
    fskFilter.type = 'lowpass';
    fskFilter.frequency.setValueAtTime(3800, t);

    fskOsc.connect(fskFilter);
    fskFilter.connect(fskGain);
    fskGain.connect(this.masterGain);
    fskOsc.start(t);
    fskOsc.stop(t + durationSec + 0.02);

    // 2. 磁头寻道步进脉冲 (Stepper motor steps)
    const clicks = 5;
    for (let i = 0; i < clicks; i++) {
      const clickTime = t + (i / clicks) * durationSec;
      const stepOsc = this.ctx.createOscillator();
      const stepGain = this.ctx.createGain();
      stepOsc.type = 'triangle';
      stepOsc.frequency.setValueAtTime(140 + i * 20, clickTime);
      stepGain.gain.setValueAtTime(0.18, clickTime);
      stepGain.gain.exponentialRampToValueAtTime(0.001, clickTime + 0.02);
      stepOsc.connect(stepGain);
      stepGain.connect(this.masterGain);
      stepOsc.start(clickTime);
      stepOsc.stop(clickTime + 0.025);
    }
  }

  /**
   * 单发摩尔斯电码单音 (Dit 或 Dah)
   */
  public playMorseTone(duration: number, freq = 750): Promise<void> {
    this.init();
    return new Promise((resolve) => {
      if (!this.ctx || !this.masterGain) {
        setTimeout(resolve, duration * 1000);
        return;
      }
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      // 防爆音平滑 Attack / Release
      const attack = 0.008;
      const release = 0.008;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.linearRampToValueAtTime(0.3, t + attack);
      gain.gain.setValueAtTime(0.3, t + Math.max(attack, duration - release));
      gain.gain.linearRampToValueAtTime(0.0001, t + duration);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + duration + 0.01);

      setTimeout(() => {
        resolve();
      }, duration * 1000);
    });
  }

  /**
   * 停止当前摩尔斯回放
   */
  public stopMorsePlayback() {
    if (this.morseAbortController) {
      this.morseAbortController.abort();
      this.morseAbortController = null;
    }
    this.isMorsePlaying = false;
  }

  public getIsMorsePlaying(): boolean {
    return this.isMorsePlaying;
  }

  /**
   * 顺序播放完整摩尔斯电码字符串（如 "... --- ..."）
   */
  public async playMorseSequence(
    morseText: string,
    onElement?: (char: string, active: boolean) => void,
    unitTimeSec = 0.07
  ): Promise<void> {
    this.stopMorsePlayback();
    this.morseAbortController = new AbortController();
    const signal = this.morseAbortController.signal;
    this.isMorsePlaying = true;

    const dit = unitTimeSec;
    const dah = unitTimeSec * 3;
    const intraChar = unitTimeSec;
    const interChar = unitTimeSec * 3;
    const wordSpace = unitTimeSec * 7;

    try {
      const tokens = morseText.trim().split('');
      for (let i = 0; i < tokens.length; i++) {
        if (signal.aborted) break;
        const char = tokens[i];

        if (char === '.') {
          onElement?.('.', true);
          await this.playMorseTone(dit);
          onElement?.('.', false);
          await new Promise((r) => setTimeout(r, intraChar * 1000));
        } else if (char === '-' || char === '—' || char === '_') {
          onElement?.('-', true);
          await this.playMorseTone(dah);
          onElement?.('-', false);
          await new Promise((r) => setTimeout(r, intraChar * 1000));
        } else if (char === ' ') {
          onElement?.(' ', false);
          await new Promise((r) => setTimeout(r, interChar * 1000));
        } else if (char === '/' || char === '|') {
          onElement?.('/', false);
          await new Promise((r) => setTimeout(r, wordSpace * 1000));
        }
      }
    } finally {
      this.isMorsePlaying = false;
      onElement?.('', false);
    }
  }
}

export const sound = new SoundEngine();

/**
 * 纯算法生成 44.1kHz 16-bit PCM 单声道 WAV 音频文件
 * 零第三方依赖，自带平滑防爆音包络，可直接供用户下载
 */
export function exportMorseWavBlob(
  morseText: string,
  unitTimeSec = 0.07,
  freq = 750
): Blob {
  const sampleRate = 44100;
  const dit = unitTimeSec;
  const dah = unitTimeSec * 3;
  const intraChar = unitTimeSec;
  const interChar = unitTimeSec * 3;
  const wordSpace = unitTimeSec * 7;

  // 1. 解析时间轴事件
  type AudioSegment = { isTone: boolean; duration: number };
  const segments: AudioSegment[] = [];

  const tokens = morseText.trim().split('');
  for (let i = 0; i < tokens.length; i++) {
    const char = tokens[i];
    if (char === '.') {
      segments.push({ isTone: true, duration: dit });
      segments.push({ isTone: false, duration: intraChar });
    } else if (char === '-' || char === '—' || char === '_') {
      segments.push({ isTone: true, duration: dah });
      segments.push({ isTone: false, duration: intraChar });
    } else if (char === ' ') {
      segments.push({ isTone: false, duration: interChar });
    } else if (char === '/' || char === '|') {
      segments.push({ isTone: false, duration: wordSpace });
    }
  }

  // 额外增加 0.2 秒头尾静音
  segments.unshift({ isTone: false, duration: 0.1 });
  segments.push({ isTone: false, duration: 0.2 });

  const totalDuration = segments.reduce((acc, seg) => acc + seg.duration, 0);
  const totalSamples = Math.floor(totalDuration * sampleRate);
  const pcmData = new Int16Array(totalSamples);

  let currentSample = 0;
  const twoPiF = 2 * Math.PI * freq;
  const attackSamples = Math.floor(0.006 * sampleRate);
  const releaseSamples = Math.floor(0.006 * sampleRate);

  for (const seg of segments) {
    const segSamples = Math.floor(seg.duration * sampleRate);
    if (seg.isTone) {
      for (let s = 0; s < segSamples && currentSample < totalSamples; s++) {
        const time = s / sampleRate;
        let amp = 0.5; // 音量基准 50%
        // 前后防爆音平滑
        if (s < attackSamples) {
          amp *= s / attackSamples;
        } else if (s > segSamples - releaseSamples) {
          amp *= Math.max(0, (segSamples - s) / releaseSamples);
        }
        const sampleValue = Math.sin(twoPiF * time) * amp;
        pcmData[currentSample++] = Math.round(sampleValue * 32767);
      }
    } else {
      currentSample += segSamples;
    }
  }

  // 2. 构造 44 字节标准 RIFF WAV 头
  const wavBuffer = new ArrayBuffer(44 + pcmData.length * 2);
  const view = new DataView(wavBuffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  // RIFF Chunk
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + pcmData.length * 2, true); // 文件总大小 - 8
  writeString(8, 'WAVE');

  // fmt Sub-chunk
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);          // fmt chunk 长度 16
  view.setUint16(20, 1, true);           // PCM 格式 = 1
  view.setUint16(22, 1, true);           // 单声道 = 1
  view.setUint32(24, sampleRate, true);  // 采样率 44100
  view.setUint32(28, sampleRate * 2, true); // 字节率 (44100 * 1 * 16/8)
  view.setUint16(32, 2, true);           // 块对齐 2 字节
  view.setUint16(34, 16, true);          // 采样位深 16-bit

  // data Sub-chunk
  writeString(36, 'data');
  view.setUint32(40, pcmData.length * 2, true); // 数据总字节数

  // 写入 PCM 采样数据
  let offset = 44;
  for (let i = 0; i < pcmData.length; i++, offset += 2) {
    view.setInt16(offset, pcmData[i], true);
  }

  return new Blob([wavBuffer], { type: 'audio/wav' });
}
