import { Box } from '@mui/material';
import {LogSummaryBlock} from "./LogSummaryBlock"

export type LogSummary = {
  task_name: string;
  status: string;
  pattern?: string;
  log_lines: Array<string>;
  errors?: Number;
  passed?: Number;
  skipped?: Number;
  warnings?: Number;
  tests: Array<any>;
};

interface LogSummaryCardProps {
  logsummary: Array<LogSummary>;
  setLogsummaryLogs: any;
}

export const LogSummaryCard = ({logsummary, setLogsummaryLogs}: LogSummaryCardProps) => {

  return (
    <Box>
      {logsummary.map((log: LogSummary) => (
        <LogSummaryBlock logsummary={log} setLogsummaryLogs={setLogsummaryLogs} />
      ))}
    </Box>
  )
};