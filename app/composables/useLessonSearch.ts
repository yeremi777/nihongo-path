type SearchAnchorRect = {
  top: number
  left: number
  right: number
  width: number
}

export function useLessonSearch() {
  const isOpen = useState('lesson-search-open', () => false)
  const anchorRect = useState<SearchAnchorRect | null>('lesson-search-anchor', () => null)
  const fallbackPlacement = useState<'sidebar' | 'toolbar'>('lesson-search-placement', () => 'sidebar')

  const setFallbackPlacement = (placement: 'sidebar' | 'toolbar') => {
    fallbackPlacement.value = placement
  }

  const open = (element?: HTMLElement | null) => {
    if (element) {
      const rect = element.getBoundingClientRect()
      anchorRect.value = {
        top: rect.bottom,
        left: rect.left,
        right: rect.right,
        width: rect.width
      }
    }

    isOpen.value = true
  }

  const close = () => {
    isOpen.value = false
    anchorRect.value = null
  }

  const toggle = () => {
    if (isOpen.value) {
      close()
      return
    }

    open()
  }

  return {
    isOpen,
    anchorRect,
    fallbackPlacement,
    setFallbackPlacement,
    open,
    close,
    toggle
  }
}
