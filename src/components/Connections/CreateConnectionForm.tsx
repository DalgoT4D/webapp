import React, { useContext, useEffect, useState } from 'react';
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
} from '@mui/material';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  FormControlLabel,
} from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import { httpGet, httpPost, httpPut } from '@/helpers/http';
import { errorToast, successToast } from '../ToastMessage/ToastHelper';
import { GlobalContext } from '@/contexts/ContextProvider';
import { useSession } from 'next-auth/react';
import { backendUrl } from '@/config/constant';
import Input from '../UI/Input/Input';

interface CreateConnectionFormProps {
  blockId: string;
  mutate: (...args: any) => any;
  showForm: boolean;
  setShowForm: (...args: any) => any;
  setBlockId: (...args: any) => any;
}

interface SourceStream {
  name: string;
  supportsIncremental: boolean;
  selected: boolean;
  syncMode: string; // incremental | full_refresh
  destinationSyncMode: string; // append | overwrite | append_dedup
}

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
      destinationSchema: '',
    },
  });
  const [sources, setSources] = useState<Array<string>>([]);
  const [sourceStreams, setSourceStreams] = useState<Array<SourceStream>>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [someStreamSelected, setSomeStreamSelected] = useState<boolean>(false);
  const [normalize, setNormalize] = useState<boolean>(false);

  const { data: sourcesData } = useSWR(`${backendUrl}/api/airbyte/sources`);

  const watchSourceSelection = watch('sources');

  const globalContext = useContext(GlobalContext);

  useEffect(() => {
    if (blockId) {
      setLoading(true);
      (async () => {
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
          setSourceStreams(
            data?.syncCatalog.streams.map((el: any) => ({
              name: el.stream.name,
              supportsIncremental:
                el.stream.supportedSyncModes.indexOf('incremental') > -1,
              selected: true,
              syncMode: el.config.syncMode,
              destinationSyncMode: el.config.destinationSyncMode,
            }))
          );
        } catch (err: any) {
          console.error(err);
          errorToast(err.message, [], globalContext);
        }
      })();
      setLoading(false);
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
      setLoading(true);

      (async () => {
        try {
          const message = await httpGet(
            session,
            `airbyte/sources/${watchSourceSelection.id}/schema_catalog`
          );
          const streams: SourceStream[] = [];
          message['catalog']['streams'].forEach((el: any) => {
            streams.push({
              name: el.stream.name,
              supportsIncremental:
                el.stream.supportedSyncModes.indexOf('incremental') > -1,
              selected: false,
              syncMode: 'full_refresh',
              destinationSyncMode: 'append',
            });
          });
          setSourceStreams(streams);
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
    setShowForm(false);
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
        await httpPut(
          session,
          `airbyte/connections/${blockId}/update`,
          payload
        );
        successToast('Connection updated', [], globalContext);
      } else {
        await httpPost(session, 'airbyte/connections/', payload);
        successToast('Connection created', [], globalContext);
      }
      mutate();
      handleClose();
    } catch (err: any) {
      console.error(err);
      errorToast(err.message, [], globalContext);
    }
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
    setSomeStreamSelected(newstreams.some((stream) => stream.selected));
  };
  const selectStream = (checked: boolean, stream: SourceStream) => {
    updateThisStreamTo_(stream, {
      name: stream.name,
      supportsIncremental: stream.supportsIncremental,
      selected: checked,
      syncMode: stream.syncMode,
      destinationSyncMode: stream.destinationSyncMode,
    } as SourceStream);
  };
  const setStreamIncr = (checked: boolean, stream: SourceStream) => {
    updateThisStreamTo_(stream, {
      name: stream.name,
      supportsIncremental: stream.supportsIncremental,
      selected: stream.selected,
      syncMode: checked ? 'incremental' : 'full_refresh',
      destinationSyncMode: stream.destinationSyncMode,
    } as SourceStream);
  };
  const setDestinationSyncMode = (value: string, stream: SourceStream) => {
    updateThisStreamTo_(stream, {
      name: stream.name,
      supportsIncremental: stream.supportsIncremental,
      selected: stream.selected,
      syncMode: stream.syncMode,
      destinationSyncMode: value,
    } as SourceStream);
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

          {sourceStreams.length > 0 && (
            <>
              <Table data-testid="sourceStreamTable">
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
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sourceStreams.map((stream, idx: number) => (
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
                            stream.syncMode === 'incremental' && stream.selected
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
                            setDestinationSyncMode(event.target.value, stream);
                          }}
                        >
                          <MenuItem value="append">Append</MenuItem>
                          <MenuItem value="overwrite">Overwrite</MenuItem>
                          <MenuItem value="append_dedup">
                            Append / Dedup
                          </MenuItem>
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
