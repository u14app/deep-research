"use client";
import dayjs from "dayjs";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useKnowledgeStore } from "@/store/knowledge";
import Content from "./Content";

type Props = {
  id: string;
  open: boolean;
  onClose: () => void;
};

function formatDate(timestamp: number) {
  return dayjs(timestamp).format("YYYY-MM-DD HH:mm");
}

function KnowledgeInfor({ id }: { id: string }) {
  const { t } = useTranslation();
  const knowledge = useMemo(() => {
    const { knowledges } = useKnowledgeStore.getState();
    const detail = knowledges.find((item) => item.id === id);
    return detail;
  }, [id]);
  if (knowledge) {
    const createdAt = formatDate(knowledge.createdAt);
    if (knowledge.type === "file" && knowledge.fileMeta) {
      return t("knowledge.fileInfor", { createdAt });
    } else if (knowledge.type === "url" && knowledge.url) {
      return t("knowledge.urlInfor", { createdAt });
    } else {
      return t("knowledge.createInfor", { createdAt });
    }
  }
  return null;
}

function Resource({ id, open, onClose }: Props) {
  const { t } = useTranslation();
  function handleClose(open: boolean) {
    if (!open) onClose();
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-lg:max-w-screen-sm max-w-screen-md gap-2">
        <DialogHeader>
          <DialogTitle>{t("knowledge.resource")}</DialogTitle>
          <DialogDescription>
            <KnowledgeInfor id={id} />
          </DialogDescription>
        </DialogHeader>
        <Content
          id={id}
          editClassName="magicdown-editor h-72 overflow-y-auto"
          onSubmit={() => onClose()}
        ></Content>
      </DialogContent>
    </Dialog>
  );
}

export default Resource;
