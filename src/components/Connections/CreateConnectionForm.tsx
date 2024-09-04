import React, { useContext, useEffect, useRef, useState } from 'react';
import useSWR from 'swr';
import CustomDialog from '../Dialog/CustomDialog';
import {
  Autocomplete,
  Box,
  Button,
  Switch,
  Select,
  MenuItem,
  TextField,
} from '@mui/material';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import { httpGet, httpPost, httpPut } from '@/helpers/http';
import { errorToast, successToast } from '../ToastMessage/ToastHelper';
import { GlobalContext } from '@/contexts/ContextProvider';
import { useSession } from 'next-auth/react';
import { demoAccDestSchema } from '@/config/constant';
import Input from '../UI/Input/Input';

interface CreateConnectionFormProps {
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

interface SourceStream {
  name: string;
  supportsIncremental: boolean;
  selected: boolean;
  syncMode: string; // incremental | full_refresh
  destinationSyncMode: string; // append | overwrite | append_dedup
  cursorFieldConfig: CursorFieldConfig; // this will not be posted to backend
  cursorField: string;
}

const CreateConnectionForm = ({
  setConnectionId,
  connectionId,
  mutate,
  showForm,
  setShowForm,
}: CreateConnectionFormProps) => {
  const { data: session }: any = useSession();
  const globalContext = useContext(GlobalContext);
  const { register, handleSubmit, control, watch, reset, setValue } = useForm({
    defaultValues: {
      name: '',
      sources: { label: '', id: '' },
      destinations: { label: '', id: '' },
      destinationSchema: globalContext?.CurrentOrg.state.is_demo
        ? demoAccDestSchema
        : 'staging',
    },
  });
  const [sources, setSources] = useState<Array<string>>([]);
  const [sourceStreams, setSourceStreams] = useState<Array<SourceStream>>([]);
  const [filteredSourceStreams, setFilteredSourceStreams] = useState<
    Array<SourceStream>
  >([]);

  const [loading, setLoading] = useState<boolean>(false);
  const [someStreamSelected, setSomeStreamSelected] = useState<boolean>(false);
  const [normalize, setNormalize] = useState<boolean>(false);
  // const [syncAllStreams, setSyncAllStreams] = useState<boolean>(false);
  const [incrementalAllStreams, setIncrementalAllStreams] =
    useState<boolean>(false);
  const [selectAllStreams, setSelectAllStreams] = useState<boolean>(false);
  const searchInputRef: any = useRef();
  const inputRef: any = useRef(null);
  const shouldFocusInput: any = useRef(null);

  const { data: sourcesData } = useSWR(`airbyte/sources`);

  const watchSourceSelection = watch('sources');

  const setupInitialStreamsState = (
    catalog: any,
    connectionId: string | undefined | null
  ) => {
    const action = connectionId ? 'edit' : 'create';

    const streams = catalog.streams.map((el: any) => {
      const stream = {
        name: el.stream.name,
        supportsIncremental:
          el.stream.supportedSyncModes.indexOf('incremental') > -1,
        selected: action === 'edit' ? el.config.selected : false,
        syncMode: action === 'edit' ? el.config.syncMode : 'full_refresh',
        destinationSyncMode:
          action === 'edit' ? el.config.destinationSyncMode : 'append',
        cursorFieldConfig: {
          sourceDefinedCursor: false,
          cursorFieldOptions: [],
        },
        cursorField: '',
      };

      const cursorFieldObj = stream.cursorFieldConfig;

      // will be true for most of our custom connectors
      if ('sourceDefinedCursor' in el.stream)
        cursorFieldObj.sourceDefinedCursor = el.stream.sourceDefinedCursor;

      if (cursorFieldObj.sourceDefinedCursor) {
        // eg el.config.cursorField = ["indexed_on"] i.e. defined in the connector code
        stream.cursorField = el.config.cursorField[0];
        cursorFieldObj.cursorFieldOptions = el.config.cursorField;
      } else {
        // user needs to define the cursor field
        // available options are picked from the stream's jsonSchema (cols)
        if ('jsonSchema' in el.stream)
          cursorFieldObj.cursorFieldOptions = Object.keys(
            el.stream.jsonSchema.properties
          ) as any;

        // set selected cursor field
        if ('defaultCursorField' in el.stream)
          stream.cursorField =
            el.stream.defaultCursorField.length > 0
              ? el.stream.defaultCursorField[0]
              : '';

        // overwrite default if the cursor field is set
        if ('cursorField' in el.config)
          stream.cursorField =
            el.config.cursorField.length > 0 ? el.config.cursorField[0] : '';
      }

      return stream;
    });

    return streams;
  };

  useEffect(() => {
    if (connectionId) {
      (async () => {
        setLoading(true);
        try {
          const data: any = await httpGet(
            session,
            `airbyte/v1/connections/${connectionId}`
          );
          setValue('name', data?.name);
          setValue('sources', {
            label: data?.source.name,
            id: data?.source.id,
          });
          setValue('destinationSchema', data?.destinationSchema);
          const streams = setupInitialStreamsState(
            data?.syncCatalog,
            connectionId
          );
          setSourceStreams(streams);
          setFilteredSourceStreams(streams);
          setNormalize(data?.normalize || false);
        } catch (err: any) {
          console.error(err);
          errorToast(err.message, [], globalContext);
        }
        setLoading(false);
      })();
    }else{
      reset();
      setConnectionId('');
      setSourceStreams([]);
      setFilteredSourceStreams([]);
      setSelectAllStreams(false);
      setIncrementalAllStreams(false);
      searchInputRef.current = '';
    }
  }, [connectionId]);

  // when the source list changes
  useEffect(() => {
    if (sourcesData && sourcesData.length > 0) {
      const rows = sourcesData.map((element: any) => ({
        label: element.name,
        id: element.sourceId,
      }));
      setSources(rows);
    }
  }, [sourcesData]);

  // source selection changes
  useEffect(() => {
    if (watchSourceSelection?.id && !connectionId) {
      (async () => {
        setLoading(true);
        try {
          const message = await httpGet(
            session,
            `airbyte/sources/${watchSourceSelection.id}/schema_catalog`
          );
          const streams: SourceStream[] = setupInitialStreamsState(
            message['catalog'],
            connectionId
          );
          setSourceStreams(streams);
          setFilteredSourceStreams(streams);
        } catch (err: any) {
          if (err.cause) {
            errorToast(err.cause.detail, [], globalContext);
          } else {
            errorToast(err.message, [], globalContext);
          }
        }
        setLoading(false);
      })();
    }
  }, [watchSourceSelection]);

  const handleClose = () => {
    reset();
    setConnectionId('');
    setSourceStreams([]);
    setFilteredSourceStreams([]);
    setShowForm(false);
    setSelectAllStreams(false);
    setIncrementalAllStreams(false);
    searchInputRef.current = '';
  };

  // create/update a connection
  const onSubmit = async (data: any) => {
    // remove the cursorFieldConfig key before posting
    const payload: any = {
      name: data.name,
      sourceId: data.sources.id,
      streams: sourceStreams.map((stream: SourceStream) => {
        return {
          name: stream.name,
          supportsIncremental: stream.supportsIncremental,
          selected: stream.selected,
          syncMode: stream.syncMode, // incremental | full_refresh
          destinationSyncMode: stream.destinationSyncMode, // append | overwrite | append_dedup
          cursorField: stream.cursorField,
        };
      }),
      normalize,
    };
    if (data.destinationSchema) {
      payload.destinationSchema = data.destinationSchema;
    }
    try {
      if (connectionId) {
        setLoading(true);
        await httpPut(
          session,
          `airbyte/v1/connections/${connectionId}/update`,
          payload
        );
        successToast('Connection updated', [], globalContext);
        setLoading(false);
      } else {
        setLoading(true);
        await httpPost(session, 'airbyte/v1/connections/', payload);
        successToast('Connection created', [], globalContext);
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

  const updateThisStreamTo_ = (
    stream: SourceStream,
    newStream: SourceStream
  ) => {
    const newstreams: SourceStream[] = [];
    for (let idx = 0; idx < sourceStreams.length; idx++) {
      if (sourceStreams[idx].name === stream.name) {
        newstreams.push(newStream);
      } else {
        newstreams.push(sourceStreams[idx]);
      }
    }
    setSourceStreams(newstreams);
  };
  const selectStream = (checked: boolean, stream: SourceStream) => {
    updateThisStreamTo_(stream, { ...stream, selected: checked });
  };
  const setStreamIncr = (checked: boolean, stream: SourceStream) => {
    updateThisStreamTo_(stream, {
      ...stream,
      syncMode: checked ? 'incremental' : 'full_refresh',
    });
  };
  const setDestinationSyncMode = (value: string, stream: SourceStream) => {
    updateThisStreamTo_(stream, { ...stream, destinationSyncMode: value });
  };

  const updateCursorField = (value: string, stream: SourceStream) => {
    updateThisStreamTo_(stream, { ...stream, cursorField: value });
  };

  const handleSyncAllStreams = (checked: boolean) => {
    setSelectAllStreams(checked);
    const sourceStreamsSlice: Array<SourceStream> = sourceStreams.map(
      (stream: SourceStream) => ({ ...stream, selected: checked })
    );
    setSourceStreams(sourceStreamsSlice);
  };

  const handleIncrementalAllStreams = (checked: boolean) => {
    setIncrementalAllStreams(checked);
    const sourceStreamsSlice: Array<SourceStream> = sourceStreams.map(
      (stream: SourceStream) => ({
        ...stream,
        syncMode: checked ? 'incremental' : 'full_refresh',
      })
    );
    setSourceStreams(sourceStreamsSlice);
  };

  const handleSearchChange = (event: any) => {
    searchInputRef.current = event.target.value;
    updateFilteredStreams(event.target.value);
    shouldFocusInput.current = true;
  };

  useEffect(() => {
    if (shouldFocusInput.current && inputRef.current) {
      inputRef.current.focus();
      shouldFocusInput.current = false; // Reset focus flag
    }
  });

  const updateFilteredStreams = async (searchString: string) => {
    if (searchString && searchString.length > 0) {
      const newFilteredStreams = sourceStreams.filter((stream: SourceStream) =>
        stream.name.toLowerCase().startsWith(searchString.trim().toLowerCase())
      );

      setFilteredSourceStreams(newFilteredStreams);
    } else {
      setFilteredSourceStreams(sourceStreams);
    }
  };

  useEffect(() => {
    const filteredStreamNames = filteredSourceStreams.map(
      (stream: SourceStream) => stream.name
    );
    const updateFilteredStreams = sourceStreams.filter((stream: SourceStream) =>
      filteredStreamNames.includes(stream.name)
    );
    setFilteredSourceStreams(updateFilteredStreams);
    setSomeStreamSelected(sourceStreams.some((stream) => stream.selected));
  }, [sourceStreams]);

  const FormContent = () => {
    return (
      <>
        <Box key={connectionId ? "edit-mode" : "add-new-mode"} sx={{ pt: 2, pb: 4 }}>
          <Input
            data-testid="connectionName"
            sx={{ width: '100%' }}
            label="Name"
            variant="outlined"
            register={register}
            required
            name="name"
          ></Input>

          <Box sx={{ m: 2 }} />

          <Input
            data-testid="schemaName"
            sx={{ width: '100%' }}
            label="Destination Schema"
            variant="outlined"
            register={register}
            name="destinationSchema"
            disabled={globalContext?.CurrentOrg.state.is_demo ? true : false}
          ></Input>

          <Box sx={{ m: 2 }} />

          <Controller
            name="sources"
            control={control}
            rules={{ required: true }}
            render={({ field }: any) => (
              <Autocomplete
                readOnly={connectionId ? true : false}
                data-testid="sourceList"
                options={sources}
                value={field.value}
                onChange={(e, data) => field.onChange(data)}
                renderInput={(params) => (
                  <Input {...params} label="Select source" variant="outlined" />
                )}
              />
            )}
          />

          <Box sx={{ m: 2 }} />

          {filteredSourceStreams.length >= 0 && (
            <>
              <Table data-testid="sourceStreamTable" sx={{ marginTop: '5px' }}>
                <TableHead>
                  <TableRow>
                    <TableCell key="streamname" align="center">
                      Stream
                    </TableCell>
                    <TableCell key="selected" align="center">
                      Sync?
                    </TableCell>
                    <TableCell key="incremental" align="center">
                      Incremental?
                    </TableCell>
                    <TableCell key="destsyncmode" align="center">
                      Destination
                    </TableCell>
                    <TableCell key="cursorfield" align="center">
                      Cursor Field
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell key="searchstream" align="center">
                      <Box>
                        <TextField
                          inputRef={inputRef}
                          key="search-input"
                          data-testid="search-stream"
                          label="Search"
                          name="search-stream"
                          value={searchInputRef.current}
                          onChange={(event) => handleSearchChange(event)}
                        />
                      </Box>
                    </TableCell>
                    <TableCell key="selectall" align="center">
                      <Box>
                        <Switch
                          data-testid={`sync-all-streams`}
                          checked={selectAllStreams}
                          onChange={(event) =>
                            handleSyncAllStreams(event.target.checked)
                          }
                        />
                      </Box>
                    </TableCell>
                    <TableCell key="incrementall" align="center">
                      <Box>
                        <Switch
                          data-testid={`incremental-all-streams`}
                          checked={incrementalAllStreams}
                          onChange={(event) =>
                            handleIncrementalAllStreams(event.target.checked)
                          }
                        />
                      </Box>
                    </TableCell>
                    <TableCell key="center1" align="center"></TableCell>
                    <TableCell key="center2" align="center"></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredSourceStreams
                    .slice()
                    .sort((a, b) => a.name.localeCompare(b.name)) // this will sort the stream on the basis of the name property.
                    .map((stream, idx: number) => (
                      <TableRow key={stream.name}>
                        <TableCell
                          key="name"
                          align="center"
                          sx={
                            stream.selected
                              ? { color: 'green', fontWeight: 700 }
                              : {}
                          }
                        >
                          {stream.name}
                        </TableCell>
                        <TableCell key="sel" align="center">
                          <Switch
                            data-testid={`stream-sync-${idx}`}
                            checked={stream.selected}
                            onChange={(event) =>
                              selectStream(event.target.checked, stream)
                            }
                          />
                        </TableCell>
                        <TableCell key="inc" align="center">
                          <Switch
                            data-testid={`stream-incremental-${idx}`}
                            disabled={
                            !stream.supportsIncremental || !stream.selected
                            }
                            checked={
                              stream.supportsIncremental &&
                              stream.syncMode === 'incremental' &&
                              stream.selected
                            }
                            onChange={(event) =>
                              setStreamIncr(event.target.checked, stream)
                            }
                          />
                        </TableCell>
                        <TableCell key="destination" align="center">
                          <Select
                            data-testid={`stream-destmode-${idx}`}
                            disabled={!stream.selected}
                            value={stream.destinationSyncMode}
                            onChange={(event) => {
                              setDestinationSyncMode(
                                event.target.value,
                                stream
                              );
                            }}
                          >
                            <MenuItem value="append">Append</MenuItem>
                            <MenuItem value="overwrite">Overwrite</MenuItem>
                            <MenuItem value="append_dedup">
                              Append / Dedup
                            </MenuItem>
                          </Select>
                        </TableCell>
                        <TableCell key="cursorfield" align="center">
                          <Select
                            data-testid={`stream-cursorfield-${idx}`}
                            disabled={
                              !stream.selected ||
                              !stream.supportsIncremental ||
                              stream.syncMode !== 'incremental'
                            }
                            value={stream.cursorField}
                            onChange={(event) => {
                              updateCursorField(event.target.value, stream);
                            }}
                          >
                            {stream.cursorFieldConfig?.cursorFieldOptions.map(
                              (option: string) => (
                                <MenuItem key={option} value={option}>
                                  {option}
                                </MenuItem>
                              )
                            )}
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </>
          )}
        </Box>
      </>
    );
  };

  return (
    <>
      <CustomDialog
        key={connectionId ? "edit-custom" : "new-custom"}
        maxWidth={false}
        data-testid="dialog"
        title={connectionId ? 'Edit this connection' : 'Add a new connection'}
        show={showForm}
        handleClose={handleClose}
        handleSubmit={handleSubmit(onSubmit)}
        formContent={<FormContent />}
        formActions={
          <>
            <Button
              variant="contained"
              type="submit"
              disabled={!someStreamSelected}
            >
              Connect
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

export default CreateConnectionForm;
