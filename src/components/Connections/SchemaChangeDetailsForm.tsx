import React, { useContext, useEffect, useRef, useState } from 'react';
import CustomDialog from '../Dialog/CustomDialog';
import { Box, Button, Table, TableBody, TableCell, TableRow, Typography } from '@mui/material';
import { useForm } from 'react-hook-form';
import { httpGet, httpPost, httpPut } from '@/helpers/http';
import { errorToast, successToast } from '../ToastMessage/ToastHelper';
import { GlobalContext } from '@/contexts/ContextProvider';
import { useSession } from 'next-auth/react';
import { delay } from '@/utils/common';

interface SchemaChangeDetailsFormProps {
  connectionId: string;
  refreshConnectionsList: (...args: any) => any;
  showForm: boolean;
  setShowForm: (...args: any) => any;
  setConnectionId: (...args: any) => any;
  fetchPendingActions: () => Promise<void>;
}

type CursorFieldConfig = {
  sourceDefinedCursor: boolean;
  cursorFieldOptions: string[];
};

interface SourceStream {
  name: string;
  supportsIncremental: boolean;
  selected: boolean;
  syncMode: string; // incremental | full_refresh
  destinationSyncMode: string; // append | overwrite | append_dedup
  cursorFieldConfig: CursorFieldConfig; // this will not be posted to backend
  cursorField: string;
  columnsAdded?: string[];
  columnsRemoved?: string[];
}

