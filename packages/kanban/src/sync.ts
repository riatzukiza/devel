import { buildColumnTitle } from "./tasks.js";
import { TrelloClient } from "./trello-client.js";
import {
  defaultStatusOrder,
  priorityColors,
  type KanbanTask,
  type TrelloBoardState,
  type TrelloCard,
  type TrelloLabel,
  type TrelloList,
  type TrelloSyncOperation,
  type TrelloSyncOptions,
  type TrelloSyncPlan,
  type TrelloSyncResult
} from "./types.js";

const uuidMarker = "Kanban UUID:";

const normalizeListMapping = (mapping: Record<string, string> | undefined): Record<string, string> => {
  return Object.fromEntries(
    Object.entries(mapping ?? {}).map(([status, listName]) => [status.toLowerCase(), listName])
  );
};

const listNameForStatus = (status: string, mapping: Record<string, string>): string => {
  return mapping[status] ?? buildColumnTitle(status);
};

const TRELLO_DESC_MAX = 16384;

const sanitizeDescription = (text: string): string => {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\0/g, "")
    .substring(0, TRELLO_DESC_MAX);
};

export const buildCardDescription = (task: KanbanTask): string => {
  const sections = [
    `${uuidMarker} ${task.uuid}`,
    `Status: ${task.status}`,
    `Priority: ${task.priority}`,
    `Labels: ${task.labels.join(", ") || "none"}`,
    `Source: ${task.sourcePath}`,
    "",
    task.content || "No task body provided."
  ];

  return sanitizeDescription(sections.join("\n"));
};

export const extractTaskUuidFromCard = (card: Pick<TrelloCard, "desc">): string | undefined => {
  const match = card.desc.match(/Kanban UUID:\s*(.+)$/mu);
  return match?.[1]?.trim();
};

const cardNeedsUpdate = (
  card: TrelloCard,
  task: KanbanTask,
  description: string,
  targetListName: string,
  listById: Map<string, TrelloList>,
  desiredLabelNames: string[]
): boolean => {
  const currentListName = listById.get(card.idList)?.name;
  const currentLabelNames = card.labels.map((label) => label.name).sort();
  const nextLabelNames = [...desiredLabelNames].sort();

  return (
    card.name !== task.title ||
    card.desc !== description ||
    currentListName !== targetListName ||
    currentLabelNames.join(",") !== nextLabelNames.join(",")
  );
};

