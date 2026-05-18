const EXPRESSION_SCORE_MAX = 24
const EXPRESSION_SCORE_TICKS = [24, 18, 12, 6, 0] as const

const DEPRESSION_STAGE_SCORES: Record<string, number> = {
  minimal: 2,
  mild: 7,
  moderate: 12,
  moderately_severe: 17,
  moderatelysevere: 17,
  severe: 22,
}

function clampExpressionScore(value: number) {
  return Math.max(0, Math.min(EXPRESSION_SCORE_MAX, Math.round(value)))
}

function parseExpressionPredictionScore(prediction?: string | null) {
  const normalized = prediction?.trim().toLowerCase()

  if (!normalized) {
    return 0
  }

  const stageScore = DEPRESSION_STAGE_SCORES[normalized.replace(/[\s-]/g, '_')]

  if (typeof stageScore === 'number') {
    return stageScore
  }

  const match = normalized.match(/-?\d+(\.\d+)?/)
  const parsedValue = match ? Number(match[0]) : Number.NaN

  if (!Number.isFinite(parsedValue)) {
    return 0
  }

  const score =
    parsedValue > 0 && parsedValue <= 1
      ? parsedValue * EXPRESSION_SCORE_MAX
      : parsedValue

  return clampExpressionScore(score)
}

function getAverageExpressionPredictionScore(scores: number[]) {
  if (scores.length === 0) {
    return 0
  }

  const total = scores.reduce((sum, score) => sum + score, 0)

  return clampExpressionScore(total / scores.length)
}

export {
  EXPRESSION_SCORE_MAX,
  EXPRESSION_SCORE_TICKS,
  getAverageExpressionPredictionScore,
  parseExpressionPredictionScore,
}