const SchemaChangeDetailsForm = ({
  setConnectionId,
  connectionId,
  refreshConnectionsList,
  showForm,
  setShowForm,
  fetchPendingActions,
}: SchemaChangeDetailsFormProps) => {
  const { data: session }: any = useSession();
  const globalContext = useContext(GlobalContext);
  const { handleSubmit, reset, setValue } = useForm({
    defaultValues: {
      name: '',
    },
  });
  const [sourceStreams, setSourceStreams] = useState<Array<SourceStream>>([]);
  const [filteredSourceStreams, setFilteredSourceStreams] = useState<Array<SourceStream>>([]);
  const [tableData, setTableData] = useState<Array<{ name: string; changedColumns: string[] }>>([]);
  const [syncCatalog, setSyncCatalog] = useState<any>(null);
  const [catalogDiff, setCatalogDiff] = useState<any>(null);
  const [catalogId, setCatalogId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [hasBreakingChanges, setHasBreakingChanges] = useState<boolean>(false);
  const searchInputRef: any = useRef();
  const inputRef: any = useRef(null);
  const shouldFocusInput: any = useRef(null);

  const [failureMessage, setFailureMessage] = useState<string | null>(null);
  const toastContext = useContext(GlobalContext);

  const checkProgress = async function (taskId: string): Promise<[boolean, any]> {
    try {
      const message = await httpGet(session, `tasks/stp/${taskId}`);
      await delay(3000);
      // setProgressMessages(message['progress']);
      const lastMessage = message['progress'][message['progress'].length - 1];

      if (lastMessage['status'] === 'completed') {
        return [true, lastMessage['result']];
      } else if (lastMessage['status'] === 'failed') {
        return [false, lastMessage['message']];
      } else {
        await delay(2000);
        return await checkProgress(taskId);
      }
    } catch (err: any) {
      console.error(err);
      errorToast(err.message, [], toastContext);
      return [false, null];
    }
  };

  useEffect(() => {
    if (connectionId) {
      (async () => {
        setLoading(true);
        try {
          const data: any = await httpGet(
            session,
            `airbyte/v1/connections/${connectionId}/catalog`
          );
          await delay(3000);
          const [isSuccessful, result] = await checkProgress(data.task_id);
          if (!isSuccessful) {
            setFailureMessage(result);
            throw new Error(result);
          }
          if (result) {
            setCatalogId(result.catalogId || '');
            setValue('name', result.name || '');
            setSyncCatalog(result.syncCatalog?.streams || {});
            setCatalogDiff(result.catalogDiff);

            const catalogDiffData = result.catalogDiff?.transforms || [];

            const newData = catalogDiffData.map((transform: any) => {
              const tableName = transform.streamDescriptor.name;

              // Initialize changedColumns based on transformType
              let changedColumns: string[] = [];

              if (transform.transformType === 'remove_stream') {
                changedColumns.push(`-Stream: ${tableName}`);
              } else if (transform.transformType === 'add_stream') {
                changedColumns.push(`+Stream: ${tableName}`);
              } else {
                changedColumns = transform.updateStream.fieldTransforms.reduce(
                  (columns: string[], update: any) => {
                    if (
                      update.transformType === 'add_field' ||
                      update.transformType === 'remove_field' ||
                      update.transformType === 'update_field_schema'
                    ) {
                      if (update.transformType === 'update_field_schema') {
                        columns.push(`+${update.fieldName.join(', ')}`);
                      } else {
                        columns.push(
                          `${
                            update.transformType === 'add_field' ? '+' : '-'
                          }${update.fieldName.join(', ')}`
                        );
                      }
                    }
                    return columns;
                  },
                  []
                );
              }

              return { name: tableName, changedColumns };
            });

            setTableData(newData);

            // Extract and set source streams
            const streams = result.syncCatalog?.streams;
            if (streams) {
              const sourceStreamsData = streams.map((stream: any) => ({
                name: stream.stream.name,
                columnsAdded: stream.stream.columnsAdded,
                columnsRemoved: stream.stream.columnsRemoved,
              }));
              setSourceStreams(sourceStreamsData);
              setFilteredSourceStreams(sourceStreamsData);
            }

            // Check for breaking changes
            const breakingChanges = result.schemaChange === 'breaking';
            setHasBreakingChanges(breakingChanges);
          }
        } catch (err: any) {
          console.error(err);
          errorToast(err.message, [], globalContext);
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [connectionId]);

  const handleClose = () => {
    reset();
    setConnectionId('');
    setSourceStreams([]);
    setFilteredSourceStreams([]);
    setShowForm(false);
    searchInputRef.current = '';
  };

  const onSubmit = async (data: any) => {
    const payload: any = {
      sourceCatalogId: catalogId,
      name: data.name,
      connectionId,
      syncCatalog: {
        streams: Object.values(syncCatalog),
      },
      skipReset: true,
    };

    if (data.destinationSchema) {
      payload.destinationSchema = data.destinationSchema;
    }

    try {
      if (connectionId) {
        setLoading(true);
        await httpPost(session, `airbyte/v1/connections/${connectionId}/schema_update/schedule`, {
          catalogDiff: catalogDiff,
        });
        successToast('Initiated schema update changes', [], globalContext);
        setLoading(false);
      }
      handleClose();
      refreshConnectionsList();
    } catch (err: any) {
      console.error(err);
      errorToast(err.message, [], globalContext);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (shouldFocusInput.current && inputRef.current) {
      inputRef.current.focus();
      shouldFocusInput.current = false;
    }
  });

  useEffect(() => {
    if (filteredSourceStreams && filteredSourceStreams.length > 0) {
      const filteredStreamNames = filteredSourceStreams.map((stream: SourceStream) => stream.name);
      const updateFilteredStreams = sourceStreams.filter((stream: SourceStream) =>
        filteredStreamNames.includes(stream.name)
      );
      setFilteredSourceStreams(updateFilteredStreams);
    }
  }, [sourceStreams]);

  const FormContent = () => {
    const tableCount = tableData.length;
    // Separate tables and columns added/removed
    const tablesRemoved = tableData.filter((table) =>
      table.changedColumns.some((column) => column.startsWith('-Stream'))
    );
    const tablesAdded = tableData.filter((table) =>
      table.changedColumns.some((column) => column.startsWith('+Stream'))
    );
    const columnsRemoved = tableData.flatMap((table) =>
      table.changedColumns
        .filter((column) => column.startsWith('-') && !column.startsWith('-Stream'))
        .map((column) => ({
          tableName: table.name,
          columnName: column.substring(1),
        }))
    );
    const columnsAdded = tableData.flatMap((table) =>
      table.changedColumns
        .filter((column) => column.startsWith('+') && !column.startsWith('+Stream'))
        .map((column) => ({
          tableName: table.name,
          columnName: column.substring(1),
        }))
    );

    const pluralizeTable = tableCount === 1 ? 'table' : 'tables';

    return (
      <>
        <Box>
          {tableCount > 0 ? (
            <>
              <Typography variant="h5" gutterBottom>
                {tableCount} {pluralizeTable} with changes
              </Typography>
              <Table>
                <TableBody>
                  {tablesRemoved.length > 0 && (
                    <React.Fragment>
                      <Typography variant="h6" fontWeight={600} color="#5f7182" gutterBottom>
                        Tables Removed
                      </Typography>
                      {tablesRemoved.map((table, idx) => (
                        <TableRow key={idx} sx={{ boxShadow: 'none' }}>
                          <TableCell colSpan={2} sx={{ bgcolor: '#f2f2eb' }}>
                            <Typography variant="body2" align="left">
                              {table.name}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </React.Fragment>
                  )}
                  {tablesAdded.length > 0 && (
                    <React.Fragment>
                      <Typography
                        variant="h6"
                        fontWeight={600}
                        color="#5f7182"
                        marginTop="10px"
                        gutterBottom
                      >
                        Tables Added
                      </Typography>
                      {tablesAdded.map((table, idx) => (
                        <TableRow key={idx} sx={{ boxShadow: 'none' }}>
                          <TableCell colSpan={2} sx={{ bgcolor: '#f2f2eb' }}>
                            <Typography variant="body2" align="left">
                              {table.name}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </React.Fragment>
                  )}
                  {columnsRemoved.length > 0 && (
                    <React.Fragment>
                      <Typography
                        variant="h6"
                        fontWeight={600}
                        color="#5f7182"
                        marginTop="10px"
                        gutterBottom
                      >
                        Columns Removed
                      </Typography>
                      <TableRow sx={{ boxShadow: '1px', borderRadius: '0px' }}>
                        <TableCell sx={{ fontWeight: 'bold' }}>Table Names</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Column Names</TableCell>
                      </TableRow>
                      {columnsRemoved.map((column, idx) => (
                        <TableRow key={idx} sx={{ boxShadow: 'none' }}>
                          <TableCell
                            sx={{
                              bgcolor: '#f2f2eb',
                              paddingRight: '8px',
                              borderRight: '8px solid white',
                              width: '50%',
                            }}
                          >
                            <Typography variant="body2" align="left">
                              {column.tableName}
                            </Typography>
                          </TableCell>
                          <TableCell
                            sx={{
                              bgcolor: '#f2f2eb',
                              paddingLeft: '8px',
                              borderLeft: '8px solid white',
                              width: '50%',
                            }}
                          >
                            <Typography variant="body2" align="left">
                              {column.columnName}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </React.Fragment>
                  )}
                  {columnsAdded.length > 0 && (
                    <React.Fragment>
                      <Typography
                        variant="h6"
                        fontWeight={600}
                        color="#5f7182"
                        marginTop="10px"
                        gutterBottom
                      >
                        Columns Added
                      </Typography>
                      <TableRow sx={{ boxShadow: '1px', borderRadius: '0px' }}>
                        <TableCell sx={{ fontWeight: 'bold' }}>Table Names</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Column Names</TableCell>
                      </TableRow>
                      {columnsAdded.map((column, idx) => (
                        <TableRow key={idx} sx={{ boxShadow: 'none' }}>
                          <TableCell
                            sx={{
                              bgcolor: '#f2f2eb',
                              paddingRight: '8px',
                              borderRight: '8px solid white',
                              width: '50%',
                            }}
                          >
                            <Typography variant="body2" align="left">
                              {column.tableName}
                            </Typography>
                          </TableCell>
                          <TableCell
                            sx={{
                              bgcolor: '#f2f2eb',
                              paddingLeft: '8px',
                              borderLeft: '8px solid white',
                              width: '50%',
                            }}
                          >
                            <Typography variant="body2" align="left">
                              {column.columnName}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </React.Fragment>
                  )}
                </TableBody>
              </Table>
            </>
          ) : failureMessage && failureMessage.length > 0 ? (
            <Typography variant="body1">{failureMessage}</Typography>
          ) : (
            <Typography variant="body1">No schema changes detected.</Typography>
          )}
        </Box>
      </>
    );
  };

  return (
    <>
      <CustomDialog
        maxWidth={false}
        data-testid="dialog"
        title={'Schema Changes'}
        subTitle={
          'Accepting the schema changes will not trigger a clear & resync of the connection. You are free to do this manually but in most cases you will not need to.'
        }
        show={showForm}
        handleClose={handleClose}
        handleSubmit={handleSubmit(onSubmit)}
        formContent={<FormContent />}
        formActions={
          <>
            {tableData.length > 0 && (
              <Button
                variant="contained"
                type="submit"
                disabled={hasBreakingChanges}
                data-testid="approveschemachange"
                sx={{ marginTop: '20px' }}
              >
                Yes, I approve
              </Button>
            )}
            <Button
              color="secondary"
              variant="outlined"
              onClick={handleClose}
              sx={{ marginTop: '20px' }}
            >
              Close
            </Button>
          </>
        }
        loading={loading}
      ></CustomDialog>
    </>
  );
};

export default SchemaChangeDetailsForm;
