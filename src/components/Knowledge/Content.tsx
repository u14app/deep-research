"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import MagicDownEditor from "@/components/MagicDown/Editor";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useKnowledgeStore } from "@/store/knowledge";
import { cn } from "@/utils/style";

type Props = {
  id: string;
  editClassName?: string;
  onSubmit?: (values: { title: string; content: string }) => void;
  onBack?: () => void;
};

const formSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
});

function Content({ id, editClassName, onSubmit, onBack }: Props) {
  const { t } = useTranslation();
  const knowledgeStore = useKnowledgeStore();
  const defaultValues = useMemo(() => {
    const { knowledges } = useKnowledgeStore.getState();
    const detail = knowledges.find((item) => item.id === id);
    return detail ? { title: detail.title, content: detail.content } : { title: "", content: "" };
  }, [id]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  function handleSubmit(values: z.infer<typeof formSchema>) {
    const currentTime = Date.now();
    knowledgeStore.update(id, { ...values, updatedAt: currentTime });
    if (onSubmit) onSubmit(values);
    if (onBack) onBack();
  }

  return (
    <Form {...form}>
      <form
        className="space-y-4 max-sm:space-y-2"
        onReset={() => form.reset()}
        onSubmit={form.handleSubmit(handleSubmit)}
      >
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("knowledge.editor.title")}</FormLabel>
              <FormControl>
                <Input placeholder={t("knowledge.editor.titlePlaceholder")} {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("knowledge.editor.content")}</FormLabel>
              <FormControl>
                <MagicDownEditor
                  {...(editClassName && { className: editClassName })}
                  defaultValue={field.value}
                  hideView={true}
                  onChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <div className={cn("flex", onBack ? "justify-between" : "justify-end")}>
          {onBack ? (
            <Button type="button" variant="secondary" onClick={() => onBack()}>
              {t("knowledge.editor.back")}
            </Button>
          ) : null}
          <div className="flex gap-2">
            <Button type="reset" variant="secondary">
              {t("knowledge.editor.reset")}
            </Button>
            <Button type="submit">{t("knowledge.editor.submit")}</Button>
          </div>
        </div>
      </form>
    </Form>
  );
}

export default Content;
