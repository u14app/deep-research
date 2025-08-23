"use client";
import dayjs from "dayjs";
import Fuse from "fuse.js";
import { Download, FileOutput, TrashIcon } from "lucide-react";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";
import SearchArea from "@/components/Internal/SearchArea";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { type ResearchHistory, useHistoryStore } from "@/store/history";
import { type TaskStore, useTaskStore } from "@/store/task";
import { downloadFile } from "@/utils/file";
import { fileParser } from "@/utils/parser";

interface HistoryProps {
  open: boolean;
  onClose: () => void;
}

const PAGE_SIZE = 20;

const resourceSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  size: z.number(),
  status: z.enum(["unprocessed", "processing", "completed", "failed"]),
});

const sourceSchema = z.object({
  title: z.string().optional(),
  content: z.string().optional(),
  url: z.string(),
});

const searchTaskSchema = z.object({
  state: z.enum(["unprocessed", "processing", "completed", "failed"]),
  query: z.string(),
  researchGoal: z.string(),
  learning: z.string(),
  sources: z.array(sourceSchema),
});

const taskStoreSchema = z.object({
  id: z.string(),
  question: z.string(),
  resources: z.array(resourceSchema).optional(),
  query: z.string(),
  questions: z.string(),
  feedback: z.string().optional(),
  reportPlan: z.string(),
  suggestion: z.string().optional(),
  tasks: z.array(searchTaskSchema),
  requirement: z.string().optional(),
  title: z.string(),
  finalReport: z.string(),
  sources: z.array(sourceSchema).optional(),
  version: z.string().optional(),
});

function formatDate(timestamp: number) {
  return dayjs(timestamp).format("YYYY-MM-DD HH:mm");
}

function History({ open, onClose }: HistoryProps) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { backup, restore, reset } = useTaskStore();
  const { history, save, load, update, remove } = useHistoryStore();
  const [historyList, setHistoryList] = useState<ResearchHistory[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const showLoadMore = useMemo(() => {
    return history.length > currentPage * PAGE_SIZE;
  }, [history, currentPage]);

  async function importResearch(file: File) {
    const text = await fileParser(file);
    const data = JSON.parse(text) as z.infer<typeof taskStoreSchema>;
    const verifyFileformat = taskStoreSchema.safeParse(data);
    if (verifyFileformat.success) {
      save(data as TaskStore);
      toast.message(t("history.importSuccess", { title: file.name }));
    } else {
      console.error(verifyFileformat.error);
      toast.error(t("history.importFailed", { title: file.name }));
    }
  }

  function loadHistory(id: string) {
    const { id: currentId } = useTaskStore.getState();
    const data = load(id);
    if (data) {
      update(currentId, backup());
      reset();
      restore(data);
    }
    onClose();
  }

  function downloadResearch(id: string) {
    const data = load(id);
    if (data) {
      downloadFile(
        JSON.stringify(data, null, 4),
        `${data.title}.json`,
        "application/json;charset=utf-8"
      );
    }
  }

  function removeHistory(id: string) {
    remove(id);
  }

  function handleSearch(value: string) {
    const options = { keys: ["question", "finalReport"] };
    const knowledgeIndex = Fuse.createIndex(options.keys, history);
    const fuse = new Fuse(history, options, knowledgeIndex);
    const result = fuse.search(value);
    setHistoryList(result.map((value) => value.item));
  }

  function handleClose(open: boolean) {
    if (!open) onClose();
  }

  async function loadMore() {
    const nextPage = currentPage + 1;
    const total = nextPage * PAGE_SIZE;
    setHistoryList(history.slice(0, total));
    setCurrentPage(nextPage);
  }

  async function handleFileUpload(files: FileList | null) {
    if (files) {
      for await (const file of files) {
        await importResearch(file);
      }
      // Clear the input file to avoid processing the previous file multiple times
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  useLayoutEffect(() => {
    setHistoryList(history.slice(0, PAGE_SIZE));
  }, [history]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-lg:max-w-screen-sm max-w-screen-md gap-2">
        <DialogHeader>
          <DialogTitle>{t("history.title")}</DialogTitle>
          <DialogDescription>{t("history.description")}</DialogDescription>
        </DialogHeader>
        <div className="flex justify-between mt-2">
          <Button
            variant="secondary"
            title={t("history.importTip")}
            onClick={() => fileInputRef.current?.click()}
          >
            {t("history.import")}
          </Button>
          <SearchArea
            onChange={handleSearch}
            onClear={() => setHistoryList(history.slice(0, PAGE_SIZE))}
          />
        </div>
        <ScrollArea className="max-h-[65vh]">
          {historyList.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">{t("history.noHistory")}</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("history.name")}</TableHead>
                    <TableHead className="text-center max-sm:hidden">{t("history.date")}</TableHead>
                    <TableHead className="text-center w-32">{t("history.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historyList.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <p
                          className="truncate w-96 max-lg:max-w-72 max-sm:max-w-52 cursor-pointer hover:text-blue-500"
                          title={item.title}
                          onClick={() => loadHistory(item.id)}
                        >
                          {item.title || item.question}
                        </p>
                      </TableCell>
                      <TableCell className="text-center whitespace-nowrap max-sm:hidden">
                        {formatDate(item.updatedAt || item.createdAt)}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            title={t("history.load")}
                            onClick={() => loadHistory(item.id)}
                          >
                            <FileOutput className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title={t("history.export")}
                            onClick={() => downloadResearch(item.id)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            className="text-red-500 hover:text-red-600"
                            variant="ghost"
                            size="icon"
                            title={t("history.delete")}
                            onClick={() => removeHistory(item.id)}
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div
                className={
                  showLoadMore
                    ? "text-center cursor-pointer text-sm hover:underline underline-offset-4"
                    : "hidden"
                }
                onClick={() => loadMore()}
              >
                {t("history.loadMore")}
              </div>
            </>
          )}
        </ScrollArea>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          multiple
          hidden
          onChange={(ev) => handleFileUpload(ev.target.files)}
        />
      </DialogContent>
    </Dialog>
  );
}

export default History;
