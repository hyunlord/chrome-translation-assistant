# Phase 8: Auto Paragraph Detection - Testing Guide

## Overview

This guide helps you test the newly implemented auto paragraph detection and translation feature.

## Prerequisites

1. Build the extension:
   ```bash
   npm run build
   ```

2. Load extension in Chrome:
   - Open `chrome://extensions/`
   - Enable "Developer mode" (top right)
   - Click "Load unpacked"
   - Select the `dist/` folder

## Quick Test Checklist

### ✅ Basic Functionality

1. **Enable Feature**
   - Open extension Options page (right-click extension icon → Options)
   - Enable "Auto-translate paragraphs" checkbox
   - Select "Balanced" detection mode (recommended)
   - Keep "Auto-translate on page load" unchecked for manual testing first
   - Save settings

2. **Test on Wikipedia**
   - Navigate to any Wikipedia article (e.g., `https://en.wikipedia.org/wiki/Python_(programming_language)`)
   - Open browser console (F12) to see logs
   - Trigger translation:
     - If "Auto-translate on page load" is OFF: Refresh page
     - If ON: It should start automatically
   - **Expected**: Console should show "Auto Paragraph Manager: Detecting paragraphs..."
   - **Expected**: Paragraphs should have a blue left border
   - **Expected**: Hovering over paragraphs shows toggle button (🔄)

3. **Test Translation Overlay**
   - Hover over a detected paragraph
   - Click the toggle button (🔄)
   - **Expected**: Paragraph text should change to translated version
   - **Expected**: Button changes to ↩️
   - Click again to toggle back
   - **Expected**: Shows original text again

4. **Test Keyboard Shortcut**
   - Press `Alt+T`
   - **Expected**: All paragraphs toggle between original and translated
   - Press again
   - **Expected**: All paragraphs toggle back

### ✅ Advanced Features

5. **Test Content Filtering**
   - Check navigation bar
   - **Expected**: Nav items NOT detected as paragraphs
   - Check footer
   - **Expected**: Footer NOT detected
   - Check article content
   - **Expected**: Only main content paragraphs detected

6. **Test Code Block Exclusion**
   - Navigate to a page with code (e.g., GitHub repo README)
   - **Expected**: Code blocks (`<pre>`, `<code>`) NOT translated
   - Go to Options → Uncheck "Exclude code blocks"
   - Refresh page
   - **Expected**: Code blocks NOW detected (if detection mode allows)

7. **Test Detection Modes**
   - **Aggressive**: Detects more paragraphs (lower quality threshold)
     - Change mode in Options
     - Refresh Wikipedia
     - **Expected**: More paragraphs detected (including shorter ones)

   - **Balanced** (recommended): Main content only
     - **Expected**: ~10-30 paragraphs on typical article

   - **Conservative**: High confidence only
     - **Expected**: Fewer, high-quality paragraphs

8. **Test Dynamic Content (Twitter/X)**
   - Navigate to Twitter/X feed
   - Enable auto-translate
   - Scroll down to load new tweets
   - **Expected**: New tweets/posts get detected automatically
   - **Expected**: Console shows "Detected new elements"

9. **Test SPA Navigation (GitHub)**
   - Go to a GitHub repo
   - Click on a file
   - **Expected**: Extension resets and re-detects on new page
   - **Expected**: Console shows "URL changed, resetting..."

10. **Test Caching**
    - Translate a paragraph
    - Refresh the page
    - **Expected**: Same paragraph translates instantly (from cache)
    - **Expected**: Console shows "Cache hits" count

### ✅ Performance Testing

11. **Test Large Pages**
    - Navigate to a long Wikipedia article
    - Open Performance tab in DevTools
    - Record page load
    - **Expected**: Detection completes in < 100ms
    - **Expected**: Memory usage < 5MB for overlays

12. **Test Batch Translation**
    - Enable auto-translate on load
    - Navigate to article with many paragraphs
    - Open Network tab
    - **Expected**: Multiple paragraphs translated in single API call
    - **Expected**: Visible paragraphs translated first

13. **Test Visibility Detection**
    - Navigate to long article
    - Don't scroll
    - **Expected**: Only visible paragraphs get translated immediately
    - Scroll down
    - **Expected**: New visible paragraphs start translating

### ✅ Error Handling

14. **Test Without API Key**
    - Remove API key from Options
    - Try to translate
    - **Expected**: Error message in overlay: "Translation failed: Provider not registered"

