import { render, screen, waitFor } from '@testing-library/react';
import ReplaceValueOpForm from '../ReplaceValueOpForm';
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
    label: 'Replace',
    slug: 'replace',
    infoToolTip:
      'Replace all the row values in a column having a specified string with a new value',
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

const replaceValueForm = (
  <GlobalContext.Provider value={mockContext}>
    <ReplaceValueOpForm {...props} />
  </GlobalContext.Provider>
);

describe('Replace value form', () => {
  it('renders correct initial form state', async () => {
    render(replaceValueForm);
    await waitFor(() => {
      expect(screen.getByText('Select a column*')).toBeInTheDocument();
      expect(screen.getByText('Column value')).toBeInTheDocument();
      expect(screen.getByText('Replace with')).toBeInTheDocument();
    });
  });
});

describe('Form interactions', () => {
  it('allows filling out the form and submitting', async () => {
    render(replaceValueForm);

    await waitFor(() => {
      expect(screen.getByTestId('savebutton')).toBeInTheDocument();
    });
    const saveButton = screen.getByTestId('savebutton');
    await userEvent.click(saveButton);

    // validations to be called
    await waitFor(() => {
      expect(screen.getByText('Column is required')).toBeInTheDocument();
      expect(screen.getByText('Atleast one value is required')).toBeInTheDocument();
    });

    await fireMultipleKeyDown('column', 2);

    const columnValue0 = screen
      .getByTestId('columnValue0')
      .querySelector('input') as HTMLInputElement;
    const replacedValue0 = screen
      .getByTestId('replacedValue0')
      .querySelector('input') as HTMLInputElement;

    await user.type(columnValue0, '0');
    await user.type(replacedValue0, '1');

    await user.click(screen.getByText('Add row'));

    const columnValue1 = screen
      .getByTestId('columnValue0')
      .querySelector('input') as HTMLInputElement;
    const replacedValue1 = screen
      .getByTestId('replacedValue0')
      .querySelector('input') as HTMLInputElement;

    await user.type(columnValue1, 'null');
    await user.type(replacedValue1, '1');

    await user.click(saveButton);

    await waitFor(() => {
      expect(continueOperationChainMock).toHaveBeenCalled();
    });
  });
});
