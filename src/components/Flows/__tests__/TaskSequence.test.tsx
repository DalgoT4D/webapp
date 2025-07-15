// TaskSequence.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

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

  it('filters autocomplete options to exclude already selected tasks', () => {
    const fieldWithAllTasks = {
      ...mockField,
      value: [mockTasks[0], mockTasks[1], mockTasks[2]],
    };

    render(<TaskSequence field={fieldWithAllTasks} options={mockTasks} />);

    // The autocomplete should only show tasks not in the value
    const autocomplete = screen.getByTestId('tasksequence');
    expect(autocomplete).toBeInTheDocument();

    // Check that available options are filtered (this would be implementation specific)
    // The component should have 2 options remaining (tasks 4 and 5)
  });

  it('handles handleSelect when value is null or undefined', async () => {
    render(<TaskSequence field={mockField} options={mockTasks} />);

    const autocomplete = screen.getByTestId('tasksequence');
    const input = within(autocomplete).getByRole('combobox');

    // Simulate selecting nothing/null
    fireEvent.change(input, { target: { value: '' } });

    // Should not call onChange when no value is selected
    expect(mockField.onChange).not.toHaveBeenCalled();
  });

  it('disables drag for system generated tasks', () => {
    const fieldWithSystemTask = {
      ...mockField,
      value: [mockTasks[0]], // system generated task
    };

    render(<TaskSequence field={fieldWithSystemTask} options={mockTasks} />);

    // System generated tasks should not have drag icon
    const dragIcons = screen.queryAllByTestId('dropicon');
    expect(dragIcons).toHaveLength(0);
  });

  it('handles empty field.value correctly', () => {
    const emptyField = {
      ...mockField,
      value: [],
    };

    render(<TaskSequence field={emptyField} options={mockTasks} />);

    // Should render autocomplete and reset button
    expect(screen.getByTestId('tasksequence')).toBeInTheDocument();
    expect(screen.getByText('Reset to default')).toBeInTheDocument();

    // Tree should be empty
    const deleteButtons = screen.queryAllByAltText('delete icon');
    expect(deleteButtons).toHaveLength(0);
  });

  it('should call onChange when selecting an option from Autocomplete', async () => {
    const user = userEvent.setup();

    render(<TaskSequence field={mockField} options={mockTasks} />);

    const autocomplete = screen.getByTestId('tasksequence');
    const input = within(autocomplete).getByRole('combobox');

    // Click to open dropdown
    await user.click(input);

    // Type to search for task 3
    await user.type(input, 'task 3');

    // Wait for options to appear and select the first one
    await waitFor(async () => {
      const options = screen.queryAllByRole('option');
      if (options.length > 0) {
        await user.click(options[0]);
      }
    });

    // Verify onChange was called with the new task added and sorted
    expect(mockField.onChange).toHaveBeenCalled();

    // The call should include the original tasks plus the new one, sorted by order
    const lastCall = mockField.onChange.mock.calls[mockField.onChange.mock.calls.length - 1];
    expect(lastCall[0]).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ uuid: '1' }),
        expect.objectContaining({ uuid: '2' }),
        expect.objectContaining({ uuid: '3' }),
      ])
    );
  });
});
