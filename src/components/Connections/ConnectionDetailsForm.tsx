import React, { useContext, useEffect, useRef, useState } from 'react';
import CustomDialog from '../Dialog/CustomDialog';
import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Typography,
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { httpGet, httpPut } from '@/helpers/http';
import { errorToast, successToast } from '../ToastMessage/ToastHelper';
import { GlobalContext } from '@/contexts/ContextProvider';
import { useSession } from 'next-auth/react';
import Input from '../UI/Input/Input';

interface ConnectionDetailsFormProps {
  connectionId: string;
  mutate: (...args: any) => any;
  showForm: boolean;
  setShowForm: (...args: any) => any;
  setConnectionId: (...args: any) => any;
}

type CursorFieldConfig = {
  sourceDefinedCursor: boolean;
  cursorFieldOptions: string[];
};

interface ColumnChange {
  table: string;
  added: string[];
  removed: string[];
}

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

const ConnectionDetailsForm = ({
  setConnectionId,
  connectionId,
  mutate,
  showForm,
  setShowForm,
}: ConnectionDetailsFormProps) => {
  const { data: session }: any = useSession();
  const globalContext = useContext(GlobalContext);
  const { register, handleSubmit, reset, setValue } = useForm({
    defaultValues: {
      name: '',
    },
  });
  const [sourceStreams, setSourceStreams] = useState<Array<SourceStream>>([]);
  const [filteredSourceStreams, setFilteredSourceStreams] = useState<
    Array<SourceStream>
  >([]);
  const [tableData, setTableData] = useState<
    Array<{ name: string; changedColumns: string[] }>
  >([]);
  const [columnChanges, setColumnChanges] = useState<ColumnChange[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const searchInputRef: any = useRef();
  const inputRef: any = useRef(null);
  const shouldFocusInput: any = useRef(null);

  useEffect(() => {
    if (connectionId) {
      (async () => {
        setLoading(true);
        try {
          const data: any = await httpGet(
            session,
            `airbyte/v1/connections/${connectionId}/catalog`
          );
          console.log('Fetched Data:', data); // Log fetched data
          setValue('name', data?.name);

          // Process catalogDiff to extract table names and changed columns
          if (Array.isArray(data)) {
            data.forEach((dataItem) => {
              if (Array.isArray(dataItem?.catalogDiff?.transforms)) {
                const newData = dataItem.catalogDiff.transforms.map(
                  (transform: any) => {
                    const tableName = transform.streamDescriptor.name;
                    const addedColumns: string[] = [];

                    const removedColumns: string[] = [];

                    transform.updateStream.forEach((update: any) => {
                      if (update.transformType === 'add_field') {
                        addedColumns.push(...update.fieldName);
                      } else if (update.transformType === 'remove_field') {
                        removedColumns.push(...update.fieldName);
                      }
                    });
                    return { name: tableName, addedColumns, removedColumns };
                  }
                );
                console.log('Processed Data:', newData); // Log processed data
                setTableData(newData);

                // Extract and set source streams
                const streams = dataItem.syncCatalog?.streams;
                if (streams) {
                  const sourceStreamsData = streams.map((stream: any) => ({
                    name: stream.stream.name,
                    columnsAdded: stream.stream.columnsAdded,
                    columnsRemoved: stream.stream.columnsRemoved,
                  }));
                  setSourceStreams(sourceStreamsData);
                  setFilteredSourceStreams(sourceStreamsData);
                }
              } else {
                console.log('No changes detected or invalid data structure.'); // Log message for no changes
                setTableData([]); // Set tableData to an empty array
              }
            });
          }
        } catch (err: any) {
          console.error(err);
          errorToast(err.message, [], globalContext);
        }
        setLoading(false);
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
      name: data.name,
      streams: sourceStreams.map((stream: SourceStream) => {
        return {
          name: stream.name,
        };
      }),
    };
    if (data.destinationSchema) {
      payload.destinationSchema = data.destinationSchema;
    }
    try {
      if (connectionId) {
        setLoading(true);
        await httpPut(
          session,
          `airbyte/v1/web_backend/connections/update`,
          payload
        );
        successToast('Connection updated', [], globalContext);
        setLoading(false);
      }
      mutate();
      handleClose();
    } catch (err: any) {
      console.error(err);
      errorToast(err.message, [], globalContext);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (shouldFocusInput.current && inputRef.current) {
      inputRef.current.focus();
      shouldFocusInput.current = false;
    }
  });

  useEffect(() => {
    if (filteredSourceStreams && filteredSourceStreams.length > 0) {
      const filteredStreamNames = filteredSourceStreams.map(
        (stream: SourceStream) => stream.name
      );
      const updateFilteredStreams = sourceStreams.filter(
        (stream: SourceStream) => filteredStreamNames.includes(stream.name)
      );
      setFilteredSourceStreams(updateFilteredStreams);
    }
  }, [sourceStreams]);

  const FormContent = () => {
    const tableCount = tableData.length;
    return (
      <>
        <Box sx={{ pt: 2, pb: 4 }}>
          {tableData.length > 0 ? (
            <Table>
              <Typography variant="h6">{`${tableCount} table${
                tableCount !== 1 ? 's' : ''
              } with changes`}</Typography>
              <TableBody>
                {tableData.map((table, idx) => (
                  <React.Fragment key={idx}>
                    <Typography variant="subtitle2">Table name</Typography>
                    <TableRow>
                      <TableCell>
                        <Typography variant="subtitle1" gutterBottom>
                          {table.name}
                        </Typography>
                      </TableCell>
                    </TableRow>
                    {table.changedColumns.some((column) =>
                      column.startsWith('-')
                    ) && (
                      <React.Fragment>
                        <Typography variant="h6" gutterBottom>
                          Columns Removed
                        </Typography>
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                          }}
                        >
                          <Typography variant="subtitle2">
                            Table Name
                          </Typography>
                          <Typography variant="subtitle2">
                            Column Name
                          </Typography>
                        </Box>
                        <Table>
                          {table.changedColumns
                            .filter((column) => column.startsWith('-'))
                            .map((column, idx) => (
                              <TableRow key={idx}>
                                <TableCell>
                                  <Typography variant="body2">
                                    {table.name}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Typography variant="body2">
                                    {column.substring(1)}
                                  </Typography>
                                </TableCell>
                              </TableRow>
                            ))}
                        </Table>
                      </React.Fragment>
                    )}
                    {table.changedColumns.some(
                      (column) => !column.startsWith('-')
                    ) && (
                      <React.Fragment>
                        <Typography variant="h6" gutterBottom>
                          Columns Added
                        </Typography>
                        <Typography variant="subtitle2">Table Name</Typography>
                        <Typography variant="subtitle2">Column Name</Typography>
                        <Table>
                          {table.changedColumns
                            .filter((column) => !column.startsWith('-'))
                            .map((column, idx) => (
                              <TableRow key={idx}>
                                <TableCell>
                                  <Typography variant="body2">
                                    {table.name}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Typography variant="body2">
                                    {column}
                                  </Typography>
                                </TableCell>
                              </TableRow>
                            ))}
                        </Table>
                      </React.Fragment>
                    )}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
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
        title={'New Schema Changes Detected'}
        show={showForm}
        handleClose={handleClose}
        handleSubmit={handleSubmit(onSubmit)}
        formContent={<FormContent />}
        formActions={
          <>
            <Button variant="contained" type="submit">
              Yes, I approve
            </Button>
            <Button color="secondary" variant="outlined" onClick={handleClose}>
              Cancel
            </Button>
          </>
        }
        loading={loading}
      ></CustomDialog>
    </>
  );
};

export default ConnectionDetailsForm;
