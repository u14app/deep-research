"use client";
import dayjs from "dayjs";
import Fuse from "fuse.js";
import { FilePenLine, FilePlus2, TrashIcon } from "lucide-react";
import dynamic from "next/dynamic";
import { useLayoutEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
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
import { Tabs, TabsContent } from "@/components/ui/tabs";
import useKnowledge from "@/hooks/useKnowledge";
import { useKnowledgeStore } from "@/store/knowledge";
import { useTaskStore } from "@/store/task";
import { formatSize, getTextByteSize } from "@/utils/file";
import { cn } from "@/utils/style";
import ResourceIcon from "./ResourceIcon";

const Content = dynamic(() => import("./Content"));

interface KnowledgeProps {
  open: boolean;
  onClose: () => void;
}

const PAGE_SIZE = 20;

function formatDate(timestamp: number) {
  return dayjs(timestamp).format("YYYY-MM-DD HH:mm");
}

function Knowledge({ open, onClose }: KnowledgeProps) {
  const { t } = useTranslation();
  const { generateId } = useKnowledge();
  const { knowledges, save, remove } = useKnowledgeStore();
  const [tab, setTab] = useState<"list" | "edit">("list");
  const [currentId, setCurrentId] = useState<string>("");
  const [knowledgeList, setKnowledgeList] = useState<Knowledge[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const showLoadMore = useMemo(() => {
    return knowledges.length > currentPage * PAGE_SIZE;
  }, [knowledges, currentPage]);

  function createKnowledge() {
    const currentTime = Date.now();
    const id = generateId("knowledge");
    save({
      id,
      title: "",
      content: "",
      type: "knowledge",
      createdAt: currentTime,
      updatedAt: currentTime,
    });
    setCurrentId(id);
    setTab("edit");
  }

  function handleSearch(value: string) {
    const options = { keys: ["title", "content", "fileMeta.name", "url"] };
    const knowledgeIndex = Fuse.createIndex(options.keys, knowledges);
    const fuse = new Fuse(knowledges, options, knowledgeIndex);
    const result = fuse.search(value);
    setKnowledgeList(result.map((value) => value.item));
  }

  function addToResources(id: string) {
    const { resources, addResource } = useTaskStore.getState();
    const knowledge = knowledges.find((item) => item.id === id);
    if (knowledge) {
      const isExist = resources.find((item) => item.id === id);
      if (!isExist) {
        addResource({
          id,
          name: knowledge.title,
          type: "knowledge",
          size: getTextByteSize(knowledge.content),
          status: "completed",
        });
      }
      toast.message(t("knowledge.addResourceMessage", { title: knowledge.title }));
    } else {
      toast.error(t("knowledge.resourceNotFound"));
    }
  }

  function editKnowledge(id: string) {
    setCurrentId(id);
    setTab("edit");
  }

  function removeKnowledge(id: string) {
    remove(id);
  }

  function handleBack() {
    setCurrentId("");
    setTab("list");
  }

  function handleClose(open: boolean) {
    if (!open) {
      onClose();
      setTimeout(() => {
        handleBack();
      }, 300);
    }
  }

  async function loadMore() {
    const nextPage = currentPage + 1;
    const total = nextPage * PAGE_SIZE;
    setKnowledgeList(knowledges.slice(0, total));
    setCurrentPage(nextPage);
  }

  useLayoutEffect(() => {
    setKnowledgeList(knowledges.slice(0, PAGE_SIZE));
  }, [knowledges]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-lg:max-w-screen-sm max-w-screen-md gap-0">
        <DialogHeader>
          <DialogTitle>{t("knowledge.title")}</DialogTitle>
          <DialogDescription>{t("knowledge.description")}</DialogDescription>
        </DialogHeader>
        <div
          className={cn("flex justify-between mt-4", {
            hidden: tab !== "list",
          })}
        >
          <Button
            variant="secondary"
            title={t("knowledge.createTip")}
            onClick={() => createKnowledge()}
          >
            {t("knowledge.create")}
          </Button>
          <SearchArea
            className="max-sm:w-52"
            onChange={handleSearch}
            onClear={() => setKnowledgeList(knowledges.slice(0, PAGE_SIZE))}
          />
        </div>
        <ScrollArea className="max-h-[65vh]">
          <Tabs value={tab} className="w-full">
            <TabsContent value="list">
              {knowledgeList.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  {t("knowledge.emptyTip")}
                </div>
              ) : (
                <>
                  <Table className="max-sm:overflow-y-auto">
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("knowledge.name")}</TableHead>
                        <TableHead className="text-center max-sm:hidden">
                          {t("knowledge.size")}
                        </TableHead>
                        <TableHead className="text-center max-sm:hidden">
                          {t("knowledge.date")}
                        </TableHead>
                        <TableHead className="text-center w-28">{t("knowledge.action")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {knowledgeList.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <p
                              className="inline-flex items-center"
                              title={item.title}
                              onClick={() => editKnowledge(item.id)}
                            >
                              <ResourceIcon className="w-4 h-4 mr-1" type={item.type} />{" "}
                              <span className="truncate w-80 max-lg:w-52 max-sm:w-40 cursor-pointer hover:text-blue-500">
                                {item.title}
                              </span>
                            </p>
                          </TableCell>
                          <TableCell className="text-center whitespace-nowrap max-sm:hidden">
                            {formatSize(getTextByteSize(item.content))}
                          </TableCell>
                          <TableCell className="text-center whitespace-nowrap max-sm:hidden">
                            {formatDate(item.updatedAt || item.createdAt)}
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex justify-center">
                              <Button
                                variant="ghost"
                                size="icon"
                                title={t("knowledge.add")}
                                onClick={() => addToResources(item.id)}
                              >
                                <FilePlus2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                title={t("knowledge.edit")}
                                onClick={() => editKnowledge(item.id)}
                              >
                                <FilePenLine className="h-4 w-4" />
                              </Button>
                              <Button
                                className="text-red-500 hover:text-red-600"
                                variant="ghost"
                                size="icon"
                                title={t("knowledge.delete")}
                                onClick={() => removeKnowledge(item.id)}
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
                    {t("knowledge.loadMore")}
                  </div>
                </>
              )}
            </TabsContent>
            <TabsContent value="edit">
              {currentId ? (
                <Content
                  id={currentId}
                  editClassName="magicdown-editor h-72 overflow-y-auto rounded-md border p-1 text-sm"
                  onBack={() => handleBack()}
                ></Content>
              ) : null}
            </TabsContent>
          </Tabs>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

export default Knowledge;
