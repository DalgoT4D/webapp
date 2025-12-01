import { render, screen, waitFor } from '@testing-library/react';
import FlattenJsonOpForm from '../FlattenJsonOpForm';
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
    label: 'Flatten JSON',
    slug: 'flattenjson',
    infoToolTip: 'Transforms JSON formatted data into Tablular formatted data',
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

    case url.includes(
      'warehouse/dbt_project/json_columnspec/?source_schema=intermediate&input_name=sheet2_mod2&json_column=_airbyte_extracted_at'
    ):
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(['default']),
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

const flattenjsonForm = (
  <GlobalContext.Provider value={mockContext}>
    <FlattenJsonOpForm {...props} />
  </GlobalContext.Provider>
);

describe('Flatten json form', () => {
  it('renders correct initial form state', async () => {
    render(flattenjsonForm);
    await waitFor(() => {
      expect(screen.getByText('Select JSON Column')).toBeInTheDocument();
    });
  });
});

describe('Form interactions', () => {
  it('allows filling out the form and submitting', async () => {
    render(flattenjsonForm);

    await waitFor(() => {
      expect(screen.getByTestId('savebutton')).toBeInTheDocument();
    });
    const saveButton = screen.getByTestId('savebutton');
    await userEvent.click(saveButton);

    // validations to be called
    await waitFor(() => {
      expect(screen.getByText('JSON column is required')).toBeInTheDocument();
    });

    await fireMultipleKeyDown('jsonColumn', 2);

    await waitFor(() => {
      expect(screen.getByText('JSON Columns')).toBeInTheDocument();
      expect(screen.getByText('default')).toBeInTheDocument();
    });

    await user.click(saveButton);

    await waitFor(() => {
      expect(continueOperationChainMock).toHaveBeenCalled();
    });
  });
});
