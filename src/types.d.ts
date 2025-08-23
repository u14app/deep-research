interface Resource {
  id: string;
  name: string;
  type: string;
  size: number;
  status: "unprocessed" | "processing" | "completed" | "failed";
}

interface FileMeta {
  name: string;
  size: number;
  type: string;
  lastModified: number;
}

interface Knowledge {
  id: string;
  title: string;
  content: string;
  type: "file" | "url" | "knowledge";
  fileMeta?: FileMeta;
  url?: string;
  createdAt: number;
  updatedAt: number;
}

interface ImageSource {
  url: string;
  description?: string;
}

interface Source {
  title?: string;
  content?: string;
  url: string;
  images?: ImageSource[];
}

interface SearchTask {
  state: "unprocessed" | "processing" | "completed" | "failed";
  query: string;
  researchGoal: string;
  learning: string;
  sources: Source[];
  images: ImageSource[];
}

interface PartialJson {
  value: JSONValue | undefined;
  state: "undefined-input" | "successful-parse" | "repaired-parse" | "failed-parse";
}

interface WebSearchResult {
  content: string;
  url: string;
  title?: string;
}
