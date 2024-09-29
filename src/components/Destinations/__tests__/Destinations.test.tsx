import { render, screen, act, waitFor } from '@testing-library/react';
import { SessionProvider } from 'next-auth/react';
import { Destinations } from '../Destinations';
import { Session } from 'next-auth';
import { SWRConfig } from 'swr';
import { Dialog } from '@mui/material';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { GlobalContext } from '@/contexts/ContextProvider';

// Mock destination form component
jest.mock('./../DestinationForm', () => {
  const MockDestination = ({}: any) => {
    return (
      <Dialog open={true} data-testid="test-dest-form">
        form-dialog-component
      </Dialog>
    );
  };

  MockDestination.displayName = 'MockDestinationForm';

  return MockDestination;
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

  const destinations = (mockFunction: any) => (
    <GlobalContext.Provider
      value={{
        CurrentOrg: { state: { is_demo: false } },
        Permissions: {
          state: [
            'can_edit_warehouse',
            'can_create_warehouse',
            'can_delete_warehouse',
          ],
        },
      }}
    >
      <SWRConfig
        value={{
          dedupingInterval: 0,
          fetcher: (resource) =>
            mockFunction(resource, {}).then((res: any) => res.json()),
          provider: () => new Map(),
        }}
      >
        <SessionProvider session={mockSession}>
          <Destinations />
        </SessionProvider>
      </SWRConfig>
    </GlobalContext.Provider>
  );

  it('fetches a postgres warehouse', async () => {
    render(destinations(mockSWR_postgres));
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
    const username = screen.getByTestId('user');
    expect(username).toHaveTextContent('MYUSERNAME');
    const abworkspace = screen.getByTestId('airbyteWorkspaceID');
    expect(abworkspace).toHaveTextContent('WORKSPACE_ID');

    // Check if edit button renders the mocked component
    const editWarehouseButton = screen.getByTestId('edit-destination');
    await await userEvent.click(editWarehouseButton);
    const mockEditDestinationForm = screen.getByTestId('test-dest-form');
    expect(mockEditDestinationForm).toBeInTheDocument();
  });

  it('fetches a bigquery warehouse', async () => {
    render(destinations(mockSWR_bigquery));

    await waitFor(() => {
      const wtype = screen.getByTestId('wname');
      expect(wtype).toHaveTextContent('BQWarehouse');
    });

    const project_id = screen.getByTestId('project');
    expect(project_id).toHaveTextContent('PROJECT_ID');
    const dataset_id = screen.getByTestId('dataset');
    expect(dataset_id).toHaveTextContent('DATASET_ID');
    const loading_method = screen.getByTestId('loadingMethod');
    expect(loading_method).toHaveTextContent('GCS Staging');
    const gcs_bucket_name_and_path = screen.getByTestId('gCSBucket&amp;Path');
    expect(gcs_bucket_name_and_path).toHaveTextContent(
      'gcs_bucket_name / gcs_bucket_path'
    );
    const abworkspace = screen.getByTestId('airbyteWorkspaceID');
    expect(abworkspace).toHaveTextContent('WORKSPACE_ID');

    const edit_button = screen.getByTestId('edit-destination');
    expect(edit_button).toBeInTheDocument();
    const delete_button = screen.getByTestId('delete-destination');
    expect(delete_button).toBeInTheDocument();

    // Check if edit button renders the mocked component
    const editWarehouseButton = screen.getByTestId('edit-destination');
    await act(async () => await userEvent.click(editWarehouseButton));
    const mockEditDestinationForm = screen.getByTestId('test-dest-form');
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
      render(destinations(mockSWR_nowarehouse));
    });

    const addNewWarehouseButton = screen.getByTestId('add-new-destination');
    expect(addNewWarehouseButton).toBeInTheDocument();

    // Open create destination form
    await act(async () => userEvent.click(addNewWarehouseButton));
    const mockCreateDestinationForm = screen.getByTestId('test-dest-form');
    expect(mockCreateDestinationForm).toBeInTheDocument();
  });
});
