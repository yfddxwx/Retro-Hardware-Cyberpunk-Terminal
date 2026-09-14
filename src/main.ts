import { sound, exportMorseWavBlob } from './audio/synth.js';
import { Converter } from './converter/coder.js';
import { HistoryManager } from './storage/history.js';

// DOM 元素引用
const powerToggle = document.getElementById('power-toggle') as HTMLInputElement;
const crtScreen = document.getElementById('crt-screen') as HTMLElement;

// LED 指示灯
const ledPower = document.getElementById('led-power') as HTMLElement;
const ledCarrier = document.getElementById('led-carrier') as HTMLElement;
const ledBusy = document.getElementById('led-busy') as HTMLElement;
const ledFault = document.getElementById('led-fault') as HTMLElement;

// 荧光主题切换 & 3D 曲率切换
const phosphorButtons = document.querySelectorAll('.color-btn[data-theme]');
const btnToggleCurve = document.getElementById('btn-toggle-curve') as HTMLElement;

// 音频控件
const volumeSlider = document.getElementById('volume-slider') as HTMLInputElement;
const muteBtn = document.getElementById('mute-btn') as HTMLElement;

// 终端输入输出
const termInput = document.getElementById('term-input') as HTMLTextAreaElement;
const termOutput = document.getElementById('term-output') as HTMLTextAreaElement;
const displayMode = document.getElementById('display-mode') as HTMLElement;
const inputTypeLabel = document.getElementById('input-type-label') as HTMLElement;
const outputTypeLabel = document.getElementById('output-type-label') as HTMLElement;
const termClock = document.getElementById('term-clock') as HTMLElement;
const bottomStatus = document.getElementById('bottom-status') as HTMLElement;

// 遥测信息
const statChars = document.getElementById('stat-chars') as HTMLElement;
const statBytes = document.getElementById('stat-bytes') as HTMLElement;
const statCrc = document.getElementById('stat-crc') as HTMLElement;
const statXor = document.getElementById('stat-xor') as HTMLElement;

// 模式按钮
const modeButtons = document.querySelectorAll('.mode-btn');

// 辅助动作按钮
const btnHexDump = document.getElementById('btn-hex-dump') as HTMLElement;
const btnCyberPacket = document.getElementById('btn-cyber-packet') as HTMLElement;
const btnClearScreen = document.getElementById('btn-clear-screen') as HTMLElement;
const btnPasteIn = document.getElementById('btn-paste-in') as HTMLElement;
const btnClearIn = document.getElementById('btn-clear-in') as HTMLElement;
const btnCopyOut = document.getElementById('btn-copy-out') as HTMLElement;
const btnSwapStream = document.getElementById('btn-swap-stream') as HTMLElement;
const btnSaveLog = document.getElementById('btn-save-log') as HTMLElement;
const btnMorsePlay = document.getElementById('btn-morse-play') as HTMLElement;
const morsePlayingIndicator = document.getElementById('morse-playing-indicator') as HTMLElement;
const morseSpeedSelect = document.getElementById('morse-speed-select') as HTMLSelectElement;
const btnExportWav = document.getElementById('btn-export-wav') as HTMLElement;
const btnExportTxt = document.getElementById('btn-export-txt') as HTMLElement;

// 历史记录
const historyList = document.getElementById('history-list') as HTMLElement;
const historyCount = document.getElementById('history-count') as HTMLElement;
const btnClearHistory = document.getElementById('btn-clear-history') as HTMLElement;

// 示波器与 VU 表 Canvas
const scopeCanvas = document.getElementById('scope-canvas') as HTMLCanvasElement;
const scopeCtx = scopeCanvas.getContext('2d');
const vuCanvas = document.getElementById('vu-canvas') as HTMLCanvasElement;
const vuCtx = vuCanvas.getContext('2d');
const vuPeakLed = document.getElementById('vu-peak-led') as HTMLElement;

// 应用状态
let currentMode = 'text-to-hex';
let isPoweredOn = false;
let isScopeActive = false;
let isCurvatureOn = true;

// 真实音频波形缓存
const audioWaveBuffer = new Uint8Array(256);
let currentVuNeedle = 0;

// -----------------------------------------------------------------
// 1. 初始化时钟、示波器与模拟 VU 表动态渲染
// -----------------------------------------------------------------
function updateClock() {
  const d = new Date();
  termClock.textContent = d.toTimeString().split(' ')[0];
}
setInterval(updateClock, 1000);
updateClock();

