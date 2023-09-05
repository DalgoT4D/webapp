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
  RadioGroup,
  Radio,
  FormControl,
  FormLabel,
  Grid,
  TextField,
} from '@mui/material';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  FormControlLabel,
} from '@mui/material';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { httpGet, httpPost, httpPut } from '@/helpers/http';
import { errorToast, successToast } from '../ToastMessage/ToastHelper';
import { GlobalContext } from '@/contexts/ContextProvider';
import { useSession } from 'next-auth/react';
import Input from '../UI/Input/Input';
import { Stream } from 'stream';

interface CreateConnectionFormProps {
  blockId: string;
  mutate: (...args: any) => any;
  showForm: boolean;
  setShowForm: (...args: any) => any;
  setBlockId: (...args: any) => any;
}

type CursorFieldConfig = {
  selectedCursorField: string;
  sourceDefinedCursor: boolean;
  cursorFieldOptions: string[];
};

interface SourceStream {
  id: number;
  name: string;
  supportsIncremental: boolean;
  selected: boolean;
  syncMode: string; // incremental | full_refresh
  destinationSyncMode: string; // append | overwrite | append_dedup
  cursorFieldConfig: CursorFieldConfig; // this will not be posted to backend
  cursorField: string;
}

interface StreamState {
  id: number;
  name: string;
  selected: boolean;
  syncMode: string;
  destSyncMode: string;
  cursorField: string;
  hide: boolean;
  cursorFieldConfig: CursorFieldConfig;
  supportsIncremental: boolean;
}

interface StreamRowProps {
  streamState: StreamState;
}

interface GlobalFilterRowProps {
  filterStreams: (...args: any) => any;
}

const StreamRow = ({ streamState }: StreamRowProps) => {
  return (
    <>
      {!streamState.hide && (
        <TableRow key={streamState.name}>
          <TableCell
            key="name"
            align="center"
            sx={streamState.selected ? { color: 'green', fontWeight: 700 } : {}}
          >
            {streamState.name}
          </TableCell>
          <TableCell key="sel" align="center">
            <Switch
              data-testid={`stream-sync-${streamState.id}`}
              checked={streamState.selected}
              // onChange={(event) => setSelected(event.target.checked)}
            />
          </TableCell>
          <TableCell key="inc" align="center">
            <Switch
              data-testid={`stream-incremental-${streamState.id}`}
              disabled={
                !streamState.supportsIncremental || !streamState.selected
              }
              checked={
                streamState.syncMode === 'incremental' && streamState.selected
              }
              // onChange={(event) => setIncremental(event.target.checked)}
            />
          </TableCell>
          <TableCell key="destination" align="center">
            <Select
              data-testid={`stream-destmode-${streamState.id}`}
              disabled={!streamState.selected}
              value={streamState.destSyncMode}
              // onChange={(event) => {
              //   setDestSyncMode(event.target.value);
              // }}
            >
              <MenuItem value="append">Append</MenuItem>
              <MenuItem value="overwrite">Overwrite</MenuItem>
              <MenuItem value="append_dedup">Append / Dedup</MenuItem>
            </Select>
          </TableCell>
          <TableCell key="cursorfield" align="center">
            <Select
              data-testid={`cursorfield-${streamState.id}`}
              value={streamState.cursorField}
              disabled={
                !(streamState.syncMode === 'incremental') ||
                !streamState.selected
              }
              // onChange={(event) => setCursorField(event.target.value)}
            >
              {streamState.cursorFieldConfig?.cursorFieldOptions.map(
                (option: string, idx: number) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                )
              )}
            </Select>
          </TableCell>
        </TableRow>
      )}
    </>
  );
};

const GlobalFilterRow = ({ filterStreams }: GlobalFilterRowProps) => {
  const [selectAllStreams, setSelectAllStreams] = useState<boolean>(false);
  const [incrementalAllStreams, setIncrementalAllStreams] =
    useState<boolean>(false);
  const [search, setSearch] = useState<string>('');

  useEffect(() => {
    filterStreams(search);
  }, [search]);

  return (
    <TableRow>
      <TableCell key="streamname" align="center">
        <Box>
          <TextField
            autoFocus
            data-testid="search"
            sx={{ width: '100%' }}
            label="Search"
            variant="outlined"
            name="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          ></TextField>
        </Box>
      </TableCell>
      <TableCell key="selected" align="center">
        {/* <Box>
          <Switch
            data-testid={`sync-all-streams`}
            checked={selectAllStreams}
            onChange={(event) => setSelectAllStreams(event.target.checked)}
          />
        </Box> */}
      </TableCell>
      <TableCell key="incremental" align="center">
        {/* <Box>
          <Switch
            data-testid={`incremental-all-streams`}
            checked={incrementalAllStreams}
            onChange={(event) => setIncrementalAllStreams(event.target.checked)}
          />
        </Box> */}
      </TableCell>
      <TableCell key="destsyncmode" align="center"></TableCell>
      <TableCell key="cursorfield" align="center"></TableCell>
    </TableRow>
  );
};

