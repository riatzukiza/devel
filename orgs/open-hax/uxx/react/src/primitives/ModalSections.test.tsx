import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Modal } from './Modal';
import { ModalHeader } from './ModalHeader';
import { ModalBody } from './ModalBody';
import { ModalFooter } from './ModalFooter';

describe('Modal sections', () => {
  it('renders standalone header, body, and footer sections inside Modal', () => {
    render(
      <Modal open onClose={vi.fn()} closable={false}>
        <ModalHeader>Header</ModalHeader>
        <ModalBody>Body</ModalBody>
        <ModalFooter>Footer</ModalFooter>
      </Modal>,
    );

    expect(screen.getByText('Header')).toBeInTheDocument();
    expect(screen.getByText('Body')).toBeInTheDocument();
    expect(screen.getByText('Footer')).toBeInTheDocument();
    expect(screen.getByText('Header').closest('[data-component="modal-header"]')).not.toBeNull();
    expect(screen.getByText('Body').closest('[data-component="modal-body"]')).not.toBeNull();
    expect(screen.getByText('Footer').closest('[data-component="modal-footer"]')).not.toBeNull();
  });
});
