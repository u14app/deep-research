"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { toast } from "sonner";
import { Settings, Github, History, BookText, Keyboard } from "lucide-react";
import { Button } from "@/components/Internal/Button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useGlobalStore } from "@/store/global";
import { useTaskStore, type TaskStore } from "@/store/task";
import { useHistoryStore } from "@/store/history";
import { downloadFile } from "@/utils/file";
import { fileParser } from "@/utils/parser";

const VERSION = process.env.NEXT_PUBLIC_VERSION;

const resourceSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  size: z.number(),
  status: z.enum(["unprocessed", "processing", "completed", "failed"]),
});

const imageSourceSchema = z.object({
  url: z.string(),
  description: z.string().optional(),
});

const sourceSchema = z.object({
  title: z.string().optional(),
  content: z.string().optional(),
  url: z.string(),
  images: z.array(imageSourceSchema).optional(),
});

const searchTaskSchema = z.object({
  state: z.enum(["unprocessed", "processing", "completed", "failed"]),
  query: z.string(),
  researchGoal: z.string(),
  learning: z.string(),
  sources: z.array(sourceSchema).optional(),
  images: z.array(imageSourceSchema).optional(),
});

const taskSnapshotSchema = z.object({
  id: z.string().optional(),
  question: z.string().optional(),
  resources: z.array(resourceSchema).optional(),
  query: z.string().optional(),
  questions: z.string().optional(),
  feedback: z.string().optional(),
  reportPlan: z.string().optional(),
  suggestion: z.string().optional(),
  tasks: z.array(searchTaskSchema).optional(),
  requirement: z.string().optional(),
  title: z.string().optional(),
  finalReport: z.string().optional(),
  sources: z.array(sourceSchema).optional(),
  images: z.array(imageSourceSchema).optional(),
  knowledgeGraph: z.string().optional(),
});

function normalizeTaskSnapshot(
  snapshot: z.infer<typeof taskSnapshotSchema>,
): TaskStore {
  return {
    id: snapshot.id ?? "",
    question: snapshot.question ?? "",
    resources: snapshot.resources ?? [],
    query: snapshot.query ?? "",
    questions: snapshot.questions ?? "",
    feedback: snapshot.feedback ?? "",
    reportPlan: snapshot.reportPlan ?? "",
    suggestion: snapshot.suggestion ?? "",
    tasks: (snapshot.tasks ?? []).map((task) => ({
      ...task,
      sources: task.sources ?? [],
      images: task.images ?? [],
    })),
    requirement: snapshot.requirement ?? "",
    title: snapshot.title ?? "",
    finalReport: snapshot.finalReport ?? "",
    sources: snapshot.sources ?? [],
    images: snapshot.images ?? [],
    knowledgeGraph: snapshot.knowledgeGraph ?? "",
  };
}

function getSafeSnapshotFilename(value: string): string {
  return (
    value
      .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "-")
      .replace(/\s+/g, "-")
      .slice(0, 80) || "deep-research-session"
  );
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tagName = target.tagName;
  return (
    target.isContentEditable ||
    tagName === "INPUT" ||
    tagName === "TEXTAREA" ||
    tagName === "SELECT"
  );
}

