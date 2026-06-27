import type { Preview } from '@storybook/react';
import { ThemeProvider } from '../src/theme.js';

const themeBackgrounds = {
  monokai: '#272822',
  'night-owl': '#011627',
  'proxy-console': '#0A0C0F',
} as const;

const preview: Preview = {
  globalTypes: {
    theme: {
      name: 'Theme',
      description: 'Global UXX theme',
      defaultValue: 'monokai',
      toolbar: {
        icon: 'paintbrush',
        items: [
          { value: 'monokai', title: 'Monokai' },
          { value: 'night-owl', title: 'Night Owl' },
          { value: 'proxy-console', title: 'Proxy Console' },
        ],
      },
    },
  },
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: 'monokai',
      values: [
        { name: 'monokai', value: themeBackgrounds.monokai },
        { name: 'night-owl', value: themeBackgrounds['night-owl'] },
        { name: 'proxy-console', value: themeBackgrounds['proxy-console'] },
      ],
    },
  },
  decorators: [
    (Story, context) => {
      const requestedTheme = context.args.theme ?? context.globals.theme ?? 'monokai';
      const finalTheme = (requestedTheme in themeBackgrounds ? requestedTheme : 'monokai') as keyof typeof themeBackgrounds;

      return (
        <ThemeProvider
          theme={finalTheme}
          style={{
            padding: '1rem',
            minHeight: '100vh',
            background: themeBackgrounds[finalTheme],
          }}
        >
          <Story args={{ ...context.args, theme: finalTheme }} />
        </ThemeProvider>
      );
    },
  ],
};

export default preview;
