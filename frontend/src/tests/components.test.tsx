import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

describe('UI Component Library', () => {
  it('renders Card with title and children', () => {
    render(
      <Card title="Sales Highlights" subtitle="Q1 Analysis">
        <p>Revenue up 25%</p>
      </Card>
    );

    expect(screen.getByText('Sales Highlights')).toBeDefined();
    expect(screen.getByText('Q1 Analysis')).toBeDefined();
    expect(screen.getByText('Revenue up 25%')).toBeDefined();
  });

  it('renders Badge with custom variant and text', () => {
    render(<Badge variant="emerald">1,470 Records</Badge>);
    expect(screen.getByText('1,470 Records')).toBeDefined();
  });

  it('renders Button with text and handles disabled state', () => {
    render(
      <Button variant="primary" disabled>
        Process Sales File
      </Button>
    );
    const btn = screen.getByRole('button', { name: /process sales file/i });
    expect(btn).toBeDefined();
    expect((btn as HTMLButtonElement).disabled).toBe(true);
  });
});
