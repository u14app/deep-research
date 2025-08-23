/**
 * Modified from https://github.com/harshankur/officeParser
 */
import { BlobReader, BlobWriter, type Entry, ZipReader } from "@zip.js/zip.js";

/**
 * Resolves to an array of object
 */
interface ExtractedFiles {
  filename: string;
  data: Blob;
}

/**
 * Config Object for officeParser
 */
interface OfficeParserConfig {
  /**
   * File parsing type
   */
  type: "text" | "file";
  /**
   * Flag to show all the logs to console in case of an error irrespective of your own handling. Default is false.
   */
  outputErrorToConsole: boolean;
  /**
   * The delimiter used for every new line in places that allow multiline text like word. Default is \n.
   */
  newlineDelimiter: string;
  /**
   * Flag to ignore notes from parsing in files like powerpoint. Default is false. It includes notes in the parsed text by default.
   */
  ignoreNotes: boolean;
  /**
   * Flag, if set to true, will collectively put all the parsed text from notes at last in files like powerpoint. Default is false. It puts each notes right after its main slide content. If ignoreNotes is set to true, this flag is also ignored.
   */
  putNotesAtLast: boolean;
}

/** Header for error messages */
const ERRORHEADER = "[OfficeParser]: ";
/** Error messages */
const ERRORMSG = {
  extensionUnsupported: (ext: string) =>
    `Sorry, OfficeParser currently support docx, pptx, xlsx, odt, odp, ods files only. Create a ticket in Issues on github to add support for ${ext} files. Stay tuned for further updates.`,
  fileCorrupted: (filepath: string) =>
    `Your file ${filepath} seems to be corrupted. If you are sure it is fine, please create a ticket in Issues on github with the file to reproduce error.`,
};

function handleError(error: string, outputErrorToConsole = false) {
  if (error && outputErrorToConsole) console.error(ERRORHEADER + error);
  throw new Error(ERRORHEADER + error);
}

const officeFileTypes = {
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  odt: "application/vnd.oasis.opendocument.text",
  odp: "application/vnd.oasis.opendocument.presentation",
  ods: "application/vnd.oasis.opendocument.spreadsheet",
};

function parseXMLString(xml: string) {
  const parser = new DOMParser();
  return parser.parseFromString(xml, "text/xml");
}

function createMergedXmlDocument(): Document {
  return document.implementation.createDocument(null, "root"); // 将 "root" 替换为您想要的根元素名称
}

function mergeXmlDocuments(mergedDoc: Document, xmlDocs: Document[]): void {
  const mergedRoot = mergedDoc.documentElement;
  xmlDocs.forEach((xmlDoc) => {
    const root = xmlDoc.documentElement;
    if (root) {
      Array.from(root.childNodes).forEach((node) => {
        mergedRoot.appendChild(mergedDoc.importNode(node, true));
      });
    }
  });
}

function serializeXmlDocument(xmlDoc: Document): string {
  const serializer = new XMLSerializer();
  return serializer.serializeToString(xmlDoc);
}

function stringToBlob(xmlString: string): Blob {
  return new Blob([xmlString], { type: "text/xml" });
}

function blobToFile(blob: Blob, fileName: string): File {
  return new File([blob], fileName, { type: blob.type });
}

async function mergeXmlBlobs(blobs: Blob[]): Promise<Blob> {
  const xmlStrings = await Promise.all(blobs.map((blob) => blob.text()));
  const xmlDocs = xmlStrings.map((xmlString) => parseXMLString(xmlString));

  const mergedDoc = createMergedXmlDocument();
  mergeXmlDocuments(mergedDoc, xmlDocs);

  const mergedXmlString = serializeXmlDocument(mergedDoc);
  return stringToBlob(mergedXmlString);
}

function extractFiles(
  zipInput: File,
  filterFn: (filename: string) => boolean
): Promise<ExtractedFiles[]> {
  return new Promise(async (resolve, reject) => {
    const extractedFiles: ExtractedFiles[] = [];
    const processZipfile = async (entry: Entry) => {
      if (filterFn(entry.filename)) {
        if (entry.getData) {
          const data = await entry.getData(new BlobWriter());
          extractedFiles.push({
            filename: entry.filename,
            data,
          });
        }
      }
    };

    try {
      // Process ZIP
      const entrys = await new ZipReader(new BlobReader(zipInput)).getEntries();
      for (const entry of entrys) {
        await processZipfile(entry);
      }
      resolve(extractedFiles);
    } catch (err) {
      reject(err);
    }
  });
}