// const StreamsTable = ({ sourceStreams }: any) => {
//   const [currentStreams, setCurrentStreams] = useState(sourceStreams);
//   const [search, setSearch] = useState('');
//   const filterStreams = (search: string) => {
//     console.log('in parent table comp', search);
//     const tempStreams = currentStreams.map(
//       (stream: any) => stream.name === search
//     );
//     setCurrentStreams(tempStreams);
//   };
//   return (
//     <>
//       {currentStreams.length > 0 && (
//         <Table data-testid="sourceStreamTable" sx={{ marginTop: '5px' }}>
//           <TableHead>
//             <TableRow>
//               <TableCell key="streamname" align="center">
//                 <Box>Stream</Box>
//               </TableCell>
//               <TableCell key="selected" align="center">
//                 <Box>Sync?</Box>
//               </TableCell>
//               <TableCell key="incremental" align="center">
//                 <Box>Incremental?</Box>
//               </TableCell>
//               <TableCell key="destsyncmode" align="center">
//                 Destination
//               </TableCell>
//               <TableCell key="cursorfield" align="center">
//                 Cursor field
//               </TableCell>
//             </TableRow>
//             <GlobalFilterRow
//               search={search}
//               setSearch={setSearch}
//               filterStreams={filterStreams}
//             />
//           </TableHead>
//           <TableBody>
//             {currentStreams.map((stream: any, idx: number) => (
//               <StreamRow
//                 key={idx}
//                 stream={stream}
//                 idx={idx}
//                 selectAll={false}
//                 incrementalAll={false}
//               />
//             ))}
//           </TableBody>
//         </Table>
//       )}
//     </>
//   );
// };

