import {
  NewsOrgQuery,
  GuardianQuery,
  NyTimesQuery,
  DataCubeQuery,
} from '../types/Query.types'

interface AggregatedArticle {
  id: string
  title: string
  description: string
  url: string
  imageUrl?: string
  publishedAt: string
  author: string
  category: string
  source: string
}

interface AggregatedArticles {
  [key: string]: Array<AggregatedArticle>
  nyTimes: Array<AggregatedArticle>
  newsOrg: Array<AggregatedArticle>
  guardian: Array<AggregatedArticle>
  dataCubeTech: Array<AggregatedArticle>
  dataCubeInvestment: Array<AggregatedArticle>
  dataCubeTips: Array<AggregatedArticle>
  dataCubeVideos: Array<AggregatedArticle>
  dataCubeTrends: Array<AggregatedArticle>
}

interface UnifiedQuery {
  newsOrg: NewsOrgQuery
  guardian: GuardianQuery
  nyTimes: NyTimesQuery
  dataCubeTech: DataCubeQuery
  dataCubeInvestment: DataCubeQuery
  dataCubeTips: DataCubeQuery
  dataCubeVideos: DataCubeQuery
  dataCubeTrends: DataCubeQuery
}
export type { AggregatedArticle, AggregatedArticles, UnifiedQuery }
