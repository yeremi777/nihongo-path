export type LevelKey = 'n5' | 'n4' | 'n3'

export type LevelTrack = {
  key: LevelKey
  title: string
  description: string
  meta: string
  to: `/learn/${LevelKey}`
}

export const levelTracks: LevelTrack[] = [
  {
    key: 'n5',
    title: 'N5',
    description: 'Mulai dari nol: kana, kosakata dasar, kanji sederhana, dan pola kalimat dasar untuk fondasi bahasa Jepang yang kuat.',
    meta: '4 sections',
    to: '/learn/n5'
  },
  {
    key: 'n4',
    title: 'N4',
    description: 'Perkuat dasar-dasar: kanji, kosakata, dan pola kalimat sehari-hari untuk komunikasi yang lebih alami.',
    meta: '3 sections',
    to: '/learn/n4'
  },
  {
    key: 'n3',
    title: 'N3',
    description: 'Kembangkan kemampuan ke tingkat menengah: kanji praktis, kosakata luas, tata bahasa bernuansa, dan pemahaman teks yang lebih dalam.',
    meta: '3 sections',
    to: '/learn/n3'
  }
]

export const levelSummaries = Object.fromEntries(
  levelTracks.map(({ key, title, description }) => [key, { title, description }])
) as Record<LevelKey, { title: string, description: string }>
