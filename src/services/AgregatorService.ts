import { dataCubeWeeksUrl, endpoints } from './endpoints'
import { IAggregatorService } from './types/AggregatorService.interface'
import { GetParams, HttpClient } from './types/HttpClient.Interface'
import {
  AggregatedArticles,
  UnifiedQuery,
} from './models/AggregatedArticles.model'
import {
  DataCubeArticle,
  DataCubeResponse,
  DataCubeWeeksResponse,
} from './models/DataCube.model'
import { NewsOrgArticle, NewsOrgResponse } from './models/NewsOrg.model'
import { NyTimesArticle, NyTimesResponse } from './models/NyTimes.model'
import { GuardianArticle, GuardianResponse } from './models/TheGuardian.model'
import { ArticleQuery } from './types/Query.types'
import { findDeepValue, processArticlesAndAggregate, unifyQuery } from './utils'

const DATA_CUBE_SOURCE_PREFIX = 'dataCube'
const PERIOD_ID_PLACEHOLDER = '{periodId}'
const DATE_PERIOD_PATTERN = /^\d{4}-\d{2}-\d{2}$/

export class AggregatorService implements IAggregatorService {
  constructor(private httpClient: HttpClient) {}

  async getArticlesFromSource<T>({ url, config }: GetParams) {
    try {
      const data = await this.httpClient.get<T>({
        url,
        config,
      })
      return data
    } catch (error) {
      console.error('Error fetching articles:', error)
      return []
    }
  }

  async getArticlesFromSources<T>(
    sources: Array<GetParams>
  ): Promise<PromiseSettledResult<T | unknown>[]> {
    try {
      const articles = await Promise.allSettled(
        sources.map(({ url, config }) =>
          this.getArticlesFromSource({ url, config })
        )
      )
      return articles
    } catch (error) {
      console.error('Error fetching articles:', error)
      return []
    }
  }

  /**
   * Resolves the latest Data Cube period id from /api/weeks, or uses a
   * YYYY-MM-DD date from the UI when provided
   */
  private async resolveDataCubePeriodId(
    date?: string,
    signal?: AbortSignal
  ): Promise<string | undefined> {
    if (date && DATE_PERIOD_PATTERN.test(date)) {
      return date
    }

    try {
      const weeksResponse = await this.getArticlesFromSource<
        DataCubeWeeksResponse
      >({
        url: dataCubeWeeksUrl,
        config: { signal },
      })

      if (
        !weeksResponse ||
        Array.isArray(weeksResponse) ||
        !weeksResponse.weeks?.length
      ) {
        return undefined
      }

      const currentWeek =
        weeksResponse.weeks.find((week) => week.current) ??
        weeksResponse.weeks[0]

      const lastDay = currentWeek.days?.[currentWeek.days.length - 1]
      return lastDay?.id ?? currentWeek.id
    } catch (error) {
      console.error('Error resolving Data Cube period:', error)
      return undefined
    }
  }

  private resolveEndpointUrl(
    key: string,
    url: string,
    periodId?: string
  ): string | undefined {
    const needsPeriod = url.includes(PERIOD_ID_PLACEHOLDER)
    if (!needsPeriod) {
      return url
    }

    if (!key.startsWith(DATA_CUBE_SOURCE_PREFIX) || !periodId) {
      return undefined
    }

    return url.replace(/\{periodId\}/g, periodId)
  }

  async getArticlesFromAllSources({
    category,
    author,
    searchWord,
    date,
    signal,
  }: Omit<ArticleQuery, 'apiKey'> & { signal?: AbortSignal }) {
    try {
      const periodId = await this.resolveDataCubePeriodId(date, signal)
      const endpointEntries = Object.entries(endpoints)

      const requests = endpointEntries
        .map(([key, value]) => {
          const resolvedUrl = this.resolveEndpointUrl(key, value.url, periodId)
          if (!resolvedUrl) {
            return null
          }

          const unifiedParams = unifyQuery({
            category,
            author,
            searchWord,
            date,
            apiKey: 'apiKey' in value ? value.apiKey : '',
          })?.[key as keyof UnifiedQuery]

          return {
            key,
            url: resolvedUrl,
            config: {
              params: unifiedParams,
            },
            responseKey: value.responseKey,
            timeout: value.timeout,
          }
        })
        .filter(
          (request): request is NonNullable<typeof request> => request !== null
        )

      const responses = (await Promise.allSettled(
        requests.map(({ url, config }) =>
          this.getArticlesFromSource({ url, config: { ...config, signal } })
        )
      )) as Array<
        PromiseSettledResult<
          | NewsOrgResponse
          | GuardianResponse
          | NyTimesResponse
          | DataCubeResponse
        >
      >

      // Process the response
      const aggregatedArticles = requests.reduce(
        (acc, { key, responseKey }, index) => {
          const response = responses[index]

          if (response.status === 'fulfilled') {
            // Find the JSON keys that match the responseKey, which is the actual
            // articles
            const arrayOfArticles = findDeepValue(response.value, responseKey)
              .value as
              | Array<
                  | NyTimesArticle
                  | GuardianArticle
                  | NewsOrgArticle
                  | DataCubeArticle
                >
              | undefined

            if (!arrayOfArticles || !Array.isArray(arrayOfArticles)) {
              return acc
            }

            // Processed article data is assigned
            acc[key] = processArticlesAndAggregate(arrayOfArticles)
          }

          return acc
        },
        {} as AggregatedArticles
      )

      return aggregatedArticles
    } catch (error) {
      console.error('Error fetching articles:', error)
      //TODO: This might not be such a good idea to do, because if this
      // function fails, it will return an empty object which cannot be accessed
      return {} as AggregatedArticles
    }
  }
}
