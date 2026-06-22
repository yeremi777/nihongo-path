<script setup lang="ts">
const table = ref<HTMLTableElement | null>(null)

const splitListText = (value: string) =>
  value
    .split(/[、,]/)
    .map((item) => item.trim())
    .filter(Boolean)

const applyTableLabels = () => {
  const tableEl = table.value
  if (!tableEl) return

  const headerCells = Array.from(tableEl.querySelectorAll<HTMLTableCellElement>('thead th'))
  const fallbackHeaderCells = Array.from(tableEl.querySelectorAll<HTMLTableCellElement>('tr:first-child th, tr:first-child td'))
  const labels = (headerCells.length ? headerCells : fallbackHeaderCells)
    .map((cell) => cell.textContent?.trim() || '')

  if (!labels.length) return

  tableEl.querySelectorAll<HTMLTableRowElement>('tbody tr').forEach((row) => {
    Array.from(row.children).forEach((cell, index) => {
      const label = labels[index] || ''
      if (!(cell instanceof HTMLTableCellElement) || !label) return

      cell.dataset.label = label

      if (label.toLowerCase() !== 'kata umum' || cell.querySelector('.table-token-list')) return

      const items = splitListText(cell.textContent || '')
      if (items.length <= 1) return

      cell.textContent = ''

      const list = document.createElement('ul')
      list.className = 'table-token-list'

      for (const item of items) {
        const listItem = document.createElement('li')
        listItem.textContent = item
        list.appendChild(listItem)
      }

      cell.appendChild(list)
    })
  })
}

onMounted(applyTableLabels)
onUpdated(applyTableLabels)
</script>

<template>
  <div class="markdown-table-wrap">
    <table ref="table">
      <slot />
    </table>
  </div>
</template>