export function parseWord(file: File, config: Partial<OfficeParserConfig>): Promise<string | File> {
  /** The target content xml file for the docx file. */
  const mainContentFileRegex = /word\/document[\d+]?.xml/g;
  const footnotesFileRegex = /word\/footnotes[\d+]?.xml/g;
  const endnotesFileRegex = /word\/endnotes[\d+]?.xml/g;

  return new Promise((resolve, reject) => {
    extractFiles(file, (x) =>
      [mainContentFileRegex, footnotesFileRegex, endnotesFileRegex].some((fileRegex) =>
        x.match(fileRegex)
      )
    )
      .then((files: ExtractedFiles[]) => {
        // Verify if atleast the document xml file exists in the extracted files list.
        if (!files.some((file) => file.filename.match(mainContentFileRegex)))
          handleError(ERRORMSG.fileCorrupted(file.name), config.outputErrorToConsole);

        return files.filter(
          (file) =>
            file.filename.match(mainContentFileRegex) ||
            file.filename.match(footnotesFileRegex) ||
            file.filename.match(endnotesFileRegex)
        );
      })
      // ************************************* word xml files explanation *************************************
      // Structure of xmlContent of a word file is simple.
      // All text nodes are within w:t tags and each of the text nodes that belong in one paragraph are clubbed together within a w:p tag.
      // So, we will filter out all the empty w:p tags and then combine all the w:t tag text inside for creating our response text.
      // ******************************************************************************************************
      .then(async (files: ExtractedFiles[]) => {
        if (config.type === "file") {
          const mergedBlob = await mergeXmlBlobs(files.map((item) => item.data));
          return resolve(blobToFile(mergedBlob, file.name));
        }

        /** Store all the text content to respond. */
        const responseText: string[] = [];

        const xmlContentArray: string[] = [];
        for await (const file of files) {
          xmlContentArray.push(await file.data.text());
        }

        xmlContentArray.forEach((xmlContent) => {
          /** Find text nodes with w:p tags */
          const xmlParagraphNodesList = parseXMLString(xmlContent).getElementsByTagName("w:p");
          /** Store all the text content to respond */
          responseText.push(
            Array.from(xmlParagraphNodesList)
              // Filter paragraph nodes than do not have any text nodes which are identifiable by w:t tag
              .filter((paragraphNode) => paragraphNode.getElementsByTagName("w:t").length !== 0)
              .map((paragraphNode) => {
                // Find text nodes with w:t tags
                const xmlTextNodeList = paragraphNode.getElementsByTagName("w:t");
                // Join the texts within this paragraph node without any spaces or delimiters.
                return Array.from(xmlTextNodeList)
                  .filter((textNode) => textNode.childNodes[0]?.nodeValue)
                  .map((textNode) => textNode.childNodes[0]?.nodeValue ?? "")
                  .join("");
              })
              // Join each paragraph text with a new line delimiter.
              .join(config.newlineDelimiter ?? "\n")
          );
        });
        // Respond by calling the Callback function.
        resolve(responseText.join(config.newlineDelimiter ?? "\n"));
      })
      .catch(reject);
  });
}

