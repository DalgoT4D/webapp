import { useState, useEffect } from 'react';
import useSWR from 'swr';
import {
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  TextField,
} from '@mui/material';
import { List } from '../List/List';
import { backendUrl } from '@/config/constant';
import { Close } from '@mui/icons-material';
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

const headers = ['Destination details', 'Type'];

export const Destinations = () => {
  const { data: session }: any = useSession();
  const [rows, setRows] = useState<Array<Array<string>>>([]);
  const { data, isLoading, mutate } = useSWR(
    `${backendUrl}/api/airbyte/destinations`
  );
  const [showDialog, setShowDialog] = useState(false);
  const [destinationDefs, setDestinationDefs] = useState([]);
  const [destinationDefSpecs, setDestinationDefSpecs] = useState<Array<any>>(
    []
  );
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
      const rows = data.map((element: any) => [
        element.name,
        element.destinationDest,
      ]);
      setRows(rows);
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
  };

  const handleClickOpen = () => {
    setShowDialog(true);
  };

  const onSubmit = async (data: any) => {
    try {
      await httpPost(session, 'organizations/warehouse/', {
        wtype: data.destinationDef.label.toLowerCase(),
        name: data.name,
        destinationDefId: data.destinationDef.id,
        airbyteConfig: data.config,
      });
      mutate();
      handleClose();
      successToast('Warehouse created', [], toastContext);
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

  return (
    <>
      <CustomDialog
        title={'Add a new destination'}
        show={showDialog}
        handleClose={handleClose}
        handleSubmit={handleSubmit(onSubmit)}
        formContent={<CreateDestinationForm />}
        formActions={
          <>
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
      <List
        openDialog={handleClickOpen}
        title="Destination"
        headers={headers}
        rows={rows}
      />
    </>
  );
};
