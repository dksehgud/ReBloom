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
}

const DIARY_EMOTION_OPTIONS: DiaryEmotionOption[] = [
  {
    key: 'happy',
    label: '기쁜 감정',
    imageSrc: 'https://www.figma.com/api/mcp/asset/5c70558e-d2b0-45ea-be97-a6a6a73d754c',
  },
  {
    key: 'calm',
    label: '편안한 감정',
    imageSrc: 'https://www.figma.com/api/mcp/asset/cd41a982-86a1-4019-b3b3-ca2fb01d9eda',
  },
  {
    key: 'excited',
    label: '신나는 감정',
    imageSrc: 'https://www.figma.com/api/mcp/asset/ac4a8f6a-b3e8-4ced-82a7-c80926a68cd5',
  },
  {
    key: 'sad',
    label: '슬픈 감정',
    imageSrc: 'https://www.figma.com/api/mcp/asset/3e8b11c2-5224-4fae-8175-4b4c6811f243',
  },
  {
    key: 'angry',
    label: '속상한 감정',
    imageSrc: 'https://www.figma.com/api/mcp/asset/801fabf3-0531-4009-922e-f56859245823',
  },
  {
    key: 'tired',
    label: '피곤한 감정',
    imageSrc: 'https://www.figma.com/api/mcp/asset/ccb8a404-38eb-40f4-8041-62c9c163669d',
  },
]

function getDiaryEmotionByKey(emotionKey: DiaryEmotionKey) {
  return DIARY_EMOTION_OPTIONS.find((option) => option.key === emotionKey) ?? null
}

export { DIARY_EMOTION_OPTIONS, getDiaryEmotionByKey }
export type { DiaryEmotionKey, DiaryEmotionOption }
