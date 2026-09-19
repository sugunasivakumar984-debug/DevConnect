import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Avatar, Badge, Button, EmptyState } from '../components/ui';

describe('UI primitives', () => {
  it('renders a button with its label', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('disables the button while loading', () => {
    render(<Button loading>Save</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('renders a badge', () => {
    render(<Badge tone="brand">React</Badge>);
    expect(screen.getByText('React')).toBeInTheDocument();
  });

  it('falls back to initials when no avatar image is given', () => {
    render(<Avatar name="Ada Lovelace" />);
    expect(screen.getByLabelText('Ada Lovelace')).toHaveTextContent('AL');
  });

  it('renders an empty state with title and description', () => {
    render(<EmptyState title="Nothing here" description="Add something." />);
    expect(screen.getByText('Nothing here')).toBeInTheDocument();
    expect(screen.getByText('Add something.')).toBeInTheDocument();
  });
});
