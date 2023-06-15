import { render, screen, act } from '@testing-library/react';
import { SessionProvider } from 'next-auth/react';
import { Session } from 'next-auth';
import EditSourceForm from '../EditSourceForm';
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

  // ============================================================
  it('renders the form', async () => {
    (global as any).fetch = jest
      .fn()
      // airbyte/source_definitions
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce([
          {
            name: 'sourceDefElementName',
            sourceDefinitionId: 'MY-SOURCEDEF-ID',
          },
          {
            name: 'anotherSDefName',
            sourceDefinitionId: 'anotherSDefId',
          },
          {
            name: 'andAnotherSDefName',
            sourceDefinitionId: 'andAnotherSDefId',
          },
        ]),
      })
      // airbyte/sources/<sourceId>
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({
          name: 'MYSOURCENAME',
          sourceDefinitionId: 'MY-SOURCEDEF-ID',
        }),
      })
      // airbyte/source_definitions/<sourceDefId>/specifications
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce([
          {
            properties: {
              host: {
                type: 'string',
                title: 'Host',
                field: 'host',
                default: 'localhost',
              },
            },
            required: ['host'],
          },
        ]),
      });
    const setShowFormMock = jest.fn();

    await act(async () => {
      render(
        <SessionProvider session={mockSession}>
          <EditSourceForm
            sourceId="fake-source-id"
            showForm={true}
            setShowForm={(x) => setShowFormMock(x)}
          />
        </SessionProvider>
      );
    });
    const savebutton = screen.getByTestId('savebutton');
    expect(savebutton).toBeInTheDocument();

    const cancelbutton = screen.getByTestId('cancelbutton');
    expect(cancelbutton).toBeInTheDocument();

    const sourceName = screen.getByLabelText('Name') as HTMLInputElement;
    expect(sourceName).toBeInTheDocument();
    expect(sourceName.value).toBe('MYSOURCENAME');

    await userEvent.click(cancelbutton);
    expect(setShowFormMock).toHaveBeenCalledWith(false);

    const sourceType = screen.getByLabelText('Select source type');
    expect(sourceType).toBeInTheDocument();
  });

  // ============================================================
  // it('renders the form', async () => {
  //   (global as any).fetch = jest
  //     .fn()
  //     // airbyte/sources/<sourceId>
  //     .mockResolvedValueOnce({
  //       ok: true,
  //       json: jest.fn().mockResolvedValueOnce({
  //         name: 'sourceName',
  //         sourceDefinitionId: 'sourceDefId',
  //       }),
  //     })
  //     // airbyte/source_definitions
  //     .mockResolvedValueOnce({
  //       ok: true,
  //       json: jest.fn().mockResolvedValueOnce([
  //         {
  //           name: 'sourceDefElementName',
  //           sourceDefinitionId: 'sourceDefId',
  //         },
  //       ]),
  //     })
  //     // airbyte/source_definitions/<sourceDefId>/specifications
  //     .mockResolvedValueOnce({
  //       ok: true,
  //       json: jest.fn().mockResolvedValueOnce([
  //         {
  //           properties: {
  //             host: {
  //               type: 'string',
  //               title: 'Host',
  //               field: 'host',
  //               default: 'localhost',
  //             },
  //           },
  //           required: ['host'],
  //         },
  //       ]),
  //     });

  //   const setShowFormMock = jest.fn();

  //   render(
  //     <SessionProvider session={mockSession}>
  //       <EditSourceForm
  //         sourceId="fake-source-id"
  //         showForm={true}
  //         setShowForm={(x) => setShowFormMock(x)}
  //       />
  //     </SessionProvider>
  //   );
  //   const savebutton = screen.getByTestId('savebutton');
  //   expect(savebutton).toBeInTheDocument();

  //   const cancelbutton = screen.getByTestId('cancelbutton');
  //   expect(cancelbutton).toBeInTheDocument();

  //   const sourceName = screen.getByLabelText('Name');
  //   expect(sourceName).toBeInTheDocument();
  //   // expect(sourceName.value).toBe('sourceName');

  //   await userEvent.click(cancelbutton);
  //   expect(setShowFormMock).toHaveBeenCalledWith(false);

  //   const sourceType = screen.getByLabelText('Select source type');
  //   expect(sourceType).toBeInTheDocument();

  //   const sourceTypeInput = screen.getByRole('combobox');
  //   // await userEvent.type(sourceTypeInput, 'sourceDefElementName');

  //   // console.log(sourceconfiginput);
  // });
});
