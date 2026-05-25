import { ContractList } from "@/components/contracts/ContractList";
import { ContractBuilder } from "@/components/contracts/ContractBuilder";

export function ContractsListTab() {
  return (
    <div className="space-y-6">
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
