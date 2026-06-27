import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card } from './Card';
import { CardHeader } from './CardHeader';
import { CardBody } from './CardBody';
import { CardFooter } from './CardFooter';

describe('Card sections', () => {
  it('renders standalone header, body, and footer sections', () => {
    render(
      <Card padding="none">
        <CardHeader>Header</CardHeader>
        <CardBody>Body</CardBody>
        <CardFooter>Footer</CardFooter>
      </Card>,
    );

    expect(screen.getByText('Header')).toBeInTheDocument();
    expect(screen.getByText('Body')).toBeInTheDocument();
    expect(screen.getByText('Footer')).toBeInTheDocument();
    expect(screen.getByText('Header').closest('[data-component="card-header"]')).not.toBeNull();
    expect(screen.getByText('Body').closest('[data-component="card-body"]')).not.toBeNull();
    expect(screen.getByText('Footer').closest('[data-component="card-footer"]')).not.toBeNull();
  });
});
