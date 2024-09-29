// CreateTableForm.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CreateTableForm from '../CreateTableForm';
import { useSession } from 'next-auth/react';
import { httpPost } from '@/helpers/http';
import {
  useCanvasAction,
  useCanvasNode,
} from '@/contexts/FlowEditorCanvasContext';

jest.mock('next-auth/react');
jest.mock('@/helpers/http');
jest.mock('@/contexts/FlowEditorCanvasContext');

const mockSetCanvasAction = jest.fn();
const mockClearAndClosePanel = jest.fn();

jest.mock('react-hook-form', () => ({
  useForm: () => ({
    control: {},
    handleSubmit: jest.fn((fn) => (data) => fn(data)),
    reset: jest.fn(),
    register: jest.fn(),
  }),
  Controller: ({ render }) => render({ field: {}, fieldState: {} }),
}));

describe('CreateTableForm', () => {
  beforeEach(() => {
    useSession.mockReturnValue({ data: { session: 'mockSession' } });
    useCanvasNode.mockReturnValue({
      canvasNode: { type: 'operation_node', data: { target_model_id: '123' } },
    });
    useCanvasAction.mockReturnValue({ setCanvasAction: mockSetCanvasAction });
    httpPost.mockResolvedValue({});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const renderComponent = (props = {}) =>
    render(
      <CreateTableForm
        sx={{}}
        clearAndClosePanel={mockClearAndClosePanel}
        {...props}
      />
    );

  it('renders the form', () => {
    renderComponent();

    expect(screen.getByText(/Output Name/i)).toBeInTheDocument();
    expect(screen.getByText(/Output Schema Name/i)).toBeInTheDocument();
  });

  //write test for form submission.
  it('calls clearAndClosePanel if provided', async () => {
    renderComponent({ clearAndClosePanel: mockClearAndClosePanel });

    fireEvent.change(screen.getByLabelText(/Output Name/i), {
      target: { value: 'Test Table' },
    });

    fireEvent.click(screen.getByTestId('savebutton'));

    await waitFor(() => {
      expect(mockClearAndClosePanel).toHaveBeenCalled();
    });
  });
});
