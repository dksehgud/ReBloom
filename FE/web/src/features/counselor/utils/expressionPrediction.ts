const EXPRESSION_SCORE_MAX = 24
const EXPRESSION_SCORE_TICKS = [24, 18, 12, 6, 0] as const

const DEPRESSION_STAGE_SCORES: Record<string, number> = {
  minimal: 0,
  mild: 1,
  moderate: 2,
  moderately_severe: 2,
  moderatelysevere: 2,
  severe: 3,
  uncertain: 0,
}

function clampExpressionScore(value: number) {
  return Math.max(0, Math.min(EXPRESSION_SCORE_MAX, Math.round(value)))
}

function normalizeNumericPredictionScore(value: number) {
  if (!Number.isFinite(value)) {
    return 0
  }

  return clampExpressionScore(value)
}

function parseExpressionPredictionScore(prediction?: number | string | null) {
  if (typeof prediction === 'number') {
    return normalizeNumericPredictionScore(prediction)
  }

  if (typeof prediction !== 'string') {
    return 0
  }

  const normalized = prediction.trim().toLowerCase()

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

  return normalizeNumericPredictionScore(parsedValue)
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
