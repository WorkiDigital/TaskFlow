import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { ContractList } from "@/components/contracts/ContractList";
import { ContractBuilder } from "@/components/contracts/ContractBuilder";
import { mockContracts } from "@/lib/mock-data";

export const Route = createFileRoute("/_app/contracts")({
  component: ContractsPage,
});

function ContractsPage() {
  useEffect(() => {
    console.log("[Contracts] página carregada", mockContracts.length);
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Contratos</h2>
        <p className="text-sm text-muted-foreground">Acompanhe rascunhos, pendências e assinaturas.</p>
      </div>

      <section>
        <h3 className="mb-3 text-sm font-medium text-muted-foreground">Contratos recentes</h3>
        <ContractList contracts={mockContracts} />
      </section>

      <section>
        <h3 className="mb-3 text-sm font-medium text-muted-foreground">Novo contrato</h3>
        <ContractBuilder />
      </section>
    </div>
  );
}