export function parsePowerPoint(
  file: File,
  config: Partial<OfficeParserConfig>
): Promise<string | File> {
  // Files regex that hold our content of interest
  const allFilesRegex = /ppt\/(notesSlides|slides)\/(notesSlide|slide)\d+.xml/g;
  const slidesRegex = /ppt\/slides\/slide\d+.xml/g;
  const slideNumberRegex = /lide(\d+)\.xml/;

  return new Promise((resolve, reject) => {
    extractFiles(file, (x) => !!x.match(config.ignoreNotes ? slidesRegex : allFilesRegex))
      .then((files: ExtractedFiles[]) => {
        // Sort files by slide number and their notes (if any).
        files.sort((a, b) => {
          const matchedANumber = parseInt(a.filename.match(slideNumberRegex)?.at(1) || "0", 10);
          const matchedBNumber = parseInt(b.filename.match(slideNumberRegex)?.at(1) || "0", 10);

          const aNumber = Number.isNaN(matchedANumber) ? Infinity : matchedANumber;
          const bNumber = Number.isNaN(matchedBNumber) ? Infinity : matchedBNumber;

          return (
            aNumber - bNumber ||
            Number(a.filename.includes("notes")) - Number(b.filename.includes("notes"))
          );
        });

        // Verify if atleast the slides xml files exist in the extracted files list.
        if (
          files.length === 0 ||
          !files.map((file) => file.filename).some((filename) => filename.match(slidesRegex))
        )
          handleError(ERRORMSG.fileCorrupted(file.name), config.outputErrorToConsole);

        // Check if any sorting is required.
        if (!config.ignoreNotes && config.putNotesAtLast)
          // Sort files according to previous order of taking text out of ppt/slides followed by ppt/notesSlides
          // For this we are looking at the index of notes which results in -1 in the main slide file and exists at a certain index in notes file names.
          files.sort((a, b) => a.filename.indexOf("notes") - b.filename.indexOf("notes"));

        // Returning an array of all the xml contents read using fs.readFileSync
        return files;
      })
      // ******************************** powerpoint xml files explanation ************************************
      // Structure of xmlContent of a powerpoint file is simple.
      // There are multiple xml files for each slide and correspondingly their notesSlide files.
      // All text nodes are within a:t tags and each of the text nodes that belong in one paragraph are clubbed together within a a:p tag.
      // So, we will filter out all the empty a:p tags and then combine all the a:t tag text inside for creating our response text.
      // ******************************************************************************************************
      .then(async (files: ExtractedFiles[]) => {
        if (config.type === "file") {
          const mergedBlob = await mergeXmlBlobs(files.map((item) => item.data));
          return resolve(blobToFile(mergedBlob, file.name));
        }

        /** Store all the text content to respond */
        const responseText: string[] = [];

        const xmlContentArray: string[] = [];
        for await (const file of files) {
          xmlContentArray.push(await file.data.text());
        }
        xmlContentArray.forEach((xmlContent) => {
          /** Find text nodes with a:p tags */
          const xmlParagraphNodesList = parseXMLString(xmlContent).getElementsByTagName("a:p");
          /** Store all the text content to respond */
          responseText.push(
            Array.from(xmlParagraphNodesList)
              // Filter paragraph nodes than do not have any text nodes which are identifiable by a:t tag
              .filter((paragraphNode) => paragraphNode.getElementsByTagName("a:t").length !== 0)
              .map((paragraphNode) => {
                /** Find text nodes with a:t tags */
                const xmlTextNodeList = paragraphNode.getElementsByTagName("a:t");
                return Array.from(xmlTextNodeList)
                  .filter((textNode) => textNode.childNodes[0]?.nodeValue)
                  .map((textNode) => textNode.childNodes[0]?.nodeValue ?? "")
                  .join("");
              })
              .join(config.newlineDelimiter ?? "\n")
          );
        });

        // Respond by calling the Callback function.
        resolve(responseText.join(config.newlineDelimiter ?? "\n"));
      })
      .catch(reject);
  });
}

