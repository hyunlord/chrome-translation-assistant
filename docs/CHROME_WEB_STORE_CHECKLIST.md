# Chrome Web Store Submission Checklist

## Pre-Submission Requirements

### ✅ Account Setup
- [ ] Chrome Web Store developer account registered ($5 one-time fee)
- [ ] Developer account verified
- [ ] Payment method added (if monetizing)

### ✅ Extension Files
- [ ] Production build completed (`npm run build`)
- [ ] ZIP file created (`npm run zip`)
- [ ] ZIP size < 128 MB (current size: ___ MB)
- [ ] All files optimized (no source maps in production)

### ✅ Testing
- [ ] Tested on multiple websites (Wikipedia, Medium, news sites)
- [ ] Tested all features (text selection, auto-detect, chat, PDF)
- [ ] Tested on different screen sizes
- [ ] No console errors in production build
- [ ] Performance benchmarks met (see TESTING.md)
- [ ] Works on latest Chrome version (check current: chrome://version/)

### ✅ Code Quality
- [ ] `npm run lint` passes with no errors
- [ ] `npm run format` applied to all files
- [ ] No TODO comments in production code
- [ ] No console.log statements in production (or conditional)
- [ ] All TypeScript errors resolved

---

## Store Listing Assets

### ✅ Required Images

**Icon (Required)**
- [ ] 128x128 PNG icon created
  - File: `public/icons/icon-128.png`
  - Clear, recognizable design
  - Works at small sizes
  - No text (or minimal)

**Screenshots (Required - at least 1, max 5)**
- [ ] Screenshot 1: Hero shot (side panel with translation)
  - Size: 1280x800 or 640x400 pixels
  - Format: PNG or JPEG
  - Annotations/highlights if needed

- [ ] Screenshot 2: Auto paragraph detection in action
  - Shows webpage with translation overlays
  - Highlights key features

- [ ] Screenshot 3: Settings/Options page
  - Shows configuration options
  - Clean, professional look

- [ ] Screenshot 4: Chat interface
  - Interactive Q&A demonstration

- [ ] Screenshot 5: History view
  - Translation history browser

**Promotional Tile (Optional but recommended)**
- [ ] Small tile: 440x280 PNG
  - Extension logo
  - Tagline
  - Key features highlighted

**Marquee Promotional Tile (Optional)**
- [ ] Marquee: 1400x560 PNG
  - For featured listings
  - High quality design

### ✅ Store Listing Text

**Name (Max 75 characters)**
- [ ] Name decided: "Translation & Learning Assistant"
- [ ] Unique (check existing extensions)
- [ ] Descriptive
- [ ] SEO-friendly

**Summary (Max 132 characters)**
- [ ] Tagline written: "AI-powered translation with auto paragraph detection. Supports Claude, GPT, Gemini. Learn languages while browsing!"
- [ ] Compelling
- [ ] Highlights key features
- [ ] Under character limit

**Detailed Description (Max 16,000 characters)**
- [ ] Full description written (see STORE_LISTING.md)
- [ ] Features clearly listed
- [ ] Use cases explained
- [ ] Setup instructions included
- [ ] Benefits highlighted
- [ ] Keywords included naturally

**Category**
- [ ] Primary category: Productivity
- [ ] Secondary (optional): Education, Tools

**Language**
- [ ] Primary language: English
- [ ] Additional languages (optional): Korean, Japanese, Chinese

---

## Legal & Privacy

### ✅ Privacy Policy
- [ ] Privacy policy created (PRIVACY_POLICY.md)
- [ ] Hosted on publicly accessible URL OR
- [ ] Included in extension as HTML page
- [ ] Privacy policy URL added to manifest.json
- [ ] Covers:
  - [ ] Data collection
  - [ ] Third-party services (AI providers, Firebase)
  - [ ] User rights
  - [ ] Contact information

**Recommended hosting options:**
- GitHub Pages (free)
- GitHub Gist
- Google Sites
- Your own website

**Add to manifest.json:**
```json
"privacy_policy": "https://github.com/[username]/chrome-translation-assistant/blob/main/PRIVACY_POLICY.md"
```

### ✅ Terms of Service
- [ ] Terms of service created (TERMS_OF_SERVICE.md)
- [ ] Linked in store listing
- [ ] Covers:
  - [ ] User responsibilities
  - [ ] API usage terms
  - [ ] Disclaimers
  - [ ] Limitation of liability

### ✅ Permissions Justification
- [ ] All permissions explained in listing description
- [ ] Minimal permissions requested
- [ ] Each permission has clear purpose

**Required justifications:**
```
activeTab: Access selected text on current page for translation
storage: Save settings, translation history, and cache locally
sidePanel: Display translation results in side panel interface
scripting: Inject content scripts for paragraph detection overlays
contextMenus: Add right-click "Translate" option for convenience
identity: Optional Google Sign-In for cross-device sync (Firebase)
<all_urls>: Translate text on any website (user's choice)
```

---

## Manifest.json Verification

### ✅ Required Fields
- [ ] `manifest_version`: 3
- [ ] `name`: "Translation & Learning Assistant"
- [ ] `version`: "1.0.0"
- [ ] `description`: (Under 132 chars)
- [ ] `icons`: All sizes (16, 32, 48, 128)
- [ ] `permissions`: Array with required permissions
- [ ] `host_permissions`: Array with host patterns
- [ ] `background.service_worker`: Points to compiled JS
- [ ] `content_scripts`: Configured correctly
- [ ] `action.default_popup`: Points to HTML
- [ ] `options_page`: Points to HTML
- [ ] `side_panel.default_path`: Points to HTML

### ✅ Optional but Recommended
- [ ] `homepage_url`: GitHub repository
- [ ] `privacy_policy`: URL to privacy policy
- [ ] `author`: Your name/organization
- [ ] `web_accessible_resources`: For assets

### ✅ Content Security Policy
- [ ] CSP configured for Manifest V3
- [ ] No unsafe-eval or unsafe-inline
- [ ] Works with React/Vite build

---

## Testing Checklist

### ✅ Functionality Tests
- [ ] Extension installs without errors
- [ ] All UI components load properly
- [ ] Text selection translation works
- [ ] Auto paragraph detection works
- [ ] Settings save and persist
- [ ] API keys work for all providers
- [ ] Chat interface functional
- [ ] PDF translation works
- [ ] Firebase sync works (if configured)
- [ ] History tracking works
- [ ] Cache works (check revisit)
- [ ] Keyboard shortcuts work (Alt+T)

### ✅ Browser Compatibility
- [ ] Chrome (latest version)
- [ ] Chrome (version - 1)
- [ ] Edge (Chromium-based)

### ✅ Platform Tests
- [ ] Windows
- [ ] macOS
- [ ] Linux

### ✅ Performance Tests
- [ ] No memory leaks
- [ ] CPU usage acceptable
- [ ] Network requests optimized
- [ ] Paragraph detection < 100ms
- [ ] Translation latency < 2s

---

## Submission Process

### ✅ Developer Dashboard

1. **Login**
   - [ ] Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
   - [ ] Sign in with Google account
   - [ ] Pay $5 developer fee (one-time)

2. **Create New Item**
   - [ ] Click "New Item"
   - [ ] Upload ZIP file
   - [ ] Wait for automatic checks (2-5 minutes)
   - [ ] Fix any errors reported

3. **Store Listing**
   - [ ] Fill in all required fields
   - [ ] Upload all images (icon, screenshots, promotional)
   - [ ] Write description
   - [ ] Select category
   - [ ] Add privacy policy URL
   - [ ] Set language
   - [ ] Choose visibility (Public/Unlisted/Private)

4. **Distribution**
   - [ ] Select countries (All or specific)
   - [ ] Pricing: Free
   - [ ] Visibility: Public (or Unlisted for testing)

5. **Privacy Practices**
   - [ ] Answer data usage questions:
     - [ ] Does extension handle personal info? NO
     - [ ] Does extension collect user data? NO (or explain if sync enabled)
     - [ ] Does extension use remote code? NO
     - [ ] Is extension compliant with User Data Policy? YES

6. **Submit for Review**
   - [ ] Review all information
   - [ ] Click "Submit for Review"
   - [ ] Note: Review takes 1-3 business days (sometimes longer)

---

## Post-Submission

### ✅ After Approval
- [ ] Verify listing looks correct
- [ ] Test install from Chrome Web Store
- [ ] Check all links work
- [ ] Monitor user reviews
- [ ] Respond to user feedback

### ✅ Marketing
- [ ] Post on GitHub Discussions
- [ ] Share on Reddit (r/chrome_extensions, r/languagelearning)
- [ ] Post on Twitter/X
- [ ] Write blog post
- [ ] Submit to extension directories
- [ ] Add "Available on Chrome Web Store" badge to README

### ✅ Monitoring
- [ ] Set up error tracking (if not already)
- [ ] Monitor Chrome Web Store reviews
- [ ] Track installation metrics
- [ ] Monitor GitHub issues
- [ ] Collect user feedback

---

## Common Rejection Reasons & How to Avoid

### ⚠️ Policy Violations
- **Issue**: Unclear permissions usage
- **Solution**: Clearly explain each permission in description

- **Issue**: Missing privacy policy
- **Solution**: Include complete privacy policy with public URL

- **Issue**: Deceptive practices
- **Solution**: Accurately describe features, no false claims

### ⚠️ Technical Issues
- **Issue**: Extension doesn't work as described
- **Solution**: Thorough testing before submission

- **Issue**: Broken links in listing
- **Solution**: Verify all URLs work

- **Issue**: Low-quality images
- **Solution**: Use high-resolution, clear screenshots

### ⚠️ Manifest Issues
- **Issue**: Invalid manifest structure
- **Solution**: Validate with Chrome extension validator

- **Issue**: Excessive permissions
- **Solution**: Request only necessary permissions

---

## Timeline

**Estimated Timeline:**
- Preparation: 1-2 days (if assets ready)
- Submission: 30 minutes
- Review: 1-3 business days (average)
- Revisions (if needed): 1-2 days + review again

**Total**: ~3-7 days from submission to publication

---

## Resources

### Official Docs
- [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
- [Developer Program Policies](https://developer.chrome.com/docs/webstore/program-policies/)
- [Publish in Chrome Web Store](https://developer.chrome.com/docs/webstore/publish/)
- [User Data Policy](https://developer.chrome.com/docs/webstore/user-data/)
- [Branding Guidelines](https://developer.chrome.com/docs/webstore/branding/)

### Helpful Tools
- [Extension Manifest Validator](https://developer.chrome.com/docs/extensions/mv3/manifest/)
- [Chrome Extension Samples](https://github.com/GoogleChrome/chrome-extensions-samples)
- [Image Optimizer](https://tinypng.com/) - Compress screenshots
- [Markdown to HTML](https://markdowntohtml.com/) - For privacy policy

### Community
- [r/chrome_extensions](https://reddit.com/r/chrome_extensions)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/google-chrome-extension)
- [Chrome Extension Google Group](https://groups.google.com/a/chromium.org/g/chromium-extensions)

---

## Final Checks Before Submission

- [ ] All above checkboxes completed
- [ ] ZIP file tested one final time
- [ ] All assets uploaded
- [ ] Privacy policy publicly accessible
- [ ] Store listing reviewed for typos
- [ ] Screenshots represent current version
- [ ] Ready for user feedback

---

**Good luck with your submission! 🚀**

**Questions?** Check the [Chrome Web Store FAQ](https://developer.chrome.com/docs/webstore/faq/) or open an issue on GitHub.