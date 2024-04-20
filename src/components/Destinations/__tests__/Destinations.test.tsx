import { render, screen, act, waitFor } from '@testing-library/react';
import { SessionProvider } from 'next-auth/react';
import { Destinations } from '../Destinations';
import { Session } from 'next-auth';
import { SWRConfig } from 'swr';
import { Dialog } from '@mui/material';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';

// Mock create destination form component
jest.mock('./../CreateDestinationForm', () => {
  const MockCreateDestination = ({}: any) => {
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
          wtype: 'postgres',
          name: 'PGWarehouse',
          airbyte_destination: {
            destinationDefinitionId: 'DESTINATION_DEF_ID',
            destinationId: 'DESTINATION_ID',
            workspaceId: 'WORKSPACE_ID',
            connectionConfiguration: {
              ssl: false,
              host: 'HOSTNAME',
              port: 5432,
              schema: 'destinations_v2',
              database: 'MYDATABASE',
              password: '**********',
              ssl_mode: {
                mode: 'require',
              },
              username: 'MYUSERNAME',
              tunnel_method: {
                tunnel_method: 'NO_TUNNEL',
              },
            },
            name: 'postgres-warehouse',
            destinationName: 'Postgres',
            icon: 'https://connectors.airbyte.com/files/metadata/airbyte/destination-postgres/latest/icon.svg',
          },
          airbyte_docker_repository: 'airbyte/destination-postgres',
          airbyte_docker_image_tag: '2.0.9',
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
            workspaceId: 'WORKSPACE_ID',
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
          name: 'BQWarehouse',
          icon: null,
        },
      ],
    }),
  });

  it('fetches a postgres warehouse', async () => {
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
    await waitFor(() => {
      const wtype = screen.getByTestId('wname');
      expect(wtype).toHaveTextContent('PGWarehouse');
    });

    const host = screen.getByTestId('host');
    expect(host).toHaveTextContent('HOSTNAME');
    const port = screen.getByTestId('port');
    expect(port).toHaveTextContent('5432');
    const database = screen.getByTestId('database');
    expect(database).toHaveTextContent('MYDATABASE');
    const username = screen.getByTestId('username');
    expect(username).toHaveTextContent('MYUSERNAME');
    const abworkspace = screen.getByTestId('abworkspaceid');
    expect(abworkspace).toHaveTextContent('WORKSPACE_ID');

    // Check if edit button renders the mocked component
    const editWarehouseButton = screen.getByTestId('edit-destination');
    await await userEvent.click(editWarehouseButton);
    const mockEditDestinationForm = screen.getByTestId('test-edit-dest-form');
    expect(mockEditDestinationForm).toBeInTheDocument();
  });

  it('fetches a bigquery warehouse', async () => {
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

    await waitFor(() => {
      const wtype = screen.getByTestId('wname');
      expect(wtype).toHaveTextContent('BQWarehouse');
    });

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
    const abworkspace = screen.getByTestId('abworkspaceid');
    expect(abworkspace).toHaveTextContent('WORKSPACE_ID');

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
            fetcher: () => mockSWR_nowarehouse().then((res: any) => res.json()),
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
