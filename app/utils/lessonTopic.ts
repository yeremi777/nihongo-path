export type LessonTopicFields = {
  title?: string
  topic?: string
  topicLabel?: string
  week?: number
  day?: number
}

export const hasLessonTopic = (lesson: LessonTopicFields | null | undefined) => {
  return Boolean(lesson?.topic && lesson?.topicLabel)
}
