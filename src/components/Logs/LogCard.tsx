import * as React from 'react';
import { Box, Button, Card, CardActions, CardContent, Collapse, IconButton } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

export type FlowRunLogMessage = {
  message: string;
};

interface LogCardProps {
  expand: boolean;
  logs: Array<string | FlowRunLogMessage>;
  setExpand: (...args: any) => any;
  fetchMore?: boolean;
  fetchMoreLogs?: () => void;
}

export const LogCard = ({
  expand,
  setExpand,
  logs,
  fetchMore = false,
  fetchMoreLogs = () => {},
}: LogCardProps) => {
  return (
    <Card
      sx={{
        gap: '10px',
        display: 'flex',
        flexDirection: 'column',
        marginTop: '10px',
        paddingLeft: '4px',
        paddingTop: '10px',
        paddingBottom: '20px',
        borderRadius: '8px',
        color: '#092540',
        width: '100%',
        wordWrap: 'anywhere',
        border: '1px solid #e0e0e0',
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
          <CardContent data-testid="logmessages">
            {logs?.map((log: any, idx) => (
              <Box className="color-on-hover" key={idx}>
                - {log?.message || log}
              </Box>
            ))}
            {fetchMore && (
              <Button data-testid="offset" onClick={fetchMoreLogs}>
                Fetch more
              </Button>
            )}
          </CardContent>
        }
      </Collapse>
    </Card>
  );
};
