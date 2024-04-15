import React, { useContext, useEffect, useState } from 'react';
import { OperationNodeData } from '../../Canvas';
import { useSession } from 'next-auth/react';
import { Box, Button } from '@mui/material';
import { OPERATION_NODE, SRC_MODEL_NODE } from '../../../constant';
import { DbtSourceModel } from '../../Canvas';
import { httpGet, httpPost, httpPut } from '@/helpers/http';
import { ColumnData } from '../../Nodes/DbtSourceModelNode';
import { useForm } from 'react-hook-form';
import { GlobalContext } from '@/contexts/ContextProvider';
import { errorToast } from '@/components/ToastMessage/ToastHelper';
import { OperationFormProps } from '../../OperationConfigLayout';
import { GridTableCheckBox } from '@/components/UI/GridTable/GridCheckBox';

interface UnpivotDataConfig {
  source_columns: string[];
  exclude_columns: string[];
  unpivot_columns: string[];
  unpivot_field_name: string;
  unpivot_value_name: string;
}

const UnpivotOpForm = ({
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
  const [unpivotColumns, setUnpivotColumns] = useState<string[]>([]);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const nodeData: any =
    node?.type === SRC_MODEL_NODE
      ? (node?.data as DbtSourceModel)
      : node?.type === OPERATION_NODE
      ? (node?.data as OperationNodeData)
      : {};

  type FormProps = {
    unpivot_field_name: string;
    unpivot_value_name: string;
  };

  const { control, register, handleSubmit, reset, watch, formState } =
    useForm<FormProps>({
      defaultValues: {
        unpivot_field_name: 'col_name',
        unpivot_value_name: 'value',
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
        source_columns: srcColumns,
        config: {
          unpivot_columns: unpivotColumns,
          unpivot_field_name: data.unpivot_field_name,
          unpivot_value_name: data.unpivot_value_name,
          exclude_columns: selectedColumns,
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
      const { config }: OperationNodeData = await httpGet(
        session,
        `transform/dbt_project/model/operations/${node?.id}/`
      );
      const { config: opConfig, input_models } = config;
      setInputModels(input_models);

      // form data; will differ based on operations in progress
      const {
        source_columns,
        exclude_columns,
        unpivot_columns,
        unpivot_field_name,
        unpivot_value_name,
      }: UnpivotDataConfig = opConfig;
      setSrcColumns(source_columns);
      setSelectedColumns(exclude_columns);
      setUnpivotColumns(unpivot_columns);

      // pre-fill form
      reset({
        unpivot_field_name: unpivot_field_name,
        unpivot_value_name: unpivot_value_name,
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

  useEffect(() => {
    setSelectedColumns(
      selectedColumns.filter((col) => !unpivotColumns.includes(col))
    );
  }, [unpivotColumns]);

  return (
    <Box sx={{ ...sx, padding: '32px 16px 0px 16px' }}>
      <form onSubmit={handleSubmit(handleSave)}>
        <GridTableCheckBox
          entities={srcColumns.filter((col) => !selectedColumns.includes(col))}
          selectedEntities={unpivotColumns}
          onSelect={setUnpivotColumns}
          title={'Columns to unpivot'}
        />
        <Box sx={{ mb: 2 }}></Box>
        <GridTableCheckBox
          entities={srcColumns.filter((col) => !unpivotColumns.includes(col))}
          selectedEntities={selectedColumns}
          onSelect={setSelectedColumns}
          title={'Columns to keep in output table'}
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

export default UnpivotOpForm;
