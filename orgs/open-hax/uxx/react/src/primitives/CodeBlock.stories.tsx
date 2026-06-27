import type { Meta, StoryObj } from '@storybook/react';
import { CodeBlock } from './CodeBlock';

const meta: Meta<typeof CodeBlock> = {
  title: 'KMS IDE/CodeBlock',
  component: CodeBlock,
  tags: ['autodocs'],
  parameters: {
    design: {
      type: 'contract',
      url: '../contracts/code-block.edn',
    },
  },
};

export default meta;
type Story = StoryObj<typeof CodeBlock>;

const typescriptCode = `import React from 'react';

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  onClick?: () => void;
}

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  onClick,
}: ButtonProps) {
  return (
    <button
      className={\`btn btn-\${variant} btn-\${size}\`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}`;

const clojureCode = `(ns my-app.core
  (:require [reagent.core :as r]
            [re-frame.core :as rf]))

(defn button [{:keys [variant size on-click children]
               :or {variant :primary
                    size :md}}]
  [:button
   {:class (str "btn btn-" (name variant) " btn-" (name size))
    :on-click on-click}
   children])

(defn main-panel []
  (let [count (rf/subscribe [:counter])]
    (fn []
      [:div
       [button {:on-click #(rf/dispatch [:increment])}
        (str "Count: " @count)]])))`;

const pythonCode = `from dataclasses import dataclass
from typing import Optional, List
import asyncio

@dataclass
class User:
    id: str
    name: str
    email: str
    role: str = "user"

class UserRepository:
    def __init__(self, db_connection):
        self.db = db_connection
    
    async def get_user(self, user_id: str) -> Optional[User]:
        query = "SELECT * FROM users WHERE id = $1"
        row = await self.db.fetchrow(query, user_id)
        if row:
            return User(**dict(row))
        return None
    
    async def list_users(self, limit: int = 100) -> List[User]:
        query = "SELECT * FROM users LIMIT $1"
        rows = await self.db.fetch(query, limit)
        return [User(**dict(row)) for row in rows]`;

const rustCode = `use std::collections::HashMap;

#[derive(Debug, Clone)]
pub struct Cache<T> {
    data: HashMap<String, T>,
    capacity: usize,
}

impl<T: Clone> Cache<T> {
    pub fn new(capacity: usize) -> Self {
        Self {
            data: HashMap::with_capacity(capacity),
            capacity,
        }
    }
    
    pub fn get(&self, key: &str) -> Option<&T> {
        self.data.get(key)
    }
    
    pub fn insert(&mut self, key: String, value: T) -> Option<T> {
        if self.data.len() >= self.capacity {
            // Simple eviction: remove first key
            if let Some(first_key) = self.data.keys().next().cloned() {
                self.data.remove(&first_key);
            }
        }
        self.data.insert(key, value)
    }
}`;

export const TypeScript: Story = {
  args: {
    code: typescriptCode,
    language: 'typescript',
    filename: 'Button.tsx',
  },
};

export const Clojure: Story = {
  args: {
    code: clojureCode,
    language: 'clojure',
    filename: 'core.cljs',
  },
};

export const Python: Story = {
  args: {
    code: pythonCode,
    language: 'python',
    filename: 'user_repository.py',
  },
};

export const Rust: Story = {
  args: {
    code: rustCode,
    language: 'rust',
    filename: 'cache.rs',
  },
};

export const AutoDetect: Story = {
  args: {
    code: typescriptCode,
    filename: 'Button.tsx',
    // Language auto-detected from filename
  },
};

export const WithHighlighting: Story = {
  args: {
    code: typescriptCode,
    language: 'typescript',
    highlightLines: [1, 3, 4, 5, 6, 7],
  },
};

export const WithoutLineNumbers: Story = {
  args: {
    code: typescriptCode,
    language: 'typescript',
    lineNumbers: false,
  },
};

export const WithoutCopy: Story = {
  args: {
    code: typescriptCode,
    language: 'typescript',
    showCopy: false,
  },
};

export const Collapsed: Story = {
  args: {
    code: typescriptCode,
    language: 'typescript',
    collapsible: true,
    defaultCollapsed: true,
  },
};

export const MaxLines: Story = {
  args: {
    code: typescriptCode,
    language: 'typescript',
    maxLines: 10,
  },
};

export const DiffAdd: Story = {
  args: {
    code: typescriptCode.split('\n').slice(0, 10).join('\n'),
    language: 'typescript',
    diff: 'add',
    filename: 'Button.tsx (new)',
  },
};

export const DiffRemove: Story = {
  args: {
    code: typescriptCode.split('\n').slice(0, 10).join('\n'),
    language: 'typescript',
    diff: 'remove',
    filename: 'Button.tsx (deleted)',
  },
};

export const CustomStartLine: Story = {
  args: {
    code: typescriptCode.split('\n').slice(10, 20).join('\n'),
    language: 'typescript',
    startLine: 11,
    filename: 'Button.tsx (lines 11-20)',
  },
};

export const LineWrapping: Story = {
  args: {
    code: `// This is a very long line of code that demonstrates what happens when word wrapping is enabled versus disabled in the code block component`,
    language: 'typescript',
    wrap: true,
  },
};

const shortCode = `const x = 42;
console.log(x);`;

export const Minimal: Story = {
  args: {
    code: shortCode,
    showLanguage: false,
    showCopy: false,
  },
};
