# My Web Games 🎮

A curated monorepo of modern HTML5 web games built for high performance, mobile & desktop responsiveness, and instant deployment to game distribution platforms like **CrazyGames**, **Poki**, and **Itch.io**.

---

## 🕹️ Games in this Repository

| Game | Tech Stack | Status | Platform Targets |
| :--- | :--- | :--- | :--- |
| **[Beat Me If You Can](./BeatMeIfYouCan)** | React 19, TypeScript, Tailwind CSS, Vite, Web Audio API | ✅ **Production Ready** | CrazyGames, Web, Mobile |
| *More Games Coming Soon* | HTML5 / Canvas / React / WebGL | ⏳ *In Development* | Web Game Portals |

---

## 🌟 Featured: Beat Me If You Can

**Beat Me If You Can** is a fast-paced, psychological, ASMR-infused endless 3-piece Tic-Tac-Toe cartoon game against an unbeatable Master Bot.

### ✨ Key Features
- **Retrograde Master Solver**: Evaluates all 5,710 reachable states via minimax retrograde analysis—the bot never blunders and punishes human mistakes with escalating cartoon taunts.
- **Endless 3-Piece Variant**: Each player has at most 3 tokens on the board. Once all 3 are played, each move picks up and relocates an existing piece, eliminating trivial draws and forcing dynamic endgame play.
- **Synthesized ASMR Foley Engine**: Real-time Web Audio API sound packs (Wooden Walnut, Smooth Ceramic, Heavy Brass, Retro Bubble, Pop Fidget) with zero external audio assets.
- **CrazyGames SDK v3 Native Integration**:
  - Auto-initialization with `window.CrazyGames.SDK.init()`.
  - `gameplayStart()` and `gameplayStop()` lifecycle management.
  - Midgame ad support with audio muting (tested via integrated fallback overlay).
  - Portal mute synchronization.
- **Mobile & Desktop Optimized**: Responsive touch targets, haptic feedback, fullscreen mode, and hardware back-button navigation support.

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18 or newer recommended, tested on Node v24)
- **npm** (v10 or newer)

### Running Beat Me If You Can Locally

```bash
# Navigate to the game folder
cd BeatMeIfYouCan

# Install dependencies
npm install

# Start local development server
npm run dev
```

Visit `http://localhost:3000` in your browser.

---

## 📦 Building & Deploying to CrazyGames

CrazyGames requires HTML5 games to have:
1. `index.html` at the **root level** of the uploaded `.zip` archive.
2. Relative asset paths (`./assets/...`).
3. CrazyGames SDK v3 script tag and lifecycle hooks (`gameplayStart`, `gameplayStop`, `requestAd`).

### One-Command Packaging
Inside `BeatMeIfYouCan`:

```bash
npm run package:crazygames
```

This compiles the production assets via Vite with relative paths (`base: './'`) and automatically archives the contents of `dist/` directly into:
`BeatMeIfYouCan/beat-me-if-you-can-crazygames.zip`

### Uploading to CrazyGames Developer Portal
1. Log in to [CrazyGames Developer Portal](https://developer.crazygames.com).
2. Click **Create Game** (or select your existing game listing).
3. Under **Game Media / Build Upload**, select **HTML5 (ZIP)**.
4. Upload `beat-me-if-you-can-crazygames.zip`.
5. Use the CrazyGames QA tool in the dashboard to test the SDK integration, test ads, and verify display.
6. Submit for review!

---

## 📂 Repository Structure

```text
My_Web_Games/
├── .gitignore
├── README.md
└── BeatMeIfYouCan/                     # Game 1: Endless ASMR Tic-Tac-Toe
    ├── package.json
    ├── vite.config.ts
    ├── tsconfig.json
    ├── index.html
    ├── scripts/
    │   └── build-crazygames-zip.js    # CrazyGames packaging automation
    ├── public/
    └── src/
        ├── App.tsx                    # Main flow, screen router & ad gating
        ├── components/                # Game board, bot avatar, shop, UI
        ├── engine/                    # CrazyGames SDK bridge, ASMR audio & AI solver
        └── hooks/                     # Game progress, save states & storage
```

---

## 📄 License

MIT License. Crafted with ❤️ for web gamers everywhere.
