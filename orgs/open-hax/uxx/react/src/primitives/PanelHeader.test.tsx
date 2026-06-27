import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PanelHeader } from './PanelHeader';

describe('PanelHeader', () => {
  describe('rendering', () => {
    it('renders title', () => {
      render(<PanelHeader title="Panel Title" />);
      expect(screen.getByRole('heading', { name: 'Panel Title' })).toBeInTheDocument();
    });

    it('renders as h3 heading', () => {
      render(<PanelHeader title="Title" />);
      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toHaveTextContent('Title');
    });
  });

  describe('kicker', () => {
    it('renders kicker when provided', () => {
      render(<PanelHeader title="Title" kicker="Section" />);
      expect(screen.getByText('Section')).toBeInTheDocument();
    });

    it('does not render kicker when not provided', () => {
      render(<PanelHeader title="Title" />);
      expect(screen.queryByText('Section')).not.toBeInTheDocument();
    });
  });

  describe('description', () => {
    it('renders description when provided', () => {
      render(<PanelHeader title="Title" description="A description of the panel" />);
      expect(screen.getByText('A description of the panel')).toBeInTheDocument();
    });

    it('does not render description when not provided', () => {
      render(<PanelHeader title="Title" />);
      expect(screen.queryByText('description')).not.toBeInTheDocument();
    });
  });

  describe('meta', () => {
    it('renders meta content when provided', () => {
      render(<PanelHeader title="Title" meta={<span data-testid="meta">Meta info</span>} />);
      expect(screen.getByTestId('meta')).toBeInTheDocument();
    });

    it('does not render meta when not provided', () => {
      render(<PanelHeader title="Title" />);
      expect(screen.queryByTestId('meta')).not.toBeInTheDocument();
    });
  });

  describe('actions', () => {
    it('renders actions when provided', () => {
      render(
        <PanelHeader 
          title="Title" 
          actions={
            <>
              <button>Edit</button>
              <button>Delete</button>
            </>
          } 
        />
      );
      expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
    });

    it('does not render actions when not provided', () => {
      render(<PanelHeader title="Title" />);
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });

  describe('combination', () => {
    it('renders all props together', () => {
      render(
        <PanelHeader 
          title="Panel Title"
          kicker="Section"
          description="Panel description"
          meta={<span>Meta</span>}
          actions={<button>Action</button>}
        />
      );
      
      expect(screen.getByText('Section')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Panel Title' })).toBeInTheDocument();
      expect(screen.getByText('Panel description')).toBeInTheDocument();
      expect(screen.getByText('Meta')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has heading role', () => {
      render(<PanelHeader title="Title" />);
      expect(screen.getByRole('heading')).toBeInTheDocument();
    });

    it('heading level is 3', () => {
      render(<PanelHeader title="Title" />);
      expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
    });
  });
});
