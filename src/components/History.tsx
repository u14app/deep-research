"use client";
import { useTranslation } from "react-i18next";
import { TrashIcon, FileOutput, RefreshCw } from "lucide-react";
import dayjs from "dayjs";
import { useEffect } from "react";
import { useSettingStore } from "@/store/setting";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useTaskStore } from "@/store/task";
import { useHistoryStore } from "@/store/history";

interface HistoryProps {
  open: boolean;
  onClose: () => void;
}

function formatDate(timestamp: number) {
  return dayjs(timestamp).format("YYYY-MM-DD HH:mm");
}

function History({ open, onClose }: HistoryProps) {
  const { t } = useTranslation();
  const { restore, reset } = useTaskStore();
  const { history, load, remove, syncWithServer, isSyncing } = useHistoryStore();
  const { accessPassword, syncId } = useSettingStore();
  
  // 当组件打开且配置了访问密码和同步ID时，尝试同步
  useEffect(() => {
    if (open && accessPassword && syncId) {
      syncWithServer();
    }
  }, [open, accessPassword, syncId, syncWithServer]);

  async function loadHistory(id: string) {
    const data = load(id);
    if (data) {
      reset();
      restore(data);
    }
    onClose();
  }

  async function removeHistory(id: string) {
    remove(id);
  }

  function handleClose(open: boolean) {
    if (!open) onClose();
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-screen-sm">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle>{t("research.history.title")}</DialogTitle>
          {accessPassword && syncId && (
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-1"
              onClick={() => syncWithServer()}
              disabled={isSyncing}
              title={t("research.history.sync")}
            >
              <RefreshCw className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
              {isSyncing ? t("research.history.syncing") : t("research.history.sync")}
            </Button>
          )}
        </DialogHeader>
        <div className="max-h-96 overflow-y-auto">
          {history.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              {t("research.history.noHistory")}
            </div>
          ) : (
            <Table className="max-sm:overflow-y-auto">
              <TableHeader>
                <TableRow>
                  <TableHead>{t("research.history.name")}</TableHead>
                  <TableHead className="text-center">
                    {t("research.history.date")}
                  </TableHead>
                  <TableHead className="text-center w-32">
                    {t("research.history.actions")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Button
                        variant="link"
                        className="p-0 h-auto text-left font-normal"
                        title={item.title}
                        onClick={() => loadHistory(item.id)}
                      >
                        <p className="truncate w-72">
                          {item.title || item.question}
                        </p>
                      </Button>
                    </TableCell>
                    <TableCell className="text-center whitespace-nowrap">
                      {formatDate(item.createdAt)}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          title={t("research.history.load")}
                          onClick={() => loadHistory(item.id)}
                        >
                          <FileOutput className="h-4 w-4" />
                        </Button>
                        <Button
                          className="text-red-500 hover:text-red-600"
                          variant="ghost"
                          size="icon"
                          title={t("research.history.delete")}
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
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default History;
