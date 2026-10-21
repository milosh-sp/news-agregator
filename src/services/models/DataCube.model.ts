type DataCubeAuthor = {
  name: string
  handle?: string
  avatar?: string
  verified?: boolean
}

type DataCubeArticle = {
  id: number | string
  content: string
  source: string
  sourceUrl?: string
  category?: string
  impact?: string
  timestamp: string
  author?: DataCubeAuthor
  tags?: Array<string>
  isVideo?: boolean
  videoId?: string | null
  videoDuration?: string | null
  videoViewCount?: string | null
  videoThumbnailUrl?: string | null
  metrics?: {
    comments?: number
    retweets?: number
    likes?: number
    views?: string
  }
}

type DataCubeLanguageCode =
  | 'en'
  | 'de'
  | 'zh'
  | 'fr'
  | 'es'
  | 'pt'
  | 'ja'
  | 'ko'

type DataCubeResponse = Partial<
  Record<DataCubeLanguageCode, Array<DataCubeArticle>>
>

type DataCubeWeekDay = {
  id: string
  label: string
  weekday?: string
  current?: boolean
}

type DataCubeWeek = {
  id: string
  label: string
  year: number
  weekNum: number
  dateRange: string
  current: boolean
  periodType: string
  days: Array<DataCubeWeekDay>
}

type DataCubeWeeksResponse = {
  weeks: Array<DataCubeWeek>
}

export type {
  DataCubeArticle,
  DataCubeAuthor,
  DataCubeLanguageCode,
  DataCubeResponse,
  DataCubeWeek,
  DataCubeWeekDay,
  DataCubeWeeksResponse,
}