15. **Test Network Error**
    - Enable auto-translate
    - Disable internet (or block API domain)
    - Try to translate
    - **Expected**: Error overlay shown
    - **Expected**: Can retry manually

## Recommended Test Sites

### Well-Structured Content
- ✅ **Wikipedia**: `https://en.wikipedia.org/wiki/Artificial_intelligence`
  - Good semantic HTML
  - Clear paragraphs
  - No dynamic content

- ✅ **Medium**: `https://medium.com/` (any article)
  - Clean blog format
  - Good paragraph detection
  - Minimal noise

### Complex Layouts
- ⚠️ **News Sites** (CNN, BBC, NYTimes)
  - Ads, sidebars, navigation
  - Tests filtering
  - Complex DOM structure

### Dynamic Content
- 🔄 **Twitter/X**: `https://twitter.com/`
  - Infinite scroll
  - Real-time updates
  - SPA navigation

- 🔄 **Reddit**: `https://reddit.com/`
  - Comments loading
  - Dynamic threads
  - Nested structure

### Technical Content
- 💻 **GitHub**: `https://github.com/` (any repo)
  - Code blocks
  - SPA navigation
  - Mixed content (code + docs)

- 💻 **Stack Overflow**: `https://stackoverflow.com/questions`
  - Code snippets
  - Questions + answers
  - Technical content

## Debugging Tips

### Check Console Logs

Key log messages to look for:

```
✅ "Auto Paragraph Manager: Initializing..."
✅ "Auto Paragraph Manager: Detecting paragraphs..."
✅ "Auto Paragraph Manager: Found X candidates"
✅ "Batch translation requested: X paragraphs"
✅ "Cache hits: X, Cache misses: Y"
```

### Inspect Paragraph State

In browser console:
```javascript
// Get manager stats (if available)
// Note: This requires exposing manager to window for debugging
console.log(autoParagraphManager?.getStats())
```

### Common Issues

**Issue**: No paragraphs detected
- **Check**: Is "Auto-translate paragraphs" enabled in Options?
- **Check**: Console for errors
- **Try**: Change detection mode to "Aggressive"

**Issue**: Too many paragraphs detected
- **Solution**: Use "Conservative" mode
- **Solution**: Increase minimum paragraph length

**Issue**: Navigation/ads being translated
- **Report**: This is a bug - content filter needs improvement
- **Workaround**: Use "Conservative" mode

**Issue**: Translations not showing
- **Check**: API key is set
- **Check**: Network tab for API errors
- **Check**: Console for error messages

**Issue**: Performance problems
- **Check**: How many paragraphs detected? (should be < 50)
- **Solution**: Use "Balanced" or "Conservative" mode
- **Check**: Disable auto-translate on large pages

## Performance Benchmarks

Target metrics:

| Metric | Target | Measured |
|--------|--------|----------|
| Detection time (50 paragraphs) | < 100ms | ___ ms |
| Translation latency per batch | < 2s | ___ s |
| Memory usage (overlays) | < 5MB | ___ MB |
| Cache hit rate (revisit) | > 60% | ___ % |
| API calls per page | < 5 | ___ calls |

## Success Criteria

Phase 8 is successful when:

- ✅ Auto paragraph detection toggleable in settings
- ✅ Paragraphs detected on Wikipedia/Medium with >90% accuracy
- ✅ Navigation/ads filtered with >95% accuracy
- ✅ Translation overlays appear with smooth animations
- ✅ Toggle functionality works (button + Alt+T)
- ✅ Performance targets met
- ✅ Dynamic content supported (SPAs, infinite scroll)
- ✅ Caching reduces API calls by >60%
- ✅ No breaking of existing features (text selection, PDF, chat)

## Reporting Issues

If you find bugs, please report with:

1. **Browser version**: Chrome version number
2. **Extension version**: 1.0.0
3. **Steps to reproduce**: Exact steps
4. **Expected behavior**: What should happen
5. **Actual behavior**: What actually happened
6. **Console logs**: Any error messages
7. **Screenshots**: If visual issue
8. **Test site URL**: Where it happened

## Next Steps After Testing

Once testing is complete and issues are fixed:

1. **Phase 9**: Polish & Optimization
   - Performance profiling
   - Accessibility improvements
   - Internationalization

2. **Phase 10**: Deployment
   - Chrome Web Store submission
   - Privacy policy
   - Documentation
