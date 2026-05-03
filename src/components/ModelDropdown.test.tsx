import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ModelDropdown } from './ModelDropdown';
import { MODELS } from '../data/models';

describe('ModelDropdown Component', () => {
  it('renders the current model label', () => {
    const onChange = vi.fn();
    render(<ModelDropdown value={MODELS[0].key} onChange={onChange} />);
    expect(screen.getByText(MODELS[0].label)).toBeInTheDocument();
  });

  it('opens dropdown on click and filters results', async () => {
    const onChange = vi.fn();
    render(<ModelDropdown value={MODELS[0].key} onChange={onChange} />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    const input = screen.getByPlaceholderText(/Search/);
    expect(input).toBeInTheDocument();
    
    // Filter by name
    fireEvent.change(input, { target: { value: 'GPT' } });
    const filtered = screen.queryByText(/ResNet-50/);
    expect(filtered).not.toBeInTheDocument();
  });

  it('calls onChange when a model is selected', () => {
    const onChange = vi.fn();
    render(<ModelDropdown value={MODELS[0].key} onChange={onChange} />);
    
    fireEvent.click(screen.getByRole('button'));
    
    // Find the second model and click it
    const nextModel = MODELS[1];
    const item = screen.getByText(nextModel.label);
    fireEvent.click(item);
    
    expect(onChange).toHaveBeenCalledWith(nextModel.key);
  });
});