function renderInstruments() {
  // 1. 示波器绘制
  if (scopeCtx) {
    const width = scopeCanvas.width;
    const height = scopeCanvas.height;
    const midY = height / 2;

    scopeCtx.fillStyle = 'rgba(2, 6, 3, 0.4)';
    scopeCtx.fillRect(0, 0, width, height);

    const styles = getComputedStyle(document.body);
    const strokeColor = styles.getPropertyValue('--crt-primary').trim() || '#33ff33';
    const accentColor = styles.getPropertyValue('--crt-accent').trim() || '#80ff80';

    scopeCtx.beginPath();
    scopeCtx.strokeStyle = isScopeActive ? accentColor : strokeColor;
    scopeCtx.lineWidth = isScopeActive ? 2 : 1.5;
    scopeCtx.shadowColor = strokeColor;
    scopeCtx.shadowBlur = isScopeActive ? 8 : 4;

    if (!isPoweredOn) {
      // 关机状态：中心平直虚弱暗线
      scopeCtx.strokeStyle = 'rgba(40, 50, 45, 0.4)';
      scopeCtx.moveTo(0, midY);
      scopeCtx.lineTo(width, midY);
    } else {
      // 从 Web Audio 获取真实时间域音频波形
      sound.getWaveformData(audioWaveBuffer);
      const audioLevel = sound.getAudioLevel();

      const time = performance.now() * 0.006;
      for (let x = 0; x < width; x++) {
        const bufferIdx = Math.floor((x / width) * audioWaveBuffer.length);
        const rawAudio = (audioWaveBuffer[bufferIdx] - 128) / 128; // -1 ~ 1

        let wave = rawAudio * (isScopeActive ? 1.4 : 0.9);
        // 背景环境微弱 RF 载波与杂波
        wave += Math.sin(x * 0.08 + time * 3) * (0.04 + audioLevel * 0.1);
        wave += (Math.random() - 0.5) * 0.06;

        const y = Math.max(2, Math.min(height - 2, midY + wave * (midY - 4)));
        if (x === 0) scopeCtx.moveTo(x, y);
        else scopeCtx.lineTo(x, y);
      }
    }
    scopeCtx.stroke();
    scopeCtx.shadowBlur = 0;
  }

  // 2. 模拟指针 VU 电平表绘制
  if (vuCtx) {
    const width = vuCanvas.width;
    const height = vuCanvas.height;

    vuCtx.fillStyle = '#030704';
    vuCtx.fillRect(0, 0, width, height);

    const styles = getComputedStyle(document.body);
    const strokeColor = styles.getPropertyValue('--crt-primary').trim() || '#33ff33';

    // 绘制表盘刻度弧线
    const centerX = width / 2;
    const centerY = height + 14;
    const radius = height + 8;

    vuCtx.lineWidth = 1;
    vuCtx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    vuCtx.beginPath();
    vuCtx.arc(centerX, centerY, radius, -Math.PI * 0.8, -Math.PI * 0.2);
    vuCtx.stroke();

    // 刻度线与文字
    const markings = [
      { val: 0.0, text: '-20', isRed: false },
      { val: 0.2, text: '-10', isRed: false },
      { val: 0.4, text: '-5', isRed: false },
      { val: 0.6, text: '-2', isRed: false },
      { val: 0.75, text: '0', isRed: false },
      { val: 0.9, text: '+2', isRed: true },
      { val: 1.0, text: '+3', isRed: true },
    ];

    vuCtx.font = '7px "Share Tech Mono", monospace';
    vuCtx.textAlign = 'center';
    for (const m of markings) {
      const angle = -Math.PI * 0.78 + m.val * (Math.PI * 0.56);
      const x1 = centerX + Math.cos(angle) * (radius - 1);
      const y1 = centerY + Math.sin(angle) * (radius - 1);
      const x2 = centerX + Math.cos(angle) * (radius - 5);
      const y2 = centerY + Math.sin(angle) * (radius - 5);

      vuCtx.strokeStyle = m.isRed ? '#ff3b3b' : strokeColor;
      vuCtx.beginPath();
      vuCtx.moveTo(x1, y1);
      vuCtx.lineTo(x2, y2);
      vuCtx.stroke();

      const tx = centerX + Math.cos(angle) * (radius - 9);
      const ty = centerY + Math.sin(angle) * (radius - 9);
      vuCtx.fillStyle = m.isRed ? '#ff6666' : 'rgba(200, 220, 205, 0.7)';
      vuCtx.fillText(m.text, tx, ty);
    }

    // 阻尼弹簧针尖动态
    const targetAudio = isPoweredOn ? sound.getAudioLevel() : 0;
    // 弹簧阻尼跟随
    currentVuNeedle += (targetAudio - currentVuNeedle) * 0.38;
    currentVuNeedle = Math.max(0, currentVuNeedle - 0.012);

    // 过载峰值指示灯
    if (currentVuNeedle > 0.82) {
      vuPeakLed.classList.add('active');
    } else {
      vuPeakLed.classList.remove('active');
    }

    // 绘制针尖
    const needleAngle = -Math.PI * 0.78 + Math.min(1.05, currentVuNeedle) * (Math.PI * 0.56);
    const needleLen = radius - 2;
    const nx = centerX + Math.cos(needleAngle) * needleLen;
    const ny = centerY + Math.sin(needleAngle) * needleLen;

    vuCtx.lineWidth = 1.5;
    vuCtx.strokeStyle = currentVuNeedle > 0.8 ? '#ff3b3b' : strokeColor;
    vuCtx.shadowColor = currentVuNeedle > 0.8 ? '#ff3b3b' : strokeColor;
    vuCtx.shadowBlur = 4;
    vuCtx.beginPath();
    vuCtx.moveTo(centerX, centerY);
    vuCtx.lineTo(nx, ny);
    vuCtx.stroke();
    vuCtx.shadowBlur = 0;

    // 针座轴心
    vuCtx.fillStyle = '#1c222b';
    vuCtx.beginPath();
    vuCtx.arc(centerX, centerY, 5, 0, Math.PI * 2);
    vuCtx.fill();
    vuCtx.strokeStyle = '#445163';
    vuCtx.stroke();
  }

  requestAnimationFrame(renderInstruments);
}
renderInstruments();