export function parseExcel(
  file: File,
  config: Partial<OfficeParserConfig>
): Promise<string | File> {
  // Files regex that hold our content of interest
  const sheetsRegex = /xl\/worksheets\/sheet\d+.xml/g;
  const drawingsRegex = /xl\/drawings\/drawing\d+.xml/g;
  const chartsRegex = /xl\/charts\/chart\d+.xml/g;
  const stringsFilePath = "xl/sharedStrings.xml";

  return new Promise((resolve, reject) => {
    extractFiles(
      file,
      (x) =>
        [sheetsRegex, drawingsRegex, chartsRegex].some((fileRegex) => x.match(fileRegex)) ||
        x === stringsFilePath
    )
      .then((files: ExtractedFiles[]) => {
        // Verify if atleast the slides xml files exist in the extracted files list.
        if (
          files.length === 0 ||
          !files.map((file) => file.filename).some((filename) => filename.match(sheetsRegex))
        )
          handleError(ERRORMSG.fileCorrupted(file.name), config.outputErrorToConsole);

        return {
          sheetFiles: files.filter((file) => file.filename.match(sheetsRegex)),
          drawingFiles: files.filter((file) => file.filename.match(drawingsRegex)),
          chartFiles: files.filter((file) => file.filename.match(chartsRegex)),
          sharedStringsFile:
            files.filter((file) => file.filename === stringsFilePath)[0] || undefined,
        };
      })
      // ********************************** excel xml files explanation ***************************************
      // Structure of xmlContent of an excel file is a bit complex.
      // We usually have a sharedStrings.xml file which has strings inside t tags
      // However, this file is not necessary to be present. It is sometimes absent if the file has no shared strings indices represented in v nodes.
      // Each sheet has an individual sheet xml file which has numbers in v tags (probably value) inside c tags (probably cell)
      // Each value of v tag is to be used as it is if the "t" attribute (probably type) of c tag is not "s" (probably shared string)
      // If the "t" attribute of c tag is "s", then we use the value to select value from sharedStrings array with the value as its index.
      // However, if the "t" attribute of c tag is "inlineStr", strings can be inline inside "is"(probably inside String) > "t".
      // We extract either the inline strings or use the value to get numbers of text from shared strings.
      // Drawing files contain all text for each drawing and have text nodes in a:t and paragraph nodes in a:p.
      // ******************************************************************************************************
      .then(async (xmlContentFilesObject) => {
        if (config.type === "file") {
          const files: ExtractedFiles[] = [];
          for (const fileOrFiles of Object.values(xmlContentFilesObject)) {
            if (Array.isArray(fileOrFiles)) {
              fileOrFiles.forEach((file) => files.push(file));
            } else if (fileOrFiles) {
              files.push(fileOrFiles);
            }
          }
          const mergedBlob = await mergeXmlBlobs(files.map((item) => item.data));
          return resolve(blobToFile(mergedBlob, file.name));
        }

        /** Store all the text content to respond */
        const responseText: string[] = [];

        /** Function to check if the given c node is a valid inline string node. */
        function isValidInlineStringCNode(cNode: Element) {
          // Initial check to see if the passed node is a cNode
          if (cNode.tagName.toLowerCase() !== "c") return false;
          if (cNode.getAttribute("t") !== "inlineStr") return false;
          const childNodesNamedIs = cNode.getElementsByTagName("is");
          if (childNodesNamedIs.length !== 1) return false;
          const childNodesNamedT = childNodesNamedIs[0]?.getElementsByTagName("t");
          if (!childNodesNamedT || childNodesNamedT.length !== 1) return false;
          return (
            childNodesNamedT[0]?.childNodes[0] &&
            childNodesNamedT[0]?.childNodes[0].nodeValue !== ""
          );
        }

        /** Function to check if the given c node has a valid v node */
        function hasValidVNodeInCNode(cNode: Element) {
          const vNode = cNode.getElementsByTagName("v")[0];
          return vNode?.childNodes[0] && vNode.childNodes[0].nodeValue !== "";
        }

        /** Find text nodes with t tags in sharedStrings xml file. If the sharedStringsFile is not present, we return an empty array. */
        const sharedStringsXmlTNodesList = xmlContentFilesObject.sharedStringsFile
          ? parseXMLString(
              await xmlContentFilesObject.sharedStringsFile.data.text()
            ).getElementsByTagName("t")
          : [];
        /** Create shared string array. This will be used as a map to get strings from within sheet files. */
        const sharedStrings = Array.from(sharedStringsXmlTNodesList).map(
          (tNode) => tNode.childNodes[0]?.nodeValue ?? ""
        );

        // Parse Sheet files
        for await (const sheetFile of xmlContentFilesObject.sheetFiles) {
          const sheetXmlContent = await sheetFile.data.text();
          /** Find text nodes with c tags in sharedStrings xml file */
          const sheetsXmlCNodesList = parseXMLString(sheetXmlContent).getElementsByTagName("c");
          // Traverse through the nodes list and fill responseText with either the number value in its v node or find a mapped string from sharedStrings or an inline string.
          responseText.push(
            Array.from(sheetsXmlCNodesList)
              // Filter out invalid c nodes
              .filter((cNode) => isValidInlineStringCNode(cNode) || hasValidVNodeInCNode(cNode))
              .map((cNode) => {
                // Processing if this is a valid inline string c node.
                if (isValidInlineStringCNode(cNode))
                  return cNode.getElementsByTagName("is")[0]?.getElementsByTagName("t")[0]
                    ?.childNodes[0]?.nodeValue;

                // Processing if this c node has a valid v node.
                if (hasValidVNodeInCNode(cNode)) {
                  /** Flag whether this node's value represents an index in the shared string array */
                  const isIndexInSharedStrings = cNode.getAttribute("t") === "s";

                  /** Find value nodes represented by v tags */
                  const cNodeValue = cNode.getElementsByTagName("v")[0]?.childNodes[0]?.nodeValue;
                  if (cNodeValue) {
                    const value = parseInt(cNodeValue, 10);
                    // Validate text
                    if (isIndexInSharedStrings && value >= sharedStrings.length)
                      handleError(ERRORMSG.fileCorrupted(file.name), config.outputErrorToConsole);

                    return isIndexInSharedStrings ? sharedStrings[value] : value;
                  }
                }
                // TODO: Add debug asserts for if we reach here which would mean we are filtering more items than we are processing.
                // Not the case now but it could happen and it is better to be safe.
                return "";
              })
              // Join each cell text within a sheet with a space.
              .join(config.newlineDelimiter ?? "\n")
          );
        }

        // Parse Drawing files
        for await (const drawingFile of xmlContentFilesObject.drawingFiles) {
          const drawingXmlContent = await drawingFile.data.text();
          /** Find text nodes with a:p tags */
          const drawingsXmlParagraphNodesList =
            parseXMLString(drawingXmlContent).getElementsByTagName("a:p");
          /** Store all the text content to respond */
          responseText.push(
            Array.from(drawingsXmlParagraphNodesList)
              // Filter paragraph nodes than do not have any text nodes which are identifiable by a:t tag
              .filter((paragraphNode) => paragraphNode.getElementsByTagName("a:t").length !== 0)
              .map((paragraphNode) => {
                /** Find text nodes with a:t tags */
                const xmlTextNodeList = paragraphNode.getElementsByTagName("a:t");
                return Array.from(xmlTextNodeList)
                  .filter((textNode) => textNode.childNodes[0]?.nodeValue)
                  .map((textNode) => textNode.childNodes[0]?.nodeValue ?? "")
                  .join("");
              })
              .join(config.newlineDelimiter ?? "\n")
          );
        }

        // Parse Chart files
        for await (const chartFile of xmlContentFilesObject.chartFiles) {
          const chartXmlContent = await chartFile.data.text();
          /** Find text nodes with c:v tags */
          const chartsXmlCVNodesList = parseXMLString(chartXmlContent).getElementsByTagName("c:v");
          /** Store all the text content to respond */
          responseText.push(
            Array.from(chartsXmlCVNodesList)
              .filter((cVNode) => cVNode.childNodes[0]?.nodeValue)
              .map((cVNode) => cVNode.childNodes[0]?.nodeValue ?? "")
              .join(config.newlineDelimiter ?? "\n")
          );
        }

        // Respond by calling the Callback function.
        resolve(responseText.join(config.newlineDelimiter ?? "\n"));
      })
      .catch(reject);
  });
}

