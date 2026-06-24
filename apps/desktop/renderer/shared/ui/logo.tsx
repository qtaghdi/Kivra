import logoMarkUrl from "../../../../../packages/shared/logo/img.png";

import { cn } from "@/shared/lib/utils";

type logoProps = {
  className?: string;
  markClassName?: string;
  showTagline?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "horizontal" | "compact" | "wordmark";
};

const sizeClassName = {
  sm: {
    mark: "h-5 w-5",
    wordmark: "text-sm",
    tagline: "text-[10px]"
  },
  md: {
    mark: "h-7 w-7",
    wordmark: "text-lg",
    tagline: "text-xs"
  },
  lg: {
    mark: "h-10 w-10",
    wordmark: "text-3xl",
    tagline: "text-xs"
  }
};

export function Logo({
  className,
  markClassName,
  showTagline = false,
  size = "md",
  variant = "horizontal"
}: logoProps) {
  const classes = sizeClassName[size];

  if (variant === "wordmark") {
    return (
      <div className={cn("min-w-0", className)}>
        <Wordmark className={classes.wordmark} />
        {showTagline && <Tagline className={classes.tagline} />}
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div className={cn("flex flex-col items-start gap-2", className)}>
        <LogoMark className={cn(classes.mark, markClassName)} />
        <div>
          <Wordmark className={classes.wordmark} />
          {showTagline && <Tagline className={classes.tagline} />}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex min-w-0 items-center gap-3", className)}>
      <LogoMark className={cn(classes.mark, markClassName)} />
      <div className="min-w-0">
        <Wordmark className={classes.wordmark} />
        {showTagline && <Tagline className={classes.tagline} />}
      </div>
    </div>
  );
}

type classNameProps = {
  className?: string;
};

function LogoMark({ className }: classNameProps) {
  return (
    <img
      src={logoMarkUrl}
      alt=""
      className={cn("shrink-0 object-contain", className)}
      draggable={false}
    />
  );
}

function Wordmark({ className }: classNameProps) {
  return (
    <div
      className={cn(
        "font-semibold leading-none tracking-[-0.03em] text-foreground",
        className
      )}
    >
      Kivra
    </div>
  );
}

function Tagline({ className }: classNameProps) {
  return (
    <div
      className={cn(
        "mt-1 font-mono leading-none text-muted-foreground",
        className
      )}
    >
      Build. Fail. Remember.
    </div>
  );
}
