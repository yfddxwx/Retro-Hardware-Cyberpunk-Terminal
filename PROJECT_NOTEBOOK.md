# 📟 项目全景笔记本：赛博朋克复古终端 (CYBERDYNE MIL-SPEC MODEL-84)

> **文档用途**：本项目专属知识库与全景档案，可直接上传至 **Google NotebookLM**、**Notion**、**Obsidian** 等笔记平台作为项目上下文源文件，亦可作为交接与二次开发指南。

---

## 📌 一、项目概况 (Project Overview)

| 属性 | 说明 |
| :--- | :--- |
| **项目名称** | Retro Hardware Cyberpunk Terminal (赛博朋克复古工业终端 Model-84) |
| **项目定位** | 纯前端、零外部音频素材、拟真 80~90 年代军工复古风格的硬件数据编解码终端与发报台 |
| **本地路径** | `D:\Gemini pro\Retro Hardware Cyberpunk Terminal` |
| **技术栈** | Vite 5 + TypeScript 5 + 原生 CSS (Vanilla CSS) + Web Audio API + HTML5 Canvas |
| **部署/启动方式**| 本地一键批处理 (`启动终端.bat`) 或 `npm run dev`，浏览器访问 `http://localhost:5173/` |
| **依赖特色** | **零外部音频文件**（所有机械键盘声、大电容充电、继电器开关、摩尔斯电码音效均为纯数学代码合成，支持直接导出 44.1kHz WAV） |

---

## ⚡ 二、核心功能特性 (Key Features)

### 1. 拟真 CRT 显示屏与工业机箱视觉
- **三维重型机箱设计**：工业拉丝面板、四个角沉头螺栓、黄黑警示条、LED 状态指示灯阵列（PWR/CARRIER/TX/RX/FAULT）。
- **古董 CRT 显像管效果**：物理扫描线（Scanlines）、行间距闪烁、边缘暗角、荧光辉光（Glow）、老电视关机水平白线动画。
- **五种显像管荧光色彩**：
  - `P1-GRN`（经典黑客绿，525nm 荧光绿显像管）
  - `P3-AMB`（工业琥珀金，暖橙黄）
  - `P4-CYN`（赛博冷光青，科技蓝）
  - `P4-WHT`（80 年代黑白单色显像管 Paper White Monochrome）
  - `P2-RED`（高危等离子警报红 Plasma Alert Red）
- **[CURVE: ON / OFF] CRT 3D 弧面曲率切换**：支持一键切换老式凸起显像管球面畸变与现代纯平面模式。

### 2. 纯代码合成 Web Audio 拟真音效引擎 (`src/audio/synth.ts`)
- **零音频素材**：不需要加载任何 `.mp3` 或 `.wav` 文件，全部通过 Web Audio API 的 `OscillatorNode`、`BiquadFilterNode` 与白噪声算法合成。
- **冷启动总闸音效**：大电容充电升频、电磁继电器机械吸合的重击感（Thud + Clack）、CRT 显像管 15.75kHz 行频低鸣。
- **机械键盘敲击音**：每次键盘打字随机生成带有机械弹簧震颤的清脆敲击音。
- **工业蜂鸣报警**：模式切换、错误报警与数据生成时的 8-bit 压电蜂鸣。
- **无线电发报音**：纯正 750Hz 无线电台报务员莫尔斯电码音，支持自选发报速率（10 WPM / 18 WPM / 26 WPM）。

### 3. 多协议编解码器 (`src/converter/coder.ts`)
- **TXT ↔ HEX**：支持普通文本与十六进制互转，提供标准古董终端内存转储格式（8 位偏移地址 + 16 字节十六进制 + ASCII 可读字符转储）。
- **TXT ↔ BASE64**：标准 Base64 编码与解码，支持 UTF-8 多字节中文。
- **TXT ↔ MORSE**：标准国际摩尔斯电码相互转换，支持字母、数字及常用标点符号。
- **TXT ↔ BIN**：计算机底层 8-bit 二进制比特流互转（`01001000 01100101...`）。
- **ROT-13 CIPHER**：经典密码学 13 字符移位替换加密。
- **[SWAP ⇄] 交换功能**：一键将输出框内容置入输入框，并自动切换对应的反向解码模式。

### 4. 双轨仪表舱：无线电示波器 + 机械阻尼模拟 VU 电平表
- **实时波形示波器（RF SIGNAL MONITOR）**：直接从 Web Audio `AnalyserNode` 获取高保真时域波形，键盘打字、系统蜂鸣、摩尔斯发报时示波器精准展现真实波形。
- **模拟指针 VU 表（ANALOG VU METER）**：采用弹簧惯性与阻尼球弹道算法，指针根据音频 RMS 电平摆动，带标准 dB 刻度线与**红色 PEAK 过载指示灯瞬间爆闪**。