// -----------------------------------------------------------------
// 2. 电源总闸与加电自检 (Power & Boot Sequence)
// -----------------------------------------------------------------
function triggerLedBlink(element: HTMLElement, durationMs = 120) {
  element.classList.add('active');
  setTimeout(() => {
    if (!isPoweredOn && element !== ledPower) {
      element.classList.remove('active');
    } else if (element === ledBusy || element === ledFault) {
      element.classList.remove('active');
    }
  }, durationMs);
}

function handlePowerToggle() {
  sound.init();
  isPoweredOn = powerToggle.checked;

  if (isPoweredOn) {
    sound.playPowerOn();
    crtScreen.classList.remove('animating-off');
    crtScreen.classList.add('powered-on', 'animating-on');
    ledPower.classList.add('active');
    ledCarrier.classList.add('active');
    bottomStatus.textContent = 'SYSTEM POWERED // CRT WARMING UP...';

    // 模拟冷启动自检字符流打印
    termInput.value = '';
    termOutput.value = '';
    termInput.placeholder = 'INITIALIZING SYSTEM BUS...';

    setTimeout(() => {
      crtScreen.classList.remove('animating-on');
      termInput.placeholder = 'ENTER TELETYPE DATA STREAM HERE...';
      bottomStatus.textContent = 'ONLINE // BUS READY // MIL-STD OPERATIONAL';
      // 默认提供一段复古示范文本
      termInput.value = 'NEO-TOKYO 1999 // SYSTEM OVERRIDE PROTOCOL';
      runConversion();
    }, 650);
  } else {
    sound.playPowerOff();
    sound.stopMorsePlayback();
    btnMorsePlay.classList.remove('playing');
    btnMorsePlay.textContent = '► AUDIBLE MORSE TRANSMIT';
    morsePlayingIndicator.textContent = 'CARRIER IDLE';
    isScopeActive = false;

    crtScreen.classList.remove('animating-on');
    crtScreen.classList.add('animating-off');
    ledPower.classList.remove('active');
    ledCarrier.classList.remove('active');
    ledBusy.classList.remove('active');
    ledFault.classList.remove('active');
    bottomStatus.textContent = 'STANDBY // DISCONNECT POWER BEFORE SERVICING';

    setTimeout(() => {
      crtScreen.classList.remove('powered-on', 'animating-off');
    }, 520);
  }
}

powerToggle.addEventListener('change', handlePowerToggle);

