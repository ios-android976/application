"use client";

import { useTransition, type ReactNode } from "react";

import { Button, type ButtonVariant } from "@/components/ui";

/** Asks for confirmation, then runs a server action. */
export function ConfirmButton({
  action,
  message,
  children,
  variant = "danger",
  label,
}: {
  action: () => Promise<void>;
  message: string;
  children: ReactNode;
  variant?: ButtonVariant;
  label?: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant={variant}
      size="sm"
      aria-label={label}
      disabled={pending}
      onClick={() => {
        if (!window.confirm(message)) return;
        startTransition(async () => {
          try {
            await action();
          } catch (error) {
            window.alert(error instanceof Error ? error.message : "Алдаа гарлаа.");
          }
        });
      }}>
      {children}
    </Button>
  );
}
