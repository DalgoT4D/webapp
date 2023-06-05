import { useState, useEffect } from 'react';
import useSWR from 'swr';
import {
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  Typography,
  TextField
} from '@mui/material';
import { Table, TableBody, TableCell, TableRow } from '@mui/material';
import { backendUrl } from '@/config/constant';
import { Controller, useForm } from 'react-hook-form';
import { useSession } from 'next-auth/react';
import { DestinationConfigInput } from './DestinationConfigInput';
import { httpGet, httpPost } from '@/helpers/http';
import { GlobalContext } from '@/contexts/ContextProvider';
import { useContext } from 'react';
import {
  errorToast,
  successToast,
} from '@/components/ToastMessage/ToastHelper';
import CustomDialog from '../Dialog/CustomDialog';

export const Destinations = () => {
  const { data: session }: any = useSession();
  const { data, isLoading, mutate } = useSWR(
    `${backendUrl}/api/airbyte/destinations`
  );
  const [warehouse, setWarehouse] = useState<any>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [destinationDefs, setDestinationDefs] = useState([]);
  const [destinationDefSpecs, setDestinationDefSpecs] = useState<Array<any>>(
    []
  );
  const [setupLogs, setSetupLogs] = useState<Array<string>>([]);
  const toastContext = useContext(GlobalContext);

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    setValue,
    unregister,
  } = useForm({
    defaultValues: {
      name: '',
      destinationDef: { id: '', label: '' },
      config: {},
    },
  });

  const watchSelectedDestinationDef = watch('destinationDef');

  useEffect(() => {
    if (data && data.length > 0) {
      setWarehouse({
        name: data[0].destinationName,
        wtype: data[0].destinationName,
        icon: data[0].icon,
        connectionConfiguration: data[0].connectionConfiguration,
      })
    }
  }, [data]);

  useEffect(() => {
    if (showDialog && destinationDefs.length === 0) {
      (async () => {
        try {
          const data = await httpGet(
            session,
            'airbyte/destination_definitions'
          );
          const destinationDefRows = data?.map((element: any) => ({
            label: element.name,
            id: element.destinationDefinitionId,
          }));
          setDestinationDefs(destinationDefRows);
        } catch (err: any) {
          console.error(err);
          errorToast(err.message, [], toastContext);
        }
      })();
    }
  }, [showDialog]);

  const prePrepareConfigSpecs = (
    result: any,
    data: any,
    parent = 'parent',
    exclude: any[] = [],
    dropdownEnums: any[] = []
  ) => {
    // Push the parent enum in the array
    if (exclude.length > 0) {
      if (exclude[0] in data?.properties) {
        dropdownEnums.push(data?.properties[exclude[0]]?.const);
      }
    }

    for (const [key, value] of Object.entries<any>(data?.properties || {})) {
      // The parent oneOf key has already been added to the array
      if (exclude.includes(key)) continue;

      const objParentKey = `${parent}.${key}`;

      if (value?.type === 'object') {
        let commonField: string[] = [];

        // Find common property among all array elements of 'oneOf' array
        if (value['oneOf'].length > 1) {
          value['oneOf']?.forEach((ele: any) => {
            if (commonField.length > 0) {
              commonField = ele?.required.filter((value: any) =>
                commonField.includes(value)
              );
            } else {
              commonField = ele?.required;
            }
          });
        }

        const objResult = {
          field: `${objParentKey}.${commonField}`,
          type: value?.type,
          order: value?.order,
          title: value?.title,
          description: value?.description,
          parent:
            dropdownEnums.length > 0
              ? dropdownEnums[dropdownEnums.length - 1]
              : '',
          enum: [],
          specs: [],
        };

        result.push(objResult);

        value?.oneOf.forEach((eachEnum: any) => {
          prePrepareConfigSpecs(
            objResult.specs,
            eachEnum,
            objParentKey,
            commonField,
            objResult.enum
          );
        });

        continue;
      }

      result.push({
        ...value,
        field: objParentKey,
        parent:
          dropdownEnums.length > 0
            ? dropdownEnums[dropdownEnums.length - 1]
            : '',
        required: data?.required.includes(key),
      });
    }

    return result;
  };

  useEffect(() => {
    if (watchSelectedDestinationDef?.id) {
      (async () => {
        try {
          const data = await httpGet(
            session,
            `airbyte/destination_definitions/${watchSelectedDestinationDef.id}/specifications`
          );
          // Prepare the specs config before setting it
          const specsConfigFields = prePrepareConfigSpecs(
            [],
            data,
            'config',
            [],
            []
          );
          setDestinationDefSpecs(specsConfigFields);
        } catch (err: any) {
          console.error(err);
          errorToast(err.message, [], toastContext);
        }
      })();
    }
  }, [watchSelectedDestinationDef]);

  const handleClose = () => {
    reset();
    setDestinationDefSpecs([]);
    setShowDialog(false);
    setSetupLogs([]);
  };

  const onSubmit = async (data: any) => {
    try {
      setSetupLogs([]);
      const connectivityCheck = await httpPost(session, 'airbyte/destinations/check_connection/', {
        name: data.name,
        destinationDefId: data.destinationDef.id,
        config: data.config,
      });
      if (connectivityCheck.status === 'succeeded') {
        await httpPost(session, 'organizations/warehouse/', {
          wtype: data.destinationDef.label.toLowerCase(),
          name: data.name,
          destinationDefId: data.destinationDef.id,
          airbyteConfig: data.config,
        });
        mutate();
        handleClose();
        successToast('Warehouse created', [], toastContext);
      } else {
        setSetupLogs(connectivityCheck.logs);
        errorToast('Failed to connect to warehouse', [], toastContext);
      }
    } catch (err: any) {
      console.error(err);
      errorToast(err.message, [], toastContext);
    }
  };

  const CreateDestinationForm = () => {
    return (
      <Box sx={{ pt: 2, pb: 4 }}>
        <TextField
          sx={{ width: '100%' }}
          label="Name"
          variant="outlined"
          {...register('name', { required: true })}
        ></TextField>
        <Box sx={{ m: 2 }} />
        <Controller
          name="destinationDef"
          control={control}
          rules={{ required: true }}
          render={({ field }) => (
            <Autocomplete
              options={destinationDefs}
              value={field.value}
              onChange={(e, data) => field.onChange(data)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select destination type"
                  variant="outlined"
                />
              )}
            />
          )}
        />
        <Box sx={{ m: 2 }} />
        <DestinationConfigInput
          specs={destinationDefSpecs}
          registerFormFieldValue={register}
          control={control}
          setFormValue={setValue}
          unregisterFormField={unregister}
        />
      </Box>
    );
  };

  if (isLoading) {
    return <CircularProgress />;
  }

  const deleteDestination = async () => {
    // TODO
  }

  return (
    <>
      {warehouse && warehouse.wtype === 'Postgres' &&
        <>
          <Typography variant="h3">{warehouse.name}</Typography>
          <Box dangerouslySetInnerHTML={{ __html: warehouse.icon }} />
          <Table sx={{ maxWidth: '600px' }}>
            <TableBody>
              <TableRow><TableCell>Host</TableCell><TableCell align="right">{warehouse.connectionConfiguration.host}</TableCell></TableRow>
              <TableRow><TableCell>Port</TableCell><TableCell align="right">{warehouse.connectionConfiguration.port}</TableCell></TableRow>
              <TableRow><TableCell>Database</TableCell><TableCell align="right">{warehouse.connectionConfiguration.database}</TableCell></TableRow>
              <TableRow><TableCell>User</TableCell><TableCell align="right">{warehouse.connectionConfiguration.username}</TableCell></TableRow>
            </TableBody>
          </Table>
        </>
      }
      {warehouse && warehouse.wtype === 'BigQuery' &&
        <>
          <Typography variant="h3">{warehouse.name}</Typography>
          <Box dangerouslySetInnerHTML={{ __html: warehouse.icon }} />
        </>
      }
      {warehouse &&
        <Button variant="contained"
          sx={{ backgroundColor: '#d84141' }}
          onClick={() => deleteDestination()}
        >
          Delete connection to warehouse (TODO)
        </Button>
      }
      {!warehouse && !showDialog &&
        <Button
          color="primary"
          variant="outlined"
          onClick={() => setShowDialog(true)}
          data-testid="add-new-destination"
        >
          Add a new warehouse
        </Button>
      }
      {!warehouse &&
        <CustomDialog
          title={'Add a new destination'}
          show={showDialog}
          handleClose={handleClose}
          handleSubmit={handleSubmit(onSubmit)}
          formContent={<CreateDestinationForm />}
          formActions={
            <>
              {
                setupLogs && (
                  <Box sx={{ pt: 2, pb: 4, maxWidth: '100%' }}>
                    {
                      setupLogs.map((logmessage, idx) => <Box key={idx}>{logmessage}</Box>)
                    }
                  </Box>
                )
              }
              <Button variant="contained" type="submit">
                Save changes and test
              </Button>
              <Button
                color="secondary"
                variant="outlined"
                onClick={handleClose}
                data-testid="cancel"
              >
                Cancel
              </Button>
            </>
          }
        />
      }
    </>
  );
};
