import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import CoalesceOpForm from '../CoalesceOpForm';
import { GlobalContext } from '@/contexts/ContextProvider';
import { OperationFormProps } from '../../../OperationConfigLayout';
import userEvent from '@testing-library/user-event';
import { intermediateTableResponse, mockNode } from './helpers';

const user = userEvent.setup();
// Mock global context and session

const continueOperationChainMock = jest.fn();
const mockContext = {
  Toast: { state: null, dispatch: jest.fn() },
};

// Mock dependencies
jest.mock('next-auth/react', () => ({
  useSession: jest.fn().mockReturnValue({
    data: {
      user: { name: 'Test User', email: 'test@example.com' },
      expires: '2021-05-27T00:00:00.000Z',
    },
  }),
}));

const props: OperationFormProps = {
  node: mockNode,
  operation: {
    label: 'Coalesce',
    slug: 'coalescecolumns',
    infoToolTip:
      'Reads columns in the order selected and returns the first non-NULL value from a series of columns',
  },
  sx: { marginLeft: '10px' },
  continueOperationChain: continueOperationChainMock,
  action: 'create',
  setLoading: jest.fn(),
};

(global as any).fetch = jest.fn((url: string) => {
  console.log(url, 'swes');
  switch (true) {
    case url.includes('warehouse/table_columns/intermediate/sheet2_mod2'):
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(intermediateTableResponse),
      });

    case url.includes('transform/dbt_project/model'):
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(),
      });

    default:
      return Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: 'Not Found' }),
      });
  }
});

const coalesceForm = (
  <GlobalContext.Provider value={mockContext}>
    <CoalesceOpForm {...props} />
  </GlobalContext.Provider>
);

describe('Coalesce form', () => {
  it('renders correct initial form state', async () => {
    render(coalesceForm);
    await waitFor(() => {
      expect(screen.getByText('Columns')).toBeInTheDocument();
      expect(screen.getByText('Default Value*')).toBeInTheDocument();
      expect(screen.getByText('Output Column Name*')).toBeInTheDocument();
    });
  });
});

describe('Form interactions', () => {
  it('allows filling out the form and submitting', async () => {
    render(coalesceForm);

    await waitFor(() => {
      expect(screen.getByTestId('savebutton')).toBeInTheDocument();
    });

    const column = screen.getByTestId('column0');

    await fireEvent.keyDown(column, { key: 'ArrowDown' });
    await fireEvent.keyDown(column, { key: 'ArrowDown' });
    await fireEvent.keyDown(column, { key: 'Enter' });

    const defaultValueINput = screen
      .getByTestId('defaultValue')
      .querySelector('input') as HTMLInputElement;
    await user.type(defaultValueINput, '2');

    // Simulate user typing in the Output Column Name
    const outputColumnNameInput = screen.getByLabelText('Output Column Name*');
    await user.type(outputColumnNameInput, 'Default value');

    const saveButton = screen.getByTestId('savebutton');
    await user.click(saveButton);

    await waitFor(() => {
      expect(continueOperationChainMock).toHaveBeenCalled();
    });
  });
});
