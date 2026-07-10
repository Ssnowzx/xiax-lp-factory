"use client";

import { useEffect, useId, useRef, useState } from "react";
// React 18.3: useFormState/useFormStatus vêm de react-dom.
// Swap drop-in para useActionState (react-dom → react) na migração p/ React 19.
import { useFormState, useFormStatus } from "react-dom";
import {
  startTrialAction,
  initialTrialState,
  type TrialState,
} from "@/app/actions/start-trial";
import { trialSchema } from "@/lib/validation/trial-schema";
import { MICROCOPY } from "@/lib/ux/microcopy";
import { track } from "@/lib/analytics/track";
import type { CtaPlacement } from "@/lib/analytics/events";
import { FieldInput, FieldLabel } from "@/components/ui/field";
import { FormStatus } from "@/components/ui/form-status";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/ui/cn";

/**
 * Botão de submit — a primitiva `Button` (IMP-1: sem CTA remontado à mão). Lê o
 * pending do form via useFormStatus e mapeia p/ `loading` (aria-busy + disabled +
 * troca de rótulo no box fixo → CLS 0). Micro-motion/disabled vêm do Design System.
 */
function SubmitButton({ placement }: { placement: CtaPlacement }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant="accent"
      loading={pending}
      loadingLabel={MICROCOPY.form.enviando}
      onClick={() => track({ name: "cta_click", placement })}
    >
      Começar teste grátis <span aria-hidden="true">▸</span>
    </Button>
  );
}

export interface TrialFormProps {
  /** hero | planos | final — mesma ação, mesmo destino, mesma validação (UX/IA §4). */
  placement: CtaPlacement;
  className?: string;
}

/**
 * TrialForm — componente ÚNICO reusado em #hero, #planos e #final.
 * PE (Rule 12): `<form action>` envia mesmo sem JS; o Server Action re-valida o
 * MESMO `trialSchema`. 4 estados (idle/loading/error/success) no box fixo → CLS 0.
 */
export function TrialForm({ placement, className }: TrialFormProps) {
  const [state, formAction] = useFormState<TrialState, FormData>(
    startTrialAction,
    initialTrialState,
  );
  const uid = useId();
  const emailId = `email-${uid}`;
  const errId = `email-erro-${uid}`;
  const inputRef = useRef<HTMLInputElement>(null);
  // A11Y-03: no caminho com JS o Server Action não roda, então o erro do zod-cliente
  // precisa renderizar o MESMO FormStatus (role="alert") + aria-invalid/describedby.
  const [clientEmailError, setClientEmailError] = useState<string | undefined>();

  // Instrumentação 1:1: emite success/error quando o estado do servidor muda.
  const lastStatus = useRef<TrialState["status"]>("idle");
  useEffect(() => {
    if (state.status === lastStatus.current) return;
    lastStatus.current = state.status;
    if (state.status === "success") track({ name: "trial_success", placement });
    if (state.status === "error")
      track({
        name: "trial_error",
        placement,
        reason: state.fieldErrors.email ? "validation" : "network",
      });
  }, [state, placement]);

  // Sucesso substitui o form NO MESMO BOX (CLS 0) e aponta o próximo passo.
  if (state.status === "success") {
    return (
      <div
        className={cn("rounded-window border border-line bg-surface p-5", className)}
        role="status"
        aria-live="polite"
      >
        <p className="text-body text-ink">
          {MICROCOPY.estado.sucessoTrial}{" "}
          <span className="text-ink-muted">{MICROCOPY.estado.sucessoTrialSpam}</span>
        </p>
      </div>
    );
  }

  // Erro do cliente tem precedência no caminho com JS (o Server Action nem chega a
  // rodar); o erro do servidor cobre o caminho sem JS e a revalidação final.
  const emailError =
    clientEmailError ?? (state.status === "error" ? state.fieldErrors.email : undefined);
  const formError = state.status === "error" ? state.formError : undefined;

  return (
    <form
      action={formAction}
      // validação é do Zod (cliente+servidor), não a nativa do browser
      noValidate
      // enhancement leve de PE: checa o Zod no submit do cliente; se inválido,
      // foca o campo e deixa o Server Action ser a fronteira final.
      onSubmit={(e) => {
        track({ name: "trial_submit", placement });
        const value = inputRef.current?.value ?? "";
        const parsed = trialSchema.safeParse({ email: value });
        if (!parsed.success) {
          e.preventDefault();
          // popula o MESMO estado de erro que a UI já renderiza (role="alert")
          setClientEmailError(
            parsed.error.flatten().fieldErrors.email?.[0] ?? MICROCOPY.form.erroEmail,
          );
          track({ name: "trial_error", placement, reason: "validation" });
          inputRef.current?.focus();
        } else {
          setClientEmailError(undefined);
        }
      }}
      className={cn("flex flex-col gap-3", className)}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <FieldLabel htmlFor={emailId}>{MICROCOPY.form.labelEmail}</FieldLabel>
          <FieldInput
            ref={inputRef}
            id={emailId}
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder={MICROCOPY.form.placeholderEmail}
            required
            state={emailError ? "invalid" : "default"}
            aria-invalid={emailError ? true : undefined}
            aria-describedby={emailError ? errId : undefined}
            // limpa o erro do cliente ao corrigir (evita aria-invalid preso)
            onChange={() => clientEmailError && setClientEmailError(undefined)}
          />
        </div>
        <SubmitButton placement={placement} />
      </div>

      {emailError && (
        <FormStatus id={errId} tone="danger">
          {emailError}
        </FormStatus>
      )}
      {formError && <FormStatus tone="danger">{formError}</FormStatus>}
    </form>
  );
}
