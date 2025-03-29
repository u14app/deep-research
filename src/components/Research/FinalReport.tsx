"use client";
import dynamic from "next/dynamic";
import { useTranslation } from "react-i18next";
import { Download, FileText, Signature } from "lucide-react";
import { Button } from "@/components/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { useTaskStore } from "@/store/task";
import { useHistoryStore } from "@/store/history";
import { getSystemPrompt } from "@/utils/deep-research";
import { downloadFile } from "@/utils/file";

const MilkdownEditor = dynamic(() => import("@/components/MilkdownEditor"));
const Artifact = dynamic(() => import("@/components/Artifact"));

function FinalReport() {
  const { t } = useTranslation();
  const taskStore = useTaskStore();
  const historyStore = useHistoryStore();

  function getFinakReportContent() {
    const { finalReport, sources } = useTaskStore.getState();

    return [
      finalReport,
      sources.length > 0
        ? [
            "\n\n---",
            `## ${t("research.finalReport.researchedInfor", {
              total: sources.length,
            })}`,
            `${sources
              .map(
                (source, idx) =>
                  `${idx + 1}. [${source.title || source.url}](${source.url})`
              )
              .join("\n")}`,
          ].join("\n\n")
        : "",
    ].join("\n\n");
  }

  async function handleDownloadPDF() {
    const originalTitle = document.title;
    document.title = taskStore.title;
    window.print();
    document.title = originalTitle;
  }

  // update taskStore and historyStore
  const handleEditorChange = (value: string) => {
    taskStore.updateFinalReport(value);
    historyStore.update(taskStore.id, taskStore.backup());
  };

  return (
    <section className="p-4 border rounded-md mt-4 print:border-none">
      <h3 className="font-semibold text-lg border-b mb-2 leading-10 print:hidden">
        {t("research.finalReport.title")}
      </h3>
      {taskStore.finalReport === "" ? (
        <div>{t("research.finalReport.emptyTip")}</div>
      ) : (
        <>
          <article id="final-report">
            <MilkdownEditor
              className="min-h-72"
              value={taskStore.finalReport}
              onChange={handleEditorChange}
              tools={
                <>
                  <div className="px-1">
                    <Separator className="dark:bg-slate-700" />
                  </div>
                  <Artifact
                    value={taskStore.finalReport}
                    systemInstruction={getSystemPrompt()}
                    onChange={handleEditorChange}
                    buttonClassName="float-menu-button"
                    dropdownMenuSideOffset={8}
                    tooltipSideOffset={8}
                  />
                  <div className="px-1">
                    <Separator className="dark:bg-slate-700" />
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        className="float-menu-button"
                        type="button"
                        size="icon"
                        variant="ghost"
                        title={t("editor.export")}
                        side="left"
                        sideoffset={8}
                      >
                        <Download />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      className="print:hidden"
                      side="left"
                      sideOffset={8}
                    >
                      <DropdownMenuItem
                        onClick={() =>
                          downloadFile(
                            getFinakReportContent(),
                            `${taskStore.title}.md`,
                            "text/markdown;charset=utf-8"
                          )
                        }
                      >
                        <FileText />
                        <span>Markdown</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDownloadPDF()}>
                        <Signature />
                        <span>PDF</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              }
            />
            {taskStore.sources?.length > 0 ? (
              <div className="prose prose-slate dark:prose-invert">
                <hr className="my-6" />
                <h2>
                  {t("research.finalReport.researchedInfor", {
                    total: taskStore.sources.length,
                  })}
                </h2>
                <ol>
                  {taskStore.sources.map((source, idx) => {
                    return (
                      <li key={idx}>
                        <a href={source.url} target="_blank">
                          {source.title || source.url}
                        </a>
                      </li>
                    );
                  })}
                </ol>
              </div>
            ) : null}
          </article>
        </>
      )}
    </section>
  );
}

export default FinalReport;
