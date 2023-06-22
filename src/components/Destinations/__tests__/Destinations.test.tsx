import { render, screen, act } from '@testing-library/react';
import { SessionProvider } from 'next-auth/react';
import { Destinations } from '../Destinations';
import { Session } from 'next-auth';
import { SWRConfig } from 'swr';
import { Dialog } from '@mui/material';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';

// Mock create destination form component
jest.mock('./../CreateDestinationForm', () => {
  const MockCreateDestination = ({ showForm }: any) => {
    return (
      <Dialog open={true} data-testid="test-create-dest-form">
        create-form-dialog-component
      </Dialog>
    );
  };

  MockCreateDestination.displayName = 'MockCreateDestination';

  return MockCreateDestination;
});

// Mock edit destination form component
jest.mock('./../EditDestinationForm', () => {
  const MockEditDestination = ({ showForm }: any) => {
    return (
      <Dialog open={showForm} data-testid="test-edit-dest-form">
        edit-form-dialog-component
      </Dialog>
    );
  };

  MockEditDestination.displayName = 'MockEditDestination';

  return MockEditDestination;
});

describe('Destinations', () => {
  const mockSession: Session = {
    expires: '1',
    user: { email: 'a', name: 'Delta', image: 'c' },
  };

  // Tests
  it('new destination button renders', async () => {
    render(
      <SessionProvider session={mockSession}>
        <Destinations />
      </SessionProvider>
    );
    const button = screen.getByTestId('add-new-destination');
    expect(button).toHaveTextContent('Add a new warehouse');
  });

  const mockSWR_postgres = jest.fn().mockResolvedValueOnce({
    ok: true,
    json: jest.fn().mockResolvedValueOnce({
      warehouses: [
        {
          airbyte_destination: {
            destinationId: 'fake-dest-id',
            destinationDefinitionId: 'fake-dest-def-id',
            name: 'warehouse-name',
            connectionConfiguration: {
              host: 'HOSTNAME',
              port: '9999',
              database: 'MYDATABASE',
              username: 'MYUSERNAME',
            },
          },
          wtype: 'postgres',
          icon: null,
        },
      ],
    }),
  });

  const mockSWR_bigquery = jest.fn().mockResolvedValueOnce({
    ok: true,
    json: jest.fn().mockResolvedValueOnce({
      warehouses: [
        {
          airbyte_destination: {
            destinationId: 'fake-dest-id',
            destinationDefinitionId: 'fake-dest-def-id',
            name: 'warehouse-name',
            connectionConfiguration: {
              project_id: 'PROJECT_ID',
              dataset_id: 'DATASET_ID',
              loading_method: {
                method: 'GCS Staging',
                gcs_bucket_name: 'gcs_bucket_name',
                gcs_bucket_path: 'gcs_bucket_path',
              },
            },
          },
          wtype: 'bigquery',
          icon: null,
        },
      ],
    }),
  });

  it('fetches a postgres warehouse', async () => {
    await act(() => {
      render(
        <SWRConfig
          value={{
            dedupingInterval: 0,
            fetcher: (resource) =>
              mockSWR_postgres(resource, {}).then((res: any) => res.json()),
            provider: () => new Map(),
          }}
        >
          <SessionProvider session={mockSession}>
            <Destinations />
          </SessionProvider>
        </SWRConfig>
      );
    });
    const wtype = screen.getByTestId('wtype');
    expect(wtype).toHaveTextContent('postgres');
    const host = screen.getByTestId('host');
    expect(host).toHaveTextContent('HOSTNAME');
    const port = screen.getByTestId('port');
    expect(port).toHaveTextContent('9999');
    const database = screen.getByTestId('database');
    expect(database).toHaveTextContent('MYDATABASE');
    const username = screen.getByTestId('username');
    expect(username).toHaveTextContent('MYUSERNAME');

    // Check if edit button renders the mocked component
    const editWarehouseButton = screen.getByTestId('edit-destination');
    await act(async () => await userEvent.click(editWarehouseButton));
    const mockEditDestinationForm = screen.getByTestId('test-edit-dest-form');
    expect(mockEditDestinationForm).toBeInTheDocument();
  });

  it('fetches a bigquery warehouse', async () => {
    await act(() => {
      render(
        <SWRConfig
          value={{
            dedupingInterval: 0,
            fetcher: (resource) =>
              mockSWR_bigquery(resource, {}).then((res: any) => res.json()),
            provider: () => new Map(),
          }}
        >
          <SessionProvider session={mockSession}>
            <Destinations />
          </SessionProvider>
        </SWRConfig>
      );
    });
    const wtype = screen.getByTestId('wtype');
    expect(wtype).toHaveTextContent('bigquery');
    const project_id = screen.getByTestId('project_id');
    expect(project_id).toHaveTextContent('PROJECT_ID');
    const dataset_id = screen.getByTestId('dataset_id');
    expect(dataset_id).toHaveTextContent('DATASET_ID');
    const loading_method = screen.getByTestId('loading_method');
    expect(loading_method).toHaveTextContent('GCS Staging');
    const gcs_bucket_name_and_path = screen.getByTestId(
      'gcs_bucket_name_and_path'
    );
    expect(gcs_bucket_name_and_path).toHaveTextContent(
      'gcs_bucket_name / gcs_bucket_path'
    );

    const edit_button = screen.getByTestId('edit-destination');
    expect(edit_button).toBeInTheDocument();
    const delete_button = screen.getByTestId('delete-destination');
    expect(delete_button).toBeInTheDocument();

    // Check if edit button renders the mocked component
    const editWarehouseButton = screen.getByTestId('edit-destination');
    await act(async () => await userEvent.click(editWarehouseButton));
    const mockEditDestinationForm = screen.getByTestId('test-edit-dest-form');
    expect(mockEditDestinationForm).toBeInTheDocument();
  });

  it('warehouse not created', async () => {
    const mockSWR_nowarehouse = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce({
        warehouses: [],
      }),
    });

    await act(() => {
      render(
        <SWRConfig
          value={{
            dedupingInterval: 0,
            fetcher: (resource) =>
              mockSWR_nowarehouse().then((res: any) => res.json()),
            provider: () => new Map(),
          }}
        >
          <SessionProvider session={mockSession}>
            <Destinations />
          </SessionProvider>
        </SWRConfig>
      );
    });

    const addNewWarehouseButton = screen.getByTestId('add-new-destination');
    expect(addNewWarehouseButton).toBeInTheDocument();

    // Open create destination form
    await act(async () => userEvent.click(addNewWarehouseButton));
    const mockCreateDestinationForm = screen.getByTestId(
      'test-create-dest-form'
    );
    expect(mockCreateDestinationForm).toBeInTheDocument();
  });
});