// -----------------------------------------------------------------
// 3. 编码转换核心与遥测信息计算
// -----------------------------------------------------------------
function updateModeLabels() {
  switch (currentMode) {
    case 'text-to-hex':
      displayMode.textContent = 'MODE: TXT → HEX';
      inputTypeLabel.textContent = 'TEXT';
      outputTypeLabel.textContent = 'HEX BYTES';
      break;
    case 'hex-to-text':
      displayMode.textContent = 'MODE: HEX → TXT';
      inputTypeLabel.textContent = 'HEX STREAM';
      outputTypeLabel.textContent = 'DECODED TEXT';
      break;
    case 'text-to-base64':
      displayMode.textContent = 'MODE: TXT → BASE64';
      inputTypeLabel.textContent = 'TEXT';
      outputTypeLabel.textContent = 'BASE64 STREAM';
      break;
    case 'base64-to-text':
      displayMode.textContent = 'MODE: BASE64 → TXT';
      inputTypeLabel.textContent = 'BASE64 STREAM';
      outputTypeLabel.textContent = 'DECODED TEXT';
      break;
    case 'text-to-morse':
      displayMode.textContent = 'MODE: TXT → MORSE';
      inputTypeLabel.textContent = 'TEXT';
      outputTypeLabel.textContent = 'MORSE CODE (. / -)';
      break;
    case 'morse-to-text':
      displayMode.textContent = 'MODE: MORSE → TXT';
      inputTypeLabel.textContent = 'MORSE CODE (. / -)';
      outputTypeLabel.textContent = 'DECODED TEXT';
      break;
    case 'text-to-bin':
      displayMode.textContent = 'MODE: TXT → BINARY';
      inputTypeLabel.textContent = 'TEXT';
      outputTypeLabel.textContent = 'BINARY 8-BIT BITS';
      break;
    case 'bin-to-text':
      displayMode.textContent = 'MODE: BINARY → TXT';
      inputTypeLabel.textContent = 'BINARY BITSTREAM';
      outputTypeLabel.textContent = 'DECODED TEXT';
      break;
    case 'rot13':
      displayMode.textContent = 'MODE: ROT-13 CIPHER';
      inputTypeLabel.textContent = 'PLAINTEXT';
      outputTypeLabel.textContent = 'ROT-13 CIPHERTEXT';
      break;
  }
}

function runConversion() {
  if (!isPoweredOn) return;
  const input = termInput.value;
  triggerLedBlink(ledBusy, 80);

  try {
    let result = '';
    if (!input.trim()) {
      termOutput.value = '';
    } else {
      switch (currentMode) {
        case 'text-to-hex':
          result = Converter.textToHex(input, true);
          break;
        case 'hex-to-text':
          result = Converter.hexToText(input);
          break;
        case 'text-to-base64':
          result = Converter.textToBase64(input);
          break;
        case 'base64-to-text':
          result = Converter.base64ToText(input);
          break;
        case 'text-to-morse':
          result = Converter.textToMorse(input);
          break;
        case 'morse-to-text':
          result = Converter.morseToText(input);
          break;
        case 'text-to-bin':
          result = Converter.textToBinary(input);
          break;
        case 'bin-to-text':
          result = Converter.binaryToText(input);
          break;
        case 'rot13':
          result = Converter.rot13(input);
          break;
      }
      termOutput.value = result;
    }

    // 更新字符数与校验遥测指标
    const telemetry = Converter.calculateTelemetry(result || input);
    statChars.textContent = input.length.toString();
    statBytes.textContent = telemetry.length.toString();
    statCrc.textContent = telemetry.crc32;
    statXor.textContent = telemetry.xorChecksum;
    ledFault.classList.remove('active');
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    termOutput.value = `[PARITY_ERROR]: ${errorMsg}`;
    triggerLedBlink(ledFault, 400);
  }
}

// -----------------------------------------------------------------
// 4. 输入框键盘打字音效与实时响应
// -----------------------------------------------------------------
let keySoundThrottle = false;
termInput.addEventListener('keydown', () => {
  if (!isPoweredOn) return;
  if (!keySoundThrottle) {
    sound.playKeyClick();
    keySoundThrottle = true;
    setTimeout(() => { keySoundThrottle = false; }, 35);
  }
  isScopeActive = true;
  setTimeout(() => { isScopeActive = false; }, 80);
});

termInput.addEventListener('input', () => {
  runConversion();
});

