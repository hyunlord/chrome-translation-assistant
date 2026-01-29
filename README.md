# Chrome Translation Assistant

AI-powered translation assistant Chrome Extension with multi-provider support and cross-device synchronization.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Chrome](https://img.shields.io/badge/chrome-extension-brightgreen.svg)
![Status](https://img.shields.io/badge/status-in%20development-yellow.svg)

## Features

- 📝 **Text Selection Translation**: Select any text on web pages or PDFs and translate instantly
- 🤖 **Auto Paragraph Detection**: AI automatically detects and suggests paragraph translations
- 🎨 **Side Panel UI**: GPT Atlas-style side panel interface
- 💬 **Interactive Chat**: Ask follow-up questions and get explanations
- 🔄 **Multi-AI Support**: Choose between Claude, OpenAI GPT, and Google Gemini
- ☁️ **Cross-Device Sync**: Firebase + Chrome Storage hybrid synchronization
- 📚 **History Management**: All translations and chats saved with source URL tracking
- 🔗 **Source Navigation**: Jump back to original location from history

## Tech Stack

- **Extension**: Chrome Extension Manifest V3
- **Frontend**: React + TypeScript + Vite + CRXJS
- **UI**: Tailwind CSS
- **Backend**: Firebase (Auth + Firestore)
- **AI APIs**: Claude API, OpenAI API, Gemini API
- **Storage**: Chrome Storage API + IndexedDB + Firebase
- **Build**: Vite + CRXJS Plugin

## Project Status

🚧 **Currently in Phase 1: Foundation** (Week 1-2)

- [x] Project structure setup
- [x] Vite + React + TypeScript + CRXJS configuration
- [x] Tailwind CSS setup
- [ ] manifest.json creation
- [ ] Basic component skeletons
- [ ] Chrome Storage API wrapper
- [ ] Message passing infrastructure
- [ ] Service worker basic structure

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Chrome browser

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/chrome-translation-assistant.git
cd chrome-translation-assistant

# Install dependencies
npm install

# Start development server
npm run dev
```

### Loading the Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `dist/` folder from the project directory

## Development

```bash
# Development mode with HMR
npm run dev

# Build for production
npm run build

# Run linter
npm run lint

# Format code
npm run format

# Create ZIP for Chrome Web Store
npm run zip
```

## Project Structure

```
chrome-translation-assistant/
├── public/
│   ├── icons/              # Extension icons
│   └── manifest.json       # Extension manifest
├── src/
│   ├── background/         # Service worker
│   ├── content/            # Content scripts
│   ├── sidepanel/          # Side panel UI
│   ├── popup/              # Popup UI
│   ├── options/            # Options page
│   ├── lib/                # Shared libraries
│   │   ├── ai/             # AI provider abstraction
│   │   ├── storage/        # Storage layer
│   │   ├── firebase/       # Firebase integration
│   │   └── utils/          # Utilities
│   └── types/              # TypeScript types
├── package.json
├── vite.config.ts
├── tsconfig.json
└── tailwind.config.js
```

## Roadmap

### Phase 1: Foundation (Weeks 1-2) ✅
- [x] Basic extension structure
- [ ] Component skeletons
- [ ] Storage wrapper
- [ ] Message passing

### Phase 2: Core Translation (Weeks 3-4)
- [ ] Text selection detection
- [ ] AI provider integration (Claude)
- [ ] Side panel translation display
- [ ] Translation caching

### Phase 3: Multi-AI Support (Week 5)
- [ ] OpenAI provider
- [ ] Gemini provider
- [ ] API key management
- [ ] Provider settings

### Phase 4: UI Enhancement (Weeks 6-7)
- [ ] Rich side panel UI
- [ ] Chat interface
- [ ] History browser
- [ ] Dark mode

### Phase 5: PDF Support (Week 8)
- [ ] PDF text extraction
- [ ] PDF selection handling
- [ ] PDF context storage

### Phase 6-10: Advanced Features
- Storage & history management
- Firebase integration
- Auto paragraph detection
- Polish & optimization
- Chrome Web Store deployment

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

If you encounter any issues or have questions:
- Open an [issue](https://github.com/your-username/chrome-translation-assistant/issues)
- Check the [documentation](docs/)

## Acknowledgments

- [CRXJS](https://crxjs.dev/vite-plugin/) - Vite plugin for Chrome Extensions
- [React](https://react.dev/) - UI framework
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [Firebase](https://firebase.google.com/) - Backend services

---

Made with ❤️ for language learners worldwide
