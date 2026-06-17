import { defineCollection, defineContentConfig, z } from '@nuxt/content'

const lessonFrontmatterSchema = z.object({
  level: z.string().optional(),
  category: z.string().optional(),
  topic: z.string().optional(),
  topicLabel: z.string().optional(),
  week: z.number().optional(),
  day: z.number().optional(),
  order: z.number().optional(),
  status: z.string().optional(),
  tags: z.array(z.string()).optional(),
  mainReference: z.array(z.string()).optional(),
  extraReference: z.array(z.string()).optional()
})

export default defineContentConfig({
  collections: {
    content: defineCollection({
      type: 'page',
      source: '**/*.md',
      schema: lessonFrontmatterSchema,
      indexes: [
        { columns: ['path'] },
        { columns: ['week', 'day'] }
      ]
    })
  }
})