export function parseOpenOffice(
  file: File,
  config: Partial<OfficeParserConfig>
): Promise<string | File> {
  /** The target content xml file for the openoffice file. */
  const mainContentFilePath = "content.xml";
  const objectContentFilesRegex = /Object \d+\/content.xml/g;

  return new Promise((resolve, reject) => {
    extractFiles(file, (x) => x === mainContentFilePath || !!x.match(objectContentFilesRegex))
      .then((files) => {
        // Verify if atleast the content xml file exists in the extracted files list.
        if (!files.map((file) => file.filename).includes(mainContentFilePath))
          handleError(ERRORMSG.fileCorrupted(file.name), config.outputErrorToConsole);

        return {
          mainContentFile:
            files.filter((file) => file.filename === mainContentFilePath)[0] || undefined,
          objectContentFiles: files.filter((file) => file.filename.match(objectContentFilesRegex)),
        };
      })
      // ********************************** openoffice xml files explanation **********************************
      // Structure of xmlContent of openoffice files is simple.
      // All text nodes are within text:h and text:p tags with all kinds of formatting within nested tags.
      // All text in these tags are separated by new line delimiters.
      // Objects like charts in ods files are in Object d+/content.xml with the same way as above.
      // ******************************************************************************************************
      .then(async (xmlContentFilesObject) => {
        if (config.type === "file") {
          const files: ExtractedFiles[] = [];
          for (const fileOrFiles of Object.values(xmlContentFilesObject)) {
            if (Array.isArray(fileOrFiles)) {
              fileOrFiles.forEach((file) => files.push(file));
            } else if (fileOrFiles) {
              files.push(fileOrFiles);
            }
          }
          const mergedBlob = await mergeXmlBlobs(files.map((item) => item.data));
          return resolve(blobToFile(mergedBlob, file.name));
        }

        /** Store all the notes text content to respond */
        const notesText: string[] = [];
        /** Store all the text content to respond */
        let responseText: string[] = [];

        /** List of allowed text tags */
        const allowedTextTags = ["text:p", "text:h"];
        /** List of notes tags */
        const notesTag = "presentation:notes";

        /** Main dfs traversal function that goes from one node to its children and returns the value out. */
        function extractAllTextsFromNode(root: Element) {
          const xmlTextArray: string[] = [];
          for (let i = 0; i < root.childNodes.length; i++)
            traversal(root.childNodes[i], xmlTextArray, true);
          return xmlTextArray.join("");
        }
        /** Traversal function that gets recursive calling. */
        function traversal(
          node: ChildNode | undefined,
          xmlTextArray: string[],
          isFirstRecursion: boolean
        ) {
          if (!node) return;
          if (!node.childNodes || node.childNodes.length === 0) {
            if (node.parentNode?.nodeName.indexOf("text") === 0 && node.nodeValue) {
              if (isNotesNode(node.parentNode) && (config.putNotesAtLast || config.ignoreNotes)) {
                notesText.push(node.nodeValue);
                if (allowedTextTags.includes(node.parentNode.nodeName) && !isFirstRecursion)
                  notesText.push(config.newlineDelimiter ?? "\n");
              } else {
                xmlTextArray.push(node.nodeValue);
                if (allowedTextTags.includes(node.parentNode.nodeName) && !isFirstRecursion)
                  xmlTextArray.push(config.newlineDelimiter ?? "\n");
              }
            }
            return;
          }

          for (let i = 0; i < node.childNodes.length; i++)
            traversal(node.childNodes[i], xmlTextArray, false);
        }

        /** Checks if the given node has an ancestor which is a notes tag. We use this information to put the notes in the response text and its position. */
        function isNotesNode(node: Node) {
          if (node.nodeName === notesTag) return true;
          if (node.parentNode) return isNotesNode(node.parentNode);
          return false;
        }

        /** Checks if the given node has an ancestor which is also an allowed text tag. In that case, we ignore the child text tag. */
        function isInvalidTextNode(node: Node) {
          if (allowedTextTags.includes(node.nodeName)) return true;
          if (node.parentNode) return isInvalidTextNode(node.parentNode);
          return false;
        }

        /** The xml string parsed as xml array */
        const xmlContentArray: string[] = [];
        if (xmlContentFilesObject.mainContentFile) {
          xmlContentArray.push(await xmlContentFilesObject.mainContentFile.data.text());
        }
        for await (const file of xmlContentFilesObject.objectContentFiles) {
          xmlContentArray.push(await file.data.text());
        }

        // Iterate over each xmlContent and extract text from them.
        xmlContentArray.forEach((content) => {
          const xmlContent = parseXMLString(content);
          /** Find text nodes with text:h and text:p tags in xmlContent */
          const xmlTextNodesList = [
            ...Array.from(xmlContent.getElementsByTagName("*")).filter(
              (node) =>
                allowedTextTags.includes(node.tagName) && !isInvalidTextNode(node.parentNode!)
            ),
          ];
          /** Store all the text content to respond */
          responseText.push(
            xmlTextNodesList
              // Add every text information from within this textNode and combine them together.
              .map((textNode) => extractAllTextsFromNode(textNode))
              .filter((text) => text !== "")
              .join(config.newlineDelimiter ?? "\n")
          );
        });

        // Add notes text at the end if the user config says so.
        // Note that we already have pushed the text content to notesText array while extracting all texts from the nodes.
        if (!config.ignoreNotes && config.putNotesAtLast)
          responseText = [...responseText, ...notesText];

        // Respond by calling the Callback function.
        resolve(responseText.join(config.newlineDelimiter ?? "\n"));
      })
      .catch(reject);
  });
}

export function readTextFromOffice(file: File, config?: Partial<OfficeParserConfig>) {
  // Make a clone of the config with default values such that none of the config flags are undefined.
  /** @type {OfficeParserConfig} */
  let internalConfig: OfficeParserConfig = {
    type: "text",
    ignoreNotes: false,
    newlineDelimiter: "\n",
    putNotesAtLast: false,
    outputErrorToConsole: false,
  };

  if (config) internalConfig = { ...internalConfig, ...config };

  // Switch between parsing functions depending on extension.
  switch (file.type) {
    case officeFileTypes.docx:
      return parseWord(file, internalConfig);
    case officeFileTypes.pptx:
      return parsePowerPoint(file, internalConfig);
    case officeFileTypes.xlsx:
      return parseExcel(file, internalConfig);
    case officeFileTypes.odt:
    case officeFileTypes.odp:
    case officeFileTypes.ods:
      return parseOpenOffice(file, internalConfig);
    default:
      return handleError(
        ERRORMSG.extensionUnsupported(file.type),
        internalConfig.outputErrorToConsole
      );
  }
}
