import React, { useContext, useEffect, useState } from 'react';
import { OperationNodeData } from '../../Canvas';
import { useSession } from 'next-auth/react';
import { Box, Button, FormHelperText } from '@mui/material';
import { OPERATION_NODE, SRC_MODEL_NODE } from '../../../constant';
import { DbtSourceModel } from '../../Canvas';
import { httpGet, httpPost, httpPut } from '@/helpers/http';
import { ColumnData } from '../../Nodes/DbtSourceModelNode';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import Input from '@/components/UI/Input/Input';
import { GlobalContext } from '@/contexts/ContextProvider';
import { errorToast } from '@/components/ToastMessage/ToastHelper';
import { OperationFormProps } from '../../OperationConfigLayout';
import { Autocomplete } from '@/components/UI/Autocomplete/Autocomplete';
import { GridTable } from '@/components/UI/GridTable/GridTable';
import { GridTableCheckBox } from '@/components/UI/GridTable/GridCheckBox';

interface PivotDataConfig {
  source_columns: string[];
  pivot_column_name: string;
  pivot_column_values: string[];
}

const PivotOpForm = ({
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
  const [srcColumns, setSrcColumns] = useState<string[]>([]);
  const globalContext = useContext(GlobalContext);
  const [inputModels, setInputModels] = useState<any[]>([]); // used for edit; will have information about the input nodes to the operation being edited
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const nodeData: any =
    node?.type === SRC_MODEL_NODE
      ? (node?.data as DbtSourceModel)
      : node?.type === OPERATION_NODE
      ? (node?.data as OperationNodeData)
      : {};

  type FormProps = {
    pivot_column_name: string;
    pivot_column_values: {
      col: string;
    }[];
  };

  const { control, register, handleSubmit, reset, watch, formState } =
    useForm<FormProps>({
      defaultValues: {
        pivot_column_name: '',
        pivot_column_values: [
          {
            col: '',
          },
        ],
      },
    });

  const pivotColumn: string = watch('pivot_column_name');

  // Include this for multi-row input
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'pivot_column_values',
    rules: {
      minLength: {
        value: 2,
        message: 'Atleast one value is required',
      },
    },
  });

  const fetchAndSetSourceColumns = async () => {
    if (node?.type === SRC_MODEL_NODE) {
      try {
        const data: ColumnData[] = await httpGet(
          session,
          `warehouse/table_columns/${nodeData.schema}/${nodeData.input_name}`
        );
        setSrcColumns(data.map((col: ColumnData) => col.name));
      } catch (error) {
        console.log(error);
      }
    }

    if (node?.type === OPERATION_NODE) {
      setSrcColumns(nodeData.output_cols);
    }
  };

  const handleSave = async (data: FormProps) => {
    try {
      const postData: any = {
        op_type: operation.slug,
        source_columns: selectedColumns.filter((col) => col !== pivotColumn),
        config: {
          pivot_column_name: data.pivot_column_name,
          pivot_column_values: data.pivot_column_values
            .filter((item) => item.col)
            .map((item) => item.col),
        },
        input_uuid: node?.type === SRC_MODEL_NODE ? node?.data.id : '',
        target_model_uuid: nodeData?.target_model_id || '',
      };

      setLoading(true);
      // api call
      let operationNode: any;
      if (action === 'create') {
        operationNode = await httpPost(
          session,
          `transform/dbt_project/model/`,
          postData
        );
      } else if (action === 'edit') {
        // need this input to be sent for the first step in chain
        postData.input_uuid =
          inputModels.length > 0 && inputModels[0]?.uuid
            ? inputModels[0].uuid
            : '';
        operationNode = await httpPut(
          session,
          `transform/dbt_project/model/operations/${node?.id}/`,
          postData
        );
      }

      continueOperationChain(operationNode);
      reset();
    } catch (error: any) {
      console.log(error);
      errorToast(error?.message, [], globalContext);
    } finally {
      setLoading(false);
    }
  };

  const fetchAndSetConfigForEdit = async () => {
    try {
      setLoading(true);
      const { config, prev_source_columns }: OperationNodeData = await httpGet(
        session,
        `transform/dbt_project/model/operations/${node?.id}/`
      );
      const { config: opConfig, input_models } = config;
      setInputModels(input_models);

      // form data; will differ based on operations in progress
      const {
        source_columns,
        pivot_column_name,
        pivot_column_values,
      }: PivotDataConfig = opConfig;
      if (prev_source_columns)
        setSrcColumns(prev_source_columns.sort((a, b) => a.localeCompare(b)));
      setSelectedColumns(source_columns);

      // pre-fill form
      reset({
        pivot_column_name: pivot_column_name,
        pivot_column_values: pivot_column_values.map((col: string) => ({
          col: col,
        })),
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (['edit', 'view'].includes(action)) {
      fetchAndSetConfigForEdit();
    } else {
      fetchAndSetSourceColumns();
    }
  }, [session, node]);

  return (
    <Box sx={{ ...sx, padding: '32px 16px 0px 16px' }}>
      <form onSubmit={handleSubmit(handleSave)}>
        <Box sx={{ mb: 2 }}>
          <Controller
            control={control}
            name={`pivot_column_name`}
            rules={{ required: 'Pivot Column is required' }}
            render={({ field, fieldState }) => (
              <Autocomplete
                {...field}
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
                disabled={action === 'view'}
                options={srcColumns.sort((a, b) => a.localeCompare(b))}
                label="Select Column to pivot on*"
                fieldStyle="transformation"
                onChange={(data: any) => {
                  field.onChange(data);
                  if (data)
                    setSelectedColumns(
                      selectedColumns.filter((col) => col !== data)
                    );
                }}
              />
            )}
          />
        </Box>
        <GridTable
          headers={['Column values to pivot on']}
          removeItem={(index: number) => remove(index)}
          data={fields.map((field, idx) => [
            <Input
              disabled={action === 'view'}
              fieldStyle="none"
              key={field.col + idx}
              name={`pivot_column_values.${idx}.col`}
              register={register}
            />,
          ])}
        ></GridTable>
        {formState.errors.pivot_column_values && (
          <FormHelperText sx={{ color: 'red', ml: 2 }}>
            {formState.errors.pivot_column_values.root?.message}
          </FormHelperText>
        )}

        <Button
          variant="shadow"
          type="button"
          data-testid="addcase"
          sx={{ m: 2 }}
          onClick={(event) => {
            append({ col: '' });
          }}
        >
          Add row
        </Button>
        <GridTableCheckBox
          entities={srcColumns.filter((col) => col !== pivotColumn)}
          selectedEntities={selectedColumns}
          onSelect={setSelectedColumns}
          title={'Columns to group by'}
        />
        <Box>
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

export default PivotOpForm;