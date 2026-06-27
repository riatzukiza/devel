import type { Meta, StoryObj } from '@storybook/react';
import { DiffViewer } from './DiffViewer';

const meta: Meta<typeof DiffViewer> = {
  title: 'KMS IDE/DiffViewer',
  component: DiffViewer,
  tags: ['autodocs'],
  parameters: {
    design: {
      type: 'contract',
      url: '../contracts/diff-viewer.edn',
    },
  },
};

export default meta;
type Story = StoryObj<typeof DiffViewer>;

const originalTypeScript = `import React from 'react';

interface ButtonProps {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export function Button({ variant = 'primary', size = 'md', children }: ButtonProps) {
  return (
    <button className={\`btn btn-\${variant} btn-\${size}\`}>
      {children}
    </button>
  );
}`;

const modifiedTypeScript = `import React from 'react';

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}

export function Button({
  variant = 'primary',
  size = 'md',
  disabled = false,
  children,
  onClick,
}: ButtonProps) {
  return (
    <button
      className={\`btn btn-\${variant} btn-\${size}\`}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}`;

const originalClojure = `(ns my-app.core
  (:require [reagent.core :as r]))

(defn button [props children]
  [:button {:class "btn"}
   children])

(defn main-panel []
  [:div
   [button {} "Click me"]])`;

const modifiedClojure = `(ns my-app.core
  (:require [reagent.core :as r]
            [re-frame.core :as rf]))

(defn button [{:keys [variant size on-click disabled]
               :or {variant :primary
                    size :md
                    disabled false}}
              children]
  [:button
   {:class (str "btn btn-" (name variant) " btn-" (name size))
    :disabled disabled
    :on-click on-click}
   children])

(defn main-panel []
  (let [loading (rf/subscribe [:loading])]
    (fn []
      [:div
       [button {:variant :primary
                :on-click #(rf/dispatch [:submit])
                :disabled @loading}
        "Submit"]])))`;

const originalConfig = `{
  "name": "my-app",
  "version": "1.0.0",
  "dependencies": {
    "react": "^18.0.0"
  }
}`;

const modifiedConfig = `{
  "name": "my-app",
  "version": "2.0.0",
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "typescript": "^5.0.0"
  },
  "scripts": {
    "build": "tsc && vite build",
    "dev": "vite"
  }
}`;

export const Unified: Story = {
  args: {
    original: originalTypeScript,
    modified: modifiedTypeScript,
    filename: 'Button.tsx',
    mode: 'unified',
  },
};

export const Split: Story = {
  args: {
    original: originalTypeScript,
    modified: modifiedTypeScript,
    filename: 'Button.tsx',
    mode: 'split',
  },
};

export const ClojureDiff: Story = {
  args: {
    original: originalClojure,
    modified: modifiedClojure,
    filename: 'core.cljs',
    mode: 'unified',
  },
};

export const ConfigDiff: Story = {
  args: {
    original: originalConfig,
    modified: modifiedConfig,
    filename: 'package.json',
    language: 'json',
    mode: 'unified',
  },
};

export const WithoutStats: Story = {
  args: {
    original: originalTypeScript,
    modified: modifiedTypeScript,
    filename: 'Button.tsx',
    showStats: false,
  },
};

export const WithoutFilename: Story = {
  args: {
    original: originalTypeScript,
    modified: modifiedTypeScript,
    showFilename: false,
  },
};

export const WithoutLineNumbers: Story = {
  args: {
    original: originalTypeScript,
    modified: modifiedTypeScript,
    filename: 'Button.tsx',
    lineNumbers: false,
  },
};

export const WithHighlight: Story = {
  args: {
    original: originalTypeScript,
    modified: modifiedTypeScript,
    filename: 'Button.tsx',
    highlightLines: {
      original: [7, 8, 9, 10],
      modified: [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17],
    },
  },
};

const manyLinesOriginal = Array(50).fill(null).map((_, i) => `// Line ${i + 1}`).join('\n');
const manyLinesModified = manyLinesOriginal + '\n// New line at end';

export const LargeDiff: Story = {
  args: {
    original: manyLinesOriginal,
    modified: manyLinesModified,
    filename: 'large-file.ts',
    mode: 'unified',
  },
};

const addedOnly = `// New file created`;
const emptyOriginal = ``;

export const NewFile: Story = {
  args: {
    original: emptyOriginal,
    modified: addedOnly,
    filename: 'new-file.ts',
    mode: 'unified',
  },
};

const deletedOnly = `// This file will be deleted`;

export const DeletedFile: Story = {
  args: {
    original: deletedOnly,
    modified: emptyOriginal,
    filename: 'deleted-file.ts',
    mode: 'unified',
  },
};

export const NoChanges: Story = {
  args: {
    original: originalTypeScript,
    modified: originalTypeScript,
    filename: 'unchanged.ts',
    mode: 'unified',
  },
};
