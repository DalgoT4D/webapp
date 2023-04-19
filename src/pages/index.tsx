import { Typography } from '@mui/material';
import { PageHead } from '@/components/PageHead';

export default function Home() {
  return (
    <>
      <PageHead title="Development Data Platform" />
      <Typography variant="h1" gutterBottom color="primary.main">
        DDP platform
      </Typography>
    </>
  );
}
