import { createFileRoute } from "@tanstack/react-router";
import { ContractList } from "@/components/contracts/ContractList";
import { ContractBuilder } from "@/components/contracts/ContractBuilder";

export const Route = createFileRoute("/_app/contracts")({
  component: ContractsPage,
});

function ContractsPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full px-4 py-6 md:px-8 md:py-8">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Contratos</h2>
        <p className="text-sm text-muted-foreground">Acompanhe rascunhos, pendências e assinaturas.</p>
      </div>

      <section>
        <h3 className="mb-3 text-sm font-medium text-muted-foreground">Contratos recentes</h3>
        <ContractList />
      </section>

      <section>
        <h3 className="mb-3 text-sm font-medium text-muted-foreground">Novo contrato</h3>
        <ContractBuilder />
      </section>
    </div>
  );
}
