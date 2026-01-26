import {
  TAVILY_BASE_URL,
  FIRECRAWL_BASE_URL,
  EXA_BASE_URL,
  BOCHA_BASE_URL,
  BRAVE_BASE_URL,
  SEARXNG_BASE_URL,
} from "@/constants/urls";
import { rewritingPrompt } from "@/constants/prompts";
import { completePath } from "@/utils/url";
import { pick, sort } from "radash";

type TavilySearchResult = {
  title: string;
  url: string;
  content: string;
  rawContent?: string;
  score: number;
  publishedDate: string;
};

interface FirecrawlDocument<T = unknown> {
  url?: string;
  markdown?: string;
  html?: string;
  rawHtml?: string;
  links?: string[];
  extract?: T;
  json?: T;
  screenshot?: string;
  compare?: {
    previousScrapeAt: string | null;
    changeStatus: "new" | "same" | "changed" | "removed";
    visibility: "visible" | "hidden";
  };
  // v1 search only
  title?: string;
  description?: string;
}

type ExaSearchResult = {
  title: string;
  url: string;
  publishedDate: string;
  author: string;
  score: number;
  id: string;
  image?: string;
  favicon: string;
  text?: string;
  highlights?: string[];
  highlightScores?: number[];
  summary?: string;
  subpages?: ExaSearchResult[];
  extras?: {
    links?: string[];
    imageLinks?: string[];
  };
};

type BochaSearchResult = {
  id: string | null;
  name: string;
  url: string;
  displayUrl: string;
  snippet: string;
  summary?: string;
  siteName: string;
  siteIcon: string;
  dateLastCrawled: string;
  cachedPageUrl: string | null;
  language: string | null;
  isFamilyFriendly: boolean | null;
  isNavigational: boolean | null;
};

type BochaImage = {
  webSearchUrl: string;
  name: string;
  thumbnailUrl: string;
  datePublished: string;
  contentUrl: string;
  hostPageUrl: string;
  contentSize: number;
  encodingFormat: string;
  hostPageDisplayUrl: string;
  width: number;
  height: number;
  thumbnail: {
    width: number;
    height: number;
  };
};

type SearxngSearchResult = {
  url: string;
  title: string;
  content?: string;
  engine: string;
  parsed_url: string[];
  template: "default.html" | "videos.html" | "images.html";
  engines: string[];
  positions: number[];
  publishedDate?: Date | null;
  thumbnail?: null | string;
  is_onion?: boolean;
  score: number;
  category: string;
  length?: null | string;
  duration?: null | string;
  iframe_src?: string;
  source?: string;
  metadata?: string;
  resolution?: null | string;
  img_src?: string;
  thumbnail_src?: string;
  img_format?: "jpeg" | "Culture Snaxx" | "png";
};

export interface SearchProviderOptions {
  provider: string;
  baseURL?: string;
  apiKey?: string;
  query: string;
  maxResult?: number;
  scope?: string;
}

type BraveSearchResult = {
  title: string;
  url: string;
  is_source_local: boolean;
  is_source_both: boolean;
  description: string;
  page_age: string;
  page_fetched: string;
  fetched_content_timestamp: number;
  profile: {
    name: string;
    url: string;
    long_name: string;
    img: string;
  };
  language: string;
};

type BreaveImage = {
  type: string;
  title: string;
  url: string;
  source: string;
  page_fetched: string;
  thumbnail: {
    src: string;
    width: number;
    height: number;
  };
  properties: {
    url: string;
    placeholder: string;
    width: number;
    height: number;
  };
  meta_url: {
    scheme: string;
    netloc: string;
    hostname: string;
    favicon: string;
    path: string;
  };
  confidence: string;
};

