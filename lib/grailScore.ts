/** Pure calculation — usable server-side and client-side */
export function calcGrailScore(params: {
  category: string
  budgetMax: number
  offersCount: number
  views: number
  createdAt: Date | string
  verified?: boolean
}): number {
  const { category, budgetMax, offersCount, views, createdAt, verified } = params

  const categoryWeight: Record<string, number> = {
    "sports-cards-nba": 18, "sports-cards-mlb": 18, "pokemon": 20,
    "sports-cards-nfl": 15, "sports-cards-nhl": 12,
    "sports-memorabilia": 10, "autographs": 8, "card-packs": 7, "other": 5,
  }

  const catScore    = categoryWeight[category] ?? 5
  const budgetScore = Math.min(Math.log10(Math.max(budgetMax, 10)) * 6, 25)
  const offerScore  = Math.min(offersCount * 6, 24)
  const viewScore   = Math.min(views / 60, 10)

  const daysSince   = (Date.now() - new Date(createdAt).getTime()) / 86_400_000
  const recencyScore = daysSince < 3 ? 18 : daysSince < 7 ? 12 : daysSince < 30 ? 6 : 0

  const verifiedScore = verified ? 5 : 0

  return Math.min(
    Math.round(catScore + budgetScore + offerScore + viewScore + recencyScore + verifiedScore),
    100
  )
}
