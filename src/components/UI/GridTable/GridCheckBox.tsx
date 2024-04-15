import {
  Checkbox,
  FormControlLabel,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { castGridStyles } from './GridTable';

interface GridTableProps {
  entities: string[];
  selectedEntities: string[];
  onSelect: (selected: string[]) => void;
  title: string;
}

export const GridTableCheckBox = ({
  title,
  entities,
  selectedEntities,
  onSelect,
}: GridTableProps) => {
  const handleSelect = (column: string) => {
    if (selectedEntities.includes(column)) {
      onSelect(selectedEntities.filter((col) => col !== column));
    } else {
      onSelect([...selectedEntities, column]);
    }
  };

  const handleSelectAll = () => {
    if (selectedEntities.length === entities.length) {
      onSelect([]);
    } else {
      onSelect(entities);
    }
  };

  return (
    <Table sx={castGridStyles.container}>
      <TableHead sx={castGridStyles.headerItem}>
        <TableRow>
          <TableCell
            sx={{
              padding: '12px 10px',
              width: `100%`,
              borderRight: '1px solid #E8E8E8',
              display: 'flex',
              alignItems: 'center',
            }}
            key={title}
          >
            <FormControlLabel
              control={
                <Checkbox
                  checked={selectedEntities.length === entities.length}
                  onChange={handleSelectAll}
                />
              }
              label=""
            />
            <Typography
              sx={{
                fontWeight: '600',
                fontSize: '14px',
              }}
            >
              {title}
            </Typography>
          </TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {entities?.map((entity, index) => (
          <TableRow key={index} sx={{ boxShadow: 'none' }}>
            <TableCell
              sx={{
                padding: '2px 10px',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                border: '1px solid #E8E8E8',
                borderTop: 'unset',
              }}
            >
              <FormControlLabel
                key={entity}
                control={
                  <Checkbox
                    checked={selectedEntities.includes(entity)}
                    onChange={() => handleSelect(entity)}
                  />
                }
                label=""
              />
              <Typography
                sx={{
                  fontWeight: '600',
                  fontSize: '14px',
                }}
              >
                {entity}
              </Typography>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
