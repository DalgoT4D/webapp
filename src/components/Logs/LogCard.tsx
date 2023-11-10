import * as React from 'react';
import {
  Box,
  Card,
  CardActions,
  CardContent,
  Collapse,
  IconButton,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

interface LogCardPropss {
  expand: boolean;
  logs: Array<string>;
  setExpand: (...args: any) => any;
}

export const LogCard = ({ expand, setExpand, logs }: LogCardPropss) => {
  return (
    <Card
      sx={{
        marginTop: '10px',
        padding: '4px',
        borderRadius: '8px',
        color: '#092540',
      }}
    >
      <CardActions sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Box>Logs</Box>
        <IconButton onClick={() => setExpand(!expand)}>
          <ExpandMoreIcon
            sx={{
              transform: !expand ? 'rotate(0deg)' : 'rotate(180deg)',
            }}
          />
        </IconButton>
      </CardActions>
      <Collapse in={expand} unmountOnExit>
        {
          <CardContent>
            {logs?.map((logMessage: string, idx) => (
              <Box key={idx}>{logMessage}</Box>
            ))}
          </CardContent>
        }
      </Collapse>
    </Card>
  );
};
