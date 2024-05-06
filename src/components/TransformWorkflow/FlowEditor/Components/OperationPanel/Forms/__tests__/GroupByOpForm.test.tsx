import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import GroupByOpForm from '../GroupByOpForm';
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

const groupByForm = (
  <GlobalContext.Provider value={mockContext}>
    <GroupByOpForm {...props} />
  </GlobalContext.Provider>
);

describe('Flatter json form', () => {
  it('renders correct initial form state', async () => {
    render(groupByForm);
    await waitFor(() => {
      expect(screen.getByText('Select dimensios')).toBeInTheDocument();
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
      expect(
        screen.getByText('Atleast 1 column is required')
      ).toBeInTheDocument();
      expect(screen.getByText('Metric is required')).toBeInTheDocument();
      expect(
        screen.getByText('Aggregate function is required')
      ).toBeInTheDocument();
      expect(
        screen.getByText('Output column name is required')
      ).toBeInTheDocument();
    });

    const column = screen.getByTestId('columns0');

    await fireEvent.keyDown(column, { key: 'ArrowDown' });
    await fireEvent.keyDown(column, { key: 'ArrowDown' });
    await fireEvent.keyDown(column, { key: 'Enter' });

    const metric = screen.getByTestId('metric');

    await fireEvent.keyDown(metric, { key: 'ArrowDown' });
    await fireEvent.keyDown(metric, { key: 'ArrowDown' });
    await fireEvent.keyDown(metric, { key: 'Enter' });

    const aggregation = screen.getByTestId('aggregation');

    await fireEvent.keyDown(aggregation, { key: 'ArrowDown' });
    await fireEvent.keyDown(aggregation, { key: 'ArrowDown' });
    await fireEvent.keyDown(aggregation, { key: 'Enter' });

    const outputColumnNameInput = screen.getByLabelText('Output Column Name*');
    await user.type(outputColumnNameInput, 'Group column');

    await user.click(saveButton);

    await waitFor(() => {
      expect(continueOperationChainMock).toHaveBeenCalled();
    });
  });
});
