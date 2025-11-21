import { render, screen, waitFor } from '@testing-library/react';
import WhereFilterOpForm from '../WhereFilterOpForm';
import { GlobalContext } from '@/contexts/ContextProvider';
import { OperationFormProps } from '../../../OperationConfigLayout';
import userEvent from '@testing-library/user-event';
import { intermediateTableResponse, mockNode, sourceModelsMock } from './helpers';
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
    label: 'Filter',
    slug: 'where',
    infoToolTip: 'Filters all the row values in the selected column based on the defined condition',
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

    case url.includes('transform/v2/dbt_project/sources_models'):
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(sourceModelsMock),
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

const whereFilterForm = (
  <GlobalContext.Provider value={mockContext}>
    <WhereFilterOpForm {...props} />
  </GlobalContext.Provider>
);

describe('Where filter form', () => {
  it('renders correct initial form state', async () => {
    render(whereFilterForm);
    await waitFor(() => {
      expect(screen.getByText('Select column*')).toBeInTheDocument();
      expect(screen.getByText('Select operation*')).toBeInTheDocument();
      expect(screen.getByText('Advance Filter')).toBeInTheDocument();
    });
  });
});

describe('Form interactions', () => {
  it('allows filling out the form and submitting', async () => {
    render(whereFilterForm);

    await waitFor(() => {
      expect(screen.getByTestId('savebutton')).toBeInTheDocument();
    });
    const saveButton = screen.getByTestId('savebutton');
    await userEvent.click(saveButton);

    // validations to be called
    await waitFor(() => {
      expect(screen.getAllByText('Column is required')).toHaveLength(2);
      expect(screen.getByText('Operation is required')).toBeInTheDocument();
    });

    await fireMultipleKeyDown('columnToCheck', 2);
    await fireMultipleKeyDown('operation', 2);
    await fireMultipleKeyDown('checkAgainstColumn', 3);

    await user.click(saveButton);

    await waitFor(() => {
      expect(continueOperationChainMock).toHaveBeenCalled();
    });
  });
});
