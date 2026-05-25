import React from "react";
import { Check, ChevronsUpDown, PlusCircle, Settings } from "lucide-react";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export function WorkspaceSwitcher() {
  const { workspaces, activeWorkspace, switchWorkspace, isLoading } = useWorkspace();
  const [open, setOpen] = React.useState(false);

  if (isLoading) {
    return (
      <Button variant="outline" className="w-full justify-between text-muted-foreground">
        Carregando...
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between truncate"
        >
          {activeWorkspace ? activeWorkspace.name : "Selecione um workspace..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[220px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar workspace..." />
          <CommandList>
            <CommandEmpty>Nenhum workspace encontrado.</CommandEmpty>
            <CommandGroup heading="Seus Workspaces">
              {workspaces.map((workspace) => (
                <CommandItem
                  key={workspace.id}
                  value={workspace.name}
                  onSelect={() => {
                    switchWorkspace(workspace.id);
                    setOpen(false);
                  }}
                  className="text-sm"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      activeWorkspace?.id === workspace.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {workspace.name}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup>
              <CommandItem
                onSelect={() => {
                  setOpen(false);
                  // TODO: Abrir modal de criar workspace
                  document.dispatchEvent(new CustomEvent("open-create-workspace"));
                }}
                className="cursor-pointer"
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Criar novo workspace
              </CommandItem>
              {activeWorkspace && (
                <CommandItem
                  onSelect={() => {
                    setOpen(false);
                    // TODO: Abrir modal de configurações
                    document.dispatchEvent(new CustomEvent("open-workspace-settings"));
                  }}
                  className="cursor-pointer"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Configurações do workspace
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
