import { z } from "zod";
import { MICROCOPY } from "@/lib/ux/microcopy";

/**
 * Contrato de validação da TrialForm — FONTE ÚNICA (cliente + servidor).
 * Rule 5 (frontend-architecture): o Server Action re-valida ESTE MESMO schema.
 * A validação do cliente é conveniência; o servidor é a fronteira.
 */
export const trialSchema = z.object({
  email: z.email(MICROCOPY.form.erroEmail),
});

export type TrialCampos = z.infer<typeof trialSchema>;
