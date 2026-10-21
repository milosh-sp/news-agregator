import {
  AggregatedArticle,
  UnifiedQuery,
} from './models/AggregatedArticles.model'
import { DataCubeArticle } from './models/DataCube.model'
import { NewsOrgArticle } from './models/NewsOrg.model'
import { NyTimesArticle } from './models/NyTimes.model'
import { GuardianArticle } from './models/TheGuardian.model'
import {
  ArticleQuery,
  DataCubeQuery,
  GuardianQuery,
  NewsOrgQuery,
  NyTimesQuery,
} from './types/Query.types'
import { SearchResult } from './types/Utils'

/**
 * Filters out undefined values and returns a new object
 */
function filterAndAssign<T extends Record<string, unknown>>(
  obj: T,
  entries: Iterable<[string, unknown]>
): T {
  if (!entries || !obj) {
    console.warn('No entries or object provided, returning empty object')
    return {} as T
  }

  Object.assign(
    obj,
    Object.fromEntries(Array.from(entries).filter(([, v]) => v !== undefined))
  )
  // Returns new object, so the original one is not mutated
  return { ...obj }
}

/**
 * Creates a specific query param used for the `NewsOrg` API
 * https://newsapi.org/docs
 */
function queryToNewsOrgParams({
  author,
  category,
  date,
  searchWord,
  apiKey,
}: ArticleQuery): NewsOrgQuery {
  try {
    const params: NewsOrgQuery = { apiKey }

    if (!apiKey) {
      throw new TypeError(
        'API key is required, for NewsOrg API, params cannot be processed'
      )
    }
    if (!searchWord) {
      throw new TypeError(
        'Search word is required, for NewsOrg API, params cannot be processed'
      )
    }

    const paramsMap = {
      q: searchWord,
      section: category,
      from: date,
      'q=author': author,
      sortBy: 'publishedAt',
    }

    return filterAndAssign(params, Object.entries(paramsMap))
  } catch (e) {
    console.error(e)
    return {} as NewsOrgQuery
  }
}

/**
 * Creates a specific query param used for the `TheGuardian` API
 * https://open-platform.theguardian.com/documentation/
 */
function queryToGuardianParams({
  author,
  category,
  date,
  searchWord,
  apiKey,
}: ArticleQuery): GuardianQuery {
  try {
    const params: GuardianQuery = { 'api-key': apiKey }

    if (!apiKey) {
      throw new TypeError(
        'API key is required, for Guardian API, params cannot be processed'
      )
    }

    const paramsMap = {
      section: category,
      reference: author ? `author/${author}` : undefined,
      q: searchWord,
      'order-by': 'relevance',
      from: date,
      'page-size': 200,
    }

    return filterAndAssign(params, Object.entries(paramsMap))
  } catch (e) {
    console.error(e)
    return {} as GuardianQuery
  }
}
/**
 * Creates a specific query param used for the `NyTimes` API
 * https://developer.nytimes.com/docs/articlesearch-product/1/routes/articlesearch.json/get
 */
function queryToNyTimesParams({
  date,
  searchWord,
  apiKey,
}: ArticleQuery): NyTimesQuery {
  try {
    const params: NyTimesQuery = { 'api-key': apiKey }

    if (!apiKey) {
      throw new TypeError(
        'API key is required, for NyTimes API, params cannot be processed'
      )
    }

    const paramsMap = {
      q: searchWord,
      begin_date: date,
      page: 100,
    }

    return filterAndAssign(params, Object.entries(paramsMap))
  } catch (e) {
    console.error(e)
    return {} as NyTimesQuery
  }
}

/**
 * Unifies a generic query params and creates an object that has a property for
 * each API, and the property is an object params modified to fit each news API
 */
/**
 * Data Cube has no query params
 */
function queryToDataCubeParams(): DataCubeQuery {
  return {}
}

function unifyQuery({
  author,
  category,
  date,
  searchWord,
  apiKey,
}: ArticleQuery): UnifiedQuery {
  return {
    newsOrg: queryToNewsOrgParams({
      author,
      category,
      date,
      searchWord,
      apiKey,
    }),
    guardian: queryToGuardianParams({
      author,
      category,
      date,
      searchWord,
      apiKey,
    }),
    nyTimes: queryToNyTimesParams({
      author,
      category,
      date,
      searchWord,
      apiKey,
    }),
    dataCubeTech: queryToDataCubeParams(),
    dataCubeInvestment: queryToDataCubeParams(),
    dataCubeTips: queryToDataCubeParams(),
    dataCubeVideos: queryToDataCubeParams(),
    dataCubeTrends: queryToDataCubeParams(),
  }
}

/**
 * Returns the value of a deeply nested object, the max depth is 10, preset in
 * the function itself
 *
 * @note It only takes in a key, not a path. Does not handle nesting, returns
 * the first ever found value to the first key
 */
function findDeepValue<T>(obj: unknown, key: string): SearchResult<T> {
  const MAX_DEPTH = 10

  function search(
    currentObj: unknown,
    currentPath: Array<string>
  ): SearchResult<T> {
    if (currentPath.length > MAX_DEPTH) {
      return { found: false }
    }

    if (currentObj === null || typeof currentObj !== 'object') {
      return { found: false }
    }

    const typedObj = currentObj as Record<string, unknown>

    if (key in typedObj && typedObj[key] !== undefined) {
      return {
        found: true,
        value: typedObj[key] as T,
        path: [...currentPath, key],
      }
    }

    for (const k in typedObj) {
      if (typeof typedObj[k] === 'object' && typedObj[k] !== null) {
        const result = search(typedObj[k], [...currentPath, k])
        if (result.found) {
          return result
        }
      }
    }

    return { found: false }
  }

  return search(obj, [])
}

