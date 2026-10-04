"use client";

import { useActionState } from "react";

import { Alert, Button, Field, Input } from "@/components/ui";

import { signIn, type LoginState } from "./actions";

export function LoginForm({ next }: { next?: string }) {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(signIn, {});

  return (
    <form action={formAction} className="space-y-4">
      {next ? <input type="hidden" name="next" value={next} /> : null}

      {state.error ? <Alert>{state.error}</Alert> : null}

      <Field label="Имэйл" htmlFor="email">
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={state.email}
          placeholder="admin@example.com"
        />
      </Field>

      <Field label="Нууц үг" htmlFor="password">
        <Input id="password" name="password" type="password" autoComplete="current-password" required />
      </Field>

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Нэвтэрч байна…" : "Нэвтрэх"}
      </Button>
    </form>
  );
}