const CreateConnectionForm = ({
  setBlockId,
  blockId,
  mutate,
  showForm,
  setShowForm,
}: CreateConnectionFormProps) => {
  const { data: session }: any = useSession();
  const { register, handleSubmit, control, watch, reset, setValue } = useForm({
    defaultValues: {
      name: '',
      sources: { label: '', id: '' },
      destinations: { label: '', id: '' },
      destinationSchema: 'staging',
    },
  });
  const [sources, setSources] = useState<Array<string>>([]);
  const [sourceStreams, setSourceStreams] = useState<Array<SourceStream>>([]);
  const [sourceStreamStates, setSourceStreamStates] = useState<
    Array<StreamState>
  >([]);
  const [filteredSourceStreams, setFilteredSourceStreams] = useState<
    Array<SourceStream>
  >([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [someStreamSelected, setSomeStreamSelected] = useState<boolean>(false);
  const [normalize, setNormalize] = useState<boolean>(false);
  const [selectAllStreams, setSelectAllStreams] = useState<boolean>(false);
  const [incrementalAllStreams, setIncrementalAllStreams] =
    useState<boolean>(false);
  const searchInputRef: any = useRef();

  const { data: sourcesData } = useSWR(`airbyte/sources`);

  const watchSourceSelection = watch('sources');

  const globalContext = useContext(GlobalContext);

  const setupInitialStreamsState = (
    catalog: any,
    blockId: string | undefined | null
  ) => {
    const action = blockId ? 'edit' : 'create';

    const streams = catalog.streams.map((el: any, idx: number) => {
      const stream = {
        id: idx + 1,
        name: el.stream.name,
        supportsIncremental:
          el.stream.supportedSyncModes.indexOf('incremental') > -1,
        selected: action === 'edit' ? el.config.selected : false,
        syncMode: action === 'edit' ? el.config.syncMode : 'full_refresh',
        destinationSyncMode:
          action === 'edit' ? el.config.destinationSyncMode : 'append',
        cursorFieldConfig: {
          selectedCursorField: '',
          sourceDefinedCursor: false,
          cursorFieldOptions: [],
        },
      };

      let cursorFieldObj = stream.cursorFieldConfig;

      // will be true for most of our custom connectors
      if ('sourceDefinedCursor' in el.stream)
        cursorFieldObj.sourceDefinedCursor = el.stream.sourceDefinedCursor;

      if (cursorFieldObj.sourceDefinedCursor) {
        // eg el.config.cursorField = ["indexed_on"] i.e. defined in the connector code
        cursorFieldObj.selectedCursorField = el.config.cursorField[0];
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
          cursorFieldObj.selectedCursorField =
            el.stream.defaultCursorField.length > 0
              ? el.stream.defaultCursorField[0]
              : '';

        // overwrite default if the cursor field is set
        if ('cursorField' in el.config)
          cursorFieldObj.selectedCursorField =
            el.config.cursorField.length > 0 ? el.config.cursorField[0] : '';
      }

      return stream;
    });

    // setup input stream states
    const streamStates: Array<StreamState> = streams.map(
      (stream: SourceStream) => ({
        id: stream.id,
        name: stream.name,
        selected: stream.selected,
        syncMode: stream.syncMode,
        destSyncMode: stream.destinationSyncMode,
        cursorField: stream.cursorFieldConfig.selectedCursorField,
        hide: false,
        supportsIncremental: stream.supportsIncremental,
        cursorFieldConfig: stream.cursorFieldConfig,
      })
    );
    setSourceStreamStates(streamStates);

    return streams;
  };

  useEffect(() => {
    if (blockId) {
      (async () => {
        setLoading(true);
        try {
          const data: any = await httpGet(
            session,
            `airbyte/connections/${blockId}`
          );
          setValue('name', data?.name);
          setValue('sources', {
            label: data?.source.name,
            id: data?.source.id,
          });
          setValue('destinationSchema', data?.destinationSchema);
          const streams = setupInitialStreamsState(data?.syncCatalog, blockId);
          setSourceStreams(streams);
          setFilteredSourceStreams(streams);
          setNormalize(data?.normalize || false);
        } catch (err: any) {
          console.error(err);
          errorToast(err.message, [], globalContext);
        }
        setLoading(false);
      })();
    }
  }, [blockId]);

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
    if (watchSourceSelection?.id && !blockId) {
      (async () => {
        setLoading(true);
        try {
          const message = await httpGet(
            session,
            `airbyte/sources/${watchSourceSelection.id}/schema_catalog`
          );
          const streams: SourceStream[] = setupInitialStreamsState(
            message['catalog'],
            blockId
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
    setBlockId('');
    setSourceStreams([]);
    setFilteredSourceStreams([]);
    setShowForm(false);
    setSelectAllStreams(false);
    setIncrementalAllStreams(false);
    searchInputRef.current = '';
  };

  const handleRadioChange = (event: any) => {
    setNormalize(event.target.value === 'normalized');
  };

  // create/update a connection
  const onSubmit = async (data: any) => {
    const payload: any = {
      name: data.name,
      sourceId: data.sources.id,
      streams: sourceStreams,
      normalize,
    };
    if (data.destinationSchema) {
      payload.destinationSchema = data.destinationSchema;
    }
    try {
      if (blockId) {
        setLoading(true);
        await httpPut(
          session,
          `airbyte/connections/${blockId}/update`,
          payload
        );
        successToast('Connection updated', [], globalContext);
        setLoading(false);
      } else {
        setLoading(true);
        await httpPost(session, 'airbyte/connections/', payload);
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

  const filterStreams = (search: string) => {
    console.log('find streams with search', search);
    if (search && search.length > 0) {
      const streamStates = sourceStreamStates.map(
        (streamState: StreamState) => {
          if (
            !streamState.name
              .toLowerCase()
              .startsWith(search.trim().toLowerCase())
          )
            return { ...streamState, hide: true };
          else return streamState;
        }
      );
      setSourceStreamStates(streamStates);
    }
  };

  const FormContent = () => {
    return (
      <>
        <Box sx={{ pt: 2, pb: 4 }}>
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
            disabled={true}
          ></Input>

          <Box sx={{ m: 2 }} />

          <Controller
            name="sources"
            control={control}
            rules={{ required: true }}
            render={({ field }: any) => (
              <Autocomplete
                readOnly={blockId ? true : false}
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

          <Box
            sx={{
              ...(blockId && { pointerEvents: 'none' }),
            }}
          >
            <FormControl sx={{ width: '100%' }}>
              <FormLabel component="legend">Select type</FormLabel>
              <RadioGroup
                aria-label="normalize-radio-group"
                value={normalize ? 'normalized' : 'raw'}
                onChange={handleRadioChange}
              >
                <Grid container>
                  <Grid
                    item
                    xs={5.8}
                    sx={{
                      px: 2,
                      py: 1,
                      background: '#f2f2eb',
                      borderRadius: 2,
                    }}
                  >
                    <FormControlLabel
                      data-testid="normalizationCheckbox"
                      value="normalized"
                      control={<Radio />}
                      label="Normalized"
                    />
                  </Grid>
                  <Grid item xs={0.4} />
                  <Grid
                    item
                    xs={5.8}
                    sx={{
                      px: 2,
                      py: 1,
                      background: '#f2f2eb',
                      borderRadius: 2,
                    }}
                  >
                    <FormControlLabel
                      value="raw"
                      control={<Radio />}
                      label="Raw"
                    />
                  </Grid>
                </Grid>
              </RadioGroup>
            </FormControl>
          </Box>
          {sourceStreamStates.length >= 0 && (
            <Table data-testid="sourceStreamTable" sx={{ marginTop: '5px' }}>
              <TableHead>
                <TableRow>
                  <TableCell key="streamname" align="center">
                    <Box>Stream</Box>
                  </TableCell>
                  <TableCell key="selected" align="center">
                    <Box>Sync?</Box>
                  </TableCell>
                  <TableCell key="incremental" align="center">
                    <Box>Incremental?</Box>
                  </TableCell>
                  <TableCell key="destsyncmode" align="center">
                    Destination
                  </TableCell>
                  <TableCell key="cursorfield" align="center">
                    Cursor field
                  </TableCell>
                </TableRow>
                <GlobalFilterRow filterStreams={filterStreams} />
              </TableHead>
              <TableBody>
                {sourceStreamStates.map(
                  (streamState: StreamState, idx: number) => (
                    <StreamRow key={streamState.id} streamState={streamState} />
                  )
                )}
              </TableBody>
            </Table>
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
        title={'Add a new connection'}
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
