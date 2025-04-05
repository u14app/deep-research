"use client";
import { useLayoutEffect, useState, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { RefreshCw, Info } from "lucide-react";
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
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectLabel,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import useModel from "@/hooks/useModel";
import { useSettingStore } from "@/store/setting";
import {
  filterThinkingModelList,
  filterNetworkingModelList,
} from "@/utils/models";
import { cn } from "@/utils/style";
import { omit, capitalize } from "radash";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type SettingProps = {
  open: boolean;
  onClose: () => void;
};

const BUILD_MODE = process.env.NEXT_PUBLIC_BUILD_MODE;

const formSchema = z.object({
  apiKey: z.string().optional(),
  apiProxy: z.string().optional(),
  accessPassword: z.string().optional(),
  thinkingModel: z.string(),
  networkingModel: z.string(),
  language: z.string().optional(),
  searchLanguage: z.string().optional(),
  searchConcurrency: z.number().min(1).max(10),
  theme: z.string().optional(),
});

function convertModelName(name: string) {
  return name
    .split("-")
    .map((word) => capitalize(word))
    .join(" ");
}

let preLoading = false;

function Setting({ open, onClose }: SettingProps) {
  const { t } = useTranslation();
  const { modelList, refresh } = useModel();
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const thinkingModelList = useMemo(() => {
    return filterThinkingModelList(modelList);
  }, [modelList]);
  const networkingModelList = useMemo(() => {
    return filterNetworkingModelList(modelList);
  }, [modelList]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: async () => {
      return new Promise((resolve) => {
        const state = useSettingStore.getState();
        resolve({ ...omit(state, ["update"]) });
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

  const fetchModelList = useCallback(async () => {
    try {
      setIsRefreshing(true);
      await refresh();
    } finally {
      setIsRefreshing(false);
    }
  }, [refresh]);

  async function handleValueChange() {
    const { update } = useSettingStore.getState();
    update({
      apiKey: form.getValues("apiKey"),
      apiProxy: form.getValues("apiProxy"),
      accessPassword: form.getValues("accessPassword"),
    });
  }

  useLayoutEffect(() => {
    if (open && !preLoading) {
      fetchModelList();
      preLoading = true;
    }
  }, [open, fetchModelList]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md print:hidden">
        <DialogHeader>
          <DialogTitle>{t("setting.title")}</DialogTitle>
          <DialogDescription>{t("setting.description")}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form className="space-y-4">
            <Tabs defaultValue={form.getValues("apiKey") ? "local" : "server"}>
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
                    <FormItem className="from-item">
                      <FormLabel className="col-span-1">
                        {t("setting.apiKeyLabel")}
                        <span className="ml-1 text-red-500">*</span>
                      </FormLabel>
                      <FormControl className="col-span-3">
                        <Input
                          type="password"
                          placeholder={t("setting.apiKeyPlaceholder")}
                          {...field}
                          onBlur={() => handleValueChange()}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="apiProxy"
                  render={({ field }) => (
                    <FormItem className="from-item">
                      <FormLabel className="col-span-1">
                        {t("setting.apiUrlLabel")}
                      </FormLabel>
                      <FormControl className="col-span-3">
                        <Input
                          placeholder="https://generativelanguage.googleapis.com"
                          {...field}
                          onBlur={() => handleValueChange()}
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
                    <FormItem className="from-item">
                      <FormLabel className="col-span-1">
                        {t("setting.accessPassword")}
                        <span className="ml-1 text-red-500">*</span>
                      </FormLabel>
                      <FormControl className="col-span-3">
                        <Input
                          type="password"
                          placeholder={t("setting.accessPasswordPlaceholder")}
                          {...field}
                          onBlur={() => handleValueChange()}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </TabsContent>
            </Tabs>

            <FormField
              control={form.control}
              name="thinkingModel"
              render={({ field }) => (
                <FormItem className="from-item">
                  <FormLabel className="col-span-1">
                    {t("setting.thinkingModel")}
                  </FormLabel>
                  <FormControl>
                    <div className="col-span-3 flex gap-1">
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger
                          className={cn({ hidden: modelList.length === 0 })}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="max-sm:max-h-72">
                          {thinkingModelList[0].length > 0 ? (
                            <SelectGroup>
                              <SelectLabel>
                                {t("setting.thinkingModels")}
                              </SelectLabel>
                              {thinkingModelList[0].map((name) => {
                                return (
                                  <SelectItem key={name} value={name}>
                                    {convertModelName(name)}
                                  </SelectItem>
                                );
                              })}
                            </SelectGroup>
                          ) : null}
                          <SelectGroup>
                            <SelectLabel>
                              {t("setting.nonThinkingModels")}
                            </SelectLabel>
                            {thinkingModelList[1].map((name) => {
                              return (
                                <SelectItem key={name} value={name}>
                                  {convertModelName(name)}
                                </SelectItem>
                              );
                            })}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                      <Button
                        className={cn("w-full", {
                          hidden: modelList.length > 0,
                        })}
                        type="button"
                        variant="outline"
                        onClick={() => fetchModelList()}
                      >
                        <RefreshCw
                          className={isRefreshing ? "animate-spin" : ""}
                        />{" "}
                        {t("setting.refresh")}
                      </Button>
                    </div>
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="networkingModel"
              render={({ field }) => (
                <FormItem className="from-item">
                  <FormLabel className="col-span-1">
                    {t("setting.networkingModel")}
                  </FormLabel>
                  <FormControl>
                    <div className="col-span-3 flex gap-1">
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger
                          className={cn({ hidden: modelList.length === 0 })}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="max-sm:max-h-72">
                          {networkingModelList[0].length > 0 ? (
                            <SelectGroup>
                              <SelectLabel>
                                {t("setting.networkingModels")}
                              </SelectLabel>
                              {networkingModelList[0].map((name) => {
                                return (
                                  <SelectItem key={name} value={name}>
                                    {convertModelName(name)}
                                  </SelectItem>
                                );
                              })}
                            </SelectGroup>
                          ) : null}
                          <SelectGroup>
                            <SelectLabel>
                              {t("setting.nonNetworkingModels")}
                            </SelectLabel>
                            {networkingModelList[1].map((name) => {
                              return (
                                <SelectItem key={name} value={name}>
                                  {convertModelName(name)}
                                </SelectItem>
                              );
                            })}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                      <Button
                        className={cn("w-full", {
                          hidden: modelList.length > 0,
                        })}
                        type="button"
                        variant="outline"
                        onClick={() => fetchModelList()}
                      >
                        <RefreshCw
                          className={isRefreshing ? "animate-spin" : ""}
                        />{" "}
                        {t("setting.refresh")}
                      </Button>
                    </div>
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="language"
              render={({ field }) => (
                <FormItem className="from-item">
                  <FormLabel className="col-span-1">
                    {t("setting.language")}
                  </FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="col-span-3">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="max-sm:max-h-48">
                        <SelectItem value="en-US">English</SelectItem>
                        <SelectItem value="zh-CN">简体中文</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="searchLanguage"
              render={({ field }) => (
                <FormItem className="from-item">
                  <FormLabel className="col-span-1">
                    {t("setting.searchLanguage")}
                  </FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="col-span-3">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="max-sm:max-h-48">
                        <SelectItem value="auto">
                          {t("setting.auto")}
                        </SelectItem>
                        <SelectItem value="zh-CN">
                          {t("setting.chinese")}
                        </SelectItem>
                        <SelectItem value="en-US">
                          {t("setting.english")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="searchConcurrency"
              render={({ field }) => (
                <FormItem className="from-item">
                  <div className="flex items-center gap-1">
                    <FormLabel className="col-span-1">
                      {t("setting.searchConcurrency")}
                    </FormLabel>
                  </div>
                  <FormControl>
                    <Input 
                      type="number"
                      min="1" 
                      max="10"
                      value={field.value}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        if (!isNaN(value) && value >= 1 && value <= 10) {
                          field.onChange(value);
                        }
                      }}
                    />
                  </FormControl>
                  <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="">
                            <Info className="h-4 w-4 " />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          <p>{t("setting.searchConcurrencyTip")}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="theme"
              render={({ field }) => (
                <FormItem className="from-item">
                  <FormLabel className="col-span-1">{t("theme")}</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="col-span-3">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="max-sm:max-h-48">
                        <SelectItem value="system">
                          {t("setting.system")}
                        </SelectItem>
                        <SelectItem value="light">
                          {t("setting.light")}
                        </SelectItem>
                        <SelectItem value="dark">
                          {t("setting.dark")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                </FormItem>
              )}
            />
          </form>
        </Form>
        <DialogFooter className="mt-2 flex-row sm:justify-between sm:space-x-0 gap-3">
          <Button className="flex-1" variant="outline" onClick={onClose}>
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
