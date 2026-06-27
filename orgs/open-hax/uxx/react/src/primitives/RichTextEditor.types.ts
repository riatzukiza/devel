import type { ReactNode } from 'react';

export interface ToolbarConfig {
  items?: ToolbarItem[];
  groups?: ToolbarGroup[];
}

export interface ToolbarItem {
  type:
    | 'bold'
    | 'italic'
    | 'underline'
    | 'strikethrough'
    | 'code'
    | 'heading'
    | 'quote'
    | 'list'
    | 'link'
    | 'image'
    | 'code-block'
    | 'divider'
    | 'undo'
    | 'redo';
  icon?: ReactNode;
  label?: string;
  shortcut?: string;
}

export interface ToolbarGroup {
  name: string;
  items: ToolbarItem[];
}

export interface MentionItem {
  id: string;
  name: string;
  avatar?: string;
  description?: string;
}