// -----------------------------------------------------------------
// 5. 模式选择与功能按键
// -----------------------------------------------------------------
modeButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    sound.playToggleClick();
    modeButtons.forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    currentMode = btn.getAttribute('data-mode') || 'text-to-hex';
    updateModeLabels();
    sound.playComputingStream(0.2);
    runConversion();
  });
});

// 生成 Hex Dump
btnHexDump.addEventListener('click', () => {
  sound.playKeyClick();
  if (!isPoweredOn) return;
  sound.playComputingStream(0.35);
  const dump = Converter.generateHexDump(64);
  termInput.value = dump;
  currentMode = 'hex-to-text';
  modeButtons.forEach((b) => {
    b.classList.toggle('active', b.getAttribute('data-mode') === 'hex-to-text');
  });
  updateModeLabels();
  runConversion();
  bottomStatus.textContent = 'HEX DUMP MATRIX GENERATED';
});

// 生成赛博遥测包
btnCyberPacket.addEventListener('click', () => {
  sound.playKeyClick();
  if (!isPoweredOn) return;
  sound.playComputingStream(0.35);
  const pkt = Converter.generateCyberPacket();
  termInput.value = pkt;
  if (currentMode === 'hex-to-text' || currentMode === 'base64-to-text' || currentMode === 'morse-to-text' || currentMode === 'bin-to-text') {
    currentMode = 'text-to-hex';
    modeButtons.forEach((b) => {
      b.classList.toggle('active', b.getAttribute('data-mode') === 'text-to-hex');
    });
    updateModeLabels();
  }
  runConversion();
  bottomStatus.textContent = 'TELEMETRY PACKET LOADED INTO BUFFER';
});

// 清空 RAM
btnClearScreen.addEventListener('click', () => {
  sound.playToggleClick();
  if (!isPoweredOn) return;
  termInput.value = '';
  termOutput.value = '';
  statChars.textContent = '0';
  statBytes.textContent = '0';
  statCrc.textContent = '0x00000000';
  statXor.textContent = '0x00';
  bottomStatus.textContent = 'BUFFER PURGED';
});

// 粘贴
btnPasteIn.addEventListener('click', async () => {
  sound.playKeyClick();
  if (!isPoweredOn) return;
  try {
    const text = await navigator.clipboard.readText();
    termInput.value = text;
    runConversion();
    bottomStatus.textContent = 'STREAM PASTED FROM SYSTEM CLIPBOARD';
  } catch {
    bottomStatus.textContent = 'CLIPBOARD PERMISSION DENIED';
  }
});

// 清空输入
btnClearIn.addEventListener('click', () => {
  sound.playKeyClick();
  if (!isPoweredOn) return;
  termInput.value = '';
  runConversion();
});

// 复制输出
btnCopyOut.addEventListener('click', async () => {
  sound.playKeyClick();
  if (!isPoweredOn || !termOutput.value) return;
  try {
    await navigator.clipboard.writeText(termOutput.value);
    bottomStatus.textContent = 'OUTPUT COPIED TO SYSTEM CLIPBOARD';
    triggerLedBlink(ledBusy, 200);
  } catch {
    bottomStatus.textContent = 'CLIPBOARD WRITE FAILED';
  }
});

// 输入输出对调 SWAP
btnSwapStream.addEventListener('click', () => {
  sound.playToggleClick();
  if (!isPoweredOn) return;
  const oldOut = termOutput.value;
  if (!oldOut || oldOut.startsWith('[PARITY_ERROR]')) return;

  termInput.value = oldOut;

  // 自动反转模式
  const reverseMap: Record<string, string> = {
    'text-to-hex': 'hex-to-text',
    'hex-to-text': 'text-to-hex',
    'text-to-base64': 'base64-to-text',
    'base64-to-text': 'text-to-base64',
    'text-to-morse': 'morse-to-text',
    'morse-to-text': 'text-to-morse',
    'text-to-bin': 'bin-to-text',
    'bin-to-text': 'text-to-bin',
    'rot13': 'rot13'
  };
  currentMode = reverseMap[currentMode] || currentMode;
  modeButtons.forEach((b) => {
    b.classList.toggle('active', b.getAttribute('data-mode') === currentMode);
  });
  updateModeLabels();
  sound.playComputingStream(0.25);
  runConversion();
  bottomStatus.textContent = 'STREAM SWAPPED & INVERTED';
});

