"use client";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { CheckCircle2, Circle, LoaderCircle } from "lucide-react";
import { useTaskStore } from "@/store/task";
import { cn } from "@/utils/style";

type StepState = "completed" | "active" | "pending";

interface WorkflowStep {
  id: string;
  label: string;
  completed: boolean;
  state: StepState;
}

function StepIcon({ state }: { state: StepState }) {
  if (state === "completed") {
    return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
  } else if (state === "active") {
    return <LoaderCircle className="h-4 w-4 text-blue-600 animate-spin" />;
  } else {
    return <Circle className="h-4 w-4 text-slate-400" />;
  }
}

function WorkflowProgress() {
  const { t } = useTranslation();
  const { question, questions, reportPlan, tasks, finalReport } =
    useTaskStore();

  const completedTaskCount = useMemo(() => {
    return tasks.filter((task) => task.state === "completed").length;
  }, [tasks]);
  const collectionDone =
    tasks.length > 0 && completedTaskCount === tasks.length;

  const steps = useMemo(() => {
    const rawSteps: Omit<WorkflowStep, "state">[] = [
      {
        id: "topic",
        label: t("research.workflow.topic"),
        completed: question.trim().length > 0,
      },
      {
        id: "questions",
        label: t("research.workflow.questions"),
        completed: questions.trim().length > 0,
      },
      {
        id: "plan",
        label: t("research.workflow.plan"),
        completed: reportPlan.trim().length > 0,
      },
      {
        id: "collection",
        label: t("research.workflow.collection"),
        completed: collectionDone,
      },
      {
        id: "report",
        label: t("research.workflow.report"),
        completed: finalReport.trim().length > 0,
      },
    ];
    const activeIndex = rawSteps.findIndex((step) => !step.completed);
    return rawSteps.map((step, idx) => ({
      ...step,
      state:
        step.completed || activeIndex === -1
          ? "completed"
          : idx === activeIndex
            ? "active"
            : "pending",
    })) as WorkflowStep[];
  }, [collectionDone, finalReport, question, questions, reportPlan, t]);

  const completedStages = useMemo(() => {
    return steps.filter((step) => step.completed).length;
  }, [steps]);
  const progress = Math.round((completedStages / steps.length) * 100);

  function getStepDescription(step: WorkflowStep): string {
    if (step.id === "collection" && tasks.length > 0) {
      return t("research.workflow.collectionDetail", {
        completed: completedTaskCount,
        total: tasks.length,
      });
    }
    if (step.state === "completed") {
      return t("research.workflow.done");
    } else if (step.state === "active") {
      return t("research.workflow.active");
    } else {
      return t("research.workflow.pending");
    }
  }

  return (
    <section className="p-4 border rounded-md mt-4 print:hidden bg-slate-50 dark:bg-slate-900/30">
      <div className="flex gap-2 items-center justify-between max-sm:flex-col max-sm:items-start">
        <h3 className="font-semibold text-lg leading-6">
          {t("research.workflow.title")}
        </h3>
        <span className="text-sm text-muted-foreground">
          {t("research.workflow.summary", {
            progress,
            completed: completedStages,
            total: steps.length,
          })}
        </span>
      </div>
      <div className="mt-3 h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
        <div
          className="h-full rounded-full bg-blue-600 transition-all"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      <div className="mt-3 grid gap-2 max-sm:hidden sm:grid-cols-2 lg:grid-cols-5">
        {steps.map((step) => (
          <div
            key={step.id}
            className={cn(
              "rounded-md border px-2 py-2",
              step.state === "completed"
                ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/20"
                : "",
              step.state === "active"
                ? "border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/20"
                : "",
              step.state === "pending"
                ? "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900/40"
                : "",
            )}
          >
            <div className="flex items-center gap-2">
              <StepIcon state={step.state} />
              <p className="text-sm font-medium truncate">{step.label}</p>
            </div>
            <p className="text-xs mt-1 text-muted-foreground">
              {getStepDescription(step)}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default WorkflowProgress;
