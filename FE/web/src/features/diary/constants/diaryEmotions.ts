import angryEmotion from '../../../assets/emotions/angry.png'
import neutralEmotion from '../../../assets/emotions/neutral.png'
import positiveEmotion from '../../../assets/emotions/positive.png'
import sadEmotion from '../../../assets/emotions/sad.png'
import tiredEmotion from '../../../assets/emotions/tired.png'

type DiaryEmotionKey =
  | 'happy'
  | 'calm'
  | 'excited'
  | 'sad'
  | 'angry'
  | 'tired'

type DiaryEmotionOption = {
  key: DiaryEmotionKey
  label: string
  imageSrc: string
  fallbackEmoji: string
}

const DIARY_EMOTION_OPTIONS: DiaryEmotionOption[] = [
  {
    key: 'happy',
    label: '기쁜 감정',
    imageSrc: positiveEmotion,
    fallbackEmoji: '😊',
  },
  {
    key: 'calm',
    label: '편안한 감정',
    imageSrc: neutralEmotion,
    fallbackEmoji: '😐',
  },
  {
    key: 'excited',
    label: '신나는 감정',
    imageSrc: positiveEmotion,
    fallbackEmoji: '😊',
  },
  {
    key: 'sad',
    label: '슬픈 감정',
    imageSrc: sadEmotion,
    fallbackEmoji: '😢',
  },
  {
    key: 'angry',
    label: '속상한 감정',
    imageSrc: angryEmotion,
    fallbackEmoji: '😠',
  },
  {
    key: 'tired',
    label: '피곤한 감정',
    imageSrc: tiredEmotion,
    fallbackEmoji: '😑',
  },
]

function getDiaryEmotionByKey(emotionKey: DiaryEmotionKey) {
  return DIARY_EMOTION_OPTIONS.find((option) => option.key === emotionKey) ?? null
}

let isDiaryEmotionPreloaded = false

function preloadDiaryEmotionAssets() {
  if (isDiaryEmotionPreloaded || typeof window === 'undefined') {
    return
  }

  DIARY_EMOTION_OPTIONS.forEach((option) => {
    const image = new Image()
    image.src = option.imageSrc
  })

  isDiaryEmotionPreloaded = true
}

export { DIARY_EMOTION_OPTIONS, getDiaryEmotionByKey, preloadDiaryEmotionAssets }
export type { DiaryEmotionKey, DiaryEmotionOption }
