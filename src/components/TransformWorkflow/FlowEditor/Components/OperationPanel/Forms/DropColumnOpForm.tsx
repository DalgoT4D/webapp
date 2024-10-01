import React, { useEffect, useState } from 'react';
import { OperationNodeData } from '../../Canvas';
import { useSession } from 'next-auth/react';
import {
  Box,
  Button,
  Checkbox,
  FormHelperText,
  Grid,
  Typography,
} from '@mui/material';
import { OPERATION_NODE, SRC_MODEL_NODE } from '../../../constant';
import { httpGet, httpPost, httpPut } from '@/helpers/http';
import { ColumnData } from '../../Nodes/DbtSourceModelNode';

import { OperationFormProps } from '../../OperationConfigLayout';
import { Autocomplete } from '@/components/UI/Autocomplete/Autocomplete';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import { useOpForm } from '@/customHooks/useOpForm';

const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const checkedIcon = <CheckBoxIcon fontSize="small" />;

interface DropDataConfig {
  columns: string[];
  source_columns: string[];
  other_inputs: any[];
}

const DropColumnOp = ({
  node,
  operation,
  sx,
  continueOperationChain,
  action,
  setLoading,
}: OperationFormProps) => {
  console.log(node, "drop node")
  const { data: session } = useSession();
  const [srcColumns, setSrcColumns] = useState<string[]>([]);
  const [valid, setValid] = useState(true);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [inputModels, setInputModels] = useState<any[]>([]); // used for edit; will have information about the input nodes to the operation being edited
  const { parentNode, nodeData } = useOpForm({
    props: {
      node,
      operation,
      sx,
      continueOperationChain,
      action,
      setLoading,
    }
  })

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

  const handleAddColumn = (columns: string[]) => {
    setSelectedColumns(columns);
  };

  const handleSave = async () => {
    const finalNode = node?.data.isDummy ? parentNode : node; //change  //this checks for edit case too.
    const finalAction = node?.data.isDummy ? 'create' : action; //change
    try {
      if (selectedColumns.length < 1) {
        setValid(false);
        return;
      }
      const postData = {
        op_type: operation.slug,
        source_columns: srcColumns,
        other_inputs: [],
        config: { columns: selectedColumns },
        input_uuid: finalNode?.type === SRC_MODEL_NODE ? finalNode?.id : '',
        target_model_uuid: finalNode?.data.target_model_id || '',
      };

      // api call
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

      continueOperationChain(operationNode);
    } catch (error) {
      console.log(error);
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
      const { source_columns, columns }: DropDataConfig = opConfig;
      setSrcColumns(source_columns);

      // pre-fill form
      setSelectedColumns(columns);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (node?.data.isDummy) return;
    if (['edit', 'view'].includes(action)) {
      fetchAndSetConfigForEdit();
    } else {
      fetchAndSetSourceColumns();
    }
  }, [session, node]);

  return (
    <Box sx={{ ...sx, marginTop: '17px', padding: '20px' }}>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Typography variant="h6">Select Columns to Drop</Typography>
        </Grid>
        <Grid item xs={12}>
          <Autocomplete
            data-testid="dropColumn"
            disabled={action === 'view'}
            value={selectedColumns}
            limitTags={3}
            multiple
            disableCloseOnSelect
            renderOption={(props: any, option: any, { selected }) => {
              const { key, ...optionProps } = props;
              return (
                <li key={key} {...optionProps}>
                  <Checkbox
                    icon={icon}
                    checkedIcon={checkedIcon}
                    style={{ marginRight: 8 }}
                    checked={selected}
                  />
                  {option}
                </li>
              );
            }}
            fieldStyle="transformation"
            options={srcColumns.sort((a, b) => a.localeCompare(b))}
            label="Select Column to Drop"
            onChange={(value: any) => {
              if (value) {
                handleAddColumn(value);
                setValid(true);
              }
            }}
          />
        </Grid>
        {!valid && (
          <FormHelperText sx={{ color: 'red', ml: 3 }}>
            Please select atleast 1 column
          </FormHelperText>
        )}
        <Grid item xs={12}>
          <Button
            data-testid="savebutton"
            onClick={handleSave}
            variant="contained"
            disabled={action === 'view'}
          >
            Save
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DropColumnOp;