// -----------------------------------------------------------------
// 6. 摩尔斯电码纯 Web Audio 音频发报回放与导出
// -----------------------------------------------------------------
btnMorsePlay.addEventListener('click', async () => {
  sound.playKeyClick();
  if (!isPoweredOn) return;

  if (sound.getIsMorsePlaying()) {
    sound.stopMorsePlayback();
    btnMorsePlay.classList.remove('playing');
    btnMorsePlay.textContent = '► AUDIBLE TRANSMIT';
    morsePlayingIndicator.textContent = 'CARRIER IDLE';
    isScopeActive = false;
    return;
  }

  let morseCode = '';
  if (currentMode === 'text-to-morse') {
    morseCode = termOutput.value;
  } else if (currentMode === 'morse-to-text') {
    morseCode = termInput.value;
  } else {
    morseCode = Converter.textToMorse(termInput.value || 'CYBERDYNE MIL-SPEC 1984');
  }

  if (!morseCode.trim()) return;

  const speed = parseFloat(morseSpeedSelect.value) || 0.065;
  btnMorsePlay.classList.add('playing');
  btnMorsePlay.textContent = '■ ABORT TRANSMIT';
  morsePlayingIndicator.textContent = 'TRANSMITTING RF CARRIER...';
  bottomStatus.textContent = 'BROADCASTING MORSE AUDIO STREAM...';

  await sound.playMorseSequence(
    morseCode,
    (_char, active) => {
      isScopeActive = active;
      if (active) {
        ledCarrier.classList.add('active');
        ledBusy.classList.add('active');
      } else {
        ledBusy.classList.remove('active');
      }
    },
    speed
  );

  btnMorsePlay.classList.remove('playing');
  btnMorsePlay.textContent = '► AUDIBLE TRANSMIT';
  morsePlayingIndicator.textContent = 'CARRIER IDLE';
  bottomStatus.textContent = 'TRANSMISSION COMPLETE';
  isScopeActive = false;
});

// 一键导出 44.1kHz 16-bit PCM RIFF WAV 文件
btnExportWav.addEventListener('click', () => {
  sound.playKeyClick();
  if (!isPoweredOn) return;

  let morseCode = '';
  if (currentMode === 'text-to-morse') {
    morseCode = termOutput.value;
  } else if (currentMode === 'morse-to-text') {
    morseCode = termInput.value;
  } else {
    morseCode = Converter.textToMorse(termInput.value || 'CYBERDYNE MIL-SPEC 1984');
  }

  if (!morseCode.trim()) {
    bottomStatus.textContent = 'EXPORT FAILED // NO TELETYPE DATA IN BUFFER';
    return;
  }

  const speed = parseFloat(morseSpeedSelect.value) || 0.065;
  sound.playComputingStream(0.3);

  const wavBlob = exportMorseWavBlob(morseCode, speed, 750);
  const url = URL.createObjectURL(wavBlob);
  const a = document.createElement('a');
  a.href = url;
  const timeStamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  a.download = `CYBERDYNE_TRANSMISSION_${timeStamp}.wav`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  triggerLedBlink(ledBusy, 300);
  bottomStatus.textContent = 'AUDIO BUFFER COMPILED // 44.1kHz WAV EXPORTED';
});

