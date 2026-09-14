# 📟 CYBERDYNE MIL-SPEC MODEL-84
### Retro Hardware Cyberpunk Teletype Terminal & Realtime Data Codec

<p align="center">
  <img src="https://img.shields.io/badge/License-MIT-green.svg" alt="MIT License" />
  <img src="https://img.shields.io/badge/TypeScript-5.4-blue.svg?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-5.2-purple.svg?logo=vite" alt="Vite" />
  <img src="https://img.shields.io/badge/Web_Audio_API-100%25_Synthesized-orange.svg" alt="Web Audio" />
  <img src="https://img.shields.io/badge/Audio_Files-ZERO_EXTERNAL_ASSETS-brightgreen.svg" alt="Zero Audio Files" />
</p>

An authentic, physics-inspired 1980s-90s military-grade cyberpunk hardware terminal simulator. Features a pure-code Web Audio synthesis engine with **zero external audio files**, real-time AnalyserNode FFT oscilloscope, ballistic analog needle VU meter, 5 CRT phosphor tube spectrums, 3D curved barrel glass simulation, and multi-protocol teletype encoding/decoding.

---

## ⚡ Highlights & Features

### 🖥️ Authentic CRT Visuals & 3D Chassis
- **Heavy Industrial Console**: Countersunk hex screws, hazard safety stripes, and physical LED rack (`PWR`, `CARRIER`, `RX/TX`, `PARITY`).
- **CRT Phosphor Luminescence**: Realistic scanlines, interlaced flicker, corner vignette, power-off beam collapse animations, and toggleable **3D Spherical Barrel Curvature (`CURVE: ON/OFF`)**.
- **5 Phosphor Tube Presets**:
  - `P1-GRN`: Classic Hacker Green (525nm CRT)
  - `P3-AMB`: Industrial Warm Amber
  - `P4-CYN`: Cyber Cyan Phosphor
  - `P4-WHT`: 80s Paper White Monochrome
  - `P2-RED`: Plasma Emergency Alert Red

### 🔊 100% Procedural Web Audio Sound Engine
- **Zero External Audio Assets**: Every relay clack, capacitor charging whine, mechanical IBM spring keystroke, CRT 15.75kHz flyback hum, and 750Hz Morse tone is mathematically generated in real time using the **Web Audio API**.
- **Real-time Dual Visualizer Deck**:
  - **RF Signal Monitor**: Canvas oscilloscope rendering real-time audio time-domain waveform via `AnalyserNode`.
  - **Ballistic Analog VU Meter**: Spring-damped mechanical needle tracking audio peaks with an active red **PEAK OVERLOAD** LED.

### 🔄 Multi-Protocol Codec & Data Generator
- **Supported Encodings**:
  - `TXT ↔ HEX`: Plaintext to hex with 8-digit memory address offsets and ASCII dump.
  - `TXT ↔ BASE64`: UTF-8 compliant Base64 encoder/decoder.
  - `TXT ↔ MORSE`: Standard ITU international Morse code converter.
  - `TXT ↔ BIN`: 8-bit binary bitstream encoding/decoding.
  - `ROT-13 CIPHER`: Classical 13-step cryptographic substitution.
  - `[SWAP ⇄]`: Instant stream inversion and mode mirroring.
- **Cyberpunk Generators**:
  - `GEN HEX DUMP`: Generates 64-byte pseudo-random core memory dumps.
  - `TELEMETRY PKT`: Generates formatted industrial MIL-STD-1553 teletype telemetry packets with CRC32 checksums.

### 💾 Export & Persistence
- **`[💾 EXPORT WAV]`**: Browser memory-synthesizes studio-grade 44.1kHz 16-bit PCM RIFF `.wav` files for Morse transmissions—no server needed.
- **`[📄 EXPORT TXT]`**: Exports timestamped military teletype dispatches with CRC32/XOR checksums.
- **LocalStorage NVRAM Vault**: Save, recall, and purge teletype transmission history snapshots.

---

## 📂 Project Architecture

```
Retro-Hardware-Cyberpunk-Terminal/
├── index.html                 # Chassis architecture, CRT viewport & visualizer deck
├── package.json               # Vite & TypeScript project configuration
├── tsconfig.json              # TypeScript compilation rules
├── vite.config.ts             # Vite build options
├── 启动终端.bat               # Windows 1-click launch script
├── LICENSE                    # MIT License
├── README.md                  # Project documentation (English)
├── README_新手使用指南.md     # Beginner user manual (Chinese)
├── PROJECT_NOTEBOOK.md        # Complete technical dossier & NotebookLM source
└── src/
    ├── main.ts                # Application state machine, canvas animations & events
    ├── style.css              # CRT raster shaders, 3D curvature & chassis styling
    ├── audio/
    │   └── synth.ts           # Pure Web Audio synthesis engine & WAV exporter
    ├── converter/
    │   └── coder.ts           # Hex/Base64/Morse/BIN/ROT13 codec & CRC32 telemetry
    └── storage/
        └── history.ts         # Persistent NVRAM LocalStorage manager
```

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18 or higher)
- [npm](https://www.npmjs.com/)

### Installation & Launch

```bash
# 1. Clone repository
git clone https://github.com/yfddxwx/Retro-Hardware-Cyberpunk-Terminal.git
cd Retro-Hardware-Cyberpunk-Terminal

# 2. Install dependencies
npm install

# 3. Start local development server
npm run dev
```

Open `http://localhost:5173/` in your browser.

> **Windows Quick Launch**: On Windows, you can also simply double-click **`启动终端.bat`** to start the terminal and launch the browser automatically!

### Production Build

```bash
npm run build
```

The compiled static assets will be output to the `dist/` directory.

---

## 📜 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🤝 Contributing & Feedback

Contributions, feature requests, and bug reports are welcome! Feel free to open an issue or submit a pull request on [GitHub](https://github.com/yfddxwx/Retro-Hardware-Cyberpunk-Terminal).
