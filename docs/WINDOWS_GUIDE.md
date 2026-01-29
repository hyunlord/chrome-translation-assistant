# Windows User Guide

## 🪟 Building & Running Chrome Extension on Windows

### Prerequisites

1. **Install Node.js**
   - Visit [https://nodejs.org/](https://nodejs.org/)
   - Download LTS version (18.x or higher)
   - Run the installer
   - Make sure "Add to PATH" option is checked

2. **Install Chrome Browser**
   - [https://www.google.com/chrome/](https://www.google.com/chrome/)

3. **Text Editor** (optional)
   - VS Code recommended: [https://code.visualstudio.com/](https://code.visualstudio.com/)

### Quick Start

#### Method 1: Using Batch Files (Recommended for Beginners)

1. **Open Project Folder**
   - Open the `chrome-translation-assistant` folder in File Explorer

2. **Build**
   - Double-click `scripts\build.bat`
   - Build will run automatically
   - Wait for "BUILD SUCCESSFUL!" message

3. **Load in Chrome**
   - Open Chrome
   - Type `chrome://extensions/` in the address bar
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the `dist` folder

#### Method 2: Using Command Prompt

**Open Command Prompt:**
- `Win + R` → type `cmd` → Press Enter
- Or Start → Search "Command Prompt"

**Run commands:**
```cmd
cd chrome-translation-assistant
npm install
npm run build
```

#### Method 3: Using PowerShell

**Open PowerShell:**
- `Win + X` → Select "Windows PowerShell"
- Or Start → Search "PowerShell"

**Run commands:**
```powershell
cd chrome-translation-assistant
npm install
npm run build
```

### Development Mode (When Modifying Code)

**HMR (Hot Module Replacement) Supported:**

```cmd
# Double-click scripts\dev.bat or run:
npm run dev
```

- Auto-reloads when code is modified
- Press Ctrl+C to stop

### Folder Structure

```
chrome-translation-assistant/
│
├── scripts/
│   ├── build.bat              ← Double-click to build
│   └── dev.bat                ← Double-click to run dev server
│
├── dist/                      ← Build output (folder to load in Chrome)
│   ├── manifest.json
│   ├── assets/
│   └── ...
│
├── src/                       ← Source code
│   ├── background/
│   ├── content/
│   ├── sidepanel/
│   └── ...
│
└── chrome-translation-assistant.zip  ← For Web Store submission
```

### Chrome Extension Loading - Detailed Guide

**Step 1: Open Extensions Page**

Method A: Address bar
```
chrome://extensions/
```

Method B: Menu
```
Menu (⋮) → More tools → Extensions
```

**Step 2: Enable Developer Mode**
- Click the "Developer mode" toggle in the top right (turns blue)

**Step 3: Load Extension**
- Click "Load unpacked" button
- In the folder selection dialog, choose the `dist` folder
- Click "Select Folder"

**Step 4: Verify**
- Extension appears in the list
- No errors = Success!

### Settings Guide

**1. Open Options Page**
```
Right-click extension icon → "Options"
or
chrome://extensions/ → Extension details → "Extension options"
```

**2. API Key Setup**
```
1. Select AI Provider (Claude/OpenAI/Gemini)
2. Enter API Key
   - Claude: https://console.anthropic.com/account/keys
   - OpenAI: https://platform.openai.com/api-keys
   - Gemini: https://makersuite.google.com/app/apikey
3. Click "Validate" to verify key
```

**3. Language Settings**
```
Target Language: Select your preferred language
```

**4. Auto-Translation Settings**
```
☑ Auto-translate paragraphs
Detection Mode: Balanced (recommended)
☑ Auto-translate on page load (optional)
☑ Exclude code blocks
```

**5. Save**
```
Click "Save Settings"
Verify "Settings saved successfully!" message
```

### Testing

**Simple Test:**

1. **Wikipedia Test**
   ```
   https://en.wikipedia.org/wiki/Python_(programming_language)
   ```
   - Verify paragraphs are auto-detected after page loads
   - Check for blue left border on paragraphs
   - Hover over paragraph to see 🔄 button
   - Click to verify translation

2. **Keyboard Shortcut Test**
   ```
   Press Alt + T
   ```
   - All paragraphs toggle at once

3. **Console Check (F12)**
   ```
   Auto Paragraph Manager: Initializing...
   Auto Paragraph Manager: Detecting paragraphs...
   Auto Paragraph Manager: Found X candidates
   ```

### Troubleshooting

#### Issue 1: npm not found

**Symptom:**
```
'npm' is not recognized as an internal or external command
```

**Solution:**
1. Verify Node.js installation
   ```cmd
   node --version
   ```
2. If not installed:
   - Visit https://nodejs.org/
   - Download Windows Installer (.msi)
   - Restart Command Prompt after installation

#### Issue 2: Permission Error

**Symptom:**
```
Error: EACCES: permission denied
```

**Solution:**
1. Run Command Prompt as Administrator
   - Start → Search "cmd" → Right-click → "Run as administrator"

2. Or work in user folder
   ```cmd
   cd %USERPROFILE%\chrome-translation-assistant
   ```

#### Issue 3: Build Failure

**Symptom:**
```
Build failed with errors
```

**Solution:**
```cmd
# 1. Delete node_modules
rmdir /s /q node_modules

# 2. Delete package-lock.json
del package-lock.json

# 3. Reinstall
npm install

# 4. Rebuild
npm run build
```

#### Issue 4: Extension Load Failure

**Symptom:**
- "Manifest file is missing or unreadable"
- Extension not working

**Solution:**
1. Verify dist folder
   ```cmd
   dir dist
   ```
   - Check if manifest.json file exists

2. Rebuild
   ```cmd
   rmdir /s /q dist
   npm run build
   ```

3. Click "Refresh" on Chrome Extensions page

#### Issue 5: TypeScript Error

**Symptom:**
```
Cannot find module 'typescript'
```

**Solution:**
```cmd
npm install -D typescript
npm run build
```

### Windows Firewall Settings

Firewall warning may appear when running dev server:

1. Click "Allow access"
2. Or manual setup:
   ```
   Control Panel → Windows Defender Firewall
   → Allow an app or feature
   → Find Node.js and check
   ```

### Performance Optimization (Windows)

**Improve Build Speed:**

1. **Add Windows Defender Exception**
   ```
   Windows Security → Virus & threat protection
   → Manage settings → Add exclusion
   → Folder: [project-path]\node_modules
   ```

2. **Use SSD**
   - Placing project on SSD improves build speed

### Useful Windows Shortcuts

- `Win + R`: Run dialog
- `Win + E`: File Explorer
- `Ctrl + Shift + Esc`: Task Manager
- `Alt + Tab`: Switch programs
- Chrome `F12`: Developer Tools
- Chrome `Ctrl + Shift + R`: Hard refresh

### Development in VS Code (Recommended)

**Install VS Code:**
1. Visit https://code.visualstudio.com/
2. Download Windows version
3. Install

**Open Project:**
```
1. Run VS Code
2. File → Open Folder
3. Select chrome-translation-assistant folder
```

**Build in Terminal:**
```
Ctrl + ` (backtick): Open terminal
npm run build
```

**Recommended Extensions:**
- ESLint
- Prettier
- TypeScript Vue Plugin (Volar)

### Additional Help

**Official Documentation:**
- Node.js: https://nodejs.org/
- Chrome Extensions: https://developer.chrome.com/docs/extensions/
- Vite: https://vitejs.dev/

**Community:**
- GitHub Issues: Report issues in the project
- Stack Overflow: Technical questions

### Next Steps

1. ✅ Build successful
2. ✅ Loaded in Chrome
3. ✅ Settings complete
4. ✅ Testing complete

**What to do now:**
- Complete TESTING.md checklist
- Test on various websites
- Report bugs via GitHub Issues
- Prepare for Chrome Web Store submission

---

**If issues persist:**
- Ask on GitHub Issues with error message
- Include Windows version, Node.js version