function Header() {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [openShortcuts, setOpenShortcuts] = useState<boolean>(false);
  const { setOpenSetting, setOpenHistory, setOpenKnowledge } = useGlobalStore();

  const exportSnapshot = useCallback(() => {
    const { backup, title, question } = useTaskStore.getState();
    const snapshot = backup();
    const baseName = title || question || "deep-research-session";
    downloadFile(
      JSON.stringify(snapshot, null, 2),
      `${getSafeSnapshotFilename(baseName)}.session.json`,
      "application/json;charset=utf-8",
    );
    toast.message(t("header.session.exportSuccess"));
  }, [t]);

  const importSnapshot = useCallback(
    async (file: File) => {
      try {
        const raw = await fileParser(file);
        const parsed = JSON.parse(raw);
        const snapshotResult = taskSnapshotSchema.safeParse(parsed);
        if (!snapshotResult.success) {
          throw snapshotResult.error;
        }
        const nextTask = normalizeTaskSnapshot(snapshotResult.data);
        const { id, backup, reset, restore } = useTaskStore.getState();
        if (id) {
          useHistoryStore.getState().update(id, backup());
        }
        reset();
        restore(nextTask);
        toast.message(t("header.session.importSuccess"));
      } catch (error) {
        console.error(error);
        toast.error(t("header.session.importFailed"));
      }
    },
    [t],
  );

  const openSnapshotImport = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const shortcuts = useMemo(
    () => [
      {
        key: "Ctrl/Cmd + ,",
        description: t("header.shortcuts.openSetting"),
      },
      {
        key: "Ctrl/Cmd + Shift + H",
        description: t("header.shortcuts.openHistory"),
      },
      {
        key: "Ctrl/Cmd + Shift + K",
        description: t("header.shortcuts.openKnowledge"),
      },
      {
        key: "Ctrl/Cmd + Shift + E",
        description: t("header.shortcuts.exportSession"),
      },
      {
        key: "Ctrl/Cmd + Shift + O",
        description: t("header.shortcuts.importSession"),
      },
      {
        key: "Ctrl/Cmd + Shift + /",
        description: t("header.shortcuts.toggleHelp"),
      },
    ],
    [t],
  );

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent): void {
      const withModifier = event.metaKey || event.ctrlKey;
      if (!withModifier) return;
      if (isEditableTarget(event.target)) return;

      const key = event.key.toLowerCase();
      if (!event.shiftKey && key === ",") {
        event.preventDefault();
        setOpenSetting(true);
        return;
      }
      if (event.shiftKey && key === "h") {
        event.preventDefault();
        setOpenHistory(true);
        return;
      }
      if (event.shiftKey && key === "k") {
        event.preventDefault();
        setOpenKnowledge(true);
        return;
      }
      if (event.shiftKey && key === "e") {
        event.preventDefault();
        exportSnapshot();
        return;
      }
      if (event.shiftKey && key === "o") {
        event.preventDefault();
        openSnapshotImport();
        return;
      }
      if (event.shiftKey && event.key === "?") {
        event.preventDefault();
        setOpenShortcuts((previous) => !previous);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    exportSnapshot,
    openSnapshotImport,
    setOpenHistory,
    setOpenKnowledge,
    setOpenSetting,
  ]);

  async function handleFileUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    await importSnapshot(files[0]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  return (
    <>
      <header className="flex justify-between items-center my-6 max-sm:my-4 print:hidden">
        <a href="https://github.com/u14app/deep-research" target="_blank">
          <h1 className="text-left text-xl font-semibold">
            {t("title")}
            <small className="ml-2 font-normal text-base">v{VERSION}</small>
          </h1>
        </a>
        <div className="flex">
          <a href="https://github.com/u14app/deep-research" target="_blank">
            <Button
              className="h-8 w-8"
              title={t("openSource")}
              variant="ghost"
              size="icon"
            >
              <Github className="h-5 w-5" />
            </Button>
          </a>
          <Button
            className="h-8 w-8"
            variant="ghost"
            size="icon"
            title={t("header.shortcuts.title")}
            onClick={() => setOpenShortcuts(true)}
          >
            <Keyboard className="h-5 w-5" />
          </Button>
          <Button
            className="h-8 w-8"
            variant="ghost"
            size="icon"
            title={t("history.title")}
            onClick={() => setOpenHistory(true)}
          >
            <History className="h-5 w-5" />
          </Button>
          <Button
            className="h-8 w-8"
            variant="ghost"
            size="icon"
            title={t("knowledge.title")}
            onClick={() => setOpenKnowledge(true)}
          >
            <BookText />
          </Button>
          <Button
            className="h-8 w-8"
            title={t("setting.title")}
            variant="ghost"
            size="icon"
            onClick={() => setOpenSetting(true)}
          >
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </header>
      <Dialog open={openShortcuts} onOpenChange={setOpenShortcuts}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("header.shortcuts.title")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            {shortcuts.map((shortcut) => (
              <div
                key={shortcut.key}
                className="flex items-center justify-between gap-3 border rounded-md px-3 py-2"
              >
                <span className="font-mono text-xs text-muted-foreground">
                  {shortcut.key}
                </span>
                <span>{shortcut.description}</span>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        hidden
        onChange={(event) => handleFileUpload(event.target.files)}
      />
    </>
  );
}

export default Header;
