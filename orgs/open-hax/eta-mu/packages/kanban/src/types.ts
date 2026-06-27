export const defaultStatusOrder = [
  "icebox",
  "incoming",
  "accepted",
  "breakdown",
  "blocked",
  "ready",
  "todo",
  "in_progress",
  "review",
  "document",
  "done",
  "rejected"
] as const;

export const priorityColors: Record<string, string> = {
  P0: "black",
  P1: "red",
  P2: "orange",
  P3: "green"
};

export interface KanbanTask {
  uuid: string;
  title: string;
  slug: string;
  status: string;
  priority: string;
  labels: string[];
  createdAt: string;
  content: string;
  sourcePath: string;
}

export interface KanbanColumnSnapshot {
  status: string;
  title: string;
  taskCount: number;
  tasks: KanbanTask[];
}

export interface KanbanBoardSnapshot {
  generatedAt: string;
  totalTasks: number;
  columns: KanbanColumnSnapshot[];
}

export interface KanbanProjectConfig {
  id?: string;
  title?: string;
  tasksDir: string;
}

export interface KanbanProject {
  id: string;
  title: string;
  tasksDir: string;
}

export interface KanbanConfigFile {
  tasksDir?: string;
  boardFile?: string;
  defaultProject?: string;
  projects?: KanbanProjectConfig[];
  trello?: {
    boardId?: string;
    boardUrl?: string;
    archiveMissing?: boolean;
    listMapping?: Record<string, string>;
  };
  github?: {
    repo?: string;
    closeDone?: boolean;
    closeRejected?: boolean;
    manageLabels?: boolean;
  };
}

export interface LoadedKanbanConfig {
  config: KanbanConfigFile;
  configPath?: string;
  configDir: string;
}

export interface TrelloAuthConfig {
  apiKey: string;
  apiToken: string;
  baseUrl?: string;
}

export interface TrelloBoard {
  id: string;
  name: string;
  url: string;
  shortUrl: string;
  closed: boolean;
}

export interface TrelloList {
  id: string;
  idBoard: string;
  name: string;
  closed: boolean;
  pos: number;
}

export interface TrelloLabel {
  id: string;
  idBoard: string;
  name: string;
  color: string | null;
}

export interface TrelloCard {
  id: string;
  idList: string;
  name: string;
  desc: string;
  closed: boolean;
  idLabels: string[];
  labels: TrelloLabel[];
  shortUrl: string;
}

export interface TrelloBoardState {
  board: TrelloBoard;
  lists: TrelloList[];
  labels: TrelloLabel[];
  cards: TrelloCard[];
}

export interface TrelloSyncOptions {
  boardIdOrUrl: string;
  dryRun?: boolean;
  archiveMissing?: boolean;
  listMapping?: Record<string, string>;
}

export type TrelloSyncOperation =
  | {
      type: "createList";
      listName: string;
      position: number;
    }
  | {
      type: "createLabel";
      labelName: string;
      color: string;
    }
  | {
      type: "createCard";
      task: KanbanTask;
      listName: string;
      labelNames: string[];
      description: string;
    }
  | {
      type: "updateCard";
      cardId: string;
      task: KanbanTask;
      listName: string;
      labelNames: string[];
      description: string;
    }
  | {
      type: "archiveCard";
      cardId: string;
      cardName: string;
    };

export interface TrelloSyncPlan {
  operations: TrelloSyncOperation[];
  summary: {
    createLists: number;
    createLabels: number;
    createCards: number;
    updateCards: number;
    archiveCards: number;
  };
}

export interface TrelloSyncResult {
  board: TrelloBoard;
  plan: TrelloSyncPlan;
  appliedOperations: TrelloSyncOperation[];
}
