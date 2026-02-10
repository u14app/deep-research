"use client";
import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/Internal/Button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import useDeepResearch from "@/hooks/useDeepResearch";
import useAccurateTimer from "@/hooks/useAccurateTimer";
import useSubmitShortcut from "@/hooks/useSubmitShortcut";
import { useTaskStore } from "@/store/task";

const MagicDown = dynamic(() => import("@/components/MagicDown"));

const formSchema = z.object({
  feedback: z.string(),
});

function Feedback() {
  const { t } = useTranslation();
  const taskStore = useTaskStore();
  const { status, deepResearch, writeReportPlan } = useDeepResearch();
  const {
    formattedTime,
    start: accurateTimerStart,
    stop: accurateTimerStop,
  } = useAccurateTimer();
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const [isResearch, setIsResaerch] = useState<boolean>(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      feedback: taskStore.feedback,
    },
  });
  const handleFeedbackSubmitShortcut = useSubmitShortcut(() => {
    void form.handleSubmit(handleSubmit)();
  });

  async function startDeepResearch() {
    try {
      accurateTimerStart();
      setIsResaerch(true);
      await deepResearch();
    } finally {
      setIsResaerch(false);
      accurateTimerStop();
    }
  }

  async function handleSubmit(values: z.infer<typeof formSchema>) {
    const { question, questions, setFeedback } = useTaskStore.getState();
    setFeedback(values.feedback);
    const prompt = [
      `Initial Query: ${question}`,
      `Follow-up Questions: ${questions}`,
      `Follow-up Feedback: ${values.feedback}`,
    ].join("\n\n");
    taskStore.setQuery(prompt);
    try {
      accurateTimerStart();
      setIsThinking(true);
      await writeReportPlan();
      setIsThinking(false);
    } finally {
      accurateTimerStop();
    }
  }

  useEffect(() => {
    form.setValue("feedback", taskStore.feedback);
  }, [taskStore.feedback, form]);

  return (
    <section className="p-4 border rounded-md mt-4 print:hidden">
      <h3 className="font-semibold text-lg border-b mb-2 leading-10">
        {t("research.feedback.title")}
      </h3>
      {taskStore.questions === "" ? (
        <div>{t("research.feedback.emptyTip")}</div>
      ) : (
        <div>
          <h4 className="mt-4 text-base font-semibold">
            {t("research.feedback.questions")}
          </h4>
          <MagicDown
            className="mt-2 min-h-20"
            value={taskStore.questions}
            onChange={(value) => taskStore.updateQuestions(value)}
          ></MagicDown>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)}>
              <FormField
                control={form.control}
                name="feedback"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="mb-2 font-semibold">
                      {t("research.feedback.feedbackLabel")}
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        rows={3}
                        placeholder={t("research.feedback.feedbackPlaceholder")}
                        disabled={isThinking}
                        onKeyDown={handleFeedbackSubmitShortcut}
                        {...field}
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">
                      {t("research.common.submitShortcut")}
                    </p>
                  </FormItem>
                )}
              />
              <Button
                className="mt-4 w-full"
                type="submit"
                disabled={isThinking}
              >
                {isThinking ? (
                  <>
                    <LoaderCircle className="animate-spin" />
                    <span>{status}</span>
                    <small className="font-mono">{formattedTime}</small>
                  </>
                ) : taskStore.reportPlan === "" ? (
                  t("research.common.writeReportPlan")
                ) : (
                  t("research.common.rewriteReportPlan")
                )}
              </Button>
            </form>
          </Form>
        </div>
      )}
      {taskStore.reportPlan !== "" ? (
        <div className="mt-6">
          <h4 className="text-base font-semibold">
            {t("research.feedback.reportPlan")}
          </h4>
          <MagicDown
            className="mt-2 min-h-20"
            value={taskStore.reportPlan}
            onChange={(value) => taskStore.updateReportPlan(value)}
          ></MagicDown>
          <Button
            className="w-full mt-4"
            variant="default"
            onClick={() => startDeepResearch()}
            disabled={isResearch}
          >
            {isResearch ? (
              <>
                <LoaderCircle className="animate-spin" />
                <span>{status}</span>
                <small className="font-mono">{formattedTime}</small>
              </>
            ) : taskStore.tasks.length === 0 ? (
              t("research.common.startResearch")
            ) : (
              t("research.common.restartResearch")
            )}
          </Button>
        </div>
      ) : null}
    </section>
  );
}

export default Feedback;
