import React, { useContext, useEffect, useRef, useState } from 'react';
import { OperationNodeData } from '../../Canvas';
import { useSession } from 'next-auth/react';
import { Box, Button } from '@mui/material';
import { OPERATION_NODE, SRC_MODEL_NODE } from '../../../constant';
import { DbtSourceModel } from '../../Canvas';
import { httpGet, httpPost, httpPut } from '@/helpers/http';
import { ColumnData } from '../../Nodes/DbtSourceModelNode';
import { Controller, useForm } from 'react-hook-form';
import Input from '@/components/UI/Input/Input';
import { GlobalContext } from '@/contexts/ContextProvider';
import { errorToast } from '@/components/ToastMessage/ToastHelper';
import { OperationFormProps } from '../../OperationConfigLayout';
import { Autocomplete } from '@/components/UI/Autocomplete/Autocomplete';
import { GridTable } from '@/components/UI/GridTable/GridTable';

interface CastDataConfig {
  source_columns: string[];
  other_inputs: any[];
  columns: { columnname: string; columntype: string }[];
}

const CastColumnOp = ({
  node,
  operation,
  sx,
  continueOperationChain,
  action,
  setLoading,
}: OperationFormProps) => {
  const { data: session } = useSession();
  const [dataTypes, setDataTypes] = useState<string[]>([]);
  const [inputModels, setInputModels] = useState<any[]>([]); // used for edit; will have information about the input nodes to the operation being edited
  const [configData, setConfigData] = useState<any>([]);
  const globalContext = useContext(GlobalContext);
  const sourceModelNodeRef: any = useRef(); //table
  const nodeData: any =
    node?.type === SRC_MODEL_NODE
      ? (node?.data as DbtSourceModel)
      : node?.type === OPERATION_NODE
      ? (node?.data as OperationNodeData)
      : {};
  type FormData = {
    config: { name: string; data_type: string | null }[];
  };
  console.log(node?.type, '%%%%$$^$%^$%^$%^$%^TYPE');
  const { control, handleSubmit, register, reset, getValues, setValue } =
    useForm<FormData>({
      defaultValues: {
        config: [
          {
            name: '',
            data_type: null,
          },
        ] as ColumnData[],
      },
    });

  const { config } = getValues();
  const fetchDataTypes = async () => {
    try {
      const response = await httpGet(
        session,
        `transform/dbt_project/data_type/`
      );
      setDataTypes(response.sort((a: string, b: string) => a.localeCompare(b)));
    } catch (error) {
      console.log(error);
    }
  };

  const fetchAndSetSourceColumns = async () => {
    if (node?.type === SRC_MODEL_NODE) {
      try {
        const columnData: ColumnData[] = await httpGet(
          session,
          `warehouse/table_columns/${nodeData.schema}/${nodeData.input_name}`
        );

        setValue('config', columnData);
      } catch (error) {
        console.log(error);
      }
    }

    if (node?.type === OPERATION_NODE) {
      setValue(
        'config',
        nodeData.output_cols.map((column: any) => ({ name: column }))
      );
    }
  };

  const handleSave = async (formData: FormData) => {
    // when a new dummy node is being created we will keep the final node as table node and the final action as create action.
    // clicking operational nodes (saved in db) has action == edit.
    //clicking source node (table) has action == create.

    const finalNode = node?.data.isDummy ? sourceModelNodeRef.current : node;
    const finalAction = node?.data.isDummy ? 'create' : action;
    try {
      const sourceColumnsNames = config.map((column) => column.name);

      const postData: any = {
        op_type: operation.slug,
        source_columns: sourceColumnsNames,
        other_inputs: [],
        config: { columns: [] },
        input_uuid:
          finalNode?.type === SRC_MODEL_NODE ? finalNode?.data.id : '',
        target_model_uuid: nodeData?.target_model_id || '',
      };

      formData.config.forEach((data: any) => {
        if (data.name && data.data_type) {
          postData.config.columns.push({
            columnname: data.name,
            columntype: data.data_type,
          });
        }
      });

      // validations
      if (Object.keys(postData.config.columns).length === 0) {
        console.log('Please add columns to cast');
        errorToast('Please add columns to cast', [], globalContext);
        return;
      }

      // Make the API call
      setLoading(true);
      let operationNode: any;
      if (finalAction === 'create') {
        operationNode = await httpPost(
          session,
          `transform/dbt_project/model/`,
          postData
        );
      } else if (finalAction === 'edit') {
        // need this input to be sent for the first step in chain
        postData.input_uuid =
          inputModels.length > 0 && inputModels[0]?.uuid
            ? inputModels[0].uuid
            : '';
        operationNode = await httpPut(
          session,
          `transform/dbt_project/model/operations/${finalNode?.id}/`,
          postData
        );
      }

      // Handle the response
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
      const nodeId = node?.data.isDummy ? sourceModelNodeRef.current : node?.id;
      const { config }: OperationNodeData = await httpGet(
        //this here fetches the columns data.
        session,
        `transform/dbt_project/model/operations/${nodeId}/`
      );
      const { config: opConfig, input_models } = config;
      setInputModels(input_models);

      // form data; will differ based on operations in progress
      const { columns }: CastDataConfig = opConfig;

      // pre-fill form
      reset({
        config: columns.map(
          (column: { columnname: string; columntype: string }) => ({
            name: column.columnname,
            data_type: column.columntype,
          })
        ),
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    const trimmedSubstring = value?.toLowerCase();
    const filteredConfigs = config?.filter((ele) => {
      const stringToSearch = ele?.name?.toLowerCase();
      return stringToSearch?.includes(trimmedSubstring);
    });
    setConfigData(filteredConfigs);
  };

  const findColumnIndex = (columnName: string) => {
    const index = config?.findIndex((column) => column.name == columnName);
    return index == -1 ? 0 : index;
  };

  /**
    So operation nodes can be dummy (not yet saved to db) or real (saved in db).
    Both have nodeId, but the dummy nodes have isDummy= true field. 
    So we dont call any api in that case.
   **/
  useEffect(() => {
    if (node?.type === SRC_MODEL_NODE) {
      sourceModelNodeRef.current = node; //saving table's id
    }
    if (node?.data.isDummy) return;
    fetchDataTypes();
    if (['edit', 'view'].includes(action)) {
      fetchAndSetConfigForEdit();
    } else {
      console.log('!@!@!@!@!@!@!@!@!@!@!@!@!else');
      fetchAndSetSourceColumns();
    }
  }, [session, node]);

  useEffect(() => {
    setConfigData(config);
  }, [config]);

  return (
    <Box sx={{ ...sx, marginTop: '17px' }}>
      <Input
        fieldStyle="transformation"
        sx={{ px: 1, pb: 1 }}
        placeholder="Search Here"
        onChange={(event) => handleSearch(event.target.value)}
      />
      <form onSubmit={handleSubmit(handleSave)}>
        <GridTable
          headers={['Column name', 'Type']}
          data={configData?.map((column: any, index: number) => [
            <Input
              data-testid={`columnName${findColumnIndex(column.name)}`}
              key={`config.${findColumnIndex(column.name)}.name`}
              fieldStyle="none"
              sx={{ padding: '0' }}
              name={`config.${findColumnIndex(column.name)}.name`}
              register={register}
              value={column.name}
              disabled={action === 'view'}
            />,
            <Controller
              key={`config.${findColumnIndex(column.name)}.data_type`}
              control={control}
              name={`config.${findColumnIndex(column.name)}.data_type`}
              render={({ field }) => (
                <Autocomplete
                  {...field}
                  data-testid={`type${findColumnIndex(column.name)}`}
                  disabled={action === 'view'}
                  disableClearable
                  fieldStyle="none"
                  options={dataTypes}
                />
              )}
            />,
          ])}
        ></GridTable>
        <Box sx={{ m: 2 }} />
        <Box sx={{ position: 'sticky', bottom: 0, background: '#fff', p: 2 }}>
          <Button
            variant="contained"
            type="submit"
            data-testid="savebutton"
            fullWidth
            disabled={action === 'view'}
          >
            Save
          </Button>
        </Box>
      </form>
    </Box>
  );
};

export default CastColumnOp;
