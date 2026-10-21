declare global {
  interface ImportMeta {
    env: {
      VITE_NEWS_ORG_API_KEY: string
      VITE_GUARDIAN_API_KEY: string
      VITE_NY_TIMES_API_KEY: string
    }
  }
}

/**
 * Proxied via Vite (`/data-cube-api` → Railway) to avoid browser CORS
 */
const DATA_CUBE_BASE = '/data-cube-api'

const dataCubeWeeksUrl = `${DATA_CUBE_BASE}/api/weeks`

const endpoints = {
  newsOrg: {
    url: 'https://newsapi.org/v2/everything',
    apiKey: import.meta.env.VITE_NEWS_ORG_API_KEY,
    /**
     * Contains the actual articles, used to extract them from the response
     */
    responseKey: 'articles',
    timeout: 10_000,
  },
  guardian: {
    url: 'https://content.guardianapis.com/search',
    apiKey: import.meta.env.VITE_GUARDIAN_API_KEY,
    /**
     * Contains the actual articles, used to extract them from the response
     */
    responseKey: 'results',
    timeout: 10_000,
  },
  nyTimes: {
    url: 'https://api.nytimes.com/svc/search/v2/articlesearch.json',
    apiKey: import.meta.env.VITE_NY_TIMES_API_KEY,
    /**
     * Contains the actual articles, used to extract them from the response
     */
    responseKey: 'docs',
    timeout: 10_000,
  },
  dataCubeTech: {
    url: `${DATA_CUBE_BASE}/api/tech/{periodId}`,
    responseKey: 'en',
    timeout: 10_000,
  },
  dataCubeInvestment: {
    url: `${DATA_CUBE_BASE}/api/investment/{periodId}`,
    responseKey: 'en',
    timeout: 10_000,
  },
  dataCubeTips: {
    url: `${DATA_CUBE_BASE}/api/tips/{periodId}`,
    responseKey: 'en',
    timeout: 10_000,
  },
  dataCubeVideos: {
    url: `${DATA_CUBE_BASE}/api/videos/{periodId}`,
    responseKey: 'en',
    timeout: 10_000,
  },
  dataCubeTrends: {
    url: `${DATA_CUBE_BASE}/api/trends/{periodId}`,
    responseKey: 'en',
    timeout: 10_000,
  },
}

export { endpoints, dataCubeWeeksUrl }
