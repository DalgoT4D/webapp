import { render, screen, waitFor } from '@testing-library/react';
import AggregationOpForm from '../AggregationOpForm';
import { GlobalContext } from '@/contexts/ContextProvider';
import { OperationFormProps } from '../../../OperationConfigLayout';
import userEvent from '@testing-library/user-event';
import { aggregateDbtModelResponse, intermediateTableResponse, mockNode } from './helpers';
import { fireMultipleKeyDown } from '@/utils/tests';

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
    label: 'Aggregate',
    slug: 'aggregate',
    infoToolTip:
      'Performs a calculation on multiple values in a column and returns a new column with that value in every row',
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

    case url.includes('transform/v2/dbt_project/operations/nodes/'):
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(aggregateDbtModelResponse),
      });

    default:
      return Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: 'Not Found' }),
      });
  }
});

const aggregationOpForm = (
  <GlobalContext.Provider value={mockContext}>
    <AggregationOpForm {...props} />
  </GlobalContext.Provider>
);

describe('AggregationOpForm', () => {
  it('renders correct initial form state', async () => {
    render(aggregationOpForm);
    await waitFor(() => {
      expect(screen.getByLabelText('Select Column to Aggregate*')).toHaveValue('');
      expect(screen.getByLabelText('Aggregate*')).toHaveValue('');
      expect(screen.getByLabelText('Output Column Name*')).toHaveValue('');
      expect(screen.getByTestId('savebutton')).toBeInTheDocument();
    });
  });
});

describe('Form interactions', () => {
  it('allows filling out the form and submitting', async () => {
    render(aggregationOpForm);
    // Simulate form submission
    const saveButton = screen.getByTestId('savebutton');
    await userEvent.click(saveButton);

    // validations to be called
    await waitFor(() => {
      expect(screen.getByText('Column to aggregate is required')).toBeInTheDocument();
      expect(screen.getByText('Operation is required')).toBeInTheDocument();
      expect(screen.getByText('Output column name is required')).toBeInTheDocument();
    });

    const [columnInput] = screen.getAllByRole('combobox');

    await user.type(columnInput, 's');
    await fireMultipleKeyDown('aggregateColumn', 1);
    await fireMultipleKeyDown('operation', 2);

    // Simulate user typing in the Output Column Name
    const outputColumnNameInput = screen.getByLabelText('Output Column Name*');
    await user.type(outputColumnNameInput, 'District aggregate');

    await userEvent.click(saveButton);

    await waitFor(() => {
      expect(continueOperationChainMock).toHaveBeenCalled();
    });

    // reset to initial state after submit
    await waitFor(() => {
      expect(screen.getByLabelText('Select Column to Aggregate*')).toHaveValue('');
      expect(screen.getByLabelText('Aggregate*')).toHaveValue('');
      expect(screen.getByLabelText('Output Column Name*')).toHaveValue('');
      expect(screen.getByTestId('savebutton')).toBeInTheDocument();
    });
  });
});
