import copy from "copy-to-clipboard";
import { Copy, CopyCheck, Download, RefreshCcw, ZoomIn, ZoomOut } from "lucide-react";
import { customAlphabet } from "nanoid";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { TransformComponent, TransformWrapper } from "react-zoom-pan-pinch";
import { Button } from "@/components/Internal/Button";
import { downloadFile } from "@/utils/file";

type Props = {
  children: ReactNode;
};

const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz", 8);

async function loadMermaid(element: HTMLElement, code: string) {
  const { default: mermaid } = await import("mermaid");
  mermaid.initialize({ startOnLoad: false });
  const canParse = await mermaid.parse(code, { suppressErrors: true });
  if (canParse) {
    await mermaid.render(nanoid(), code).then(({ svg }) => {
      element.innerHTML = svg;
    });
  }
}

function Mermaid({ children }: Props) {
  const { t } = useTranslation();
  const mermaidContainerRef = useRef<HTMLDivElement>(null);
  const [content, setContent] = useState<string>("");
  const [waitingCopy, setWaitingCopy] = useState<boolean>(false);

  function downloadSvg() {
    const target = mermaidContainerRef.current;
    if (target) {
      downloadFile(target.innerHTML, `${Date.now()}.svg`, "image/svg+xml");
    }
  }

  const handleCopy = () => {
    const target = mermaidContainerRef.current;
    if (target) {
      setWaitingCopy(true);
      copy(content);
      setTimeout(() => {
        setWaitingCopy(false);
      }, 1200);
    }
  };

  useEffect(() => {
    const target = mermaidContainerRef.current;
    if (target) {
      setContent(target.innerText);
      loadMermaid(target, target.innerText);
    }
  }, []);

  return (
    <div className="relative cursor-pointer justify-center w-full overflow-auto rounded">
      <TransformWrapper initialScale={2} smooth>
        {({ zoomIn, zoomOut, resetTransform }) => (
          <>
            <div className="absolute top-0 right-0 z-50 flex gap-1 print:hidden">
              <Button
                className="w-6 h-6"
                size="icon"
                variant="ghost"
                title={t("editor.mermaid.downloadSvg")}
                onClick={() => downloadSvg()}
              >
                <Download />
              </Button>
              <Button
                className="w-6 h-6"
                size="icon"
                variant="ghost"
                title={t("editor.mermaid.copyText")}
                onClick={() => handleCopy()}
              >
                {waitingCopy ? (
                  <CopyCheck className="h-full w-full text-green-500" />
                ) : (
                  <Copy className="h-full w-full" />
                )}
              </Button>
            </div>
            <div className="absolute bottom-0 right-0 z-50 flex gap-1 print:hidden">
              <Button
                className="w-6 h-6"
                size="icon"
                variant="ghost"
                title={t("editor.mermaid.zoomIn")}
                onClick={() => zoomIn()}
              >
                <ZoomIn />
              </Button>
              <Button
                className="w-6 h-6"
                size="icon"
                variant="ghost"
                title={t("editor.mermaid.zoomOut")}
                onClick={() => zoomOut()}
              >
                <ZoomOut />
              </Button>
              <Button
                className="w-6 h-6"
                size="icon"
                variant="ghost"
                title={t("editor.mermaid.resize")}
                onClick={() => resetTransform()}
              >
                <RefreshCcw />
              </Button>
            </div>
            <TransformComponent>
              <div className="mermaid" ref={mermaidContainerRef}>
                {children}
              </div>
            </TransformComponent>
          </>
        )}
      </TransformWrapper>
    </div>
  );
}

export default Mermaid;
