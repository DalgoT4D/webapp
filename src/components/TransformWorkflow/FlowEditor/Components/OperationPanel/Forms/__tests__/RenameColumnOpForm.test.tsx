import { render, screen, waitFor } from '@testing-library/react';
import RenameColumnOpForm from '../RenameColumnOpForm';
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
    label: 'Rename',
    slug: 'renamecolumns',
    infoToolTip: 'Select columns and rename them',
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

const renameColumnForm = (
  <GlobalContext.Provider value={mockContext}>
    <RenameColumnOpForm {...props} />
  </GlobalContext.Provider>
);

describe('Rename column form', () => {
  it('renders correct initial form state', async () => {
    render(renameColumnForm);
    await waitFor(() => {
      expect(screen.getByText('Current Name')).toBeInTheDocument();
      expect(screen.getByText('New Name')).toBeInTheDocument();
      expect(screen.getByText('Add column')).toBeInTheDocument();
    });
  });
});

describe('Form interactions', () => {
  it('allows filling out the form and submitting', async () => {
    render(renameColumnForm);

    await waitFor(() => {
      expect(screen.getByTestId('savebutton')).toBeInTheDocument();
    });
    const saveButton = screen.getByTestId('savebutton');
    await userEvent.click(saveButton);

    // validations to be called
    await waitFor(() => {
      expect(screen.getByText('Alteast one column is required')).toBeInTheDocument();
    });

    await fireMultipleKeyDown('currentName0', 2);

    const newName0 = screen.getByTestId('newName0').querySelector('input') as HTMLInputElement;

    await user.type(newName0, 'updated_name');

    await user.click(screen.getByText('Add column'));

    await fireMultipleKeyDown('currentName1', 2);

    const newName1 = screen.getByTestId('newName1').querySelector('input') as HTMLInputElement;

    await user.type(newName1, 'updated_name1');

    await user.click(saveButton);

    await waitFor(() => {
      expect(continueOperationChainMock).toHaveBeenCalled();
    });
  });
});
