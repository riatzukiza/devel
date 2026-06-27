import { addons } from '@storybook/manager-api';
import { create } from '@storybook/theming/create';

const darkTheme = create({
  base: 'dark',
  colorPrimary: '#7c3aed',
  colorSecondary: '#60a5fa',
  appBg: '#1a1b26',
  appContentBg: '#1a1b26',
  appBorderColor: '#3b3b4f',
  appBorderRadius: 4,
  fontBase: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  fontCode: '"JetBrains Mono", "Fira Code", monospace',
  textColor: '#c0caf5',
  textInverseColor: '#1a1b26',
  toolbarBg: '#1a1b26',
  toolbarHover: '#24283b',
  toolbarActive: '#3b3b4f',
  inputBg: '#24283b',
  inputBorder: '#3b3b4f',
  inputTextColor: '#c0caf5',
});

addons.setConfig({
  theme: darkTheme,
});
