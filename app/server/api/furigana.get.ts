export default defineEventHandler(() => {
  throw createError({
    statusCode: 405,
    statusMessage: 'Use POST /api/furigana with JSON body `{ "text": "試す" }`.'
  })
})
