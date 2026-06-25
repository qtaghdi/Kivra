import { ChevronDown, Loader2 } from "lucide-react";
import {
  type ButtonHTMLAttributes,
  type ReactNode,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { createPortal } from "react-dom";

import { cn } from "@/shared/lib/utils";

export type selectOption = {
  disabled?: boolean;
  label: string;
  value: string;
};

type selectChangeEvent = {
  target: {
    name?: string;
    value: string;
  };
};

type selectProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "children" | "onChange" | "size" | "value"
> & {
  icon?: ReactNode;
  isLoading?: boolean;
  onChange?: (event: selectChangeEvent) => void;
  options: selectOption[];
  placeholder?: string;
  selectClassName?: string;
  size?: "sm" | "md";
  value?: string;
};

type menuPlacement = "bottom" | "top";

const sizeClassName = {
  sm: "h-8 text-xs",
  md: "h-9 text-sm"
};

const menuOffset = 8;
const maxMenuHeight = 224;

export const Select = ({
  className,
  disabled,
  icon,
  isLoading = false,
  name,
  onBlur,
  onChange,
  options,
  placeholder,
  selectClassName,
  size = "md",
  value,
  ...props
}: selectProps) => {
  const id = useId();
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [menuGeometry, setMenuGeometry] = useState({
    left: 0,
    maxHeight: maxMenuHeight,
    placement: "bottom" as menuPlacement,
    top: 0,
    width: 0
  });
  const selectedIndex = options.findIndex((option) => option.value === value);
  const selectedOption = selectedIndex >= 0 ? options[selectedIndex] : null;
  const isDisabled = disabled || isLoading;

  const enabledOptions = useMemo(
    () => options.filter((option) => !option.disabled),
    [options]
  );

  const updateMenuGeometry = () => {
    const trigger = triggerRef.current;

    if (!trigger) {
      return;
    }

    const rect = trigger.getBoundingClientRect();
    const measuredHeight =
      menuRef.current?.getBoundingClientRect().height ??
      Math.min(options.length * 36 + 8, maxMenuHeight);
    const spaceBelow = window.innerHeight - rect.bottom - menuOffset;
    const spaceAbove = rect.top - menuOffset;
    const placement: menuPlacement =
      spaceBelow >= Math.min(measuredHeight, maxMenuHeight) || spaceBelow >= spaceAbove
        ? "bottom"
        : "top";
    const availableHeight = placement === "bottom" ? spaceBelow : spaceAbove;
    const width = Math.max(rect.width, 180);
    const left = Math.min(
      Math.max(8, rect.left),
      Math.max(8, window.innerWidth - width - 8)
    );
    const top =
      placement === "bottom"
        ? rect.bottom + menuOffset
        : Math.max(8, rect.top - Math.min(measuredHeight, availableHeight) - menuOffset);

    setMenuGeometry({
      left,
      maxHeight: Math.max(80, Math.min(maxMenuHeight, availableHeight)),
      placement,
      top,
      width
    });
  };

  useLayoutEffect(() => {
    if (!isOpen) {
      return;
    }

    updateMenuGeometry();
  }, [isOpen, options.length]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;

      if (
        triggerRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }

      setIsOpen(false);
      onBlur?.(event as unknown as React.FocusEvent<HTMLButtonElement>);
    };
    const handleViewportChange = () => updateMenuGeometry();

    document.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleViewportChange, true);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleViewportChange, true);
    };
  }, [isOpen, onBlur]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setActiveIndex(Math.max(0, selectedIndex));
  }, [isOpen, selectedIndex]);

  const selectOption = (option: selectOption) => {
    if (option.disabled) {
      return;
    }

    onChange?.({ target: { name, value: option.value } });
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  const toggleMenu = () => {
    if (isDisabled) {
      return;
    }

    setIsOpen((current) => !current);
  };

  const moveActiveOption = (direction: 1 | -1) => {
    if (enabledOptions.length === 0) {
      return;
    }

    const currentValue = options[activeIndex]?.value;
    const currentEnabledIndex = Math.max(
      0,
      enabledOptions.findIndex((option) => option.value === currentValue)
    );
    const nextEnabledIndex =
      (currentEnabledIndex + direction + enabledOptions.length) %
      enabledOptions.length;
    const nextIndex = options.findIndex(
      (option) => option.value === enabledOptions[nextEnabledIndex]?.value
    );

    setActiveIndex(Math.max(0, nextIndex));
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        role="combobox"
        aria-controls={`${id}-listbox`}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        disabled={isDisabled}
        name={name}
        className={cn(
          "relative inline-flex min-w-0 items-center gap-2 rounded-md border bg-background px-2 text-left text-foreground transition hover:border-foreground/50 focus:border-foreground focus:outline-none disabled:cursor-not-allowed disabled:opacity-50",
          isOpen && "border-primary ring-1 ring-primary/35",
          sizeClassName[size],
          className
        )}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            event.stopPropagation();
            setIsOpen(false);
            return;
          }

          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();

            if (!isOpen) {
              setIsOpen(true);
              return;
            }

            moveActiveOption(event.key === "ArrowDown" ? 1 : -1);
          }

          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();

            if (!isOpen) {
              setIsOpen(true);
              return;
            }

            const option = options[activeIndex];

            if (option) {
              selectOption(option);
            }
          }
        }}
        onPointerDown={(event) => {
          event.preventDefault();
          event.stopPropagation();
          toggleMenu();
        }}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
        ) : (
          icon
        )}
        <span
          className={cn(
            "min-w-0 flex-1 truncate pr-6",
            !selectedOption && "text-muted-foreground",
            selectClassName
          )}
        >
          {selectedOption?.label ?? placeholder}
        </span>
        <ChevronDown
          className={cn(
            "pointer-events-none absolute right-2 h-4 w-4 text-muted-foreground transition-transform",
            isOpen && "rotate-180 text-foreground"
          )}
        />
      </button>
      {isOpen &&
        createPortal(
          <div
            ref={menuRef}
            id={`${id}-listbox`}
            role="listbox"
            className="fixed z-[1000] rounded-md border bg-popover p-1 text-popover-foreground shadow-2xl shadow-black/30"
            style={{
              left: menuGeometry.left,
              maxHeight: menuGeometry.maxHeight,
              top: menuGeometry.top,
              width: menuGeometry.width
            }}
          >
            <div
              className={cn(
                "absolute left-4 z-0 h-3 w-3 rotate-45 border bg-popover",
                menuGeometry.placement === "bottom"
                  ? "-top-1.5 border-b-0 border-r-0"
                  : "-bottom-1.5 border-l-0 border-t-0"
              )}
            />
            <div className="relative z-10 max-h-[inherit] overflow-auto">
              {options.map((option, index) => {
                const isSelected = option.value === value;
                const isActive = index === activeIndex;

                return (
                  <button
                    key={option.value}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    disabled={option.disabled}
                    className={cn(
                      "flex h-8 w-full items-center rounded px-2 text-left text-xs transition",
                      isSelected && "bg-primary text-primary-foreground",
                      !isSelected && isActive && "bg-muted text-foreground",
                      !isSelected && !isActive && "text-muted-foreground hover:bg-muted hover:text-foreground",
                      option.disabled && "cursor-not-allowed opacity-45"
                    )}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => selectOption(option)}
                  >
                    <span className="truncate">{option.label}</span>
                  </button>
                );
              })}
            </div>
          </div>,
          document.body
        )}
    </>
  );
};
