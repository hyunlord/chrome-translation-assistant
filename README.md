# Translation & Learning Assistant

> AI-powered translation Chrome Extension with intelligent auto paragraph detection, multi-provider support, and interactive learning features.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Chrome](https://img.shields.io/badge/chrome-extension-brightgreen.svg)
![CI](https://github.com/hyunlord/chrome-translation-assistant/actions/workflows/ci.yml/badge.svg)
![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)

---

## 🌟 Features

### 🎯 Smart Auto Paragraph Detection
- **Intelligent Detection**: Automatically identifies paragraphs on any webpage with 90%+ accuracy
- **Smart Filtering**: Removes navigation, ads, headers, and footers
- **Three Modes**: Aggressive, Balanced (recommended), or Conservative detection
- **Inline Overlays**: Beautiful translation overlays with smooth animations
- **Toggle View**: Switch between original and translation with one click (Alt+T)
- **Performance Optimized**: Only translates visible content first

### 📝 Text Selection Translation
- Select any text on web pages or PDFs for instant translation
- Beautiful tooltip UI with "Translate" and "Explain" actions
- Context-aware translations with surrounding text
- Right-click context menu integration

### 💬 Interactive Learning Chat
- Ask follow-up questions about translations
- Learn grammar, usage, and cultural context
- Streaming responses for real-time feedback
- Conversation history with translation context

### 🤖 Multi-AI Provider Support
- **Claude (Anthropic)**: Advanced language understanding
- **GPT-4 (OpenAI)**: Powerful and versatile
- **Gemini (Google)**: Fast and efficient
- Switch providers anytime
- Bring your own API key for full control

### 📄 PDF Support
- Translate text directly from PDF files
- Maintains document context
- Works with browser PDF viewer

### ☁️ Cross-Device Sync (Optional)
- Firebase Authentication integration
- Sync translations and history across devices
- Offline-first with automatic sync when online

### 🎨 Modern UI
- Beautiful side panel interface
- Dark mode support
- Responsive design
- Smooth animations and transitions

---

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+** ([Download](https://nodejs.org/))
- **Chrome Browser** (or Edge, Brave, other Chromium-based browsers)
- **API Key** from one of the supported providers:
  - [Claude API Key](https://console.anthropic.com/account/keys)
  - [OpenAI API Key](https://platform.openai.com/api-keys)
  - [Gemini API Key](https://makersuite.google.com/app/apikey)

---

## 💻 Installation & Usage

### For Users (No Build Required)

1. **Download Extension**
   - Go to [Releases](https://github.com/hyunlord/chrome-translation-assistant/releases)
   - Download `chrome-translation-assistant.zip`
   - Extract the ZIP file

2. **Load in Chrome**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the extracted `dist` folder

3. **Configure**
   - Click extension icon → Options
   - Enter your API key (Claude/OpenAI/Gemini)
   - Save settings

**That's it! No build required.**

---

### For Developers (Build from Source)

#### Windows

#### Method 1: Batch Files (Easiest)

1. **Open Project Folder**
   - Navigate to `chrome-translation-assistant` folder in File Explorer

2. **Build Extension**
   - Double-click `scripts\build.bat`
   - Wait for "BUILD SUCCESSFUL!" message

3. **Load in Chrome**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the `dist` folder

#### Method 2: Command Prompt

```cmd
# Open Command Prompt (Win + R, type 'cmd', press Enter)
# Navigate to your project folder
cd chrome-translation-assistant

# Install dependencies
npm install

# Build extension
npm run build

# Load dist/ folder in chrome://extensions/
```

#### Method 3: PowerShell

```powershell
# Open PowerShell (Win + X, select "Windows PowerShell")
# Navigate to your project folder
cd chrome-translation-assistant

npm install
npm run build
```

#### Development Mode (Windows)

```cmd
# Double-click scripts\dev.bat OR run in Command Prompt:
npm run dev
# Press Ctrl+C to stop
```

**Troubleshooting Windows:**
- If "npm not found": Install Node.js from [nodejs.org](https://nodejs.org/)
- If permission error: Run Command Prompt as Administrator
- If build fails: Delete `node_modules` and `package-lock.json`, then run `npm install` again

---

#### macOS

```bash
# Open Terminal (Cmd + Space, type 'Terminal')
cd ~/chrome-translation-assistant

# Install dependencies
npm install

# Build extension
npm run build

# Load in Chrome
# 1. Open Chrome -> chrome://extensions/
# 2. Enable "Developer mode"
# 3. Click "Load unpacked"
# 4. Select the dist/ folder
```

#### Development Mode (macOS)

```bash
npm run dev
# Press Ctrl+C to stop
```

**Troubleshooting macOS:**
- If "npm not found": Install Node.js with Homebrew: `brew install node`
- If permission error: Use `sudo npm install` (not recommended) or fix npm permissions
- For M1/M2 Macs: Everything should work natively

---

#### Linux

```bash
# Open Terminal (Ctrl + Alt + T)
cd ~/chrome-translation-assistant

# Install dependencies
npm install

# Build extension
npm run build

# Load in Chrome/Chromium
# 1. Open Chrome -> chrome://extensions/
# 2. Enable "Developer mode"
# 3. Click "Load unpacked"
# 4. Select the dist/ folder
```

#### Development Mode (Linux)

```bash
npm run dev
# Press Ctrl+C to stop
```

**Troubleshooting Linux:**
- If "npm not found": Install Node.js:
  ```bash
  # Ubuntu/Debian
  sudo apt update && sudo apt install nodejs npm

  # Fedora
  sudo dnf install nodejs npm

  # Arch
  sudo pacman -S nodejs npm
  ```
- If permission error: Never use `sudo` with npm. Fix permissions instead.

---

## ⚙️ Configuration

### 1. Open Options Page

- Right-click extension icon → "Options"
- Or go to `chrome://extensions/` → Extension details → "Extension options"

### 2. Set API Key

1. Select your AI provider (Claude/OpenAI/Gemini)
2. Enter your API key
3. Click "Validate" to test the connection
4. Click "Save Settings"

### 3. Configure Auto-Translation

- **Enable auto-translate**: Toggle on to detect paragraphs automatically
- **Detection Mode**:
  - **Aggressive**: Translate all text blocks
  - **Balanced**: Main content only (recommended)
  - **Conservative**: High-confidence paragraphs only
- **Auto-translate on page load**: Translate immediately when page loads
- **Exclude code blocks**: Skip code snippets and technical content

### 4. Language Settings

- Select target language (Korean, Japanese, Chinese, Spanish, etc.)
- Source language auto-detected by default

---

## 🎮 Usage

### Auto Paragraph Detection

1. Visit any webpage (e.g., [Wikipedia](https://en.wikipedia.org/wiki/Python_(programming_language)))
2. Paragraphs are automatically detected with blue left border
3. Hover over paragraph to see translation button
4. Click button or press **Alt+T** to toggle all translations

### Text Selection Translation

1. Select any text on webpage or PDF
2. Click "Translate" or "Explain" in the tooltip
3. View results in side panel

### Interactive Chat

1. Translate text or detect paragraphs
2. Open side panel
3. Ask follow-up questions:
   - "Why is this grammar used?"
   - "What's the cultural context?"
   - "Give me similar examples"

---

## 📁 Project Structure

```
chrome-translation-assistant/
├── .github/
│   └── workflows/
│       ├── ci.yml           # PR validation (lint + build)
│       └── release.yml      # Automated releases & Chrome Web Store upload
├── dist/                    # Built extension (load in Chrome)
├── docs/                    # Documentation
│   ├── TESTING.md
│   ├── PHASE8_SUMMARY.md
│   ├── PRIVACY_POLICY.md
│   ├── TERMS_OF_SERVICE.md
│   ├── STORE_LISTING.md
│   ├── CHROME_WEB_STORE_CHECKLIST.md
│   └── WINDOWS_GUIDE.md
├── public/
│   ├── icons/               # Extension icons (16, 32, 48, 128 px)
│   └── manifest.json
├── scripts/
│   ├── build.bat            # Windows build script
│   ├── dev.bat              # Windows dev server script
│   ├── release.bat          # Windows release script
│   ├── release.sh           # macOS/Linux release script
│   ├── create-icons.js      # Generate placeholder icons
│   ├── sync-version.js      # Sync version to manifest.json
│   └── zip-extension.js     # Create distribution ZIP
├── src/
│   ├── background/          # Service worker
│   ├── content/             # Content scripts (text selection, paragraph detection)
│   ├── sidepanel/           # Side panel UI
│   ├── popup/               # Popup UI
│   ├── options/             # Settings page
│   └── lib/
│       ├── ai/              # AI provider abstractions
│       ├── storage/         # Cache & storage management
│       ├── firebase/        # Optional Firebase sync
│       ├── i18n/            # Internationalization
│       └── utils/           # Utilities
├── .eslintrc.cjs            # ESLint configuration
├── package.json
├── tailwind.config.js
├── vite.config.ts
└── tsconfig.json
```

---

## 🧪 Development

### Available Scripts

```bash
# Development
npm run dev              # Development mode with HMR (Hot Module Reload)
npm run build            # Build for production
npm run lint             # Run ESLint
npm run format           # Format code with Prettier

# Release & Distribution
npm run build:release    # Build + create ZIP (all-in-one)
npm run zip              # Create ZIP for Chrome Web Store
npm run version:patch    # Bump patch version (1.0.0 → 1.0.1)
npm run version:minor    # Bump minor version (1.0.0 → 1.1.0)
npm run version:major    # Bump major version (1.0.0 → 2.0.0)
npm run release:local    # Bump patch + build + ZIP
npm run sync-version     # Sync package.json version to manifest.json
```

### Testing

See comprehensive testing guide: [docs/TESTING.md](docs/TESTING.md)

**Quick test:**
1. Build extension: `npm run build`
2. Load in Chrome: `chrome://extensions/` → Load unpacked → Select `dist/`
3. Visit [Wikipedia](https://en.wikipedia.org/wiki/Python_(programming_language))
4. Verify paragraphs are detected with blue borders
5. Click translation toggle button
6. Test text selection translation
7. Open side panel and test chat

---

## 🛠️ Tech Stack

- **Extension**: Chrome Extension Manifest V3
- **Frontend**: React + TypeScript + Vite
- **Build**: CRXJS Vite Plugin
- **UI**: Tailwind CSS
- **Storage**: Chrome Storage API + IndexedDB + LRU Cache
- **AI APIs**: Claude API, OpenAI API, Gemini API
- **Backend**: Firebase (Auth + Firestore) - Optional
- **Performance**: IntersectionObserver, MutationObserver
- **i18n**: English, Korean, Japanese, Chinese

---

## 📋 Documentation

- **Testing Guide**: [docs/TESTING.md](docs/TESTING.md)
- **Implementation Summary**: [docs/PHASE8_SUMMARY.md](docs/PHASE8_SUMMARY.md)
- **Privacy Policy**: [docs/PRIVACY_POLICY.md](docs/PRIVACY_POLICY.md)
- **Terms of Service**: [docs/TERMS_OF_SERVICE.md](docs/TERMS_OF_SERVICE.md)
- **Chrome Web Store Checklist**: [docs/CHROME_WEB_STORE_CHECKLIST.md](docs/CHROME_WEB_STORE_CHECKLIST.md)
- **Windows Guide**: [docs/WINDOWS_GUIDE.md](docs/WINDOWS_GUIDE.md)

---

## 🚢 Deployment

### Option 1: GitHub Releases (Automated ✨)

**One-click automated deployment:**

#### Windows
```cmd
# Run the release script
scripts\release.bat
```

#### macOS / Linux
```bash
# Run the release script
./scripts/release.sh
```

**What happens automatically:**
1. ✅ Builds extension
2. ✅ Creates ZIP file
3. ✅ Creates git tag (reads version from package.json)
4. ✅ Pushes tag to GitHub
5. ✅ GitHub Actions triggers and:
   - Builds extension in clean environment
   - Creates ZIP
   - Creates GitHub Release with download link
   - Uploads ZIP file to release

**Manual method (alternative):**
```bash
# 1. Update version in package.json
# 2. Build and tag
npm run build
npm run zip
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0
# GitHub Actions handles the rest automatically
```

**Advantages:**
- ✅ Fully automated - one command
- ✅ Free and instant
- ✅ No review process
- ✅ Users download pre-built ZIP

### Option 2: Chrome Web Store (Official Distribution)

**For wider distribution:**

1. Review checklist: [docs/CHROME_WEB_STORE_CHECKLIST.md](docs/CHROME_WEB_STORE_CHECKLIST.md)
2. Build production version: `npm run build`
3. Create ZIP: `npm run zip`
4. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
5. Upload ZIP and fill in store listing (see [docs/STORE_LISTING.md](docs/STORE_LISTING.md))
6. Submit for review (1-3 business days)
7. $5 one-time developer fee

**Advantages:**
- Official Chrome Web Store listing
- Automatic updates
- Wider reach
- Users install with one click

---

## 🍴 Fork & Customize

Want to use this project as a base for your own Chrome extension? Follow these steps:

### 1. Fork the Repository

```bash
# Fork on GitHub, then clone your fork
git clone https://github.com/YOUR-USERNAME/chrome-translation-assistant.git
cd chrome-translation-assistant
npm install
```

### 2. Customize the Extension

**Update extension identity:**
- Edit `public/manifest.json`:
  - Change `name` and `description`
  - Update `homepage_url` to your repository
- Edit `package.json`:
  - Update `name`, `description`, `author`, `repository`
- Replace icons in `public/icons/` with your own (16, 32, 48, 128 px)

**Customize functionality:**
- AI providers: `src/lib/ai/` - Add new providers or modify existing ones
- UI themes: `src/styles/globals.css` and `tailwind.config.js`
- Translation behavior: `src/content/paragraphDetector.ts`
- Side panel UI: `src/sidepanel/`

### 3. Set Up CI/CD for Your Fork

This project includes GitHub Actions for automated builds and releases.

**For PR validation (automatic):**
- Works out of the box - every PR will be validated with lint and build checks

**For automated releases:**

1. **Manual release** (recommended for getting started):
   ```bash
   # Bump version and create release
   npm run version:patch   # or version:minor, version:major
   npm run build:release
   git add .
   git commit -m "Release v1.0.1"
   git tag v1.0.1
   git push origin main --tags
   ```

2. **GitHub Actions release** (via workflow dispatch):
   - Go to Actions → Release → Run workflow
   - Select version bump type (patch/minor/major)
   - Optionally enable Chrome Web Store upload

**For Chrome Web Store auto-upload (optional):**

Set up these GitHub Secrets in your repository settings:

| Secret Name | Description | How to Get |
|-------------|-------------|------------|
| `CHROME_EXTENSION_ID` | Your extension ID | From Chrome Web Store Developer Dashboard |
| `CHROME_CLIENT_ID` | Google API Client ID | [Google Cloud Console](https://console.cloud.google.com/) |
| `CHROME_CLIENT_SECRET` | Google API Client Secret | Google Cloud Console |
| `CHROME_REFRESH_TOKEN` | OAuth Refresh Token | Use `chrome-webstore-upload-cli` |

<details>
<summary>📋 Detailed Chrome Web Store API Setup</summary>

1. **Create Google Cloud Project:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create new project
   - Enable "Chrome Web Store API"

2. **Create OAuth Credentials:**
   - APIs & Services → Credentials → Create Credentials → OAuth Client ID
   - Application type: Desktop app
   - Note the Client ID and Client Secret

3. **Get Refresh Token:**
   ```bash
   npx chrome-webstore-upload-cli init
   # Follow prompts with your Client ID and Secret
   # Save the refresh token
   ```

4. **Add to GitHub Secrets:**
   - Repository → Settings → Secrets and variables → Actions
   - Add each secret

</details>

### 4. Available npm Scripts

```bash
# Development
npm run dev              # Start dev server with HMR
npm run build            # Build for production
npm run lint             # Run ESLint

# Release
npm run build:release    # Build + create ZIP
npm run version:patch    # Bump patch version (1.0.0 → 1.0.1)
npm run version:minor    # Bump minor version (1.0.0 → 1.1.0)
npm run version:major    # Bump major version (1.0.0 → 2.0.0)
npm run release:local    # Bump patch + build + ZIP (all-in-one)
npm run zip              # Create ZIP from dist/
npm run sync-version     # Sync package.json version to manifest.json
```

---

## 🤝 Contributing

Contributions are welcome! Here's how to contribute:

### Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork:**
   ```bash
   git clone https://github.com/YOUR-USERNAME/chrome-translation-assistant.git
   cd chrome-translation-assistant
   ```
3. **Install dependencies:**
   ```bash
   npm install
   ```
4. **Create a feature branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

### Development Workflow

1. **Make your changes** following the code style
2. **Test locally:**
   ```bash
   npm run lint          # Check for lint errors
   npm run build         # Ensure build succeeds
   ```
3. **Load in Chrome** and test manually
4. **Commit your changes:**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```
5. **Push and create PR:**
   ```bash
   git push origin feature/your-feature-name
   ```
   Then create a Pull Request on GitHub

### Commit Message Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation only
- `style:` Code style (formatting, semicolons, etc.)
- `refactor:` Code refactoring
- `perf:` Performance improvement
- `test:` Adding tests
- `chore:` Build process, dependencies, etc.

### Code Style

- TypeScript strict mode
- ESLint configuration in `.eslintrc.cjs`
- Tailwind CSS for styling
- React functional components with hooks

### Pull Request Guidelines

- PRs are automatically validated by CI (lint + build)
- Ensure all checks pass before requesting review
- Provide clear description of changes
- Link related issues if applicable

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

**Note**: You are responsible for your own API costs when using Claude, OpenAI, or Gemini APIs.

---

## 💡 Common Issues

### Extension doesn't load
- Check that you selected the `dist/` folder, not the root folder
- Make sure you ran `npm run build` first
- Check Chrome DevTools console for errors (F12)

### Translations not working
- Verify API key is valid in Options page
- Check network tab (F12) for API errors
- Ensure you have internet connection
- Try a different AI provider

### Paragraphs not detected
- Enable "Auto-translate" in Options
- Try changing Detection Mode (Balanced → Aggressive)
- Check if website uses unusual HTML structure
- Open DevTools console and look for errors

### Performance issues
- Reduce Detection Mode to Conservative
- Disable "Auto-translate on page load"
- Clear cache in Options page
- Restart Chrome

---

## 🌐 Supported Languages

**Target Languages**: English, Korean, Japanese, Chinese (Simplified/Traditional), Spanish, French, German, Italian, Portuguese, Russian, Arabic, Hindi, and 100+ more.

**UI Languages**: English, Korean, Japanese, Chinese

---

## 📞 Support

- **GitHub Issues**: Report bugs and request features
- **GitHub Discussions**: Ask questions and share ideas

---

## 🙏 Acknowledgments

- [CRXJS](https://crxjs.dev/vite-plugin/) - Vite plugin for Chrome Extensions
- [React](https://react.dev/) - UI framework
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [Anthropic Claude](https://www.anthropic.com/) - AI provider
- [OpenAI](https://openai.com/) - AI provider
- [Google Gemini](https://deepmind.google/technologies/gemini/) - AI provider

---

**Made with ❤️ for language learners worldwide**

Status: Ready for Testing
