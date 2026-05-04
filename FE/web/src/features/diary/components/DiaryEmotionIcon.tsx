import { getDiaryEmotionByKey, type DiaryEmotionKey } from '../constants/diaryEmotions'

type DiaryEmotionIconProps = {
  emotionKey: DiaryEmotionKey
  size?: number
  className?: string
}

function DiaryEmotionIcon({
  emotionKey,
  size = 40,
  className,
}: DiaryEmotionIconProps) {
  const emotion = getDiaryEmotionByKey(emotionKey)

  if (!emotion) {
    return null
  }

  return (
    <img
      src={emotion.imageSrc}
      alt={emotion.label}
      width={size}
      height={size}
      className={className}
      loading="eager"
      decoding="async"
      draggable={false}
    />
  )
}

export type { DiaryEmotionIconProps }

export default DiaryEmotionIcon
