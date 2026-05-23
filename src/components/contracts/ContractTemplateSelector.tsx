import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem, SelectLabel, SelectGroup } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useEffect, useState } from 'react';
import type { ContractTemplate } from '@/services/contractsService';

/**
 * Dropdown for selecting a contract template.
 * Displays the template name and passes the selected template ID back to the parent.
 */
export function ContractTemplateSelector({
  templates,
  selectedTemplateId,
  onSelect,
}: {
  templates: ContractTemplate[];
  selectedTemplateId?: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor="template-select">Template de contrato</Label>
      <Select value={selectedTemplateId} onValueChange={onSelect}>
        <SelectTrigger id="template-select" className="w-full">
          <SelectValue placeholder="Selecione um template" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Templates disponíveis</SelectLabel>
          </SelectGroup>
          {templates.map((t) => (
            <SelectItem key={t.id} value={t.id}>
              {t.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
