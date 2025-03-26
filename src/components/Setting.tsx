"use client";
import { useTranslation } from "react-i18next";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useSettingStore } from "@/store/setting";
import { cn } from "@/utils/style";

type SettingProps = {
  open: boolean;
  onClose: () => void;
};

const BUILD_MODE = process.env.NEXT_PUBLIC_BUILD_MODE;

const formSchema = z.object({
  apiKey: z.string().optional(),
  apiProxy: z.string().optional(),
  accessPassword: z.string().optional(),
  syncId: z.string().optional(),
  language: z.string().optional(),
});

function Setting({ open, onClose }: SettingProps) {
  const { t } = useTranslation();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: async () => {
      return new Promise((resolve) => {
        const { apiKey, apiProxy, accessPassword, syncId, language } =
          useSettingStore.getState();
        resolve({ apiKey, apiProxy, accessPassword, syncId, language });
      });
    },
  });

  function handleClose(open: boolean) {
    if (!open) onClose();
  }

  function handleSubmit(values: z.infer<typeof formSchema>) {
    const { update } = useSettingStore.getState();
    update(values);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("setting.title")}</DialogTitle>
          <DialogDescription>{t("setting.description")}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form className="space-y-4">
            <Tabs defaultValue="local">
              <TabsList
                className={cn("w-full mb-1", {
                  hidden: BUILD_MODE === "export",
                })}
              >
                <TabsTrigger className="w-1/2" value="local">
                  {t("setting.local")}
                </TabsTrigger>
                <TabsTrigger className="w-1/2" value="server">
                  {t("setting.server")}
                </TabsTrigger>
              </TabsList>
              <TabsContent className="space-y-4" value="local">
                <FormField
                  control={form.control}
                  name="apiKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t("setting.apiKeyLabel")}
                        <span className="ml-1 text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder={t("setting.apiKeyPlaceholder")}
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="apiProxy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("setting.apiProxyLabel")}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://generativelanguage.googleapis.com"
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </TabsContent>
              <TabsContent className="space-y-4" value="server">
                <FormField
                  control={form.control}
                  name="accessPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t("setting.accessPassword")}
                        <span className="ml-1 text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder={t("setting.accessPasswordPlaceholder")}
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="syncId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t("setting.syncId")}
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t("setting.syncIdPlaceholder")}
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </TabsContent>
            </Tabs>

            <FormField
              control={form.control}
              name="language"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("setting.language")}</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en-US">English</SelectItem>
                        <SelectItem value="zh-CN">简体中文</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                </FormItem>
              )}
            />
          </form>
        </Form>
        <DialogFooter className="mt-2">
          <Button
            className="flex-1 max-sm:mt-2"
            variant="outline"
            onClick={onClose}
          >
            {t("setting.cancel")}
          </Button>
          <Button
            className="flex-1"
            type="submit"
            onClick={form.handleSubmit(handleSubmit)}
          >
            {t("setting.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default Setting;
