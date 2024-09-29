import { Box, Button, Typography } from '@mui/material';

import { LogSummary } from './LogSummaryCard';

interface LogSummaryBlockProps {
  logsummary: LogSummary;
  setLogsummaryLogs: any;
}

const blockWidth = '400px';

const NameAndPatternBlock = ({
  logsummary,
  setLogsummaryLogs,
}: LogSummaryBlockProps) => {
  return (
    <>
      <Box
        sx={{
          display: 'flex',
          width: '100%',
          justifyContent: 'space-between',
          paddingLeft: '5px',
        }}
      >
        <Typography sx={{ fontWeight: 500, fontSize: 18 }}>
          {logsummary.task_name}
        </Typography>
        <Button
          variant="contained"
          onClick={() => setLogsummaryLogs(logsummary.log_lines)}
        >
          Logs
        </Button>
      </Box>
      <Typography sx={{ fontWeight: 300, fontSize: 14 }}>
        {logsummary.pattern}
      </Typography>
    </>
  );
};

const DbtRunBlock = ({
  logsummary,
  setLogsummaryLogs,
}: LogSummaryBlockProps) => {
  return (
    <>
      <Box
        sx={{
          display: 'flex',
          width: '100%',
          justifyContent: 'space-between',
          paddingLeft: '5px',
        }}
      >
        <Typography sx={{ fontWeight: 500, fontSize: 18 }}>
          {logsummary.task_name}
        </Typography>
        <Button
          variant="contained"
          onClick={() => setLogsummaryLogs(logsummary.log_lines)}
        >
          Logs
        </Button>
      </Box>
      <Box
        sx={{
          display: 'flex',
          width: '100%',
          justifyContent: 'space-between',
          paddingLeft: '5px',
        }}
      >
        <Typography sx={{ fontWeight: 300, fontSize: 14 }}>
          {String(logsummary.passed || 0)}
        </Typography>
        <Typography sx={{ fontWeight: 300, fontSize: 14 }}>passed</Typography>
      </Box>
      <Box
        sx={{
          display: 'flex',
          width: '100%',
          justifyContent: 'space-between',
          paddingLeft: '5px',
        }}
      >
        <Typography sx={{ fontWeight: 300, fontSize: 14 }}>
          {String(logsummary.errors || 0)}
        </Typography>
        <Typography sx={{ fontWeight: 300, fontSize: 14 }}>errors</Typography>
      </Box>
      <Box
        sx={{
          display: 'flex',
          width: '100%',
          justifyContent: 'space-between',
          paddingLeft: '5px',
        }}
      >
        <Typography sx={{ fontWeight: 300, fontSize: 14 }}>
          {String(logsummary.skipped || 0)}
        </Typography>
        <Typography sx={{ fontWeight: 300, fontSize: 14 }}>skipped</Typography>
      </Box>
      <Box
        sx={{
          display: 'flex',
          width: '100%',
          justifyContent: 'space-between',
          paddingLeft: '5px',
        }}
      >
        <Typography sx={{ fontWeight: 300, fontSize: 14 }}>
          {String(logsummary.warnings || 0)}
        </Typography>
        <Typography sx={{ fontWeight: 300, fontSize: 14 }}>warnings</Typography>
      </Box>
    </>
  );
};

const DbtTestBlock = ({
  logsummary,
  setLogsummaryLogs,
}: LogSummaryBlockProps) => {
  const summary = logsummary.tests.find(
    (test) => test.pattern === 'test-summary'
  );
  if (!summary) {
    return <></>;
  }
  return (
    <>
      <Box
        sx={{
          display: 'flex',
          width: '100%',
          justifyContent: 'space-between',
          paddingLeft: '5px',
        }}
      >
        <Typography sx={{ fontWeight: 500, fontSize: 18 }}>
          {logsummary.task_name}
        </Typography>
        <Button
          variant="contained"
          onClick={() => setLogsummaryLogs(logsummary.log_lines)}
        >
          Logs
        </Button>
      </Box>
      <Box
        sx={{
          display: 'flex',
          width: '100%',
          justifyContent: 'space-between',
          paddingLeft: '5px',
        }}
      >
        <Typography sx={{ fontWeight: 300, fontSize: 14 }}>
          {String(summary.passed || 0)}
        </Typography>
        <Typography sx={{ fontWeight: 300, fontSize: 14 }}>passed</Typography>
      </Box>
      <Box
        sx={{
          display: 'flex',
          width: '100%',
          justifyContent: 'space-between',
          paddingLeft: '5px',
        }}
      >
        <Typography sx={{ fontWeight: 300, fontSize: 14 }}>
          {String(summary.errors || 0)}
        </Typography>
        <Typography sx={{ fontWeight: 300, fontSize: 14 }}>errors</Typography>
      </Box>
      <Box
        sx={{
          display: 'flex',
          width: '100%',
          justifyContent: 'space-between',
          paddingLeft: '5px',
        }}
      >
        <Typography sx={{ fontWeight: 300, fontSize: 14 }}>
          {String(summary.skipped || 0)}
        </Typography>
        <Typography sx={{ fontWeight: 300, fontSize: 14 }}>skipped</Typography>
      </Box>
      <Box
        sx={{
          display: 'flex',
          width: '100%',
          justifyContent: 'space-between',
          paddingLeft: '5px',
        }}
      >
        <Typography sx={{ fontWeight: 300, fontSize: 14 }}>
          {String(summary.warnings || 0)}
        </Typography>
        <Typography sx={{ fontWeight: 300, fontSize: 14 }}>warnings</Typography>
      </Box>
    </>
  );
};

export const LogSummaryBlock = ({
  logsummary,
  setLogsummaryLogs,
}: LogSummaryBlockProps) => {
  let specialHandling = false;
  if (logsummary.task_name == 'dbt run' && logsummary.status == 'success') {
    specialHandling = true;
  }
  if (logsummary.task_name == 'dbt test' && logsummary.status == 'failed') {
    specialHandling = true;
  }
  return (
    <Box
      sx={{
        borderWidth: '3px',
        borderStyle: 'solid',
        borderColor: logsummary.status == 'success' ? '#00897B' : '#C15E5E',
        borderRadius: '8px',
        padding: '4px',
        marginBottom: '10px',
        width: blockWidth,
        textAlign: 'left',
      }}
    >
      {logsummary.task_name == 'dbt run' && logsummary.status == 'success' && (
        <DbtRunBlock
          logsummary={logsummary}
          setLogsummaryLogs={setLogsummaryLogs}
        />
      )}
      {logsummary.task_name == 'dbt test' && logsummary.status == 'failed' && (
        <DbtTestBlock
          logsummary={logsummary}
          setLogsummaryLogs={setLogsummaryLogs}
        />
      )}
      {!specialHandling && (
        <NameAndPatternBlock
          logsummary={logsummary}
          setLogsummaryLogs={setLogsummaryLogs}
        />
      )}
    </Box>
  );
};
