// TaskSequence.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor, within, act } from '@testing-library/react';

import { TaskSequence } from '../TaskSequence';
import { TransformTask } from '../../DBT/DBTTarget';
import { ControllerRenderProps } from 'react-hook-form';

// Mock data for testing
const mockTasks: TransformTask[] = [
  {
    uuid: '1',
    command: 'task 1',
    order: 1,
    generated_by: 'system',
  },
  {
    uuid: '2',
    command: 'task 2',
    order: 2,
    generated_by: 'user',
  },
  {
    uuid: '3',
    command: 'task 3',
    order: 3,
    generated_by: 'user',
  },
];

const mockField: ControllerRenderProps<any, any> = {
  onChange: jest.fn(),
  onBlur: jest.fn(),
  value: [mockTasks[0], mockTasks[1]],
  name: 'taskSequence',
  ref: jest.fn(),
};

describe('TaskSequence Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with form elements and actions', () => {
    render(<TaskSequence field={mockField} options={mockTasks} />);

    expect(screen.getByTestId('tasksequence')).toBeInTheDocument();
    expect(screen.getByText('Reset to default')).toBeInTheDocument();
    expect(
      screen.getByText(
        "These are your default transformation tasks. Most users don't need to change this list"
      )
    ).toBeInTheDocument();
  });

  it('handles removing a task', () => {
    render(<TaskSequence field={mockField} options={mockTasks} />);

    // Simulate removing the second task
    const deleteButtons = screen.getAllByAltText('delete icon');
    fireEvent.click(deleteButtons[1]);

    expect(mockField.onChange).toHaveBeenCalledWith([mockTasks[0]]);
  });

  it('handles resetting tasks to default', () => {
    render(<TaskSequence field={mockField} options={mockTasks} />);

    const resetButton = screen.getByText('Reset to default');
    fireEvent.click(resetButton);

    expect(mockField.onChange).toHaveBeenCalledWith(
      mockTasks.filter((task) => task.generated_by === 'system' && task.pipeline_default)
    );
  });

  it('shows drag icon only for user-generated tasks', () => {
    render(<TaskSequence field={mockField} options={mockTasks} />);
    const dragIcons = screen.getAllByTestId('dropicon');
    expect(dragIcons.length).toBe(1); // Only task 2 is user-generated
  });

  it('renders all nodes from field.value into the tree', () => {
    render(<TaskSequence field={mockField} options={mockTasks} />);
    // Should render the command names or slugs
    expect(screen.getByText('task 1')).toBeInTheDocument();
    expect(screen.getByText('task 2')).toBeInTheDocument();
  });

  it('should call onChange when selecting an option from Autocomplete', async () => {
    render(<TaskSequence field={mockField} options={mockTasks} />);

    const Autocomplete = screen.getByTestId('tasksequence');
    await waitFor(() => expect(Autocomplete).toBeInTheDocument());

    const input = within(Autocomplete).getByRole('combobox');
    Autocomplete.focus();

    fireEvent.keyDown(input, { key: 'ArrowDown' });
    // Select the first option
    await act(() => fireEvent.keyDown(input, { key: 'Enter' }));

    expect(mockField.onChange).toHaveBeenCalled();
  });
});
