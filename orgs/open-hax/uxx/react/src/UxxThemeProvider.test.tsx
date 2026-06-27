import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button, UxxThemeProvider, useUxxTheme } from '@open-hax/uxx';

function ThemeProbe() {
  const { resolvedTheme } = useUxxTheme();

  return (
    <>
      <output data-testid="resolved-radius">{resolvedTheme.radius.md}</output>
      <output data-testid="resolved-font-family">{resolvedTheme.fontFamily.sans}</output>
    </>
  );
}

describe('UxxThemeProvider', () => {
  it('applies a named theme pack to the wrapper element', () => {
    render(
      <UxxThemeProvider theme="proxy-console" data-testid="provider">
        <Button variant="primary">Launch</Button>
        <ThemeProbe />
      </UxxThemeProvider>
    );

    const provider = screen.getByTestId('provider');
    const button = screen.getByRole('button', { name: 'Launch' });

    expect(provider).toHaveAttribute('data-uxx-theme', 'proxy-console');
    expect(provider.style.getPropertyValue('--uxx-colors-button-primary-bg')).toBe('#00D4FF');
    expect(provider.style.getPropertyValue('--uxx-font-family-sans')).toContain('IBM Plex Sans');
    expect(button.getAttribute('style')).toContain('var(--uxx-colors-button-primary-bg');
    expect(screen.getByTestId('resolved-font-family')).toHaveTextContent('IBM Plex Sans');
  });

  it('applies token overrides on top of the base pack', () => {
    render(
      <UxxThemeProvider
        theme="proxy-console"
        data-testid="provider"
        overrides={{
          colors: {
            button: {
              primary: {
                bg: '#16E0FF',
              },
            },
          },
          radius: {
            md: '10px',
          },
        }}
      >
        <Button variant="primary">Override</Button>
        <ThemeProbe />
      </UxxThemeProvider>
    );

    const provider = screen.getByTestId('provider');

    expect(provider.style.getPropertyValue('--uxx-colors-button-primary-bg')).toBe('#16E0FF');
    expect(provider.style.getPropertyValue('--uxx-radius-md')).toBe('10px');
    expect(screen.getByTestId('resolved-radius')).toHaveTextContent('10px');
  });
});
