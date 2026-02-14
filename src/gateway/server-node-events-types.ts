import type { ModelCatalogEntry } from "../agents/model-catalog.js";
import type { CliDeps } from "../cli/deps.js";
import type { HealthSummary } from "../commands/health.js";
import type { ChatAbortControllerEntry } from "./chat-abort.js";
import type { ChatRunEntry } from "./server-chat.js";
import type { DedupeEntry } from "./server-shared.js";

export type NodeEventContext = {
  deps: CliDeps;
  broadcast: (event: string, payload: unknown, opts?: { dropIfSlow?: boolean }) => void;
  nodeSendToSession: (sessionKey: string, event: string, payload: unknown) => void;
  nodeSubscribe: (nodeId: string, sessionKey: string) => void;
  nodeUnsubscribe: (nodeId: string, sessionKey: string) => void;
  broadcastVoiceWakeChanged: (triggers: string[]) => void;
  addChatRun: (sessionId: string, entry: ChatRunEntry) => void;
  removeChatRun: (
    sessionId: string,
    clientRunId: string,
    sessionKey?: string,
  ) => ChatRunEntry | undefined;
  chatAbortControllers: Map<string, ChatAbortControllerEntry>;
  chatAbortedRuns: import("./server-chat.js").ChatRunState["abortedRuns"];
  chatRunBuffers: import("./server-chat.js").ChatRunState["buffers"];
  chatDeltaSentAt: import("./server-chat.js").ChatRunState["deltaSentAt"];
  dedupe: Map<string, DedupeEntry>;
  agentRunSeq: Map<string, number>;
  getHealthCache: () => HealthSummary | null;
  refreshHealthSnapshot: (opts?: { probe?: boolean }) => Promise<HealthSummary>;
  loadGatewayModelCatalog: () => Promise<ModelCatalogEntry[]>;
  logGateway: { warn: (msg: string) => void };
};

export type NodeEvent = {
  event: string;
  payloadJSON?: string | null;
};
