import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import CaseWhenOpForm from '../CaseWhenOpForm';
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
    label: 'Case',
    slug: 'casewhen',
    infoToolTip:
      'Select the relevant column, operation, and comparison column or value',
  },
  sx: { marginLeft: '10px' },
  continueOperationChain: continueOperationChainMock,
  action: 'create',
  setLoading: jest.fn(),
};

(global as any).fetch = jest.fn((url: string) => {
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

const caseForm = (
  <GlobalContext.Provider value={mockContext}>
    <CaseWhenOpForm {...props} />
  </GlobalContext.Provider>
);

describe('AggregationOpForm', () => {
  it('renders correct initial form state', async () => {
    render(caseForm);
    await waitFor(() => {
      expect(screen.getByText('When')).toBeInTheDocument();
      expect(screen.getByText('Then')).toBeInTheDocument();
      expect(screen.getByText('Else')).toBeInTheDocument();
      expect(screen.getByText('Output Column Name*')).toBeInTheDocument();
    });
  });
});

describe('Form interactions', () => {
  it('allows filling out the form and submitting', async () => {
    render(caseForm);

    await waitFor(() => {
      expect(screen.getByTestId('savebutton')).toBeInTheDocument();
    });
    // Simulate form submission
    const saveButton = screen.getByTestId('savebutton');
    await userEvent.click(saveButton);

    // validations to be called
    await waitFor(() => {
      expect(screen.getByText('Column is required')).toBeInTheDocument();
      expect(screen.getByText('Operation is required')).toBeInTheDocument();
      expect(screen.getAllByText('Value is required')).toHaveLength(2);
      expect(screen.getByText('Column name is required')).toBeInTheDocument();
    });

    const operation = screen.getByTestId('operation');

    await fireEvent.keyDown(operation, { key: 'ArrowDown' });
    await fireEvent.keyDown(operation, { key: 'ArrowDown' });
    await fireEvent.keyDown(operation, { key: 'Enter' });

    const column1 = screen.getByTestId('column');
    await fireEvent.keyDown(column1, { key: 'ArrowDown' });
    await fireEvent.keyDown(column1, { key: 'ArrowDown' });
    await fireEvent.keyDown(column1, { key: 'Enter' });

    const columnValue = screen
      .getByTestId('value0')
      .querySelector('input') as HTMLInputElement;
    await user.type(columnValue, '0');
    const columnValue1 = screen
      .getByTestId('value1')
      .querySelector('input') as HTMLInputElement;
    await user.type(columnValue1, '5');
    const thenValue = screen
      .getByTestId('thenInput')
      .querySelector('input') as HTMLInputElement;
    await user.type(thenValue, '5');

    // Simulate user typing in the Output Column Name
    const outputColumnNameInput = screen.getByLabelText('Output Column Name*');
    await user.type(outputColumnNameInput, 'Replace');

    await user.click(saveButton);

    await waitFor(() => {
      expect(continueOperationChainMock).toHaveBeenCalled();
    });
  });
});
