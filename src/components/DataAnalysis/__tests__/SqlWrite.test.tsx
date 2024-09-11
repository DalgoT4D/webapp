import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SqlWrite } from '../SqlWrite';
import { useSession } from 'next-auth/react';
import { GlobalContext } from '@/contexts/ContextProvider';
import { httpGet } from '@/helpers/http';
import userEvent from '@testing-library/user-event';
import { errorToast } from '@/components/ToastMessage/ToastHelper';

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

    await waitFor(() => expect(screen.queryByRole('progressbar')).not.toBeInTheDocument());

    expect(screen.getByText(/SQL Filter/i)).toBeInTheDocument();
    expect(screen.getByText(/Select a prompt/i)).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: '' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '+ Add a custom prompt' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument();
  });

  test('fetches default prompts and displays them', async () => {
    const mockPrompts = [
      { id: 1, label: 'Prompt 1', prompt: 'SELECT * FROM table' },
      { id: 2, label: 'Prompt 2', prompt: 'SELECT name FROM users' },
    ];
    useSession.mockReturnValue({ data: mockSession });
    httpGet.mockResolvedValue(mockPrompts);

    render(
      <GlobalContext.Provider value={{}}>
        <SqlWrite {...defaultProps} />
      </GlobalContext.Provider>
    );

    await waitFor(() => expect(httpGet).toHaveBeenCalled());
    expect(screen.getByText('Prompt 1')).toBeInTheDocument();
    expect(screen.getByText('Prompt 2')).toBeInTheDocument();
  });

//   test.only('handles selecting a default prompt and submitting', async () => {
//     const mockPrompts = [
//       { id: 1, label: 'Prompt 1', prompt: 'SELECT * FROM table' },
//     ];
    
//     useSession.mockReturnValue({ data: mockSession });
//     httpGet.mockResolvedValue(mockPrompts);

//     render(
//       <GlobalContext.Provider value={{}}>
//         <SqlWrite {...defaultProps} />
//       </GlobalContext.Provider>
//     );

//     // Wait for prompts to load
//     await waitFor(() => expect(httpGet).toHaveBeenCalled());

//     // Select the prompt
//     const promptButton = screen.getByTestId("1-default")
//    console.log(promptButton.outerHTML , "prompt butt")
//     fireEvent.click(promptButton);
//     // Fill in the SQL text
//     const sqlText = 'SELECT name FROM employees';
//     fireEvent.change(screen.getByRole('textbox', { name: '' }), {
//     target: { value: sqlText },
//     });


//     // Submit the form
//     fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

//     // Check that getLLMSummary is called with the correct values
//     await waitFor(() => {
//       expect(mockGetLLMSummary).toHaveBeenCalledWith({
//         sqlText,
//         user_prompt: 'SELECT * FROM table',
//       });
//     });

//   test('displays error toast when neither default nor custom prompt is selected', async () => {
//     useSession.mockReturnValue({ data: mockSession });
//     httpGet.mockResolvedValue([]);

//     render(
//       <GlobalContext.Provider value={{}}>
//         <SqlWrite {...defaultProps} />
//       </GlobalContext.Provider>
//     );

//     fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

//     await waitFor(() => {
//       expect(errorToast).toHaveBeenCalledWith(
//         'Either select a default prompt or write a custom prompt',
//         [],
//         {}
//       );
//     });
//   });
// });

  // test('allows adding a custom prompt and submitting it', async () => {
  //   useSession.mockReturnValue({ data: mockSession });
  //   httpGet.mockResolvedValue([]);

  //   render(
  //     <GlobalContext.Provider value={{}}>
  //       <SqlWrite {...defaultProps} />
  //     </GlobalContext.Provider>
  //   );

  //   fireEvent.click(screen.getByRole('button', { name: '+ Add a custom prompt' }));

  //   const customPrompt = 'Custom SQL prompt';
  //   fireEvent.change(screen.getByRole('textbox', { name: '' }), {
  //     target: { value: customPrompt },
  //   });

  //   const sqlText = 'SELECT * FROM users';
  //   fireEvent.change(screen.getByRole('textbox', { name: '' }), {
  //     target: { value: sqlText },
  //   });

  //   fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

  //   await waitFor(() => {
  //     expect(mockGetLLMSummary).toHaveBeenCalledWith({
  //       sqlText,
  //       user_prompt: customPrompt,
  //     });
  //   });
  // });

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
