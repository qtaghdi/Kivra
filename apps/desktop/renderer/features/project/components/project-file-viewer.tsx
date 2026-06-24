import { motion } from "framer-motion";
import { FileCode, FileText } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { isTauriRuntime } from "@/core/tauri/tauri-client";
import { useProjectFile } from "@/features/project/hooks/use-project-file";
import type { project } from "@/features/project/types/project";
import { cn } from "@/shared/lib/utils";

type projectFileViewerProps = {
  filePath: string | null;
  project: project;
};

type viewMode = "code" | "preview";

export function ProjectFileViewer({ filePath, project }: projectFileViewerProps) {
  const { t } = useTranslation();
  const [viewMode, setViewMode] = useState<viewMode>("code");
  const file = useProjectFile({ filePath, project });
  const language = useMemo(() => getFileLanguage(filePath), [filePath]);
  const isMarkdown = language === "Markdown";

  if (!filePath) {
    return (
      <EmptyState message={t("explorer.selectFile")} />
    );
  }

  if (project.source === "local" && !isTauriRuntime()) {
    return (
      <EmptyState message={t("runtime.desktopRequiredDetail")} />
    );
  }

  if (file.isLoading) {
    return <EmptyState message={t("explorer.loadingFile")} />;
  }

  if (file.isError || !file.data) {
    return <EmptyState message={t("explorer.fileReadFailed")} />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="h-full overflow-hidden rounded-md border bg-card"
    >
      <div className="flex items-center justify-between gap-4 border-b px-3 py-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm font-medium">
            {isMarkdown ? (
              <FileText className="h-4 w-4" />
            ) : (
              <FileCode className="h-4 w-4" />
            )}
            <span className="truncate">{file.data.path}</span>
          </div>
          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
            {file.data.size.toLocaleString()} bytes
            <span className="rounded border px-1.5 py-0.5 font-mono text-[10px]">
              {language}
            </span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {isMarkdown && (
            <div className="flex rounded-md border bg-background p-1">
              {(["code", "preview"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  className={cn(
                    "h-7 rounded px-2 text-xs text-muted-foreground",
                    viewMode === mode && "bg-muted text-foreground"
                  )}
                  onClick={() => setViewMode(mode)}
                >
                  {t(`explorer.viewModes.${mode}`)}
                </button>
              ))}
            </div>
          )}
          {file.data.truncated && (
            <div className="text-xs text-muted-foreground">
              {t("explorer.truncated")}
            </div>
          )}
        </div>
      </div>
      {isMarkdown && viewMode === "preview" ? (
        <MarkdownPreview content={file.data.content} />
      ) : (
        <CodeViewer content={file.data.content} language={language} />
      )}
    </motion.div>
  );
}

type codeViewerProps = {
  content: string;
  compact?: boolean;
  language: string;
};

function CodeViewer({ compact = false, content, language }: codeViewerProps) {
  const lines = content.split("\n");
  const isNode = language === "Node";

  return (
    <div
      className={cn(
        "overflow-auto bg-background",
        compact ? "max-h-80" : "h-[calc(100%-57px)]"
      )}
    >
      {isNode && (
        <div className="sticky top-0 z-10 border-b bg-card px-3 py-2 font-mono text-[11px] text-muted-foreground">
          Node runtime view
        </div>
      )}
      <pre className="min-w-max p-0 font-mono text-xs leading-5">
        {lines.map((line, index) => (
          <div key={`${index}-${line}`} className="grid grid-cols-[48px_1fr]">
            <span className="select-none border-r px-3 text-right text-muted-foreground/60">
              {index + 1}
            </span>
            <code className="px-3">
              {isNode ? highlightNodeLine(line) : line || " "}
            </code>
          </div>
        ))}
      </pre>
    </div>
  );
}

