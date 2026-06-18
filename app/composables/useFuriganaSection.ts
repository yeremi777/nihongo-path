import { hasJapaneseKanji, hasRubyMarkup } from '~/utils/japaneseText'
import type { FuriganaSectionKey } from '~/utils/furiganaSections'

const PLAIN_ATTR = 'data-jp-plain'

const sectionContentNodes = (sectionId: FuriganaSectionKey) => {
  const heading = document.getElementById(sectionId)
  if (!heading) return []

  const sectionRoot = heading.closest('.prose-section-heading') ?? heading
  const nodes: Element[] = []
  let current = sectionRoot.nextElementSibling

  while (current) {
    if (current.tagName === 'H2' || current.classList.contains('prose-section-heading')) {
      break
    }

    nodes.push(current)
    current = current.nextElementSibling
  }

  return nodes
}

const collectContohKalimatTargets = (sectionId: FuriganaSectionKey) => {
  const targets: HTMLElement[] = []

  for (const node of sectionContentNodes(sectionId)) {
    for (const element of node.querySelectorAll<HTMLElement>('.example-list .jp')) {
      const current = element.textContent?.trim() || ''
      if (current && hasJapaneseKanji(current) && !hasRubyMarkup(element.innerHTML)) {
        targets.push(element)
      }
    }
  }

  return targets
}

export const useFuriganaSection = () => {
  const { sectionEnabled, toFuriganaHtmlBatch } = useFurigana()

  const restoreContohKalimat = (sectionId: FuriganaSectionKey = 'contoh-kalimat') => {
    if (!import.meta.client) return

    for (const node of sectionContentNodes(sectionId)) {
      for (const element of node.querySelectorAll<HTMLElement>(`.example-list .jp[${PLAIN_ATTR}]`)) {
        const plain = element.getAttribute(PLAIN_ATTR)
        if (plain) element.textContent = plain
      }
    }
  }

  const applyContohKalimat = async (sectionId: FuriganaSectionKey = 'contoh-kalimat') => {
    if (!import.meta.client) return

    if (!sectionEnabled.value[sectionId]) {
      restoreContohKalimat(sectionId)
      return
    }

    const targets = collectContohKalimatTargets(sectionId)
    if (targets.length === 0) return

    for (const element of targets) {
      const current = element.textContent?.trim() || ''
      if (!element.hasAttribute(PLAIN_ATTR)) {
        element.setAttribute(PLAIN_ATTR, current)
      }
    }

    const converted = await toFuriganaHtmlBatch(
      targets.map((element) => element.getAttribute(PLAIN_ATTR) || element.textContent?.trim() || '')
    )

    for (const element of targets) {
      const plain = element.getAttribute(PLAIN_ATTR) || element.textContent?.trim() || ''
      element.innerHTML = converted.get(plain) || plain
    }
  }

  const applySection = async (section: FuriganaSectionKey) => {
    if (section === 'contoh-kalimat') {
      await applyContohKalimat(section)
    }
  }

  return {
    applySection,
    restoreContohKalimat,
    applyContohKalimat
  }
}
