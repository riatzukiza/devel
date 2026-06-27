import type { Meta, StoryObj } from '@storybook/react';
import { Pagination, paginateItems, calculateTotalPages } from './Pagination';
import { useState } from 'react';

const meta: Meta<typeof Pagination> = {
  title: 'Core/Pagination',
  component: Pagination,
  tags: ['autodocs'],
  parameters: {
    design: {
      type: 'contract',
      url: '../contracts/pagination.edn',
    },
  },
  argTypes: {
    page: {
      control: { type: 'number', min: 1 },
      description: 'Current page number (1-indexed)',
    },
    totalPages: {
      control: { type: 'number', min: 1 },
      description: 'Total number of pages',
    },
    onPageChange: {
      action: 'pageChanged',
      description: 'Callback when page changes',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether pagination is disabled',
    },
    showStatus: {
      control: 'boolean',
      description: 'Whether to show page status',
    },
    previousLabel: {
      control: 'text',
      description: 'Label for previous button',
    },
    nextLabel: {
      control: 'text',
      description: 'Label for next button',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Pagination>;

export const Default: Story = {
  args: {
    page: 1,
    totalPages: 10,
    onPageChange: () => {},
  },
};

export const MiddlePage: Story = {
  args: {
    page: 5,
    totalPages: 10,
    onPageChange: () => {},
  },
};

export const LastPage: Story = {
  args: {
    page: 10,
    totalPages: 10,
    onPageChange: () => {},
  },
};

export const Disabled: Story = {
  args: {
    page: 3,
    totalPages: 10,
    disabled: true,
    onPageChange: () => {},
  },
};

export const HiddenStatus: Story = {
  args: {
    page: 2,
    totalPages: 5,
    showStatus: false,
    onPageChange: () => {},
  },
};

export const CustomLabels: Story = {
  args: {
    page: 1,
    totalPages: 3,
    previousLabel: '← Back',
    nextLabel: 'Next →',
    onPageChange: () => {},
  },
};

export const FewPages: Story = {
  args: {
    page: 1,
    totalPages: 2,
    onPageChange: () => {},
  },
};

export const SinglePage: Story = {
  args: {
    page: 1,
    totalPages: 1,
    onPageChange: () => {},
  },
};

// Interactive demo with state
const InteractivePagination = () => {
  const [page, setPage] = useState(1);
  const totalPages = 10;
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ 
        padding: '24px', 
        textAlign: 'center',
        backgroundColor: '#1a1b1e',
        borderRadius: '4px',
        color: '#a6e22e'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '8px' }}>
          📄
        </div>
        <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
          Page {page}
        </div>
        <div style={{ fontSize: '14px', color: '#75715e' }}>
          of {totalPages} pages
        </div>
      </div>
      
      <Pagination
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />
    </div>
  );
};

export const Interactive: Story = {
  render: () => <InteractivePagination />,
};

// Demo showing pagination with items
const PaginationWithItems = () => {
  const [page, setPage] = useState(1);
  const pageSize = 5;
  
  // Generate sample items
  const allItems = Array.from({ length: 47 }, (_, i) => ({
    id: `item-${i + 1}`,
    title: `Item ${i + 1}`,
    description: `This is the description for item ${i + 1}`,
  }));
  
  const totalPages = calculateTotalPages(allItems.length, pageSize);
  const pageItems = paginateItems(allItems, page, pageSize);
  
  return (
    <div style={{ 
      border: '1px solid #3e3d32', 
      borderRadius: '4px',
      overflow: 'hidden'
    }}>
      <div style={{
        padding: '12px',
        borderBottom: '1px solid #3e3d32',
        fontSize: '14px',
        color: '#75715e',
      }}>
        {allItems.length} items • {totalPages} pages
      </div>
      
      <ul style={{
        listStyle: 'none',
        margin: 0,
        padding: 0,
      }}>
        {pageItems.map((item) => (
          <li
            key={item.id}
            style={{
              padding: '12px 16px',
              borderBottom: '1px solid #3e3d32',
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <span style={{ fontWeight: 'bold', color: '#f8f8f2' }}>
              {item.title}
            </span>
            <span style={{ fontSize: '14px', color: '#75715e' }}>
              {item.description}
            </span>
          </li>
        ))}
      </ul>
      
      <Pagination
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />
    </div>
  );
};

export const WithItems: Story = {
  render: () => <PaginationWithItems />,
};

// Demo showing pagination utility functions
const PaginationUtilitiesDemo = () => {
  const items = Array.from({ length: 95 }, (_, i) => `Item ${i + 1}`);
  const pageSize = 10;
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ 
        padding: '16px', 
        backgroundColor: '#1a1b1e',
        borderRadius: '4px',
        fontFamily: 'monospace',
        fontSize: '13px'
      }}>
        <div style={{ color: '#66d9ef', marginBottom: '8px' }}>
          // Utility Functions
        </div>
        <div style={{ color: '#a6e22e' }}>
          paginateItems(items, 2, 10)
        </div>
        <div style={{ color: '#f8f8f2', marginLeft: '16px', marginBottom: '12px' }}>
          → [{items.slice(10, 20).map(s => `"${s}"`).join(', ')}]
        </div>
        <div style={{ color: '#a6e22e' }}>
          calculateTotalPages(95, 10)
        </div>
        <div style={{ color: '#f8f8f2', marginLeft: '16px' }}>
          → {calculateTotalPages(95, 10)}
        </div>
      </div>
      
      <div style={{
        padding: '12px',
        backgroundColor: '#272822',
        borderRadius: '4px',
        fontSize: '14px'
      }}>
        <strong>Exported Utilities:</strong>
        <ul style={{ margin: '8px 0 0 0', padding: '0 0 0 20px' }}>
          <li><code style={{ color: '#a6e22e' }}>paginateItems&lt;T&gt;(items, page, pageSize)</code></li>
          <li><code style={{ color: '#a6e22e' }}>calculateTotalPages(totalItems, pageSize)</code></li>
        </ul>
      </div>
    </div>
  );
};

export const Utilities: Story = {
  render: () => <PaginationUtilitiesDemo />,
};
