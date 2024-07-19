import { Box } from '@mui/material';

import { LLMSummary } from '@/components/DataAnalysis/LLMSummary';
import { SqlWrite } from '@/components/DataAnalysis/SqlWrite';
export default function DataAnalysis() {
  return (
    <>
      <Box // main box
        sx={{
          p: '3rem 3rem',
          width: '100%',
          display: 'flex',
          gap: '1rem',
        }}
      >
        {/* Sql filter */}
        <SqlWrite />
        {/* LLM summary  */}
        <LLMSummary />
      </Box>
    </>
  );
}

