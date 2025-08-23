const MAX_TEXT_CHUNK_LENGTH = 2000; // 你可以根据需要调整这个值

export function splitText(text: string = "", maxLength: number = MAX_TEXT_CHUNK_LENGTH): string[] {
  const paragraphs = text.split("\n");
  const chunks: string[] = [];
  let currentChunk = "";

  for (const paragraph of paragraphs) {
    if (currentChunk.length + paragraph.length + 1 <= maxLength) {
      // +1 是为了加上换行符
      currentChunk += (currentChunk.length > 0 ? "\n" : "") + paragraph;
    } else {
      if (currentChunk.length > 0) {
        chunks.push(currentChunk);
      }
      currentChunk = paragraph;
    }
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk);
  }

  return chunks;
}

export function removeJsonMarkdown(text: string) {
  text = text.trim();
  if (text.startsWith("```json")) {
    text = text.slice(7);
  } else if (text.startsWith("json")) {
    text = text.slice(4);
  } else if (text.startsWith("```")) {
    text = text.slice(3);
  }
  if (text.endsWith("```")) {
    text = text.slice(0, -3);
  }
  return text.trim();
}

/**
 * Check if a text contains XML or HTML tags.
 * Consider various scenarios, including:
 * - Regular tags (such as <p>, <div>)
 * - Tags with attributes (such as <a href="...">)
 * - Self-closing tags (such as <img />, <br>)
 * - Closed tags (such as </p>)
 * - XML/HTML comments (such as <!-- ... -->)
 * - XML ​​processing instructions (such as <?xml ... ?>)
 * - CDATA sections (such as <![CDATA[ ... ]]> )
 * - DOCTYPE declarations (such as <!DOCTYPE html>)
 *
 * Note: This method is a fast detection based on pattern matching, not a complete parser.
 * It may misjudge some non-tag but similarly structured text as tags, but it is sufficient in most detection scenarios.
 * Strict validation requires a full parser.
 *
 * @param text The text to be detected
 * @returns Returns true if the text contains any structure that looks like an XML/HTML tag, otherwise returns false.
 */
export function containsXmlHtmlTags(text: string): boolean {
  // Check if the input is a string and is not empty
  if (typeof text !== "string" || text.length === 0) {
    return false;
  }

  // Build regular expressions to match various possible tag structures
  // This regular expression tries to cover common XML/HTML structures:
  // 1. <!--.*?--> : matches HTML/XML comments (non-greedy matching)
  // 2. <![CDATA[.*?]]> : matches CDATA sections (non-greedy matching)
  // 3. <!DOCTYPE[^>]*?> : matches DOCTYPE declarations (non-greedy matching)
  // 4. <\?.*?\?> : matches XML processing instructions (e.g. <?xml ... ?>) (non-greedy matching)
  // 5. <[!\/]?[a-zA-Z][^>]*?> : matches normal tags, tags with attributes, self-closing tags, closing tags, and <!ELEMENT>, etc.
  // < : matches '<'
  // [!\/]? : optional '!' (for <!ELEMENT>) or '/' (for closing tags)
  // [a-zA-Z] : tag names start with letters (XML/HTML standard)
  // [^>]*? : non-greedy matches any non-'>' character (remaining part of tag name, attributes, self-closing '/')
  // > : matches '>'
  //
  // Use the 'i' flag for case-insensitive matching (HTML tag names and attribute names are usually case-insensitive)
  // Use the 'test()' method, which only needs to find the first match to return true, which is more efficient
  const xmlHtmlTagRegex =
    /(<!--.*?-->|<!\[CDATA\[.*?]]>|<!DOCTYPE[^>]*?>|<\?.*?\?>|<[!/]?[a-zA-Z][^>]*?>)/i;

  return xmlHtmlTagRegex.test(text);
}

export class ThinkTagStreamProcessor {
  private buffer: string = "";
  private hasSkippedThinkBlock: boolean = false;

  /**
   * Process the received text block.
   * @param chunk The received text block.
   * @param outputCallback The callback function called when there is non-thinking content to be output.
   */
  processChunk(
    chunk: string,
    contentOutput: (data: string) => void,
    thinkingOutput?: (data: string) => void
  ): void {
    // If the think block has been skipped, all new data is output directly
    if (this.hasSkippedThinkBlock) {
      contentOutput(chunk);
      return;
    }

    // Otherwise, while still looking for or processing a think block, add the new block to the buffer
    this.buffer += chunk;

    const startTag = this.buffer.startsWith("<think>");
    const endTagIndex = this.buffer.indexOf("</think>");

    if (startTag) {
      if (endTagIndex !== -1) {
        const contentAfterThink = this.buffer.substring(endTagIndex + "</think>".length);

        // Output the content after </think>
        if (contentAfterThink.length > 0) {
          contentOutput(contentAfterThink);
        }

        this.hasSkippedThinkBlock = true;
        this.buffer = "";
      } else {
        if (thinkingOutput) thinkingOutput(chunk);
      }
    } else {
      this.hasSkippedThinkBlock = true;
      contentOutput(chunk);
    }
  }
  end(): void {
    this.buffer = "";
    this.hasSkippedThinkBlock = false;
  }
}
