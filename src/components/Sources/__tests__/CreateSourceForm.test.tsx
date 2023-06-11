import { render, screen } from '@testing-library/react';
import { SessionProvider } from 'next-auth/react';
import { Session } from 'next-auth';
import CreateSourceForm from '../CreateSourceForm';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// const user = userEvent.setup();

const pushMock = jest.fn();

jest.mock('next/router', () => ({
  useRouter() {
    return {
      push: pushMock,
    };
  },
}));


describe('Connections Setup', () => {
  const mockSession: Session = {
    expires: '1',
    user: { email: 'a' },
  };

  it('renders the form', async () => {

    (global as any).fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce([
        {
          name: 'sourceDefElementName',
          sourceDefinitionId: 'sourceDefId'
        }
      ])
    }).mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce({
        properties: {
          host: {
            order: 1,
          },
        },
        required: {
          host: true,
        }
      })
    });

    const setShowFormMock = jest.fn();

    render(
      <SessionProvider session={mockSession}>
        <CreateSourceForm
          mutate={() => { }}
          showForm={true}
          setShowForm={(x) => setShowFormMock(x)}
        />
      </SessionProvider>
    );
    const savebutton = screen.getByTestId('savebutton');
    expect(savebutton).toBeInTheDocument();

    const cancelbutton = screen.getByTestId('cancelbutton');
    expect(cancelbutton).toBeInTheDocument();

    const sourceName = screen.getByLabelText('Name');
    expect(sourceName).toBeInTheDocument();

    await userEvent.click(cancelbutton);
    expect(setShowFormMock).toHaveBeenCalledWith(false);

    const sourceType = screen.getByLabelText('Select source type');
    expect(sourceType).toBeInTheDocument();

    const sourceTypeInput = screen.getByRole('combobox');
    await userEvent.type(sourceTypeInput, "sourceDefElementName");
    const sourceconfiginput = await screen.findByTestId('temp__1');
    expect(sourceconfiginput).toBeInTheDocument();

    // console.log(sourceconfiginput);
  });

});