/**
 * Returns a nested value for a passed in object and the path
 */
function getNestedValue<T>(obj: T, path: string): unknown {
  // First check for direct property access (including keys with dots)
  if (Object.prototype.hasOwnProperty.call(obj, path)) {
    return (obj as Record<string, unknown>)[path]
  }

  // Then try nested access; if a segment is an array, use the first element
  return path.split('.').reduce((acc: unknown, part: string): unknown => {
    if (acc === undefined || acc === null) {
      return undefined
    }
    if (Array.isArray(acc)) {
      const first = acc[0] as Record<string, unknown> | undefined
      return first?.[part]
    }
    return (acc as Record<string, unknown>)[part]
  }, obj as unknown)
}

/**
 * Unifies objects by mapping fields from one object to another and returns a
 * new object with unified properties using the passed in `fieldMap`
 */
function unifyObjects<T>(
  objects: Array<T>,
  fieldMap: Record<keyof T, Array<string>>
): T[] {
  return objects.map((sourceObj) => {
    const unified = {} as Record<keyof T, unknown>

    ;(Object.entries(fieldMap) as [keyof T, Array<string>][]).forEach(
      ([targetKey, sourceKeys]) => {
        let value: unknown

        // Check source keys in priority order; skip null/empty so e.g.
        // videoThumbnailUrl: null does not block thumbnailUrl
        for (const sourceKey of sourceKeys) {
          value = getNestedValue(sourceObj, sourceKey)
          if (value !== undefined && value !== null && value !== '') break
          value = undefined
        }

        unified[targetKey] = value
      }
    )

    return unified as T
  })
}

/**
 * Derives a short title from a long content blob (Data Cube has no title field)
 */
function deriveTitleFromContent(content: string): {
  title: string
  description: string
} {
  const trimmed = content.trim()
  const sentenceMatch = trimmed.match(/^(.+?[.!?])(?:\s|$)/)
  const firstSentence = sentenceMatch?.[1]?.trim()

  if (firstSentence && firstSentence.length <= 160) {
    return {
      title: firstSentence,
      description: trimmed.slice(firstSentence.length).trim() || trimmed,
    }
  }

  const title =
    trimmed.length > 120 ? `${trimmed.slice(0, 117).trimEnd()}...` : trimmed

  return {
    title,
    description: trimmed,
  }
}

/**
 * Takes in an array of multiple articles from different sources and maps them
 * to a single object with the same keys
 */
function processArticlesAndAggregate(
  arrayOfArticles: Array<
    NyTimesArticle | GuardianArticle | NewsOrgArticle | DataCubeArticle
  >
) {
  //TODO: Might want to put this as a config
  const propertyMap = {
    id: ['id', '_id', 'source.id'],
    title: ['title', 'webTitle', 'headline.main', 'content'],
    description: [
      'abstract',
      'snippet',
      'lead_paragraph',
      'summary',
      'tip',
      'content',
    ],
    url: ['webUrl', 'web_url', 'url', 'sourceUrl'],
    //TODO: Multimedia url won't work, because NYT
    // does not send the full url they only send the PATH
    imageUrl: [
      'urlToImage',
      'multimedia.url',
      'videoThumbnailUrl',
      'thumbnailUrl',
    ],
    publishedAt: ['publishedAt', 'webPublicationDate', 'pub_date', 'timestamp'],
    category: ['sectionId', 'section_name', 'sectionName', 'category'],
    author: ['author.name', 'channelName', 'author', 'byline.original'],
    content: ['content'],
    source: ['source.id', 'source.name', 'source', 'platform', 'channelName'],
    videoId: ['videoId'],
  }

  const unified = unifyObjects(arrayOfArticles, propertyMap)

  return unified.map((article) => {
    const mapped = article as unknown as AggregatedArticle & {
      content?: string
      videoId?: string
    }
    const content =
      typeof mapped.content === 'string' ? mapped.content : undefined

    let result = { ...mapped } as AggregatedArticle & {
      content?: string
      videoId?: string
    }

    // Data Cube maps content into both title and description; shorten the title
    if (
      content &&
      result.title === content &&
      (!result.description || result.description === content)
    ) {
      const { title, description } = deriveTitleFromContent(content)
      result = { ...result, title, description }
    }

    if (result.videoId) {
      if (!result.url) {
        result = {
          ...result,
          url: `https://www.youtube.com/watch?v=${result.videoId}`,
        }
      }
      if (!result.imageUrl) {
        result = {
          ...result,
          imageUrl: `https://i.ytimg.com/vi/${result.videoId}/hqdefault.jpg`,
        }
      }
    }

    // NYT multimedia paths are relative; prefix when needed
    if (
      typeof result.imageUrl === 'string' &&
      result.imageUrl.startsWith('/')
    ) {
      result = {
        ...result,
        imageUrl: `https://www.nytimes.com/${result.imageUrl.replace(
          /^\//,
          ''
        )}`,
      }
    }

    // Drop helper fields that are not part of AggregatedArticle
    delete result.content
    delete result.videoId
    return result as AggregatedArticle
  })
}

export {
  unifyQuery,
  findDeepValue,
  processArticlesAndAggregate,
  getNestedValue,
}
