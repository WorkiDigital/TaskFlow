import { useState, useEffect } from "react";
import { 
  WhatsAppInstance, 
  WhatsAppGroup, 
  mockInstance, 
  mockCapabilities 
} from "@/data/mockWhatsAppConnection";
import { InstanceStatusCard } from "./InstanceStatusCard";
import { QRCodeConnectionCard } from "./QRCodeConnectionCard";
import { WhatsAppCapabilitiesChecklist } from "./WhatsAppCapabilitiesChecklist";
import { ConnectedGroupsManager } from "./ConnectedGroupsManager";
import { WhatsAppTestMessagePanel } from "./WhatsAppTestMessagePanel";
import { WhatsAppAutomationReadiness } from "./WhatsAppAutomationReadiness";
import { toast } from "sonner";
import { evolutionService } from "@/services/evolutionService";

export function WhatsAppConnectionPanel() {
  const [instance, setInstance] = useState<WhatsAppInstance>(mockInstance);
  const [groups, setGroups] = useState<WhatsAppGroup[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [qrCode, setQrCode] = useState<string | undefined>();
  const [pairingCode, setPairingCode] = useState<string | undefined>();

  useEffect(() => {
    void handleRefresh();
  }, []);

  const saveStatus = (newInst: WhatsAppInstance) => {
    setInstance(newInst);
    window.dispatchEvent(new Event('whatsapp_status_changed'));
  };

  const handleConnect = async () => {
    await handleGenerateQR();
  };

  const handleGenerateQR = async () => {
    setIsLoading(true);
    try {
      const connection = await evolutionService.connect(instance.instanceName);
      setQrCode(connection.qrCode);
      setPairingCode(connection.pairingCode);
      saveStatus({
        ...instance,
        status: connection.status,
        lastSyncAt: new Date().toISOString(),
      });
      toast.success(connection.status === 'connected' ? "WhatsApp ja conectado!" : "QR Code gerado com sucesso!");
    } catch (error) {
      saveStatus({ ...instance, status: 'error' });
      toast.error(error instanceof Error ? error.message : "Nao foi possivel gerar o QR Code.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setIsLoading(true);
    try {
      await evolutionService.logout(instance.instanceName);
      setQrCode(undefined);
      setPairingCode(undefined);
      saveStatus({ ...instance, status: 'disconnected', phoneNumber: "", lastSyncAt: undefined });
      toast.info("WhatsApp desconectado.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel desconectar o WhatsApp.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      const currentInstance = await evolutionService.getStatus(instance.instanceName);
      saveStatus(currentInstance);
      if (currentInstance.status === 'connected') {
        setQrCode(undefined);
        setPairingCode(undefined);
        const syncedGroups = await evolutionService.fetchGroups(currentInstance.instanceName);
        setGroups(syncedGroups);
      }
    } catch (error) {
      saveStatus({ ...instance, status: 'error' });
      toast.error(error instanceof Error ? error.message : "Nao foi possivel atualizar o status.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetDefaultInternal = (groupId: string) => {
    setGroups(groups.map(g => ({
      ...g,
      isDefaultInternal: g.id === groupId
    })));
    toast.success("Grupo interno padrão atualizado!");
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <InstanceStatusCard 
          instance={instance} 
          onConnect={handleConnect}
          onDisconnect={handleDisconnect}
          onRefresh={handleRefresh}
          isLoading={isLoading}
        />
        
        <QRCodeConnectionCard 
          status={instance.status}
          onGenerateQR={handleGenerateQR}
          isLoading={isLoading}
          qrCode={qrCode}
          pairingCode={pairingCode}
        />
      </div>

      <WhatsAppCapabilitiesChecklist 
        capabilities={mockCapabilities.map((capability) => ({
          ...capability,
          status: instance.status === 'connected' ? 'available' : capability.status,
        }))} 
        connectionStatus={instance.status} 
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ConnectedGroupsManager 
          groups={groups}
          connectionStatus={instance.status}
          onSync={async () => {
            const syncedGroups = await evolutionService.fetchGroups(instance.instanceName);
            setGroups(syncedGroups);
          }}
          onSetDefaultInternal={handleSetDefaultInternal}
        />

        <WhatsAppTestMessagePanel 
          connectionStatus={instance.status}
          instanceName={instance.instanceName}
        />
      </div>

      <WhatsAppAutomationReadiness 
        connectionStatus={instance.status}
        groups={groups}
      />
    </div>
  );
}
