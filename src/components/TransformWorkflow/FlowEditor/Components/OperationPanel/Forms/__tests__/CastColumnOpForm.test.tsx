import { render, screen, waitFor } from '@testing-library/react';
import CastColumnOpForm from '../CastColumnOpForm';
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
    label: 'Cast',
    slug: 'castdatatypes',
    infoToolTip: "Convert a column's values (of any type) into a specified datatype",
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

    case url.includes('transform/dbt_project/data_type'):
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve([
            'boolean',
            'char',
            'character varying',
            'date',
            'double precision',
            'float',
            'integer',
            'jsonb',
            'numeric',
            'text',
            'time',
            'timestamp',
            'timestamp with time zone',
            'uuid',
            'varchar',
          ]),
      });

    default:
      return Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: 'Not Found' }),
      });
  }
});

const castForm = (
  <GlobalContext.Provider value={mockContext}>
    <CastColumnOpForm {...props} />
  </GlobalContext.Provider>
);

describe('AggregationOpForm', () => {
  it('renders correct initial form state', async () => {
    render(castForm);
    await waitFor(() => {
      expect(screen.getByText('Column name')).toBeInTheDocument();
      expect(screen.getByText('Type')).toBeInTheDocument();
      expect(screen.getByTestId('columnName0').querySelector('input')).toHaveValue('salinity');
      expect(screen.getByTestId('columnName1').querySelector('input')).toHaveValue('Multiple');
    });
  });
});

describe('Form interactions', () => {
  it('allows filling out the form and submitting', async () => {
    render(castForm);

    await waitFor(() => {
      expect(screen.getByTestId('savebutton')).toBeInTheDocument();
    });

    await fireMultipleKeyDown('type0', 2);

    const saveButton = screen.getByTestId('savebutton');
    await user.click(saveButton);

    await waitFor(() => {
      expect(continueOperationChainMock).toHaveBeenCalled();
    });
  });
});
