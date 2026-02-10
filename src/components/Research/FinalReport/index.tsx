"use client";
import dynamic from "next/dynamic";
import { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Download,
  FileText,
  Signature,
  LoaderCircle,
  NotebookText,
  Waypoints,
  FileSpreadsheet,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/Internal/Button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import useAccurateTimer from "@/hooks/useAccurateTimer";
import useDeepResearch from "@/hooks/useDeepResearch";
import useKnowledge from "@/hooks/useKnowledge";
import useSubmitShortcut from "@/hooks/useSubmitShortcut";
import { useTaskStore } from "@/store/task";
import { useKnowledgeStore } from "@/store/knowledge";
import { useSettingStore } from "@/store/setting";
import { parseDeepResearchPromptOverrides } from "@/constants/prompts";
import { getSystemPrompt } from "@/utils/deep-research/prompts";
import { downloadFile } from "@/utils/file";
import { markdownToDoc } from "@/utils/markdown";

const MagicDown = dynamic(() => import("@/components/MagicDown"));
const Artifact = dynamic(() => import("@/components/Artifact"));
const KnowledgeGraph = dynamic(() => import("./KnowledgeGraph"));

const formSchema = z.object({
  requirement: z.string().optional(),
});

function FinalReport() {
  const { t } = useTranslation();
  const taskStore = useTaskStore();
  const { deepResearchPromptOverrides } = useSettingStore();
  const { status, writeFinalReport } = useDeepResearch();
  const { generateId } = useKnowledge();
  const {
    formattedTime,
    start: accurateTimerStart,
    stop: accurateTimerStop,
  } = useAccurateTimer();
  const [isWriting, setIsWriting] = useState<boolean>(false);
  const [openKnowledgeGraph, setOpenKnowledgeGraph] = useState<boolean>(false);
  const promptOverrides = useMemo(() => {
    try {
      return parseDeepResearchPromptOverrides(deepResearchPromptOverrides);
    } catch {
      return {};
    }
  }, [deepResearchPromptOverrides]);
  const taskFinished = useMemo(() => {
    const unfinishedTasks = taskStore.tasks.filter(
      (task) => task.state !== "completed"
    );
    return taskStore.tasks.length > 0 && unfinishedTasks.length === 0;
  }, [taskStore.tasks]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      requirement: taskStore.requirement,
    },
  });
  const handleFinalReportSubmitShortcut = useSubmitShortcut(() => {
    void form.handleSubmit(handleSubmit)();
  });

  async function handleSubmit(values: z.infer<typeof formSchema>) {
    const { setRequirement } = useTaskStore.getState();
    try {
      accurateTimerStart();
      setIsWriting(true);
      if (values.requirement) setRequirement(values.requirement);
      await writeFinalReport();
    } finally {
      setIsWriting(false);
      accurateTimerStop();
    }
  }

  function getFinakReportContent() {
    const { finalReport, resources, sources } = useTaskStore.getState();

    return [
      finalReport,
      resources.length > 0
        ? [
            "---",
            `## ${t("research.finalReport.localResearchedInfor", {
              total: resources.length,
            })}`,
            `${resources
              .map((source, idx) => `${idx + 1}. ${source.name}`)
              .join("\n")}`,
          ].join("\n")
        : "",
      sources.length > 0
        ? [
            "---",
            `## ${t("research.finalReport.researchedInfor", {
              total: sources.length,
            })}`,
            `${sources
              .map(
                (source, idx) =>
                  `${idx + 1}. [${source.title || source.url}][${idx + 1}]`
              )
              .join("\n")}`,
          ].join("\n")
        : "",
    ].join("\n\n");
  }

  function addToKnowledgeBase() {
    const { title } = useTaskStore.getState();
    const { save } = useKnowledgeStore.getState();
    const currentTime = Date.now();
    save({
      id: generateId("knowledge"),
      title,
      content: getFinakReportContent(),
      type: "knowledge",
      createdAt: currentTime,
      updatedAt: currentTime,
    });
    toast.message(t("research.common.addToKnowledgeBaseTip"));
  }

  function handleDownloadMarkdown() {
    downloadFile(
      getFinakReportContent(),
      `${taskStore.title}.md`,
      "text/markdown;charset=utf-8"
    );
  }

  function handleDownloadWord() {
    // markdownToDoc returns HTML that Word can read as a legacy .doc file
    const docHtml = markdownToDoc(getFinakReportContent());
    downloadFile(
      docHtml,
      `${taskStore.title}.doc`,
      "application/msword;charset=utf-8"
    );
  }

  async function handleDownloadPDF() {
    const originalTitle = document.title;
    document.title = taskStore.title;
    window.print();
    document.title = originalTitle;
  }

  useEffect(() => {
    form.setValue("requirement", taskStore.requirement);
  }, [taskStore.requirement, form]);

  return (
    <>
      <section className="p-4 border rounded-md mt-4 print:border-none">
        <h3 className="font-semibold text-lg border-b mb-2 leading-10 print:hidden">
          {t("research.finalReport.title")}
        </h3>
        {taskStore.finalReport !== "" ? (
          <article>
            <MagicDown
              className="min-h-72"
              value={taskStore.finalReport}
              onChange={(value) => taskStore.updateFinalReport(value)}
              tools={
                <>
                  <div className="px-1">
                    <Separator className="dark:bg-slate-700" />
                  </div>
                  <Artifact
                    value={taskStore.finalReport}
                    systemInstruction={getSystemPrompt(promptOverrides)}
                    onChange={taskStore.updateFinalReport}
                    buttonClassName="float-menu-button"
                    dropdownMenuSideOffset={8}
                    tooltipSideOffset={8}
                  />
                  <div className="px-1">
                    <Separator className="dark:bg-slate-700" />
                  </div>
                  <Button
                    className="float-menu-button"
                    type="button"
                    size="icon"
                    variant="ghost"
                    title={t("knowledgeGraph.action")}
                    side="left"
                    sideoffset={8}
                    onClick={() => setOpenKnowledgeGraph(true)}
                  >
                    <Waypoints />
                  </Button>
                  <Button
                    className="float-menu-button"
                    type="button"
                    size="icon"
                    variant="ghost"
                    title={t("research.common.addToKnowledgeBase")}
                    side="left"
                    sideoffset={8}
                    onClick={() => addToKnowledgeBase()}
                  >
                    <NotebookText />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        className="float-menu-button"
                        type="button"
                        size="icon"
                        variant="ghost"
                        title={t("research.common.export")}
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
                        onClick={() => handleDownloadMarkdown()}
                      >
                        <FileText />
                        <span>Markdown</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDownloadWord()}>
                        <FileSpreadsheet />
                        <span>Word</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="max-md:hidden"
                        onClick={() => handleDownloadPDF()}
                      >
                        <Signature />
                        <span>PDF</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              }
            />
            {taskStore.resources.length > 0 ? (
              <div className="prose prose-slate dark:prose-invert">
                <hr className="my-6" />
                <h2>
                  {t("research.finalReport.localResearchedInfor", {
                    total: taskStore.resources.length,
                  })}
                </h2>
                <ul>
                  {taskStore.resources.map((resource) => {
                    return <li key={resource.id}>{resource.name}</li>;
                  })}
                </ul>
              </div>
            ) : null}
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
        ) : null}
        {taskFinished ? (
          <Form {...form}>
            <form
              className="mt-4 border-t pt-4 print:hidden"
              onSubmit={form.handleSubmit(handleSubmit)}
            >
              <FormField
                control={form.control}
                name="requirement"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="mb-2 font-semibold">
                      {t("research.finalReport.writingRequirementLabel")}
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        rows={3}
                        placeholder={t(
                          "research.finalReport.writingRequirementPlaceholder"
                        )}
                        disabled={isWriting}
                        onKeyDown={handleFinalReportSubmitShortcut}
                        {...field}
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">
                      {t("research.common.submitShortcut")}
                    </p>
                  </FormItem>
                )}
              />
              <Button
                className="w-full mt-4"
                type="submit"
                disabled={isWriting}
              >
                {isWriting ? (
                  <>
                    <LoaderCircle className="animate-spin" />
                    <span>{status}</span>
                    <small className="font-mono">{formattedTime}</small>
                  </>
                ) : taskStore.finalReport === "" ? (
                  t("research.common.writeReport")
                ) : (
                  t("research.common.rewriteReport")
                )}
              </Button>
            </form>
          </Form>
        ) : null}
        {taskStore.finalReport === "" && !taskFinished ? (
          <div>{t("research.finalReport.emptyTip")}</div>
        ) : null}
      </section>
      {openKnowledgeGraph ? (
        <KnowledgeGraph
          open={openKnowledgeGraph}
          onClose={() => setOpenKnowledgeGraph(false)}
        ></KnowledgeGraph>
      ) : null}
    </>
  );
}

export default FinalReport;
