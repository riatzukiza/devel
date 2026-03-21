import type {
  TrelloAuthConfig,
  TrelloBoard,
  TrelloCard,
  TrelloLabel,
  TrelloList
} from "./types.js";

export const extractBoardId = (boardIdOrUrl: string): string => {
  if (boardIdOrUrl.startsWith("http://") || boardIdOrUrl.startsWith("https://")) {
    const parsedUrl = new URL(boardIdOrUrl);
    const segments = parsedUrl.pathname.split("/").filter(Boolean);
    if (segments[0] === "b" && segments[1]) {
      return segments[1];
    }
  }

  return boardIdOrUrl;
};

export class TrelloClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly apiToken: string;

  constructor(config: TrelloAuthConfig) {
    this.baseUrl = config.baseUrl ?? "https://api.trello.com/1";
    this.apiKey = config.apiKey;
    this.apiToken = config.apiToken;
  }

  private async request<T>(endpoint: string, init?: RequestInit): Promise<T> {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    url.searchParams.set("key", this.apiKey);
    url.searchParams.set("token", this.apiToken);

    const response = await fetch(url, {
      ...init,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(init?.headers ?? {})
      }
    });

    if (!response.ok) {
      throw new Error(`Trello API error ${response.status}: ${await response.text()}`);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  }

  async getBoard(boardIdOrUrl: string): Promise<TrelloBoard> {
    return this.request<TrelloBoard>(`/boards/${extractBoardId(boardIdOrUrl)}`);
  }

  async getLists(boardId: string): Promise<TrelloList[]> {
    return this.request<TrelloList[]>(`/boards/${boardId}/lists`);
  }

  async createList(boardId: string, name: string, position: number): Promise<TrelloList> {
    return this.request<TrelloList>("/lists", {
      method: "POST",
      body: JSON.stringify({
        idBoard: boardId,
        name,
        pos: position.toString()
      })
    });
  }

  async getLabels(boardId: string): Promise<TrelloLabel[]> {
    return this.request<TrelloLabel[]>(`/boards/${boardId}/labels`);
  }

  async createLabel(boardId: string, name: string, color: string): Promise<TrelloLabel> {
    return this.request<TrelloLabel>("/labels", {
      method: "POST",
      body: JSON.stringify({
        idBoard: boardId,
        name,
        color
      })
    });
  }

  async getCards(boardId: string): Promise<TrelloCard[]> {
    return this.request<TrelloCard[]>(`/boards/${boardId}/cards`);
  }

  async createCard(input: {
    listId: string;
    name: string;
    description: string;
    labelIds: string[];
  }): Promise<TrelloCard> {
    return this.request<TrelloCard>("/cards", {
      method: "POST",
      body: JSON.stringify({
        idList: input.listId,
        name: input.name,
        desc: input.description,
        idLabels: input.labelIds.join(",") || null
      })
    });
  }

  async updateCard(
    cardId: string,
    input: {
      listId: string;
      name: string;
      description: string;
      labelIds: string[];
    }
  ): Promise<TrelloCard> {
    return this.request<TrelloCard>(`/cards/${cardId}`, {
      method: "PUT",
      body: JSON.stringify({
        idList: input.listId,
        name: input.name,
        desc: input.description,
        idLabels: input.labelIds.join(",") || null
      })
    });
  }

  async archiveCard(cardId: string): Promise<void> {
    await this.request(`/cards/${cardId}/closed`, {
      method: "PUT",
      body: JSON.stringify({ value: true })
    });
  }
}
