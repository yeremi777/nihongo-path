export const SECTION_KEYS = ['kana', 'kanji', 'vocabulary', 'grammar'] as const

export type SectionKey = typeof SECTION_KEYS[number]

type ContentDocWithDescription = {
  path?: string
  description?: string
}

export const getSectionKeyFromContentPath = (
  path: string | undefined,
  rootPath: string
): SectionKey | null => {
  if (!path?.startsWith(`${rootPath}/`)) return null

  const parts = path.slice(rootPath.length + 1).split('/').filter(Boolean)

  if (parts.length === 1 && SECTION_KEYS.includes(parts[0] as SectionKey)) {
    return parts[0] as SectionKey
  }

  if (parts.length === 2 && parts[1] === 'index' && SECTION_KEYS.includes(parts[0] as SectionKey)) {
    return parts[0] as SectionKey
  }

  return null
}

export const buildSectionDescriptions = (
  docs: ContentDocWithDescription[],
  rootPath: string
): Record<string, string> => {
  const result: Record<string, string> = {}

  for (const doc of docs) {
    const sectionKey = getSectionKeyFromContentPath(doc.path, rootPath)
    if (!sectionKey || typeof doc.description !== 'string' || !doc.description.trim()) continue

    result[sectionKey] = doc.description
  }

  return result
}
