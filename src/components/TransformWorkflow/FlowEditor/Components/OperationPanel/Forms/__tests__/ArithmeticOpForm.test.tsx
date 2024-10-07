import { render, screen, waitFor } from '@testing-library/react';
import ArithmeticOpForm from '../ArithmeticOpForm';
import { GlobalContext } from '@/contexts/ContextProvider';
import { OperationFormProps } from '../../../OperationConfigLayout';
import userEvent from '@testing-library/user-event';
import { intermediateTableResponse, mockNode } from './helpers';
import { fireMultipleKeyDown } from '@/utils/tests';

const user = userEvent.setup();

const continueOperationChainMock = jest.fn();
const mockContext = {
  Toast: { state: null, dispatch: jest.fn() },
};

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
    label: 'Arithmetic',
    slug: 'arithmetic',
    infoToolTip: 'Perform arithmetic operations on or between one or more columns',
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
        json: () => Promise.resolve({}),
      });

    default:
      return Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: 'Not Found' }),
      });
  }
});

const arithmeticForm = (
  <GlobalContext.Provider value={mockContext}>
    <ArithmeticOpForm {...props} />
  </GlobalContext.Provider>
);

describe('Arithmetic form', () => {
  it('renders correct initial form state', async () => {
    render(arithmeticForm);
    await waitFor(() => {
      expect(screen.getByLabelText('Operation*')).toHaveValue('');
      expect(screen.getByLabelText('Output Column Name*')).toHaveValue('');
    });
  });
});

describe('Form interactions', () => {
  it('allows filling out the form and submitting', async () => {
    render(arithmeticForm);

    await waitFor(() => {
      expect(screen.getByTestId('savebutton')).toBeInTheDocument();
    });
    // Simulate form submission
    const saveButton = screen.getByTestId('savebutton');
    await userEvent.click(saveButton);

    // validations to be called
    await waitFor(() => {
      expect(screen.getByText('Operation is required')).toBeInTheDocument();
      expect(screen.getAllByText('Column is required')).toHaveLength(2);
      expect(screen.getByText('Output column name is required')).toBeInTheDocument();
    });

    await fireMultipleKeyDown('operation', 2);

    await fireMultipleKeyDown('column0', 2);

    await fireMultipleKeyDown('column1', 2);

    const outputColumnNameInput = screen.getByLabelText('Output Column Name*');
    await user.type(outputColumnNameInput, 'Sum');

    await user.click(saveButton);

    await waitFor(() => {
      expect(continueOperationChainMock).toHaveBeenCalled();
    });

    // reset to initial state after submit
    await waitFor(() => {
      expect(screen.getByLabelText('Operation*')).toHaveValue('');
      expect(screen.getByLabelText('Output Column Name*')).toHaveValue('');
    });
  });
});
