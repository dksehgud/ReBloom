import { useState } from 'react'

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
  const [imageErrorKey, setImageErrorKey] = useState<DiaryEmotionKey | null>(null)
  const emotion = getDiaryEmotionByKey(emotionKey)

  if (!emotion) {
    return null
  }

  if (imageErrorKey === emotionKey) {
    return (
      <span
        role="img"
        aria-label={emotion.label}
        className={className}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: size,
          height: size,
          fontSize: Math.round(size * 0.9),
          lineHeight: 1,
          userSelect: 'none',
        }}
      >
        {emotion.fallbackEmoji}
      </span>
    )
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
      onError={() => setImageErrorKey(emotionKey)}
    />
  )
}

export type { DiaryEmotionIconProps }

export default DiaryEmotionIcon
