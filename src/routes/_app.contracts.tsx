import { createFileRoute } from "@tanstack/react-router";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ContractsListTab } from "@/components/contracts/tabs/ContractsListTab";
import { TemplatesTab } from "@/components/contracts/tabs/TemplatesTab";
import { ServicesTab } from "@/components/contracts/tabs/ServicesTab";
import { VariablesTab } from "@/components/contracts/tabs/VariablesTab";

export const Route = createFileRoute("/_app/contracts")({
  component: ContractsPage,
});

function ContractsPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full px-4 py-6 md:px-8 md:py-8">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Contratos</h2>
        <p className="text-sm text-muted-foreground">
          Gerencie contratos, modelos, serviços e variáveis.
        </p>
      </div>

      <Tabs defaultValue="contracts">
        <TabsList className="mb-4">
          <TabsTrigger value="contracts">Contratos gerados</TabsTrigger>
          <TabsTrigger value="templates">Modelos</TabsTrigger>
          <TabsTrigger value="services">Serviços</TabsTrigger>
          <TabsTrigger value="variables">Variáveis</TabsTrigger>
        </TabsList>

        <TabsContent value="contracts">
          <ContractsListTab />
        </TabsContent>

        <TabsContent value="templates">
          <TemplatesTab />
        </TabsContent>

        <TabsContent value="services">
          <ServicesTab />
        </TabsContent>

        <TabsContent value="variables">
          <VariablesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
