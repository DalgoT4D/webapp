import { render, screen, waitFor } from '@testing-library/react';
import GenericColumnOpForm from '../GenericColumnOpForm';
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
    label: 'Generic Column',
    slug: 'generic',
    infoToolTip: 'Add a generic column operation',
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

const genericColumnForm = (
  <GlobalContext.Provider value={mockContext}>
    <GenericColumnOpForm {...props} />
  </GlobalContext.Provider>
);

describe('Flatter json form', () => {
  it('renders correct initial form state', async () => {
    render(genericColumnForm);
    await waitFor(() => {
      expect(screen.getByText('Function*')).toBeInTheDocument();
      expect(screen.getByText('Output Column Name*')).toBeInTheDocument();
    });
  });
});

describe('Form interactions', () => {
  it('allows filling out the form and submitting', async () => {
    render(genericColumnForm);

    await waitFor(() => {
      expect(screen.getByTestId('savebutton')).toBeInTheDocument();
    });
    const saveButton = screen.getByTestId('savebutton');
    await userEvent.click(saveButton);

    // validations to be called
    await waitFor(() => {
      expect(screen.getByText('Function name is required')).toBeInTheDocument();
      expect(screen.getByText('Column is required')).toBeInTheDocument();
      expect(screen.getByText('Output column name is required')).toBeInTheDocument();
    });

    const functionName = screen.getByTestId('function').querySelector('input') as HTMLInputElement;

    await user.type(functionName, 'SUM');

    await fireMultipleKeyDown('column0', 2);

    const outputColumnNameInput = screen.getByLabelText('Output Column Name*');
    await user.type(outputColumnNameInput, 'Custom function');

    await user.click(saveButton);

    await waitFor(() => {
      expect(continueOperationChainMock).toHaveBeenCalled();
    });
  });
});
