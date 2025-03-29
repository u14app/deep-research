"use client";
import dynamic from "next/dynamic";
import { useState, useEffect, useLayoutEffect } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  LoaderCircle,
  CircleCheck,
  TextSearch,
  Download,
  Trash,
} from "lucide-react";
import { Crepe } from "@milkdown/crepe";
import { replaceAll, getHTML } from "@milkdown/kit/utils";
import { Button } from "@/components/Button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import useAccurateTimer from "@/hooks/useAccurateTimer";
import useDeepResearch from "@/hooks/useDeepResearch";
import { useTaskStore } from "@/store/task";
import { downloadFile } from "@/utils/file";
import { useHistoryStore } from "@/store/history";

const MilkdownEditor = dynamic(() => import("@/components/MilkdownEditor"));

const formSchema = z.object({
  suggestion: z.string(),
});

function TaskState({ state }: { state: SearchTask["state"] }) {
  if (state === "completed") {
    return <CircleCheck className="h-5 w-5" />;
  } else if (state === "processing") {
    return <LoaderCircle className="animate-spin h-5 w-5" />;
  } else {
    return <TextSearch className="h-5 w-5" />;
  }
}

function ResearchGoal({
  milkdownEditor,
  goal,
}: {
  milkdownEditor?: Crepe;
  goal: string;
}) {
  const [html, setHtml] = useState<string>("");

  useEffect(() => {
    if (milkdownEditor && goal) {
      replaceAll(goal)(milkdownEditor.editor.ctx);
      const html = getHTML()(milkdownEditor.editor.ctx);
      setHtml(html);
    }
  }, [milkdownEditor, goal]);

  return html !== "" ? (
    <blockquote className="hidden-empty-p">
      <div
        dangerouslySetInnerHTML={{
          __html: html,
        }}
      ></div>
    </blockquote>
  ) : null;
}

