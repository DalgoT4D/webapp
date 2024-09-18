import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LLMSummary } from '../LLMSummary';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { copyToClipboard } from '@/utils/common';

import { GlobalContext } from '@/contexts/ContextProvider';
import {
  errorToast,
  successToast,
} from '@/components/ToastMessage/ToastHelper';

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}));
jest.mock('@/helpers/http', () => ({
  httpPost: jest.fn(),
}));
jest.mock('@/utils/common', () => ({
  copyToClipboard: jest.fn(),
}));
jest.mock('@/components/ToastMessage/ToastHelper', () => ({
  successToast: jest.fn(),
  errorToast: jest.fn(),
}));

const mockSession = {
  user: { name: 'Test User', email: 'test@example.com' },
};
const mockGlobalContext = {
  UnsavedChanges: { state: false, dispatch: jest.fn() },
};
const defaultProps = {
  llmSummary: 'This is a test summary',
  newSessionId: 'session-id-123',
  oldSessionMetaInfo: { oldSessionId: null },
  handleNewSession: jest.fn(),
};

describe('LLMSummary Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders the LLMSummary component correctly', () => {
    useSession.mockReturnValue({ data: mockSession });
    useRouter.mockReturnValue({
      push: jest.fn(),
      events: { on: jest.fn(), off: jest.fn() },
    });

    render(
      <GlobalContext.Provider value={mockGlobalContext}>
        <LLMSummary {...defaultProps} />
      </GlobalContext.Provider>
    );

    expect(screen.getByText('LLM Summary')).toBeInTheDocument();
    expect(screen.getByText(defaultProps.llmSummary)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /save as/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /download/i })
    ).toBeInTheDocument();
  });

  test('handles copying summary text to clipboard', async () => {
    useSession.mockReturnValue({ data: mockSession });
    useRouter.mockReturnValue({
      push: jest.fn(),
      events: { on: jest.fn(), off: jest.fn() },
    });
    copyToClipboard.mockResolvedValue(true);

    render(
      <GlobalContext.Provider value={mockGlobalContext}>
        <LLMSummary {...defaultProps} />
      </GlobalContext.Provider>
    );

    const copyButton = screen.getByAltText('copy icon');
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(copyToClipboard).toHaveBeenCalledWith(defaultProps.llmSummary);
      expect(successToast).toHaveBeenCalledWith(
        'Successfully copied to clipboard',
        [],
        mockGlobalContext
      );
    });
  });

  test('shows error when copying to clipboard fails', async () => {
    useSession.mockReturnValue({ data: mockSession });
    useRouter.mockReturnValue({
      push: jest.fn(),
      events: { on: jest.fn(), off: jest.fn() },
    });
    copyToClipboard.mockResolvedValue(false);

    render(
      <GlobalContext.Provider value={mockGlobalContext}>
        <LLMSummary {...defaultProps} />
      </GlobalContext.Provider>
    );

    const copyButton = screen.getByAltText('copy icon');
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(errorToast).toHaveBeenCalledWith(
        'Some problem with copying. Please try again',
        [],
        mockGlobalContext
      );
    });
  });

  test('opens overwrite modal on clicking "Save as" button', () => {
    useSession.mockReturnValue({ data: mockSession });
    useRouter.mockReturnValue({
      push: jest.fn(),
      events: { on: jest.fn(), off: jest.fn() },
    });

    render(
      <GlobalContext.Provider value={mockGlobalContext}>
        <LLMSummary {...defaultProps} />
      </GlobalContext.Provider>
    );

    const saveAsButton = screen.getByRole('button', { name: /save as/i });
    fireEvent.click(saveAsButton);

    expect(
      screen.getByText('Save', { selector: 'button' })
    ).toBeInTheDocument(); // Assuming modal displays "Save" text
  });

  test('disables buttons if no llm summary and no newsessionId is not provided', () => {
    useSession.mockReturnValue({ data: mockSession });
    useRouter.mockReturnValue({
      push: jest.fn(),
      events: { on: jest.fn(), off: jest.fn() },
    });

    const propsWithoutLLMSummary = {
      ...defaultProps,
      llmSummary: '',
      newSessionId: '',
    };

    render(
      <GlobalContext.Provider value={mockGlobalContext}>
        <LLMSummary {...propsWithoutLLMSummary} />
      </GlobalContext.Provider>
    );

    expect(screen.getByRole('button', { name: /save as/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /download/i })).toBeDisabled();
  });

  test('handles unsaved changes on route change', () => {
    const mockPush = jest.fn();
    const mockEvents = { on: jest.fn(), off: jest.fn() };

    useSession.mockReturnValue({ data: mockSession });
    useRouter.mockReturnValue({ push: mockPush, events: mockEvents });

    render(
      <GlobalContext.Provider value={mockGlobalContext}>
        <LLMSummary {...defaultProps} />
      </GlobalContext.Provider>
    );

    // Trigger route change start
    expect(mockEvents.on).toHaveBeenCalledWith(
      'routeChangeStart',
      expect.any(Function)
    );
  });
});