// 一键导出军工电传文报 (.TXT)
btnExportTxt.addEventListener('click', () => {
  sound.playKeyClick();
  if (!isPoweredOn) return;

  const now = new Date().toISOString();
  const report = `======================================================================
CYBERDYNE MIL-SPEC TERMINAL MODEL-84 // TELETYPE DISPATCH
======================================================================
[TIMESTAMP] : ${now}
[CODEC MODE]: ${currentMode.toUpperCase()}
[CHARS]     : ${statChars.textContent}
[BYTES]     : ${statBytes.textContent}
[CRC-32]    : ${statCrc.textContent}
[XOR-SUM]   : ${statXor.textContent}
[SYS STATUS]: HARDWARE SECURE // PARITY NOMINAL
----------------------------------------------------------------------
>> INPUT STREAM:
${termInput.value || '(EMPTY)'}
----------------------------------------------------------------------
>> OUTPUT RESULT:
${termOutput.value || '(EMPTY)'}
======================================================================
[END OF MIL-STD-1553 TELETYPE LOG]`;

  const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const timeStamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  a.download = `TELETYPE_DISPATCH_${timeStamp}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  sound.playComputingStream(0.25);
  bottomStatus.textContent = 'DISPATCH TRANSCRIPT EXPORTED (.TXT)';
});

// -----------------------------------------------------------------
// 7. LocalStorage 历史记录抽屉
// -----------------------------------------------------------------
function renderHistory() {
  const list = HistoryManager.getHistory();
  historyCount.textContent = `${list.length} RECORDS`;

  if (list.length === 0) {
    historyList.innerHTML = '<div class="history-empty">NO HISTORICAL LOGS RECORDED YET.</div>';
    return;
  }

  historyList.innerHTML = list
    .map(
      (item) => `
      <div class="history-item" data-id="${item.id}">
        <div class="history-meta">
          <span class="item-time">${item.timestamp}</span>
          <span class="item-mode">${item.mode.toUpperCase()}</span>
        </div>
        <div class="history-preview" title="${escapeHtml(item.input)}">${escapeHtml(item.input.substring(0, 32))}...</div>
        <div class="item-btns">
          <button class="term-text-btn btn-recall" data-id="${item.id}" title="Recall to terminal">[RECALL]</button>
          <button class="term-text-btn btn-del" data-id="${item.id}" title="Delete entry">[DEL]</button>
        </div>
      </div>
    `
    )
    .join('');

  historyList.querySelectorAll('.btn-recall').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      sound.playKeyClick();
      if (!isPoweredOn) return;
      const id = (e.currentTarget as HTMLElement).getAttribute('data-id');
      const item = list.find((i) => i.id === id);
      if (item) {
        termInput.value = item.input;
        currentMode = item.mode;
        modeButtons.forEach((b) => {
          b.classList.toggle('active', b.getAttribute('data-mode') === currentMode);
        });
        updateModeLabels();
        sound.playComputingStream(0.2);
        runConversion();
        bottomStatus.textContent = `RECALLED LOG ENTRY [${item.id}]`;
      }
    });
  });

  historyList.querySelectorAll('.btn-del').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      sound.playKeyClick();
      const id = (e.currentTarget as HTMLElement).getAttribute('data-id');
      if (id) {
        HistoryManager.deleteEntry(id);
        renderHistory();
      }
    });
  });
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

btnSaveLog.addEventListener('click', () => {
  sound.playKeyClick();
  if (!isPoweredOn || !termInput.value.trim()) return;

  HistoryManager.addEntry(currentMode, termInput.value, termOutput.value);
  sound.playComputingStream(0.2);
  renderHistory();
  bottomStatus.textContent = 'LOG SAVED TO PERSISTENT NVRAM (LOCALSTORAGE)';
  triggerLedBlink(ledBusy, 200);
});

btnClearHistory.addEventListener('click', () => {
  sound.playToggleClick();
  HistoryManager.clear();
  renderHistory();
  bottomStatus.textContent = 'NVRAM LOGS CLEARED';
});

// -----------------------------------------------------------------
// 8. 荧光管色谱切换、3D 曲率开关与音量控制
// -----------------------------------------------------------------
phosphorButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    sound.playToggleClick();
    phosphorButtons.forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');

    const theme = btn.getAttribute('data-theme') || 'theme-green';
    document.body.className = theme;
    bottomStatus.textContent = `PHOSPHOR SPECTRUM SWITCHED TO ${btn.textContent}`;
  });
});

btnToggleCurve.addEventListener('click', () => {
  sound.playToggleClick();
  isCurvatureOn = !isCurvatureOn;
  crtScreen.classList.toggle('curvature-active', isCurvatureOn);
  btnToggleCurve.textContent = isCurvatureOn ? 'CURVE: ON' : 'CURVE: OFF';
  bottomStatus.textContent = isCurvatureOn
    ? 'CRT 3D BARREL CURVATURE ENGAGED'
    : 'CRT FLAT BEZEL MODE ENGAGED';
});

volumeSlider.addEventListener('input', () => {
  const val = parseFloat(volumeSlider.value);
  sound.setVolume(val);
});

muteBtn.addEventListener('click', () => {
  sound.playKeyClick();
  const muted = sound.toggleMute();
  muteBtn.classList.toggle('muted', muted);
  muteBtn.textContent = muted ? 'MUTED' : 'MUTE';
});

// 全局首次任意点击激活 AudioContext
window.addEventListener('click', () => {
  sound.init();
}, { once: true });

// 初始渲染历史
renderHistory();
