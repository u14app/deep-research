"use client";
import dynamic from "next/dynamic";
import { useLayoutEffect, useCallback, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { streamText } from "ai";
import { toast } from "sonner";
import { LoaderCircle } from "lucide-react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import useModelProvider from "@/hooks/useAiProvider";
import { useTaskStore } from "@/store/task";
import { useSettingStore } from "@/store/setting";
import {
  parseDeepResearchPromptOverrides,
  resolveDeepResearchPromptTemplates,
} from "@/constants/prompts";
import { parseError } from "@/utils/error";
import { cn } from "@/utils/style";

const MagicDownView = dynamic(() => import("@/components/MagicDown/View"));
const MagicDownEditor = dynamic(() => import("@/components/MagicDown/Editor"));

type Props = {
  open: boolean;
  onClose: () => void;
};

function handleError(error: unknown) {
  const errorMessage = parseError(error);
  toast.error(errorMessage);
}

function KnowledgeGraph({ open, onClose }: Props) {
  const { t } = useTranslation();
  const taskStore = useTaskStore.getState();
  const { deepResearchPromptOverrides } = useSettingStore();
  const { createModelProvider, getModel } = useModelProvider();
  const [loading, setLoading] = useState<boolean>(false);
  const [mode, setMode] = useState<"view" | "editor">("view");
  const promptOverrides = useMemo(() => {
    try {
      return parseDeepResearchPromptOverrides(deepResearchPromptOverrides);
    } catch {
      return {};
    }
  }, [deepResearchPromptOverrides]);
  const knowledgeGraphPrompt = useMemo(() => {
    return resolveDeepResearchPromptTemplates(promptOverrides)
      .knowledgeGraphPrompt;
  }, [promptOverrides]);

  const generateKnowledgeGraph = useCallback(async () => {
    const { finalReport, updateKnowledgeGraph } = useTaskStore.getState();
    const { thinkingModel } = getModel();
    setLoading(true);
    const result = streamText({
      model: await createModelProvider(thinkingModel),
      system:
        knowledgeGraphPrompt +
        `\n\n**The node text uses the same language as the article**`,
      prompt: finalReport,
      onError: handleError,
    });
    let text = "";
    for await (const textPart of result.textStream) {
      text += textPart;
    }
    updateKnowledgeGraph(text);
    text = "";
    setLoading(false);
  }, [createModelProvider, getModel, knowledgeGraphPrompt]);

  function chnageMode() {
    if (mode === "view") {
      setMode("editor");
    } else {
      setMode("view");
    }
  }

  function handleClose(open: boolean) {
    if (!open) onClose();
  }

  useLayoutEffect(() => {
    if (taskStore.knowledgeGraph === "") {
      generateKnowledgeGraph();
    }
  }, [taskStore.knowledgeGraph, generateKnowledgeGraph]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-lg:max-w-screen-md max-w-screen-lg gap-2">
        <DialogTitle className="hidden"></DialogTitle>
        {loading ? (
          <div className="flex justify-center items-center w-full min-h-80">
            <LoaderCircle className="flex flex-col justify-center items-center w-14 h-14 animate-spin" />
          </div>
        ) : (
          <>
            <ScrollArea
              className={cn("magicdown-view mermaid-view max-w-full", {
                hidden: mode === "editor",
              })}
            >
              <MagicDownView>{taskStore.knowledgeGraph}</MagicDownView>
            </ScrollArea>
            <div className={cn("max-w-full my-4", { hidden: mode === "view" })}>
              <MagicDownEditor
                className="magicdown-editor min-h-80 h-[50vh] overflow-y-auto"
                defaultValue={taskStore.knowledgeGraph}
                onChange={(value) => taskStore.updateKnowledgeGraph(value)}
                hideView
              ></MagicDownEditor>
            </div>
          </>
        )}
        {!loading ? (
          <DialogFooter>
            <div className="flex gap-2">
              <Button
                className="flex-1"
                variant="secondary"
                onClick={() => generateKnowledgeGraph()}
              >
                {t("knowledgeGraph.regenerate")}
              </Button>
              <Button className="flex-1" onClick={() => chnageMode()}>
                {mode === "view"
                  ? t("knowledgeGraph.edit")
                  : t("knowledgeGraph.view")}
              </Button>
            </div>
          </DialogFooter>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

export default KnowledgeGraph;