function SearchResult() {
  const { t } = useTranslation();
  const taskStore = useTaskStore();
  const { status, runSearchTask, reviewSearchResult, writeFinalReport } =
    useDeepResearch();
  const {
    formattedTime,
    start: accurateTimerStart,
    stop: accurateTimerStop,
  } = useAccurateTimer();
  const [milkdownEditor, setMilkdownEditor] = useState<Crepe>();
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const [isWriting, setIsWriting] = useState<boolean>(false);
  const historyStore = useHistoryStore();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      suggestion: taskStore.suggestion,
    },
  });

  useEffect(() => {
    form.setValue("suggestion", taskStore.suggestion);
  }, [taskStore.suggestion, form]);

  async function handleWriteFinalReport() {
    try {
      accurateTimerStart();
      setIsWriting(true);
      await writeFinalReport();
    } finally {
      setIsWriting(false);
      accurateTimerStop();
    }
  }

  function getSearchResultContent(item: SearchTask) {
    return [
      `> ${item.researchGoal}\n---`,
      item.learning,
      item.sources?.length > 0
        ? `#### ${t("research.common.sources")}\n\n${item.sources
            .map((source) => `- [${source.title || source.url}](${source.url})`)
            .join("\n")}`
        : "",
    ].join("\n\n");
  }

  async function handleSubmit(values: z.infer<typeof formSchema>) {
    const { setSuggestion, tasks } = useTaskStore.getState();
    const unfinishedTasks = tasks.filter((task) => task.state !== "completed");
    try {
      accurateTimerStart();
      setIsThinking(true);
      if (unfinishedTasks.length > 0) {
        await runSearchTask(unfinishedTasks);
      } else {
        setSuggestion(values.suggestion);
        await reviewSearchResult();
        // Clear previous research suggestions
        setSuggestion("");
      }
    } finally {
      setIsThinking(false);
      accurateTimerStop();
    }
  }

  function handleRemove(query: string) {
    const { removeTask } = useTaskStore.getState();
    removeTask(query);
  }

  useLayoutEffect(() => {
    const crepe = new Crepe({
      defaultValue: "",
      root: document.createDocumentFragment(),
      features: {
        [Crepe.Feature.ImageBlock]: false,
        [Crepe.Feature.BlockEdit]: false,
        [Crepe.Feature.Toolbar]: false,
        [Crepe.Feature.LinkTooltip]: false,
      },
    });

    crepe
      .setReadonly(true)
      .create()
      .then(() => {
        setMilkdownEditor(crepe);
      });

    return () => {
      crepe.destroy();
    };
  }, []);

  // update taskStore and historyStore
  const handleLearningChange = (query: string, value: string) => {
    taskStore.updateTask(query, { learning: value });
    historyStore.update(taskStore.id, taskStore.backup());
  };

  return (
    <section className="p-4 border rounded-md mt-4 print:hidden">
      <h3 className="font-semibold text-lg border-b mb-2 leading-10">
        {t("research.searchResult.title")}
      </h3>
      {taskStore.tasks.length === 0 ? (
        <div>{t("research.searchResult.emptyTip")}</div>
      ) : (
        <div>
          <Accordion className="mb-4" type="multiple">
            {taskStore.tasks.map((item, idx) => {
              return (
                <AccordionItem key={idx} value={item.query}>
                  <AccordionTrigger>
                    <div className="flex">
                      <TaskState state={item.state} />
                      <span className="ml-1">{item.query}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="prose prose-slate dark:prose-invert max-w-full min-h-20">
                    <ResearchGoal
                      milkdownEditor={milkdownEditor}
                      goal={item.researchGoal}
                    />
                    <MilkdownEditor
                      value={item.learning}
                      onChange={(value) => handleLearningChange(item.query, value)}
                      tools={
                        <>
                          <Button
                            className="float-menu-button"
                            type="button"
                            size="icon"
                            variant="ghost"
                            title={t("research.common.delete")}
                            side="left"
                            sideoffset={8}
                            onClick={() => handleRemove(item.query)}
                          >
                            <Trash />
                          </Button>
                          <div className="px-1">
                            <Separator className="dark:bg-slate-700" />
                          </div>
                          <Button
                            className="float-menu-button"
                            type="button"
                            size="icon"
                            variant="ghost"
                            title={t("editor.export")}
                            side="left"
                            sideoffset={8}
                            onClick={() =>
                              downloadFile(
                                getSearchResultContent(item),
                                `${item.query}.md`,
                                "text/markdown;charset=utf-8"
                              )
                            }
                          >
                            <Download />
                          </Button>
                        </>
                      }
                    ></MilkdownEditor>
                    {item.sources?.length > 0 ? (
                      <>
                        <hr className="my-6" />
                        <h4>{t("research.common.sources")}</h4>
                        <ol>
                          {item.sources.map((source, idx) => {
                            return (
                              <li key={idx}>
                                <a href={source.url} target="_blank">
                                  {source.title || source.url}
                                </a>
                              </li>
                            );
                          })}
                        </ol>
                      </>
                    ) : null}
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)}>
              <FormField
                control={form.control}
                name="suggestion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="mb-2 font-semibold">
                      {t("research.searchResult.suggestionLabel")}
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        rows={3}
                        placeholder={t(
                          "research.searchResult.suggestionPlaceholder"
                        )}
                        disabled={isThinking}
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4 max-sm:gap-2 w-full mt-4">
                <Button type="submit" variant="secondary" disabled={isThinking}>
                  {isThinking ? (
                    <>
                      <LoaderCircle className="animate-spin" />
                      <span>{status}</span>
                      <small className="font-mono">{formattedTime}</small>
                    </>
                  ) : (
                    t("research.common.continueResearch")
                  )}
                </Button>
                <Button
                  disabled={isWriting}
                  onClick={() => handleWriteFinalReport()}
                >
                  {isWriting ? (
                    <>
                      <LoaderCircle className="animate-spin" />
                      <span>{status}</span>
                      <small className="font-mono">{formattedTime}</small>
                    </>
                  ) : (
                    t("research.common.writeReport")
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      )}
    </section>
  );
}

export default SearchResult;
