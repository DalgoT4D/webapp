import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { List } from '../List';

const headers = {
  values: ['Name', 'Type'],
  sortable: [true, false],
};

const rows = [
  [<span key="1">Source 1</span>, <span key="2">Type 1</span>, <button key="3">Edit</button>],
  [<span key="1">Source 2</span>, <span key="2">Type 2</span>, <button key="3">Edit</button>],
];

const rowValues = [
  ['Source 1', 'Type 1'],
  ['Source 2', 'Type 2'],
];

const mockOpenDialog = jest.fn();

describe('List component', () => {
  test('renders List component and displays rows', () => {
    render(
      <List
        title="Source"
        openDialog={mockOpenDialog}
        headers={headers}
        rows={rows}
        rowValues={rowValues}
      />
    );

    expect(screen.getByTestId('add-new-source')).toBeInTheDocument();

    expect(screen.getByText('Source 1')).toBeInTheDocument();
    expect(screen.getByText('Source 2')).toBeInTheDocument();
  });

  test('handles sorting', () => {
    render(
      <List
        title="Source"
        openDialog={mockOpenDialog}
        headers={headers}
        rows={rows}
        rowValues={rowValues}
      />
    );

    const sortLabel = screen.getByText('Name');
    expect(sortLabel).toBeInTheDocument();

    fireEvent.click(sortLabel);

    const firstRowName = screen.getAllByText(/Source/)[1];
    //ignoring the actual first row which will show the +New source button.
    expect(firstRowName).toHaveTextContent('Source 1');

    fireEvent.click(sortLabel);

    const firstRowNameDesc = screen.getAllByText(/Source/)[1];
    expect(firstRowNameDesc).toHaveTextContent('Source 2');
  });

  test('displays message when no rows are present', () => {
    render(
      <List title="Source" openDialog={mockOpenDialog} headers={headers} rows={[]} rowValues={[]} />
    );

    expect(screen.getByText('No source found. Please create one')).toBeInTheDocument();
  });

  test('opens dialog when add new button is clicked', () => {
    render(
      <List
        title="Source"
        openDialog={mockOpenDialog}
        headers={headers}
        rows={rows}
        rowValues={rowValues}
      />
    );

    fireEvent.click(screen.getByTestId('add-new-source'));
    expect(mockOpenDialog).toHaveBeenCalledTimes(1);
  });
});
