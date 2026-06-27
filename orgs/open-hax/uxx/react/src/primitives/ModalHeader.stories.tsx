import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Modal } from './Modal';
import { ModalHeader } from './ModalHeader';
import { ModalBody } from './ModalBody';
import { ModalFooter } from './ModalFooter';
import { Button } from './Button';

const meta: Meta<typeof ModalHeader> = {
  title: 'Primitives/ModalHeader',
  component: ModalHeader,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ModalHeader>;

function SectionedModalDemo() {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <Button onClick={() => setOpen(true)}>Open sectioned modal</Button>
      <Modal open={open} onClose={() => setOpen(false)} closable={false}>
        <ModalHeader>
          <span>Explicit modal sections</span>
          <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>×</Button>
        </ModalHeader>
        <ModalBody>
          <p style={{ marginTop: 0 }}>
            These section primitives support lower-level dialog composition.
          </p>
          <p style={{ marginBottom: 0 }}>
            They are useful when the simple title/header/footer props are not enough.
          </p>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="primary" onClick={() => setOpen(false)}>Continue</Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}

export const Basic: Story = {
  render: () => <SectionedModalDemo />,
};
