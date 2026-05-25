import { GlassCard } from "@/components/ui/GlassCard";
import type { FC } from "react";

/**
 * Renderiza uma pré‑visualização do contrato.
 * Recebe o HTML já processado e o exibe dentro de um painel com estilo "glassmorphism".
 */
export const ContractPreviewPanel: FC<{ content: string }> = ({ content }) => {
  return (
    <GlassCard className="bg-background/40 overflow-auto max-h-96 p-5">
      {/*
        O conteúdo costuma ser HTML gerado a partir de um template.
        Utilizamos dangerouslySetInnerHTML por ser controlado internamente.
      */}
      <div
        className="prose prose-sm dark:prose-invert"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </GlassCard>
  );
};
