import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Switch,
  Select,
  MenuItem,
  IconButton,
  Collapse,
  Box,
  Typography,
} from '@mui/material';
import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';

const StreamTable = ({ columns }) => {
  const [open, setOpen] = useState(false);
  const [selectedDataTypes, setSelectedDataTypes] = useState({});

  const handleSelectChange = (columnName, value) => {
    setSelectedDataTypes((prev) => ({
      ...prev,
      [columnName]: value,
    }));
  };

  return (
    <Box>
      {/* Parent Header Row */}
      <Box display="flex" alignItems="center" px={2} py={1}>
        <IconButton size="small" onClick={() => setOpen(!open)}>
          {open ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
        </IconButton>
      </Box>

      {/* Collapsible Table */}
      <Collapse in={open} timeout="auto" unmountOnExit>
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>
                  <strong>Sync</strong>
                </TableCell>
                <TableCell>
                  <strong>Column name</strong>
                </TableCell>
                <TableCell align="right">
                  <strong>Data type</strong>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {columns.map((col, idx: number) => {
                const typeArray = col.type;
                const type = Array.isArray(typeArray)
                  ? typeArray.find((t) => t !== 'null')
                  : typeArray;

                return (
                  <TableRow key={col.name || idx}>
                    <TableCell>
                      <Switch checked />
                    </TableCell>
                    <TableCell>{col.name}</TableCell>
                    <TableCell align="right">
                      {type === 'string' && <>ABC String</>}
                      {type === 'integer' && <># Integer</>}
                      {type === 'boolean' && <>✓ Boolean</>}
                      {/* Add other types as needed */}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Collapse>
    </Box>
  );
};

export default StreamTable;