### 5. 摩尔斯发报调速与音视频导出
- **速率调节（RATE）**：支持 `10 WPM (SLOW)`、`18 WPM (STD)`、`26 WPM (FAST)` 三档电台速率切换。
- **[💾 EXPORT WAV]**：无需任何后端，浏览器利用纯代码在内存中构造 44 字节 RIFF 头和 16-bit PCM 采样数据，一键导出生成高质量 `.wav` 声音文件。
- **[📄 EXPORT TXT]**：一键导出标准 NATO/MIL-STD 军用电传报告文本，带精确时间戳、CRC32、XOR 校验和与明文/密文存根。

### 6. 黑客数据发生器 (Cyberpunk Generators)
- **GEN HEX DUMP**：随机生成 64 字节拟真内存转储矩阵，模拟内存入侵或系统崩溃转储。
- **TELEMETRY PKT**：生成带有微秒时间戳、节点编号、环境温度、CRC32 校验码与伪随机密钥的工业遥测数据包。

### 7. 本地历史记录与持久化存储 (`src/storage/history.ts`)
- 点击 `[STORE LOG]` 即可将当前时间、输入模式、输入文本与输出摘要保存在浏览器的 `LocalStorage` 中。
- 支持随时点击 `[RECALL]` 恢复历史快照至终端界面，支持单条删除与一键清空日志。

---

## 🛠️ 三、代码结构与核心模块说明 (Architecture & Codebase)

```
Retro Hardware Cyberpunk Terminal/
├── index.html                 # 主界面：机箱骨架、指示灯矩阵、双轨仪表舱、输入输出区
├── package.json               # 项目依赖与启动脚本 (Vite 5, TypeScript 5)
├── tsconfig.json              # TypeScript 编译配置
├── vite.config.ts             # Vite 构建配置文件
├── 启动终端.bat               # Windows 一键启动脚本（后台运行并自动打开浏览器）
├── README_新手使用指南.md     # 面向普通用户的图文通俗操作指南
├── PROJECT_NOTEBOOK.md        # 本项目全景知识档案与 Notebook 导入源
└── src/
    ├── main.ts                # 主控制器：UI 状态机、双仪表 Canvas 渲染、事件流控制
    ├── style.css              # 样式体系：CRT 滤镜、3D 曲率模拟、5 款显像管色谱、拟物物理控件
    ├── audio/
    │   └── synth.ts           # Web Audio 声音合成器、AnalyserNode 波形提取、纯代码 WAV 发生器
    ├── converter/
    │   └── coder.ts           # 编解码核心：HEX/Base64/Morse/BIN/ROT13 与遥测发生器
    └── storage/
        └── history.ts         # 本地历史存储管理器 (HistoryManager)
```

---

## 🚀 四、运行与操作指南 (How to Run)

### 方式 A：双击一键运行（推荐）
在项目根目录直接双击运行 **`启动终端.bat`**：
1. 自动检测依赖与环境；
2. 启动本地 Vite 开发服务器；
3. 自动调起系统默认浏览器访问 `http://localhost:5173/`。

### 方式 B：终端命令行启动
```bash
# 1. 进入项目根目录
cd "D:\Gemini pro\Retro Hardware Cyberpunk Terminal"

# 2. 启动本地开发服务
npm run dev

# 3. 在浏览器中打开提示的本地地址（默认 http://localhost:5173/）
```

---

## 🔮 五、后续升级路线图 (Roadmap Status)

- [x] **音频录制与下载**：已实现纯浏览器内存合成 44.1kHz 16-bit PCM RIFF `.wav` 声音文件一键导出。
- [x] **更多复古色彩与 CRT 弧度曲率滤镜**：已加入 P4-WHT 黑白管、P2-RED 等离子高危红，以及 `CURVE` 3D 凸起曲率一键开关。
- [x] **音频可视化增强**：已实现实时 AnalyserNode 示波器 + 机械阻尼模拟指针 VU 电平表 + PEAK 过载灯。
- [x] **拓展编解码协议**：已新增二进制 8-bit (`TXT ↔ BIN`) 与经典 ROT-13 密码机。
- [ ] **多终端联机广播 (WebRTC / WebSocket)**：通过局域网或公网让两台复古终端互相发送加密报文与发报声。
- [ ] **磁带盒储存器拟真 (Audio Cassette Simulator)**：将报文以 80 年代磁带音频频移键控（FSK）声音加载与播放。
