'use client'

const CUSTOMIZE_PROMPT_KEY = 'therabee:hide-template-copy-prompt'

export const FALLBACK_DEFAULT_NOTE_TEMPLATE = 'soap'

export function shouldShowTemplateCopyPrompt(): boolean {
  if (typeof window === 'undefined') return true
  return localStorage.getItem(CUSTOMIZE_PROMPT_KEY) !== 'true'
}

export function setHideTemplateCopyPrompt(hide: boolean): void {
  if (typeof window === 'undefined') return
  if (hide) localStorage.setItem(CUSTOMIZE_PROMPT_KEY, 'true')
  else localStorage.removeItem(CUSTOMIZE_PROMPT_KEY)
}
