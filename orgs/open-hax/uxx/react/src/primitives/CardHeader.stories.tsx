import type { Meta, StoryObj } from '@storybook/react';
import { Card } from './Card';
import { CardHeader } from './CardHeader';
import { CardBody } from './CardBody';
import { CardFooter } from './CardFooter';
import { Button } from './Button';
import { Badge } from './Badge';

const meta: Meta<typeof CardHeader> = {
  title: 'Primitives/CardHeader',
  component: CardHeader,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof CardHeader>;

export const Basic: Story = {
  render: () => (
    <div style={{ maxWidth: '420px' }}>
      <Card padding="none">
        <CardHeader>
          <span>Card header</span>
          <Badge variant="success">Live</Badge>
        </CardHeader>
        <CardBody style={{ padding: '16px 20px' }}>
          Standalone card section primitives can now be composed explicitly.
        </CardBody>
        <CardFooter>
          <Button variant="ghost" size="sm">Cancel</Button>
          <Button variant="primary" size="sm">Save</Button>
        </CardFooter>
      </Card>
    </div>
  ),
};

export const MixedWithCard: Story = {
  render: () => (
    <div style={{ maxWidth: '420px' }}>
      <Card variant="elevated" padding="none">
        <CardHeader>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <strong>Explicit sections</strong>
            <Badge size="sm" variant="info">beta</Badge>
          </div>
          <Button variant="ghost" size="sm">Edit</Button>
        </CardHeader>
        <CardBody style={{ padding: '16px 20px' }}>
          Use section primitives when slot props are not expressive enough.
        </CardBody>
      </Card>
    </div>
  ),
};