export async function createSearchProvider({
  provider,
  baseURL,
  apiKey = "",
  query,
  maxResult = 5,
  scope,
}: SearchProviderOptions) {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

  if (provider === "tavily") {
    const response = await fetch(
      `${completePath(baseURL || TAVILY_BASE_URL)}/search`,
      {
        method: "POST",
        headers,
        credentials: "omit",
        body: JSON.stringify({
          query: query.replaceAll("\\", "").replaceAll('"', ""),
          search_depth: "advanced",
          topic: scope || "general",
          max_results: Number(maxResult),
          include_images: true,
          include_image_descriptions: true,
          include_answer: false,
          include_raw_content: "markdown",
        }),
      },
    );
    const { results = [], images = [] } = await response.json();
    return {
      sources: (results as TavilySearchResult[])
        .filter((item) => item.content && item.url)
        .map((result) => {
          return {
            title: result.title,
            content: result.rawContent || result.content,
            url: result.url,
          };
        }) as Source[],
      images: images as ImageSource[],
    };
  } else if (provider === "firecrawl") {
    const response = await fetch(
      `${completePath(baseURL || FIRECRAWL_BASE_URL, "/v1")}/search`,
      {
        method: "POST",
        headers,
        credentials: "omit",
        body: JSON.stringify({
          query,
          limit: maxResult,
          tbs: "qdr:w",
          origin: "api",
          scrapeOptions: {
            formats: ["markdown"],
          },
          timeout: 60000,
        }),
      },
    );
    const { data = [] } = await response.json();
    return {
      sources: (data as FirecrawlDocument[])
        .filter((item) => item.description && item.url)
        .map((result) => ({
          content: result.markdown || result.description,
          url: result.url,
          title: result.title,
        })) as Source[],
      images: [],
    };
  } else if (provider === "exa") {
    const response = await fetch(
      `${completePath(baseURL || EXA_BASE_URL)}/search`,
      {
        method: "POST",
        headers,
        credentials: "omit",
        body: JSON.stringify({
          query,
          category: scope || "research paper",
          contents: {
            text: true,
            summary: {
              query: `Given the following query from the user:\n<query>${query}</query>\n\n${rewritingPrompt}`,
            },
            numResults: Number(maxResult) * 5,
            livecrawl: "auto",
            extras: {
              imageLinks: 3,
            },
          },
        }),
      },
    );
    const { results = [] } = await response.json();
    const images: ImageSource[] = [];
    return {
      sources: (results as ExaSearchResult[])
        .filter((item) => (item.summary || item.text) && item.url)
        .map((result) => {
          if (
            result.extras?.imageLinks &&
            result.extras?.imageLinks.length > 0
          ) {
            result.extras.imageLinks.forEach((url) => {
              images.push({ url, description: result.text });
            });
          }
          return {
            content: result.summary || result.text,
            url: result.url,
            title: result.title,
          };
        }) as Source[],
      images,
    };
  } else if (provider === "bocha") {
    const response = await fetch(
      `${completePath(baseURL || BOCHA_BASE_URL, "/v1")}/web-search`,
      {
        method: "POST",
        headers,
        credentials: "omit",
        body: JSON.stringify({
          query,
          freshness: "noLimit",
          summary: true,
          count: maxResult,
        }),
      },
    );
    const { data = {} } = await response.json();
    const results = data.webPages?.value || [];
    const imageResults = data.images?.value || [];
    return {
      sources: (results as BochaSearchResult[])
        .filter((item) => item.snippet && item.url)
        .map((result) => ({
          content: result.summary || result.snippet,
          url: result.url,
          title: result.name,
        })) as Source[],
      images: (imageResults as BochaImage[]).map((item) => {
        const matchingResult = (results as BochaSearchResult[]).find(
          (result) => result.url === item.hostPageUrl,
        );
        return {
          url: item.contentUrl,
          description: item.name || matchingResult?.name,
        };
      }) as ImageSource[],
    };
  } else if (provider === "brave") {
    const params = {
      q: query,
      count: maxResult,
    };
    const searchQuery = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      searchQuery.append(key, value.toString());
    }

    const response = await fetch(
      `${completePath(baseURL || BRAVE_BASE_URL, "/v1")}/web/search?${searchQuery.toString()}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Accept-Encoding": "gzip",
          "X-Subscription-Token": apiKey,
        },
        credentials: "omit",
      },
    );

    const imageResponse = await fetch(
      `${completePath(baseURL || BRAVE_BASE_URL, "/v1")}/images/search?${searchQuery.toString()}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Accept-Encoding": "gzip",
          "X-Subscription-Token": apiKey,
        },
        credentials: "omit",
      },
    );

    const [webSearchResults, imageSearchResults] = await Promise.all([
      response.json(),
      imageResponse.json(),
    ]);
    const results = webSearchResults?.web?.results || [];
    const imageResults = imageSearchResults?.results || [];
    return {
      sources: (results as BraveSearchResult[])
        .filter((item) => item.description && item.url)
        .map((result) => ({
          content: result.description,
          url: result.url,
          title: result.title,
        })) as Source[],
      images: (imageResults as BreaveImage[]).map((item) => {
        return {
          url: item.url,
          description: item.title,
        };
      }) as ImageSource[],
    };
  } else if (provider === "searxng") {
    const params = {
      q: query,
      categories:
        scope === "academic" ? ["science", "images"] : ["general", "images"],
      engines:
        scope === "academic"
          ? [
              "arxiv",
              "google scholar",
              "pubmed",
              "wikispecies",
              "google_images",
            ]
          : [
              "google",
              "bing",
              "duckduckgo",
              "brave",
              "wikipedia",
              "bing_images",
              "google_images",
            ],
      lang: "auto",
      format: "json",
      autocomplete: "google",
    };
    const searchQuery = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      searchQuery.append(key, value.toString());
    }
    const local = global.location || {};
    const response = await fetch(
      `${completePath(
        baseURL || SEARXNG_BASE_URL,
      )}/search?${searchQuery.toString()}`,
      baseURL?.startsWith(local.origin)
        ? { method: "POST", credentials: "omit", headers }
        : { method: "GET", credentials: "omit" },
    );
    const { results = [] } = await response.json();
    const rearrangedResults = sort(
      results as SearxngSearchResult[],
      (item) => item.score,
      true,
    );
    return {
      sources: rearrangedResults
        .filter((item) => item.content && item.url && item.score >= 0.5)
        .slice(0, maxResult * 5)
        .map((result) => pick(result, ["title", "content", "url"])) as Source[],
      images: rearrangedResults
        .filter((item) => item.category === "images" && item.score >= 0.5)
        .slice(0, maxResult)
        .map((result) => {
          return {
            url: result.img_src,
            description: result.title,
          };
        }) as ImageSource[],
    };
  } else {
    throw new Error("Unsupported Provider: " + provider);
  }
}
