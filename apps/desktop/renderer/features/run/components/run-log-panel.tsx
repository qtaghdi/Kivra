import { motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Copy,
  ListFilter,
  Terminal,
  Timer,
  WrapText
} from "lucide-react";
import { useState } from "react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import type { runResult } from "@/features/run/types/run";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";

type runLogPanelProps = {
  run: runResult | null;
};

export const RunLogPanel = ({ run }: runLogPanelProps) => {
  const { t } = useTranslation();
  const [activeStream, setActiveStream] = useState<"all" | "stdout" | "stderr">(
    "all"
  );
  const [wrapLines, setWrapLines] = useState(true);

  if (!run) {
    return (
      <div className="flex h-full min-h-[420px] items-center justify-center rounded-md border bg-card p-4 text-sm text-muted-foreground">
        {t("runs.selectRun")}
      </div>
    );
  }

  const summaryItems = [
    {
      icon: <CheckCircle2 className="h-4 w-4" />,
      label: t("runs.status"),
      value: run.status
    },
    {
      icon: <Timer className="h-4 w-4" />,
      label: t("runs.duration"),
      value: `${run.duration} ms`
    },
    {
      icon: <Clock3 className="h-4 w-4" />,
      label: t("runs.timestamp"),
      value: new Date(run.createdAt).toLocaleString()
    },
    {
      icon: <Terminal className="h-4 w-4" />,
      label: t("runs.exitCode"),
      value: String(run.exitCode ?? "-")
    }
  ];
  const streamCounts = {
    stdout: getOutputStats(run.stdout),
    stderr: getOutputStats(run.stderr)
  };
  const hasStdout = run.stdout.trim().length > 0;
  const hasStderr = run.stderr.trim().length > 0;
  const visibleOutput = getVisibleOutput({
    stderr: run.stderr,
    stdout: run.stdout,
    stream: activeStream,
    t
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="grid h-full min-h-0 gap-4 xl:grid-cols-[minmax(0,1fr)_280px]"
    >
      <div className="flex min-h-0 flex-col rounded-md border bg-card">
        <div className="border-b px-4 py-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-sm font-medium">
                <Terminal className="h-4 w-4" />
                {t("runs.output")}
              </div>
              <div className="mt-1 max-w-[110ch] font-mono text-xs text-muted-foreground">
                {run.command}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <SegmentedControl
                value={activeStream}
                onChange={(value) =>
                  setActiveStream(value as "all" | "stdout" | "stderr")
                }
                options={[
                  { label: t("runs.all"), value: "all" },
                  { label: t("runs.stdout"), value: "stdout", disabled: !hasStdout },
                  { label: t("runs.stderr"), value: "stderr", disabled: !hasStderr }
                ]}
              />
              <Button
                type="button"
                size="sm"
                variant={wrapLines ? "primary" : "secondary"}
                onClick={() => setWrapLines((currentValue) => !currentValue)}
              >
                <WrapText className="h-4 w-4" />
                {t("runs.wrap")}
              </Button>
              <CopyOutputButton value={visibleOutput} />
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {summaryItems.map((item) => (
              <SummaryChip
                key={item.label}
                icon={item.icon}
                label={item.label}
                value={item.value}
              />
            ))}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-auto p-4">
          <div className="mx-auto w-full max-w-[110ch]">
            <pre
              className={cn(
                "min-h-full rounded-md border bg-background p-4 font-mono text-xs leading-6",
                wrapLines
                  ? "whitespace-pre-wrap break-words"
                  : "overflow-x-auto whitespace-pre"
              )}
            >
              {visibleOutput}
            </pre>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:content-start">
        <aside className="rounded-md border bg-card p-3">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium">
            <ListFilter className="h-4 w-4" />
            {t("runs.streamOverview")}
          </div>
          <div className="grid gap-2">
            <OutputStatCard
              label={t("runs.stdout")}
              lines={streamCounts.stdout.lines}
              characters={streamCounts.stdout.characters}
            />
            <OutputStatCard
              label={t("runs.stderr")}
              lines={streamCounts.stderr.lines}
              characters={streamCounts.stderr.characters}
              tone="danger"
            />
          </div>
        </aside>

        {run.errors.length > 0 && (
          <aside className="rounded-md border bg-card p-3">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              {t("runs.detectedErrors")}
            </div>
            <div className="space-y-2">
              {run.errors.map((error) => (
                <div
                  key={error.id}
                  className="rounded-md border bg-background p-3"
                >
                  <div className="text-sm">{error.message}</div>
                  <div className="mt-1 font-mono text-xs text-muted-foreground">
                    {error.filePath ?? "raw"}:{error.lineNumber ?? "-"}:
                    {error.columnNumber ?? "-"}
                  </div>
                </div>
              ))}
            </div>
          </aside>
        )}
      </div>
    </motion.div>
  );
};

const SummaryChip = ({
  icon,
  label,
  value
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) => (
  <div className="inline-flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-xs">
    <span className="text-muted-foreground">{icon}</span>
    <span className="text-muted-foreground">{label}</span>
    <span className="font-medium text-foreground">{value}</span>
  </div>
);

const OutputStatCard = ({
  label,
  lines,
  characters,
  tone = "default"
}: {
  label: string;
  lines: number;
  characters: number;
  tone?: "default" | "danger";
}) => {
  const { t } = useTranslation();

  return (
    <div
      className={cn(
        "rounded-md border bg-background p-3",
        tone === "danger" && "border-destructive/30"
      )}
    >
      <div className="text-xs font-medium uppercase text-muted-foreground">
        {label}
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <div>
          <div className="text-[11px] text-muted-foreground">{t("runs.lines")}</div>
          <div className="text-sm font-medium">{lines.toLocaleString()}</div>
        </div>
        <div>
          <div className="text-[11px] text-muted-foreground">
            {t("runs.characters")}
          </div>
          <div className="text-sm font-medium">{characters.toLocaleString()}</div>
        </div>
      </div>
    </div>
  );
};

const CopyOutputButton = ({ value }: { value: string }) => {
  const { t } = useTranslation();

  return (
    <Button
      type="button"
      size="sm"
      variant="secondary"
      onClick={() => {
        void navigator.clipboard?.writeText(value);
      }}
    >
      <Copy className="h-4 w-4" />
      {t("runs.copy")}
    </Button>
  );
};

const SegmentedControl = ({
  onChange,
  options,
  value
}: {
  onChange: (value: string) => void;
  options: { label: string; value: string; disabled?: boolean }[];
  value: string;
}) => (
  <div className="flex h-8 items-center rounded-md border bg-background px-1">
    {options.map((option) => (
      <button
        key={option.value}
        type="button"
        className={cn(
          "flex h-6 items-center rounded px-2.5 text-xs transition",
          value === option.value
            ? "bg-muted text-foreground"
            : "text-muted-foreground",
          option.disabled && "cursor-not-allowed opacity-40"
        )}
        disabled={option.disabled}
        onClick={() => onChange(option.value)}
      >
        {option.label}
      </button>
    ))}
  </div>
);

const getVisibleOutput = ({
  stderr,
  stdout,
  stream,
  t
}: {
  stderr: string;
  stdout: string;
  stream: "all" | "stdout" | "stderr";
  t: ReturnType<typeof useTranslation>["t"];
}) => {
  const normalizedStdout = stdout.trim();
  const normalizedStderr = stderr.trim();

  if (stream === "stdout") {
    return normalizedStdout || t("runs.noOutput");
  }

  if (stream === "stderr") {
    return normalizedStderr || t("runs.noOutput");
  }

  if (!normalizedStdout && !normalizedStderr) {
    return t("runs.noOutput");
  }

  return [
    normalizedStdout
      ? `${t("runs.stdout").toUpperCase()}\n${normalizedStdout}`
      : `${t("runs.stdout").toUpperCase()}\n${t("runs.noOutput")}`,
    normalizedStderr
      ? `${t("runs.stderr").toUpperCase()}\n${normalizedStderr}`
      : null
  ]
    .filter(Boolean)
    .join("\n\n");
};

const getOutputStats = (value: string) => {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return {
      lines: 0,
      characters: 0
    };
  }

  return {
    lines: trimmedValue.split(/\r?\n/).length,
    characters: trimmedValue.length
  };
};
