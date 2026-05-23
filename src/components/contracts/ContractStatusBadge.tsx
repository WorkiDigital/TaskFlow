import { StatusBadge } from '@/components/ui/StatusBadge';
import type { ContractStatus } from '@/lib/types';

/**
 * Badge visualizando o status de um contrato.
 * Mapeia os status do modelo `ContractStatus` para tons e rótulos
 * compatíveis com o componente genérico `StatusBadge`.
 */
export function ContractStatusBadge({ status }: { status: ContractStatus }) {
  const map: Record<ContractStatus, { label: string; tone: any }> = {
    draft: { label: 'Rascunho', tone: 'neutral' },
    pending: { label: 'Pendente assinatura', tone: 'warning' },
    sent: { label: 'Enviado', tone: 'info' },
    signed: { label: 'Assinado', tone: 'success' },
    expired: { label: 'Expirado', tone: 'danger' },
    cancelled: { label: 'Cancelado', tone: 'danger' },
    error: { label: 'Erro', tone: 'danger' },
  };
  const cfg = map[status] ?? map['draft'];
  return <StatusBadge tone={cfg.tone}>{cfg.label}</StatusBadge>;
}
