# Privacy Policy for Translation & Learning Assistant

**Last Updated**: January 30, 2026

## Introduction

Translation & Learning Assistant ("we", "our", or "the Extension") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our Chrome Extension.

## Information We Collect

### 1. User-Provided Information

- **API Keys**: You provide API keys for AI services (Claude, OpenAI, Gemini). These are stored locally on your device using Chrome's storage API and are never transmitted to our servers.
- **Settings & Preferences**: Your language preferences, detection mode settings, and other configuration options are stored locally.
- **Translation History**: Text you translate and the resulting translations are stored locally on your device.

### 2. Automatically Collected Information

- **Usage Data**: The Extension tracks which features you use (e.g., text selection translation, auto paragraph detection) for improving functionality. This data is stored locally only.
- **Performance Metrics**: Detection times, cache hit rates, and other performance data are collected locally for optimization purposes.

### 3. Data Not Collected

We do NOT collect:
- Personal identification information (name, email, phone number)
- Browsing history
- Website URLs (except temporarily for context in translations)
- Credit card or payment information
- IP addresses

## How We Use Your Information

Your data is used exclusively for:

1. **Providing Translation Services**: Your selected text is sent to the AI provider you choose (Claude/OpenAI/Gemini) for translation. We do not intercept or store this data on our servers.
2. **Improving User Experience**: Settings and preferences are used to customize the Extension's behavior.
3. **Caching**: Previously translated text is cached locally to reduce API calls and improve performance.
4. **Cross-Device Sync** (Optional): If you enable Firebase sync and sign in with Google, your translation history is synchronized via Firebase Firestore.

## Data Storage

### Local Storage
- All data is stored locally on your device using Chrome's storage APIs
- Includes: API keys (encrypted), settings, translation history, cache
- Can be cleared anytime via Chrome's extension data management

### Cloud Storage (Optional)
- **Firebase Authentication**: If you choose to enable sync, we use Google Sign-In for authentication
- **Firebase Firestore**: Stores your translation history for cross-device synchronization
- **Data Location**: Your synced data is stored in Firebase's servers (location depends on Firebase configuration)
- **Encryption**: Data transmitted to Firebase is encrypted in transit (HTTPS)

## Third-Party Services

The Extension integrates with the following third-party services:

### AI Providers (You Choose One)
- **Anthropic (Claude)**: https://www.anthropic.com/privacy
- **OpenAI**: https://openai.com/privacy/
- **Google (Gemini)**: https://policies.google.com/privacy

When you translate text:
- Your selected text is sent directly to your chosen AI provider
- The provider's privacy policy applies to this data
- We do not store or process the AI provider's responses on our servers

### Firebase (Optional, Only if You Enable Sync)
- **Google Firebase**: https://firebase.google.com/support/privacy
- Used for authentication (Google Sign-In) and data synchronization (Firestore)
- Subject to Google's privacy policy

## Data Security

We implement security measures to protect your data:

1. **API Key Encryption**: API keys are encrypted before storage
2. **Local-First Architecture**: All data processing happens locally on your device
3. **HTTPS Only**: All network communications use HTTPS encryption
4. **No Server-Side Storage**: We do not operate servers that store your data
5. **Minimal Permissions**: The Extension requests only necessary Chrome permissions

## Your Rights

You have the right to:

1. **Access Your Data**: View all stored data via Chrome's extension storage interface
2. **Delete Your Data**:
   - Clear local data: Go to `chrome://extensions/` → Remove extension
   - Clear cloud data: Sign out and delete from Firebase console
3. **Export Your Data**: Use the Extension's export feature (if implemented)
4. **Opt-Out of Sync**: Disable Firebase synchronization in settings
5. **Opt-Out of Analytics**: Analytics data is only stored locally, not shared

## Children's Privacy

The Extension is not intended for use by children under 13. We do not knowingly collect information from children under 13.

## Data Retention

- **Local Data**: Retained until you clear extension data or uninstall the Extension
- **Cloud Data** (if sync enabled): Retained until you delete your account or data manually
- **Translation Cache**: Automatically expires after 30 days

## Changes to Privacy Policy

We may update this Privacy Policy from time to time. We will notify you of changes by:
- Updating the "Last Updated" date
- Displaying a notification in the Extension (for major changes)

## International Users

The Extension is designed for global use. If you use the Extension outside your country:
- Your data may be transferred to and processed in countries where our service providers operate
- Firebase data location depends on your Firebase configuration
- AI providers may process data in various global locations

## Contact Us

If you have questions about this Privacy Policy:

- **GitHub Issues**: https://github.com/[your-username]/chrome-translation-assistant/issues
- **Email**: [your-email@example.com]

## Consent

By using the Translation & Learning Assistant Extension, you consent to this Privacy Policy and our data practices.

---

## Summary (TL;DR)

✅ **What we collect**: Settings, translation history (local only), API keys (encrypted locally)

✅ **What we DON'T collect**: Personal info, browsing history, credit cards

✅ **Where data is stored**: Locally on your device (+ optionally Firebase if you enable sync)

✅ **Third-party sharing**: Only your chosen AI provider receives translation requests

✅ **Your control**: Delete data anytime, opt-out of sync, full data access

---

**Version**: 1.0.0
**Effective Date**: January 30, 2026
