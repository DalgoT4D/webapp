import { AnalysisContainer } from '@/components/DataAnalysis/v2DataAnalysis/AnalysisContainer';
import { PageHead } from '@/components/PageHead';
import { Box } from '@mui/material';

const AIDataAnalysis = () => {
  return (
    <>
      <PageHead title="Dalgo | AI Data Analysis" />
      <Box
        sx={{
          p: '3rem 3rem',
          width: '100%',
          display: 'flex',
          gap: '1rem',
          flexDirection: 'column',
        }}
      >
        <AnalysisContainer />
      </Box>
    </>
  );
};

export default AIDataAnalysis;