function MarkdownPreview({ content }: { content: string }) {
  const lines = content.split("\n");
  const blocks = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];

    if (line.startsWith("```")) {
      const codeLines = [];
      const language = line.replace("```", "").trim() || "Code";
      index += 1;

      while (index < lines.length && !lines[index].startsWith("```")) {
        codeLines.push(lines[index]);
        index += 1;
      }

      blocks.push(
        <div key={index} className="overflow-hidden rounded-md border bg-background">
          <div className="border-b px-3 py-2 font-mono text-[11px] text-muted-foreground">
            {language}
          </div>
          <CodeViewer
            compact
            content={codeLines.join("\n")}
            language={getLanguageLabel(language)}
          />
        </div>
      );
      index += 1;
      continue;
    }

    if (!line.trim()) {
      blocks.push(<div key={index} className="h-3" />);
      index += 1;
      continue;
    }

    const heading = line.match(/^(#{1,3})\s+(.*)$/);

    if (heading) {
      const level = heading[1].length;
      const className =
        level === 1
          ? "text-2xl font-semibold"
          : level === 2
            ? "text-lg font-semibold"
            : "text-sm font-semibold";
      blocks.push(
        <div key={index} className={cn("mt-3 first:mt-0", className)}>
          {renderInlineMarkdown(heading[2])}
        </div>
      );
      index += 1;
      continue;
    }

    const listItem = line.match(/^[-*]\s+(.*)$/);

    if (listItem) {
      blocks.push(
        <div key={index} className="flex gap-2 text-sm leading-6 text-muted-foreground">
          <span className="mt-2 h-1 w-1 rounded-full bg-muted-foreground" />
          <span>{renderInlineMarkdown(listItem[1])}</span>
        </div>
      );
      index += 1;
      continue;
    }

    blocks.push(
      <p key={index} className="text-sm leading-6 text-muted-foreground">
        {renderInlineMarkdown(line)}
      </p>
    );
    index += 1;
  }

  return (
    <div className="h-[calc(100%-57px)] overflow-auto bg-background p-5">
      <div className="mx-auto max-w-3xl space-y-1">{blocks}</div>
    </div>
  );
}

function renderInlineMarkdown(value: string) {
  const parts = value.split(/(`[^`]+`)/g);

  return parts.map((part, index) => {
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={`${part}-${index}`}
          className="rounded border bg-card px-1 py-0.5 font-mono text-xs text-foreground"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    return <span key={`${part}-${index}`}>{part}</span>;
  });
}

function highlightNodeLine(line: string) {
  const tokens = line.split(
    /(\b(?:const|let|var|function|return|import|from|export|async|await|type|interface|class|new|if|else|throw|try|catch)\b|"[^"]*"|'[^']*'|`[^`]*`|\/\/.*)/g
  );

  return tokens.map((token, index) => {
    const key = `${token}-${index}`;

    if (/^\/\/.*/.test(token)) {
      return <span key={key} className="text-muted-foreground">{token}</span>;
    }

    if (/^["'`]/.test(token)) {
      return <span key={key} className="text-emerald-300">{token}</span>;
    }

    if (/^\b(?:const|let|var|function|return|import|from|export|async|await|type|interface|class|new|if|else|throw|try|catch)\b$/.test(token)) {
      return <span key={key} className="text-primary">{token}</span>;
    }

    return <span key={key}>{token}</span>;
  });
}

function getFileLanguage(filePath: string | null) {
  const extension = filePath?.split(".").pop()?.toLowerCase();

  if (!extension) {
    return "Text";
  }

  if (["js", "jsx", "ts", "tsx", "mjs", "cjs"].includes(extension)) {
    return "Node";
  }

  if (["md", "mdx"].includes(extension)) {
    return "Markdown";
  }

  const labels: Record<string, string> = {
    css: "CSS",
    html: "HTML",
    json: "JSON",
    rs: "Rust",
    toml: "TOML",
    yaml: "YAML",
    yml: "YAML"
  };

  return labels[extension] ?? extension.toUpperCase();
}

function getLanguageLabel(language: string) {
  return getFileLanguage(`file.${language.toLowerCase()}`);
}

type emptyStateProps = {
  message: string;
};

function EmptyState({ message }: emptyStateProps) {
  return (
    <div className="flex h-full items-center justify-center rounded-md border bg-card p-4 text-sm text-muted-foreground">
      {message}
    </div>
  );
}
