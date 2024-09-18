import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SqlWrite } from '../SqlWrite';
import { useSession } from 'next-auth/react';
import { GlobalContext } from '@/contexts/ContextProvider';
import { httpGet } from '@/helpers/http';

jest.mock('next-auth/react');
jest.mock('@/helpers/http');
jest.mock('@/components/ToastMessage/ToastHelper', () => ({
  errorToast: jest.fn(),
}));

const mockGetLLMSummary = jest.fn();

const defaultProps = {
  getLLMSummary: mockGetLLMSummary,
  prompt: '',
  newSessionId: '',
  oldSessionMetaInfo: { sqlText: '' },
};

const mockSession = { user: { name: 'Test User', email: 'test@example.com' } };

describe('SqlWrite component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders SQL editor and prompt selection components', async () => {
    useSession.mockReturnValue({ data: mockSession });

    httpGet.mockResolvedValue([]);

    render(
      <GlobalContext.Provider value={{}}>
        <SqlWrite {...defaultProps} />
      </GlobalContext.Provider>
    );

    // Ensure the loader is rendered initially
    expect(screen.getByRole('progressbar')).toBeInTheDocument();

    await waitFor(() =>
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
    );

    expect(screen.getByText(/SQL Filter/i)).toBeInTheDocument();
    expect(screen.getByText(/Select a prompt/i)).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: '' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: '+ Add a custom prompt' })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument();
  });

  test('fetches default prompts and displays them', async () => {
    // Mock prompt data returned from the API
    const mockPrompts = [
      { id: '1', label: 'Prompt 1', prompt: 'SELECT * FROM table' },
      { id: '2', label: 'Prompt 2', prompt: 'SELECT name FROM users' },
    ];

    // Mock SQL query limit data
    const mockLimit = 500;

    // Mock the session hook
    useSession.mockReturnValue({ data: mockSession });

    // Mock httpGet to return different responses for prompts and limit
    httpGet.mockImplementation((session, url) => {
      if (url === 'data/user_prompts/') {
        return Promise.resolve(mockPrompts);
      } else if (url === 'data/llm_data_analysis_query_limit/') {
        return Promise.resolve(mockLimit);
      }
      return Promise.reject(new Error('Unknown API URL'));
    });

    render(
      <GlobalContext.Provider value={{}}>
        <SqlWrite {...defaultProps} />
      </GlobalContext.Provider>
    );

    // Ensure httpGet is called
    await waitFor(() => expect(httpGet).toHaveBeenCalledTimes(2)); // Called twice, once for prompts and once for limit

    // Ensure the prompts are rendered
    await waitFor(() => {
      expect(screen.getByText('Prompt 1')).toBeInTheDocument();
      expect(screen.getByText('Prompt 2')).toBeInTheDocument();
      expect(
        screen.getByText('*You can query a maximum of 500 rows only.')
      ).toBeInTheDocument();
    });
  });

  test('displays CircularProgress when loading prompts', () => {
    useSession.mockReturnValue({ data: mockSession });
    httpGet.mockImplementation(() => new Promise(() => {})); // Simulate loading

    render(
      <GlobalContext.Provider value={{}}>
        <SqlWrite {...defaultProps} />
      </GlobalContext.Provider>
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });
});
