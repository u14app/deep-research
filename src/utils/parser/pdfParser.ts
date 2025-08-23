import * as pdfjsLib from "pdfjs-dist";

async function getTextContent(file: string | ArrayBuffer) {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `./scripts/pdf.worker.min.mjs`;

    // 加载 PDF 文件
    const loadingTask = pdfjsLib.getDocument(file);
    const pdfDocument = await loadingTask.promise;

    let fullText = "";

    // 循环处理每一页
    for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
      const page = await pdfDocument.getPage(pageNum);
      const textContent = await page.getTextContent();

      // 将文本内容组合起来
      const pageText = textContent.items
        .filter((item) => "str" in item)
        .map((item) => item.str)
        .join(" ");
      fullText += `${pageText}\n`; // 可以添加换行符来区分页面
    }

    return fullText;
  } catch (error) {
    console.error("Error extracting text:", error);
    throw new Error("Error extracting text");
  }
}

export async function readTextFromPDF(file: File): Promise<string> {
  if (!file) {
    throw new Error("No file provided");
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async () => {
      if (reader.result) {
        try {
          const text = await getTextContent(reader.result);
          resolve(text);
        } catch (error) {
          console.error("Error processing PDF:", error);
          reject(new Error("Error processing PDF"));
        }
      } else {
        reject(new Error("File reading failed"));
      }
    };

    reader.onerror = () => {
      reject(new Error("Error reading file"));
    };

    reader.readAsArrayBuffer(file);
  });
}
