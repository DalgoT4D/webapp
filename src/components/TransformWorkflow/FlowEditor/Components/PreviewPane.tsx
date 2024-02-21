import { Box, Typography } from '@mui/material';
import 'ag-grid-community/styles/ag-grid.css'; // Core CSS
import 'ag-grid-community/styles/ag-theme-quartz.css'; // Theme
import { AgGridReact } from 'ag-grid-react';
import React, { useContext, useEffect, useState } from 'react';
import { DbtSourceModel } from '../FlowEditor';
import { httpGet } from '@/helpers/http';
import { useSession } from 'next-auth/react';
import { GlobalContext } from '@/contexts/ContextProvider';
import { errorToast } from '@/components/ToastMessage/ToastHelper';
import { FlowEditorContext } from '@/contexts/FlowEditorContext';

type PreviewPaneProps = {};

const PreviewPane = ({}: PreviewPaneProps) => {
  const [modelToPreview, setModelToPreview] = useState<DbtSourceModel | null>();
  const { data: session } = useSession();
  const toastContext = useContext(GlobalContext);
  const flowEditorContext = useContext(FlowEditorContext);

  // Row Data: The data to be displayed.
  const [rowData, setRowData] = useState([]);

  // Column Definitions: Defines & controls grid columns.
  const [colDefs, setColDefs] = useState([]);

  useEffect(() => {
    if (flowEditorContext?.NodeActionTodo.state.toDo === 'preview') {
      setModelToPreview(flowEditorContext?.NodeActionTodo.state.node);
    } else if (
      flowEditorContext?.NodeActionTodo.state.toDo === 'clear-preview'
    ) {
      setModelToPreview(null);
    }
  }, [flowEditorContext?.NodeActionTodo.state]);

  const fetchColumns = async (schema: string, table: string) => {
    try {
      const columnSpec = await httpGet(
        session,
        `warehouse/table_columns/${schema}/${table}`
      );
      // console.log(columnSpec);
      setColDefs(
        columnSpec.map((col: string) => ({
          field: col,
          headerName: col,
          autoHeight: true,
        }))
      );
    } catch (error: any) {
      errorToast(error.message, [], toastContext);
    }
  };

  const fetchRows = async (schema: string, table: string) => {
    try {
      const rows = await httpGet(
        session,
        `warehouse/table_data/${schema}/${table}`
      );
      // console.log(rows);
      setRowData(rows);
    } catch (error: any) {
      errorToast(error.message, [], toastContext);
    }
  };

  useEffect(() => {
    if (modelToPreview) {
      (async () => {
        await fetchColumns(modelToPreview.schema, modelToPreview.input_name);
      })();
      (async () => {
        await fetchRows(modelToPreview.schema, modelToPreview.input_name);
      })();
    }
  }, [modelToPreview]);

  if (rowData.length === 0) {
    return (
      <Box>
        <Typography variant="h6">Preview</Typography>
        <Typography variant="body1">No data found</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{}}>
      <Typography variant="h6">
        Preview of {modelToPreview?.schema}.{modelToPreview?.input_name}
      </Typography>
      <Box
        className="ag-theme-quartz"
        sx={{
          width: '100%',
          marginTop: '0',
          padding: '10px',
        }}
      >
        <AgGridReact
          autoSizePadding={20}
          rowData={rowData}
          columnDefs={colDefs}
          pagination={true}
          paginationPageSize={5}
          paginationPageSizeSelector={[5]}
          domLayout="autoHeight"
        />
      </Box>
    </Box>
  );
};

export default PreviewPane;
