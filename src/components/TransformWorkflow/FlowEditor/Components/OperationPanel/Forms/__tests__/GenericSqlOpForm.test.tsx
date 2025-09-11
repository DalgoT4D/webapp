// GenericSqlOpForm.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import GenericSqlOpForm from '../GenericSqlOpForm';
import { useSession } from 'next-auth/react';
import { httpGet, httpPost, httpPut } from '@/helpers/http';

jest.mock('next-auth/react');
jest.mock('@/helpers/http');

const mockSetLoading = jest.fn();
const mockContinueOperationChain = jest.fn();
const mockClearAndClosePanel = jest.fn();
const mockReset = jest.fn();

jest.mock('react-hook-form', () => ({
  useForm: () => ({
    control: {},
    handleSubmit: jest.fn((fn) => (data) => fn(data)),
    reset: mockReset,
  }),
  Controller: ({ render }) => render({ field: {}, fieldState: {} }),
}));

const defaultProps = {
  node: {
    type: 'operation_node',
    data: {
      config: {
        input_models: [{ name: 'Test Input Model' }],
      },
    },
  },
  operation: { slug: 'test_operation' },
  sx: {},
  continueOperationChain: mockContinueOperationChain,
  clearAndClosePanel: mockClearAndClosePanel,
  dummyNodeId: 'dummyNodeId',
  action: 'create',
  setLoading: mockSetLoading,
};

describe('GenericSqlOpForm', () => {
  beforeEach(() => {
    useSession.mockReturnValue({ data: { session: 'mockSession' } });
    httpGet.mockResolvedValue({
      config: { sql_statement_1: '', sql_statement_2: '', input_models: [] },
    });
    httpPost.mockResolvedValue({});
    httpPut.mockResolvedValue({});
  });
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders the form', () => {
    render(<GenericSqlOpForm {...defaultProps} />);
    expect(screen.getByText('SELECT')).toBeInTheDocument();
    expect(screen.getByText('FROM Test Input Model')).toBeInTheDocument();
  });

  it('handles form submission for create action', async () => {
    render(<GenericSqlOpForm {...defaultProps} />);
    const textboxes = screen.getAllByRole('textbox');
    fireEvent.change(textboxes[0], {
      target: { value: 'SELECT * FROM table1' },
    });
    fireEvent.change(textboxes[1], {
      target: { value: 'FROM table2' },
    });

    fireEvent.click(screen.getByTestId('savebutton'));

    await waitFor(() => {
      expect(httpPost).toHaveBeenCalledWith(
        { session: 'mockSession' },
        'transform/dbt_project/model/',
        expect.any(Object)
      );
      expect(mockContinueOperationChain).toHaveBeenCalled();
      expect(mockReset).toHaveBeenCalled();
      expect(mockSetLoading).toHaveBeenCalledTimes(2);
    });
  });

  it('handles form submission for edit action', async () => {
    const editProps = {
      ...defaultProps,
      action: 'edit',
      node: {
        id: 'nodeId',
        type: 'operation_node',
        data: { config: { input_models: [{ name: 'Test Input Model' }] } },
      },
    };
    render(<GenericSqlOpForm {...editProps} />);

    const textboxes = screen.getAllByRole('textbox');
    fireEvent.change(textboxes[0], {
      target: { value: 'SELECT * FROM table1' },
    });
    fireEvent.change(textboxes[1], {
      target: { value: 'FROM table2' },
    });

    fireEvent.click(screen.getByTestId('savebutton'));

    await waitFor(() => {
      expect(httpPut).toHaveBeenCalledWith(
        { session: 'mockSession' },
        'transform/dbt_project/model/operations/nodeId/',
        expect.any(Object)
      );
      expect(mockContinueOperationChain).toHaveBeenCalled();
      expect(mockReset).toHaveBeenCalled();
      expect(mockSetLoading).toHaveBeenCalledTimes(4);
    });
  });

  it('fetches and sets config for edit action on mount', async () => {
    const editProps = {
      ...defaultProps,
      action: 'edit',
      node: {
        id: 'nodeId',
        type: 'operation_node',
        data: { config: { input_models: [{ name: 'Test Input Model' }] } },
      },
    };
    render(<GenericSqlOpForm {...editProps} />);

    await waitFor(() => {
      expect(httpGet).toHaveBeenCalledWith(
        { session: 'mockSession' },
        'transform/dbt_project/model/operations/nodeId/'
      );
      expect(mockSetLoading).toHaveBeenCalledTimes(2);
    });
  });

  it('disables inputs and button in view mode', () => {
    const viewProps = { ...defaultProps, action: 'view' };
    render(<GenericSqlOpForm {...viewProps} />);

    expect(screen.getByTestId('savebutton')).toBeDisabled();
  });
});
