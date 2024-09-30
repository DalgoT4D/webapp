import { Box } from '@mui/material';
import { LogSummaryBlock } from './LogSummaryBlock';

export type LogSummary = {
  task_name: string;
  status: string;
  pattern?: string;
  log_lines: Array<string>;
  errors?: number;
  passed?: number;
  skipped?: number;
  warnings?: number;
  tests: Array<any>;
};

interface LogSummaryCardProps {
  logsummary: Array<LogSummary>;
  setLogsummaryLogs: any;
}

export const LogSummaryCard = ({ logsummary, setLogsummaryLogs }: LogSummaryCardProps) => {
  return (
    <Box>
      {logsummary.map((log: LogSummary, index: number) => (
        <LogSummaryBlock key={index} logsummary={log} setLogsummaryLogs={setLogsummaryLogs} />
      ))}
    </Box>
  );
};
