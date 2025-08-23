"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import useKnowledge from "@/hooks/useKnowledge";
import { useSettingStore } from "@/store/setting";

type Props = {
  open: boolean;
  onClose: () => void;
};

const BUILD_MODE = process.env["NEXT_PUBLIC_BUILD_MODE"];
const URLRegExp = /^https?:\/\/.+/;

const formSchema = z.object({
  url: z.string(),
  crawler: z.string(),
});

function Crawler({ open, onClose }: Props) {
  const { t } = useTranslation();
  const { getKnowledgeFromUrl } = useKnowledge();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: async () => {
      const { crawler } = useSettingStore.getState();
      return { url: "", crawler };
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const settingStore = useSettingStore.getState();
    const { url, crawler } = values;
    if (URLRegExp.test(url)) {
      onClose();
      settingStore.update({ crawler });
      await getKnowledgeFromUrl(url, crawler);
      form.reset();
    } else {
      toast.error(t("knowledge.urlError"));
    }
  }

  function handleClose(open: boolean) {
    if (!open) onClose();
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("knowledge.webCrawler")}</DialogTitle>
          <DialogDescription>{t("knowledge.webCrawlerTip")}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      className="text-sm"
                      placeholder={t("knowledge.urlPlaceholder")}
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <DialogFooter className="flex justify-between sm:justify-between flex-row">
              <FormField
                control={form.control}
                name="crawler"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Select {...field} onValueChange={field.onChange}>
                        <SelectTrigger className="w-36">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem
                            className={BUILD_MODE === "export" ? "hidden" : ""}
                            value="local"
                          >
                            {t("knowledge.localCrawler")}
                          </SelectItem>
                          <SelectItem value="jina">Jina Reader</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                  </FormItem>
                )}
              />
              <div className="inline-flex gap-2">
                <Button type="reset" variant="secondary">
                  {t("knowledge.clear")}
                </Button>
                <Button type="submit">{t("knowledge.fetch")}</Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default Crawler;
