export type FuriganaSectionKey = 'contoh-kalimat' | 'mini-practice'

export const FURIGANA_SECTION_KEYS: FuriganaSectionKey[] = [
  'contoh-kalimat',
  'mini-practice'
]

export const isFuriganaSectionKey = (value?: string | null): value is FuriganaSectionKey =>
  value === 'contoh-kalimat' || value === 'mini-practice'
