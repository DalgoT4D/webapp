import { render, screen, waitFor } from '@testing-library/react';
import GroupByOpForm from '../GroupByOpForm';
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
    label: 'Group By',
    slug: 'groupby',
    infoToolTip: 'Group your data by one or more dimensions and analyse it',
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
        json: () => Promise.resolve(),
      });

    default:
      return Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: 'Not Found' }),
      });
  }
});

const groupByForm = (
  <GlobalContext.Provider value={mockContext}>
    <GroupByOpForm {...props} />
  </GlobalContext.Provider>
);

describe('Flatter json form', () => {
  it('renders correct initial form state', async () => {
    render(groupByForm);
    await waitFor(() => {
      expect(screen.getByText('Select dimensions')).toBeInTheDocument();
      expect(screen.getByText('ADD AGGREGATION 01')).toBeInTheDocument();
      expect(screen.getByText('Select metric*')).toBeInTheDocument();
      expect(screen.getByText('Select aggregation*')).toBeInTheDocument();
      expect(screen.getByText('Output Column Name*')).toBeInTheDocument();
    });
  });
});

describe('Form interactions', () => {
  it('allows filling out the form and submitting', async () => {
    render(groupByForm);

    await waitFor(() => {
      expect(screen.getByTestId('savebutton')).toBeInTheDocument();
    });
    const saveButton = screen.getByTestId('savebutton');
    await userEvent.click(saveButton);

    // validations to be called
    await waitFor(() => {
      expect(screen.getByText('Atleast 1 column is required')).toBeInTheDocument();
      expect(screen.getByText('Metric is required')).toBeInTheDocument();
      expect(screen.getByText('Aggregate function is required')).toBeInTheDocument();
      expect(screen.getByText('Output column name is required')).toBeInTheDocument();
    });

    await fireMultipleKeyDown('columns0', 2);
    await fireMultipleKeyDown('metric', 2);
    await fireMultipleKeyDown('aggregation', 2);

    const outputColumnNameInput = screen.getByLabelText('Output Column Name*');
    await user.type(outputColumnNameInput, 'Group column');

    await user.click(saveButton);

    await waitFor(() => {
      expect(continueOperationChainMock).toHaveBeenCalled();
    });
  });
});
