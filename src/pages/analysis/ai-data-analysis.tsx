import { AnalysisContainer } from '@/components/DataAnalysis/v2DataAnalysis/AnalysisContainer';
import { PageHead } from '@/components/PageHead';
import { Box } from '@mui/material';

const AIDataAnalysis = () => {
  return (
    <>
      <PageHead title="Dalgo | AI Data Analysis" />
      <Box
        sx={{
          p: '3rem',
          flexGrow: 1,
          maxHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            width: '100%',
            flexGrow: 1,
            overflow: 'auto',
            whiteSpace: 'nowrap',
          }}
        >
          <AnalysisContainer />
        </Box>
      </Box>
    </>
  );
};

export default AIDataAnalysis;