export const planTrelloSync = (
  tasks: KanbanTask[],
  boardState: TrelloBoardState,
  options: Omit<TrelloSyncOptions, "boardIdOrUrl">
): TrelloSyncPlan => {
  const operations: TrelloSyncOperation[] = [];
  const normalizedListMapping = normalizeListMapping(options.listMapping);
  const listByName = new Map(boardState.lists.map((list) => [list.name, list]));
  const labelByName = new Map(boardState.labels.map((label) => [label.name, label]));
  const listById = new Map(boardState.lists.map((list) => [list.id, list]));
  const taskIds = new Set(tasks.map((task) => task.uuid));
  const cardByUuid = new Map<string, TrelloCard>();
  const unnamedCardsByTitle = new Map<string, TrelloCard>();

  for (const card of boardState.cards) {
    const taskUuid = extractTaskUuidFromCard(card);
    if (taskUuid) {
      cardByUuid.set(taskUuid, card);
      continue;
    }

    if (!unnamedCardsByTitle.has(card.name)) {
      unnamedCardsByTitle.set(card.name, card);
    }
  }

  const orderedStatuses = Array.from(
    new Set([...defaultStatusOrder, ...tasks.map((task) => task.status)])
  );

  orderedStatuses.forEach((status, index) => {
    const listName = listNameForStatus(status, normalizedListMapping);
    if (!listByName.has(listName)) {
      operations.push({
        type: "createList",
        listName,
        position: index + 1
      });
    }
  });

  Object.entries(priorityColors).forEach(([labelName, color]) => {
    if (!labelByName.has(labelName)) {
      operations.push({
        type: "createLabel",
        labelName,
        color
      });
    }
  });

  for (const task of tasks) {
    const description = buildCardDescription(task);
    const labelNames = priorityColors[task.priority] ? [task.priority] : [];
    const targetListName = listNameForStatus(task.status, normalizedListMapping);
    const existingCard = cardByUuid.get(task.uuid) ?? unnamedCardsByTitle.get(task.title);

    if (!existingCard) {
      operations.push({
        type: "createCard",
        task,
        listName: targetListName,
        labelNames,
        description
      });
      continue;
    }

    if (cardNeedsUpdate(existingCard, task, description, targetListName, listById, labelNames)) {
      operations.push({
        type: "updateCard",
        cardId: existingCard.id,
        task,
        listName: targetListName,
        labelNames,
        description
      });
    }
  }

  if (options.archiveMissing) {
    for (const card of boardState.cards) {
      const taskUuid = extractTaskUuidFromCard(card);
      if (taskUuid && !taskIds.has(taskUuid) && !card.closed) {
        operations.push({
          type: "archiveCard",
          cardId: card.id,
          cardName: card.name
        });
      }
    }
  }

  return {
    operations,
    summary: {
      createLists: operations.filter((operation) => operation.type === "createList").length,
      createLabels: operations.filter((operation) => operation.type === "createLabel").length,
      createCards: operations.filter((operation) => operation.type === "createCard").length,
      updateCards: operations.filter((operation) => operation.type === "updateCard").length,
      archiveCards: operations.filter((operation) => operation.type === "archiveCard").length
    }
  };
};

const labelIdsForNames = (labels: TrelloLabel[], labelNames: string[]): string[] => {
  const labelMap = new Map(labels.map((label) => [label.name, label.id]));
  return labelNames.flatMap((labelName) => {
    const labelId = labelMap.get(labelName);
    return labelId ? [labelId] : [];
  });
};

const listIdForName = (lists: TrelloList[], listName: string): string => {
  const list = lists.find((entry) => entry.name === listName);
  if (!list) {
    throw new Error(`Missing Trello list '${listName}' after list creation step.`);
  }

  return list.id;
};

export const syncTasksToTrello = async (
  client: TrelloClient,
  tasks: KanbanTask[],
  options: TrelloSyncOptions
): Promise<TrelloSyncResult> => {
  const board = await client.getBoard(options.boardIdOrUrl);
  let lists = await client.getLists(board.id);
  let labels = await client.getLabels(board.id);
  const cards = await client.getCards(board.id);

  const plan = planTrelloSync(tasks, { board, lists, labels, cards }, options);
  const appliedOperations: TrelloSyncOperation[] = [];

  if (options.dryRun) {
    return { board, plan, appliedOperations };
  }

  for (const operation of plan.operations) {
    switch (operation.type) {
      case "createList": {
        const createdList = await client.createList(board.id, operation.listName, operation.position);
        lists = [...lists, createdList];
        appliedOperations.push(operation);
        break;
      }
      case "createLabel": {
        const createdLabel = await client.createLabel(board.id, operation.labelName, operation.color);
        labels = [...labels, createdLabel];
        appliedOperations.push(operation);
        break;
      }
      case "createCard": {
        await client.createCard({
          listId: listIdForName(lists, operation.listName),
          name: operation.task.title,
          description: operation.description,
          labelIds: labelIdsForNames(labels, operation.labelNames)
        });
        appliedOperations.push(operation);
        break;
      }
      case "updateCard": {
        await client.updateCard(operation.cardId, {
          listId: listIdForName(lists, operation.listName),
          name: operation.task.title,
          description: operation.description,
          labelIds: labelIdsForNames(labels, operation.labelNames)
        });
        appliedOperations.push(operation);
        break;
      }
      case "archiveCard": {
        await client.archiveCard(operation.cardId);
        appliedOperations.push(operation);
        break;
      }
    }
  }

  return { board, plan, appliedOperations };
};
