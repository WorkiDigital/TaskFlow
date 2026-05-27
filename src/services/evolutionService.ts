import { supabase } from "./supabase";
import type {
  WhatsAppConnectionStatus,
  WhatsAppGroup,
  WhatsAppInstance,
} from "@/data/mockWhatsAppConnection";

const DEFAULT_INSTANCE_NAME = "TaskFlow-Evolution-1";

type EvolutionConnectionState = {
  state?: string;
  connection?: string;
  status?: string;
  instance?: {
    instanceName?: string;
    state?: string;
    status?: string;
    profileName?: string;
    owner?: string;
  };
  qrcode?:
    | string
    | {
        base64?: string;
        code?: string;
        pairingCode?: string | null;
      };
  base64?: string;
  code?: string;
  pairingCode?: string;
};

export type EvolutionConnectResult = {
  status: WhatsAppConnectionStatus;
  qrCode?: string;
  pairingCode?: string;
  raw: unknown;
};

function toConnectionStatus(value?: string): WhatsAppConnectionStatus {
  const state = value?.toLowerCase();

  if (state === "open" || state === "connected" || state === "online") return "connected";
  if (state === "connecting") return "connecting";
  if (state === "qr" || state === "qrcode" || state === "waiting_qr") return "waiting_qr";
  if (state === "close" || state === "closed" || state === "disconnected" || state === "offline") {
    return "disconnected";
  }

  return "disconnected";
}

function getState(payload: EvolutionConnectionState): string | undefined {
  return (
    payload.instance?.state ??
    payload.instance?.status ??
    payload.state ??
    payload.connection ??
    payload.status
  );
}

function normalizeQrCode(payload: EvolutionConnectionState): string | undefined {
  const qrCode =
    typeof payload.qrcode === "object"
      ? (payload.qrcode.base64 ?? payload.qrcode.code)
      : (payload.qrcode ?? payload.base64);
  if (!qrCode) return undefined;
  if (qrCode.startsWith("data:image")) return qrCode;
  if (qrCode.startsWith("http")) return qrCode;
  if (qrCode.length > 200) return `data:image/png;base64,${qrCode.replace(/^base64,/, "")}`;
  return qrCode;
}

function normalizeGroup(group: Record<string, unknown>, index: number): WhatsAppGroup {
  const id = String(group.id ?? group.jid ?? group.remoteJid ?? group.groupJid ?? `group-${index}`);
  const participants = Array.isArray(group.participants) ? group.participants : [];

  return {
    id,
    jid: String(group.jid ?? group.id ?? group.remoteJid ?? group.groupJid ?? id),
    name: String(group.subject ?? group.name ?? group.title ?? "Grupo sem nome"),
    type: "client",
    membersCount: Number(group.size ?? group.participantsCount ?? participants.length ?? 0),
    lastSyncAt: new Date().toISOString(),
  };
}

async function invokeEvolution<T>(functionName: string, body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke<T>(functionName, { body });

  if (error) {
    const context = (error as { context?: unknown }).context;
    if (context instanceof Response) {
      const payload = (await context.json().catch(() => null)) as {
        error?: string;
        message?: string;
      } | null;
      throw new Error(payload?.error ?? payload?.message ?? error.message);
    }

    throw new Error(error.message);
  }

  const maybeError = data as { error?: string } | null;
  if (maybeError?.error) {
    throw new Error(maybeError.error);
  }

  return data as T;
}

export const evolutionService = {
  instanceName: DEFAULT_INSTANCE_NAME,

  async getStatus(instanceName = DEFAULT_INSTANCE_NAME): Promise<WhatsAppInstance> {
    const data = await invokeEvolution<EvolutionConnectionState>("evolution-instance", {
      action: "status",
      instanceName,
    });
    const state = getState(data);

    return {
      id: instanceName,
      agencyId: instanceName,
      instanceName,
      displayName: data.instance?.profileName ?? "WhatsApp Principal",
      phoneNumber: data.instance?.owner ?? "",
      status: toConnectionStatus(state),
      lastSyncAt: new Date().toISOString(),
      apiBaseUrl: "https://painelevo.workidigital.tech",
      maskedApiKey: "***************",
    };
  },

  async connect(instanceName = DEFAULT_INSTANCE_NAME): Promise<EvolutionConnectResult> {
    const data = await invokeEvolution<EvolutionConnectionState>("evolution-instance", {
      action: "connect",
      instanceName,
    });

    return {
      status: normalizeQrCode(data) ? "waiting_qr" : toConnectionStatus(getState(data)),
      qrCode: normalizeQrCode(data),
      pairingCode:
        data.pairingCode ??
        (typeof data.qrcode === "object" ? (data.qrcode.pairingCode ?? undefined) : undefined),
      raw: data,
    };
  },

  async logout(instanceName = DEFAULT_INSTANCE_NAME) {
    return invokeEvolution("evolution-instance", {
      action: "logout",
      instanceName,
    });
  },

  async fetchGroups(instanceName = DEFAULT_INSTANCE_NAME): Promise<WhatsAppGroup[]> {
    const data = await invokeEvolution<unknown>("evolution-groups", { instanceName });
    const groups = Array.isArray(data)
      ? data
      : Array.isArray((data as { groups?: unknown[] })?.groups)
        ? (data as { groups: unknown[] }).groups
        : Array.isArray((data as { data?: unknown[] })?.data)
          ? (data as { data: unknown[] }).data
          : Array.isArray((data as { value?: unknown[] })?.value)
            ? (data as { value: unknown[] }).value
            : [];

    return groups.map((group, index) => normalizeGroup(group as Record<string, unknown>, index));
  },

  async sendTextMessage(payload: {
    instanceName?: string;
    number: string;
    text: string;
    delay?: number;
    linkPreview?: boolean;
    mentionsEveryOne?: boolean;
    mentioned?: string[];
  }) {
    return invokeEvolution("evolution-message", {
      action: "send_text",
      instanceName: payload.instanceName ?? DEFAULT_INSTANCE_NAME,
      number: payload.number,
      text: payload.text,
      delay: payload.delay ?? 1200,
      linkPreview: payload.linkPreview ?? true,
      mentionsEveryOne: payload.mentionsEveryOne ?? false,
      mentioned: payload.mentioned ?? [],
    });
  },
};
