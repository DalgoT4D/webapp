// CreateTableForm.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CreateTableForm from '../CreateTableForm';
import { useSession } from 'next-auth/react';
import { httpPost } from '@/helpers/http';
import { useCanvasAction, useCanvasNode } from '@/contexts/FlowEditorCanvasContext';

jest.mock('next-auth/react');
jest.mock('@/helpers/http');
jest.mock('@/contexts/FlowEditorCanvasContext');
jest.mock('@/contexts/ContextProvider', () => ({
  GlobalContext: React.createContext({}),
}));

const mockSetCanvasAction = jest.fn();
const mockClearAndClosePanel = jest.fn();
const mockHandleSubmit = jest.fn();

jest.mock('react-hook-form', () => ({
  useForm: () => ({
    control: {},
    handleSubmit: (fn) =>
      mockHandleSubmit.mockImplementation(async (e) => {
        e?.preventDefault?.();
        await fn({
          output_name: 'Test Table',
          dest_schema: 'production',
        });
      }),
    reset: jest.fn(),
    register: jest.fn(),
    formState: { errors: {} },
  }),
  Controller: ({ render }) => render({ field: {}, fieldState: {} }),
}));

describe('CreateTableForm', () => {
  beforeEach(() => {
    useSession.mockReturnValue({ data: { session: 'mockSession' } });
    useCanvasNode.mockReturnValue({
      canvasNode: { type: 'operation', id: 'test-id', data: { target_model_id: '123' } },
    });
    useCanvasAction.mockReturnValue({ setCanvasAction: mockSetCanvasAction });
    httpPost.mockResolvedValue({});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const renderComponent = (props = {}) =>
    render(<CreateTableForm sx={{}} clearAndClosePanel={mockClearAndClosePanel} {...props} />);

  it('renders the form', () => {
    renderComponent();

    expect(screen.getByText(/Output Name/i)).toBeInTheDocument();
    expect(screen.getByText(/Output Schema Name/i)).toBeInTheDocument();
  });

  //write test for form submission.
  it('calls clearAndClosePanel if provided', async () => {
    renderComponent({ clearAndClosePanel: mockClearAndClosePanel });

    const form = screen.getByTestId('savebutton').closest('form');

    fireEvent.submit(form);

    await waitFor(() => {
      expect(mockHandleSubmit).toHaveBeenCalled();
      expect(mockClearAndClosePanel).toHaveBeenCalled();
    });
  });
});
