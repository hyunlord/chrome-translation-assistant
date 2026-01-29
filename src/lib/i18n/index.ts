// Internationalization (i18n) support

/**
 * Supported languages
 */
export type SupportedLanguage = 'en' | 'ko' | 'ja' | 'zh'

/**
 * Translation messages
 */
interface Messages {
  // Settings
  settings_title: string
  settings_ai_provider: string
  settings_api_key: string
  settings_target_language: string
  settings_auto_translate: string
  settings_show_tooltip: string
  settings_detection_mode: string
  settings_save: string

  // Detection modes
  mode_aggressive: string
  mode_balanced: string
  mode_conservative: string

  // Actions
  action_translate: string
  action_explain: string
  action_toggle: string
  action_save: string
  action_cancel: string

  // Messages
  msg_translating: string
  msg_translation_failed: string
  msg_no_api_key: string
  msg_settings_saved: string

  // Keyboard shortcuts
  shortcut_toggle_all: string
}

/**
 * Translation data
 */
const translations: Record<SupportedLanguage, Messages> = {
  en: {
    settings_title: 'Settings',
    settings_ai_provider: 'AI Provider',
    settings_api_key: 'API Key',
    settings_target_language: 'Target Language',
    settings_auto_translate: 'Auto-translate paragraphs',
    settings_show_tooltip: 'Show tooltip on selection',
    settings_detection_mode: 'Detection Mode',
    settings_save: 'Save Settings',

    mode_aggressive: 'Aggressive - All text blocks',
    mode_balanced: 'Balanced - Main content only (Recommended)',
    mode_conservative: 'Conservative - High confidence only',

    action_translate: 'Translate',
    action_explain: 'Explain',
    action_toggle: 'Toggle',
    action_save: 'Save',
    action_cancel: 'Cancel',

    msg_translating: 'Translating...',
    msg_translation_failed: 'Translation failed',
    msg_no_api_key: 'Please set your API key in settings',
    msg_settings_saved: 'Settings saved successfully!',

    shortcut_toggle_all: 'Press Alt+T to toggle all paragraphs',
  },

  ko: {
    settings_title: '설정',
    settings_ai_provider: 'AI 제공자',
    settings_api_key: 'API 키',
    settings_target_language: '목표 언어',
    settings_auto_translate: '문단 자동 번역',
    settings_show_tooltip: '선택 시 툴팁 표시',
    settings_detection_mode: '감지 모드',
    settings_save: '설정 저장',

    mode_aggressive: '공격적 - 모든 텍스트 블록',
    mode_balanced: '균형 - 주요 콘텐츠만 (권장)',
    mode_conservative: '보수적 - 고신뢰도만',

    action_translate: '번역',
    action_explain: '설명',
    action_toggle: '전환',
    action_save: '저장',
    action_cancel: '취소',

    msg_translating: '번역 중...',
    msg_translation_failed: '번역 실패',
    msg_no_api_key: '설정에서 API 키를 설정해주세요',
    msg_settings_saved: '설정이 저장되었습니다!',

    shortcut_toggle_all: 'Alt+T를 눌러 모든 문단을 전환하세요',
  },

  ja: {
    settings_title: '設定',
    settings_ai_provider: 'AIプロバイダー',
    settings_api_key: 'APIキー',
    settings_target_language: '対象言語',
    settings_auto_translate: '段落の自動翻訳',
    settings_show_tooltip: '選択時にツールチップを表示',
    settings_detection_mode: '検出モード',
    settings_save: '設定を保存',

    mode_aggressive: '積極的 - すべてのテキストブロック',
    mode_balanced: 'バランス - メインコンテンツのみ（推奨）',
    mode_conservative: '保守的 - 高信頼度のみ',

    action_translate: '翻訳',
    action_explain: '説明',
    action_toggle: '切り替え',
    action_save: '保存',
    action_cancel: 'キャンセル',

    msg_translating: '翻訳中...',
    msg_translation_failed: '翻訳失敗',
    msg_no_api_key: '設定でAPIキーを設定してください',
    msg_settings_saved: '設定が保存されました！',

    shortcut_toggle_all: 'Alt+Tを押してすべての段落を切り替え',
  },

  zh: {
    settings_title: '设置',
    settings_ai_provider: 'AI提供商',
    settings_api_key: 'API密钥',
    settings_target_language: '目标语言',
    settings_auto_translate: '自动翻译段落',
    settings_show_tooltip: '选择时显示工具提示',
    settings_detection_mode: '检测模式',
    settings_save: '保存设置',

    mode_aggressive: '积极 - 所有文本块',
    mode_balanced: '平衡 - 仅主要内容（推荐）',
    mode_conservative: '保守 - 仅高置信度',

    action_translate: '翻译',
    action_explain: '解释',
    action_toggle: '切换',
    action_save: '保存',
    action_cancel: '取消',

    msg_translating: '翻译中...',
    msg_translation_failed: '翻译失败',
    msg_no_api_key: '请在设置中设置API密钥',
    msg_settings_saved: '设置已保存！',

    shortcut_toggle_all: '按Alt+T切换所有段落',
  },
}

/**
 * I18n class
 */
class I18n {
  private currentLanguage: SupportedLanguage = 'en'

  constructor() {
    // Detect browser language
    const browserLang = navigator.language.split('-')[0] as SupportedLanguage
    if (browserLang in translations) {
      this.currentLanguage = browserLang
    }
  }

  /**
   * Set current language
   */
  setLanguage(lang: SupportedLanguage): void {
    if (lang in translations) {
      this.currentLanguage = lang
    }
  }

  /**
   * Get current language
   */
  getLanguage(): SupportedLanguage {
    return this.currentLanguage
  }

  /**
   * Translate a key
   */
  t(key: keyof Messages, fallback?: string): string {
    return translations[this.currentLanguage][key] || fallback || key
  }

  /**
   * Get all translations for current language
   */
  getAll(): Messages {
    return translations[this.currentLanguage]
  }
}

/**
 * Global i18n instance
 */
export const i18n = new I18n()

/**
 * Translation helper function
 */
export function t(key: keyof Messages, fallback?: string): string {
  return i18n.t(key, fallback)
}
