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

type PreviewPaneProps = {
  dbtSourceModel: DbtSourceModel | undefined | null;
};

const PreviewPane = ({ dbtSourceModel }: PreviewPaneProps) => {
  console.log('dbtSourceModel', dbtSourceModel);
  const { data: session } = useSession();
  const toastContext = useContext(GlobalContext);

  // Row Data: The data to be displayed.
  const [rowData, setRowData] = useState([]);

  // Column Definitions: Defines & controls grid columns.
  const [colDefs, setColDefs] = useState([]);

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
    if (dbtSourceModel) {
      (async () => {
        await fetchColumns(dbtSourceModel.schema, dbtSourceModel.input_name);
      })();
      (async () => {
        await fetchRows(dbtSourceModel.schema, dbtSourceModel.input_name);
      })();
    }
  }, [dbtSourceModel]);

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
        Preview of {dbtSourceModel?.schema}.{dbtSourceModel?.input_name}
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
