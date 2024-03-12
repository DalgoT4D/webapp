import React, { useContext, useEffect, useState } from 'react';
import { OperationNodeData } from '../../Canvas';
import { useSession } from 'next-auth/react';
import {
  Autocomplete,
  Box,
  Button,
  Grid,
  SxProps,
  TextField,
  Typography,
} from '@mui/material';
import { OPERATION_NODE, SRC_MODEL_NODE } from '../../../constant';
import { DbtSourceModel } from '../../../FlowEditor';
import { httpGet, httpPost } from '@/helpers/http';
import { ColumnData } from '../../Nodes/DbtSourceModelNode';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import Input from '@/components/UI/Input/Input';
import { GlobalContext } from '@/contexts/ContextProvider';
import {
  errorToast,
  successToast,
} from '@/components/ToastMessage/ToastHelper';
import { FlowEditorContext } from '@/contexts/FlowEditorContext';
import { OperationFormProps } from '../../OperationConfigLayout';

const renameGridStyles: {
  container: SxProps;
  headerItem: SxProps;
  item: SxProps;
} = {
  container: {
    border: '1px solid #F9F9F9',
    color: '#5E5E5E',
    alignItems: 'center',
  },
  headerItem: {
    background: '#F9F9F9',
    padding: '9px 16px 9px 16px',
  },
  item: {
    border: '1px solid #F9F9F9',
    padding: '9px 16px 9px 16px',
  },
};

const RenameColumnOp = ({
  node,
  operation,
  sx,
  clearOperation,
}: OperationFormProps) => {
  const { data: session } = useSession();
  const [srcColumns, setSrcColumns] = useState<String[]>([]);
  const globalContext = useContext(GlobalContext);
  const flowEditorContext = useContext(FlowEditorContext);
  const nodeConfig: any =
    node.data.node.type === SRC_MODEL_NODE
      ? (node.data.node as DbtSourceModel)
      : node.data.node.type === OPERATION_NODE
      ? (node.data.node as OperationNodeData)
      : {};

  const { control, register, handleSubmit, reset } = useForm({
    defaultValues: {
      config: [{ old: '', new: '' }],
    },
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'config' });

  const fetchAndSetSourceColumns = async () => {
    if (node.type === SRC_MODEL_NODE) {
      const nodeConfig = node.data.node as DbtSourceModel;
      try {
        const data: ColumnData[] = await httpGet(
          session,
          `warehouse/table_columns/${nodeConfig.schema}/${nodeConfig.input_name}`
        );
        setSrcColumns(data.map((col: ColumnData) => col.name));
      } catch (error) {
        console.log(error);
      }
    }

    if (node.type === OPERATION_NODE) {
      const nodeConfig = node.data.node as OperationNodeData;
      setSrcColumns(nodeConfig.output_cols);
    }
  };

  const handleSave = async (data: any) => {
    try {
      const postData: any = {
        op_type: operation.slug,
        select_columns: srcColumns,
        config: { columns: {} },
        input_uuids: node.type === SRC_MODEL_NODE ? [node.data.node.id] : [],
        model_uuid: nodeConfig?.target_model_id || '',
      };
      data.config.forEach((item: any) => {
        if (item.old && item.new) postData.config.columns[item.old] = item.new;
      });

      // validations
      if (Object.keys(postData.config.columns).length === 0) {
        console.log('Please add columns to rename');
        errorToast('Please add columns to rename', [], globalContext);
        return;
      }

      // api call
      await httpPost(session, `transform/dbt_project/model/`, postData);

      handleClose();
    } catch (error) {
      console.log(error);
    }
  };

  const handleClose = () => {
    clearOperation();
    reset();
    flowEditorContext?.canvasNode.dispatch({
      type: 'refresh-canvas',
      state: {
        node: null,
        action: 'refresh-canvas',
      },
    });
  };

  useEffect(() => {
    fetchAndSetSourceColumns();
  }, [session]);

  return (
    <Box sx={{ ...sx }}>
      <form onSubmit={handleSubmit(handleSave)}>
        <Grid container sx={{ ...renameGridStyles.container }}>
          <Grid item xs={6} sx={{ ...renameGridStyles.headerItem }}>
            <Typography
              sx={{
                fontWeight: '600',
                fontSize: '12px',
                lineHeight: '19.2px',
                letterSpacing: '2%',
              }}
            >
              Current Name
            </Typography>
          </Grid>
          <Grid item xs={6} sx={{ ...renameGridStyles.headerItem }}>
            <Typography
              sx={{
                fontWeight: '600',
                fontSize: '12px',
                lineHeight: '19.2px',
                letterSpacing: '2%',
              }}
            >
              New Name
            </Typography>
          </Grid>

          {fields.map((field, index) => (
            <>
              <Grid item xs={6} sx={{ ...renameGridStyles.item }}>
                <Controller
                  control={control}
                  name={`config.${index}.old`}
                  render={({ field }) => (
                    <Autocomplete
                      options={srcColumns}
                      value={field.value}
                      onChange={(e, data) => {
                        field.onChange(data);
                        if (data) append({ old: '', new: '' });
                        else remove(index + 1);
                      }}
                      renderInput={(params) => (
                        <Input {...params} sx={{ width: '100%' }} />
                      )}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={6} sx={{ ...renameGridStyles.item }}>
                <Input
                  sx={{ padding: '0' }}
                  name={`config.${index}.new`}
                  register={register}
                />
              </Grid>
            </>
          ))}
          <Box>
            <Button variant="outlined" type="submit" data-testid="savebutton">
              Save
            </Button>
            <Button color="secondary" variant="outlined" onClick={handleClose}>
              Cancel
            </Button>
          </Box>
        </Grid>
      </form>
    </Box>
  );
};

export default RenameColumnOp;
