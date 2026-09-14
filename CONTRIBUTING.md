# Contributing to Retro Hardware Cyberpunk Terminal

Thank you for your interest in contributing to the **Cyberdyne Mil-Spec Model-84 Terminal**! We welcome all issues, PRs, and visual/audio ideas from the retro computing and cyberpunk communities.

---

## Getting Started

1. **Fork the repository** on GitHub.
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/<your-username>/Retro-Hardware-Cyberpunk-Terminal.git
   cd Retro-Hardware-Cyberpunk-Terminal
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Start the local dev server**:
   ```bash
   npm run dev
   ```

---

## Development Guidelines

- **Zero External Audio Assets Rule**: All sound effects, clicks, hums, and tones must remain 100% procedurally synthesized via the Web Audio API in `src/audio/synth.ts`. Do not commit MP3, WAV, or OGG binary assets to the repository.
- **Type Safety**: Ensure TypeScript compiles cleanly with `npm run build` before submitting any PR.
- **Vanilla CSS & Physics**: Keep CRT screen shaders, curvature, and chassis animations lightweight and hardware-accelerated.
- **Commit Messages**: Follow [Conventional Commits](https://www.conventionalcommits.org/) (e.g. `feat: ...`, `fix: ...`, `docs: ...`, `style: ...`).

---

## Pull Request Process

1. Create a descriptive topic branch: `git checkout -b feature/awesome-codec`
2. Commit your changes with clear messages.
3. Test thoroughly in modern Chromium and WebKit/Gecko browsers.
4. Run `npm run build` to verify there are zero build or type errors.
5. Push to your branch and open a Pull Request against the `main` branch.
