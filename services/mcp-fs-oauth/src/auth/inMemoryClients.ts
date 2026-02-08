import type { OAuthRegisteredClientsStore } from "@modelcontextprotocol/sdk/server/auth/clients.js";

export type ClientInfo = {
  client_id: string;
  client_secret: string;
  client_name: string;
  redirect_uris: string[];
  token_endpoint_auth_method: string;
  grant_types: string[];
  response_types: string[];
  client_id_issued_at?: number;
  client_secret_expires_at?: number;
};

export class InMemoryClientsStore implements OAuthRegisteredClientsStore {
  private readonly clients = new Map<string, ClientInfo>();

  constructor(bootstrapClients: ClientInfo[] = []) {
    bootstrapClients.forEach(client => {
      if (client.client_id) {
        this.clients.set(client.client_id, client);
      }
    });
  }

  async getClient(clientId: string): Promise<ClientInfo | undefined> {
    return this.clients.get(clientId);
  }

  async registerClient(client: Partial<ClientInfo>): Promise<ClientInfo> {
    const clientId = crypto.randomUUID();
    const now = Math.floor(Date.now() / 1000);

    const tokenEndpointAuthMethod = client.token_endpoint_auth_method ?? "none";

    const clientInfo: ClientInfo = {
      client_name: client.client_name ?? "Unknown",
      redirect_uris: client.redirect_uris ?? [],
      grant_types: client.grant_types ?? ["authorization_code", "refresh_token"],
      response_types: client.response_types ?? ["code"],
      ...client,
      client_id: clientId,
      client_id_issued_at: now,
      token_endpoint_auth_method: tokenEndpointAuthMethod,
      client_secret: tokenEndpointAuthMethod !== "none" ? crypto.randomUUID() : "",
      client_secret_expires_at: 0,
    };

    if (clientInfo.redirect_uris.length === 0) {
      throw new Error("redirect_uris required");
    }

    clientInfo.redirect_uris.forEach(ru => {
      const u = new URL(ru);
      const isAllowed = u.protocol === "https:" || (u.protocol === "http:" && (u.hostname === "localhost" || u.hostname === "127.0.0.1"));
      if (!isAllowed) {
        throw new Error(`redirect_uri not allowed: ${ru}`);
      }
    });

    this.clients.set(clientId, clientInfo);
    return clientInfo;
  }
}
