import type { OAuthRegisteredClientsStore } from "@modelcontextprotocol/sdk/server/auth/clients.js";

import type { Persistence } from "./types.js";

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
  private readonly persistence?: Persistence;

  constructor(bootstrapClients: ClientInfo[] = [], persistence?: Persistence) {
    this.persistence = persistence;
    bootstrapClients.forEach((client) => {
      if (client.client_id) {
        this.clients.set(client.client_id, client);
      }
    });
  }

  async getClient(clientId: string): Promise<ClientInfo | undefined> {
    const inMemory = this.clients.get(clientId);
    if (inMemory) {
      return inMemory;
    }

    if (!this.persistence) {
      return undefined;
    }

    const persisted = await this.persistence.getClient(clientId);
    if (!persisted) {
      return undefined;
    }

    const hydrated: ClientInfo = {
      client_id: persisted.clientId,
      client_secret: persisted.clientSecret,
      client_name: persisted.clientName,
      redirect_uris: persisted.redirectUris,
      token_endpoint_auth_method: persisted.tokenEndpointAuthMethod,
      grant_types: persisted.grantTypes,
      response_types: persisted.responseTypes,
      client_id_issued_at: persisted.clientIdIssuedAt,
      client_secret_expires_at: persisted.clientSecretExpiresAt,
    };

    this.clients.set(clientId, hydrated);
    return hydrated;
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

    clientInfo.redirect_uris.forEach((ru) => {
      const u = new URL(ru);
      const isAllowed = u.protocol === "https:" || (u.protocol === "http:" && (u.hostname === "localhost" || u.hostname === "127.0.0.1"));
      if (!isAllowed) {
        throw new Error(`redirect_uri not allowed: ${ru}`);
      }
    });

    this.clients.set(clientId, clientInfo);

    if (this.persistence) {
      await this.persistence.setClient(clientId, {
        clientId: clientInfo.client_id,
        clientSecret: clientInfo.client_secret,
        clientName: clientInfo.client_name,
        redirectUris: clientInfo.redirect_uris,
        tokenEndpointAuthMethod: clientInfo.token_endpoint_auth_method,
        grantTypes: clientInfo.grant_types,
        responseTypes: clientInfo.response_types,
        clientIdIssuedAt: clientInfo.client_id_issued_at,
        clientSecretExpiresAt: clientInfo.client_secret_expires_at,
      });
    }

    return clientInfo;
  }
}
