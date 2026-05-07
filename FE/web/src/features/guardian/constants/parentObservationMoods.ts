export const PARENT_OBSERVATION_MOODS = [
  '침묵',
  '예민',
  '평온',
  '활발',
  '피곤',
  '불안',
] as const

export type ParentObservationMood = (typeof PARENT_OBSERVATION_MOODS)[number]
