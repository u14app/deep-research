import { omit } from "radash";
import { generateSignature } from "@/utils/signature";

interface CrawlerResult {
  url: string;
  title: string;
  content: string;
}

interface ReaderResult extends CrawlerResult {
  warning?: string;
  title: string;
  description: string;
  url: string;
  content: string;
  usage: {
    tokens: number;
  };
}

export async function jinaReader(url: string) {
  const response = await fetch("https://r.jina.ai", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ url }),
  });

  const { data }: { data: ReaderResult } = await response.json();
  if (data.warning) {
    throw new Error(data.warning);
  }
  return omit(data, ["usage", "description"]) as CrawlerResult;
}

export async function localCrawler(url: string, password: string) {
  const accessKey = generateSignature(password, Date.now());
  const response = await fetch("/api/crawler", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessKey}`,
    },
    body: JSON.stringify({ url }),
  });
  const result: CrawlerResult = await response.json();
  return result;
}
