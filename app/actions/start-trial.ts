"use server";

import { trialSchema } from "@/lib/validation/trial-schema";
import { MICROCOPY } from "@/lib/ux/microcopy";

/**
 * Estado da TrialForm (contrato do `useFormState`). União "achatada" via `status`
 * — TS `strict` obriga tratar cada ramo na UI (idle/error/success). Sem `any`.
 */
export type TrialState =
  | { status: "idle" }
  | { status: "error"; fieldErrors: { email?: string }; formError?: string }
  | { status: "success"; email: string };

export const initialTrialState: TrialState = { status: "idle" };

/**
 * Server Action da conversão (Rule 5 + Rule 12): re-valida o MESMO `trialSchema`,
 * funciona com JS desligado (`<form action={startTrialAction}>`) e nunca deixa um
 * segredo vazar pro cliente (a integração de trial mora aqui, no servidor).
 *
 * Piloto: apenas valida e "aceita" (stub) — o wiring com o backend de trial
 * (criar conta + disparar e-mail de acesso) entra quando o endpoint existir.
 */
export async function startTrialAction(
  _prev: TrialState,
  formData: FormData,
): Promise<TrialState> {
  const parsed = trialSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    const flat = parsed.error.flatten().fieldErrors;
    return {
      status: "error",
      fieldErrors: { email: flat.email?.[0] },
    };
  }

  try {
    // TODO(backend): criar conta de trial + disparar e-mail com link de acesso.
    // Segredo/credencial da integração fica AQUI (server-only), nunca no bundle.
    // await createTrial(parsed.data.email)
    return { status: "success", email: parsed.data.email };
  } catch {
    return {
      status: "error",
      fieldErrors: {},
      formError: MICROCOPY.form.erroRede,
    };
  }
}
