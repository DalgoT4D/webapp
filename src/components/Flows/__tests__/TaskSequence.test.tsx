// TaskSequence.test.js
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

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
      mockTasks.filter(
        (task) => task.generated_by === 'system' && task.pipeline_default
      )
    );
  });
});
