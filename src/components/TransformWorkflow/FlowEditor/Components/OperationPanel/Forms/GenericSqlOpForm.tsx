import React, { Fragment, useEffect, useState } from 'react';
import { OperationNodeData } from '../../Canvas';
import { useSession } from 'next-auth/react';
import {
  Box,
  Button,
  FormHelperText,
  FormLabel,
  Grid,
  SxProps,
  Typography,
} from '@mui/material';
import { OPERATION_NODE, SRC_MODEL_NODE } from '../../../constant';
import { DbtSourceModel } from '../../Canvas';
import { httpGet, httpPost, httpPut } from '@/helpers/http';
import { ColumnData } from '../../Nodes/DbtSourceModelNode';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import Input from '@/components/UI/Input/Input';
import { OperationFormProps } from '../../OperationConfigLayout';
import { Autocomplete } from '@/components/UI/Autocomplete/Autocomplete';
import InfoTooltip from '@/components/UI/Tooltip/Tooltip';

const renameGridStyles: {
  container: SxProps;
  headerItem: SxProps;
  item: SxProps;
} = {
  container: {
    border: '1px solid #F9F9F9',
    color: '#5E5E5E',
  },
  headerItem: {
    background: '#EEF3F3',
    padding: '9px 16px 9px 16px',
  },
  item: {
    background: '#EEF3F3',
    border: '1px solid #EEF3F3',
    padding: '9px 16px 9px 16px',
  },
};

interface GenericDataConfig {
  columns: string[];
  source_columns: string[];
  sql_statement_1: string;
  other_inputs: any[];
  sql_statement_2: string;
}

const GenericSqlOpForm = ({
  node,
  operation,
  sx,
  continueOperationChain,
  clearAndClosePanel,
  dummyNodeId,
  action,
  setLoading,
}: OperationFormProps) => {
  const { data: session } = useSession();
  // const [srcColumns, setSrcColumns] = useState<string[]>([]);
  const [inputModels, setInputModels] = useState<any[]>([]); // used for edit; will have information about the input nodes to the operation being edited
  const nodeData: any =
    node?.type === SRC_MODEL_NODE
      ? (node?.data as DbtSourceModel)
      : node?.type === OPERATION_NODE
      ? (node?.data as OperationNodeData)
      : {};

  const { control, handleSubmit, reset, getValues, formState } = useForm({
    defaultValues: {
      columns: [{ col: '' }],
      sql_statement_1: '',
      sql_statement_2: '',
    },
  });

  const fetchAndSetSourceColumns = async () => {
    if (node?.type === SRC_MODEL_NODE) {
      try {
        const data: ColumnData[] = await httpGet(
          session,
          `warehouse/table_columns/${nodeData.schema}/${nodeData.input_name}`
        );
        // setSrcColumns(data.map((col: ColumnData) => col.name));
      } catch (error) {
        console.log(error);
      }
    }

    if (node?.type === OPERATION_NODE) {
      // setSrcColumns(nodeData.output_cols);
    }
  };

  return (
    <Box sx={{ ...sx }}>
      <form>
        {formState.errors.columns && (
          <FormHelperText sx={{ color: 'red', ml: 3 }}>
            {formState.errors.columns.root?.message}
          </FormHelperText>
        )}
        <Box sx={{ padding: '32px 16px 0px 16px' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <FormLabel sx={{ mr: 1, color: 'black' }}>SELECT*</FormLabel>
            <Box sx={{ display: 'inline-block' }}>
              <InfoTooltip title={'Output if all values in a row are null'} />
            </Box>
          </Box>
          <Controller
            control={control}
            rules={{ required: 'SQL statement is required' }}
            name="sql_statement_1"
            render={({ field, fieldState }) => (
              <Input
                multiline
                rows={4}
                {...field}
                helperText={fieldState.error?.message}
                error={!!fieldState.error}
                disabled={action === 'view'}
                fieldStyle="transformation"
                label=""
                sx={{ padding: '0' }}
              />
            )}
          />
          <Box sx={{ m: 2 }} />
          <Controller
            control={control}
            name="sql_statement_2"
            render={({ field, fieldState }) => (
              <Input
                multiline
                rows={4}
                helperText={fieldState.error?.message}
                error={!!fieldState.error}
                {...field}
                disabled={action === 'view'}
                fieldStyle="transformation"
                label="FROM table_name"
                sx={{ padding: '0' }}
              />
            )}
          />
          <Box sx={{ m: 2 }} />
          <Box>
            <Button
              disabled={action === 'view'}
              variant="contained"
              type="submit"
              data-testid="savebutton"
              fullWidth
              sx={{ marginTop: '17px' }}
            >
              Save
            </Button>
          </Box>
        </Box>
      </form>
    </Box>
  );
};

export default GenericSqlOpForm;
