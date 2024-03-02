import { PageHead } from '@/components/PageHead';
import { httpGet } from '@/helpers/http';
import styles from '@/styles/Home.module.css';
import { Box, Grid, Typography, Button } from '@mui/material';
import { useSession } from 'next-auth/react';
import React, { useEffect, useState } from 'react';
import { ActionsMenu } from '../../components/UI/Menu/Menu';
import Image from 'next/image';
import Github from '@/assets/images/github_transform.png';
import UI from '@/assets/images/ui_transform.png';
import Link from 'next/link';

type TransformType = 'github' | 'ui';

const Transform = ({ transformType }: { transformType: TransformType }) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const open = Boolean(anchorEl);
  const handleClose = () => {
    setAnchorEl(null);
  };

  useEffect(() => {
    const fetchTransformType = async () => {
      try {
        const res = await httpGet(session, 'dbt/dbt_transform/');
        const { transform_type } = await res;
        console.log(transform_type);
        setIsLoading(false);
        return transform_type as TransformType;
      } catch (error) {
        console.error(error);
        setIsLoading(false);
        return null;
      }
    };

    if (session) {
        fetchTransformType().then((transformType) => {
          if (transformType === 'github') {
            window.location.href = '/pipeline/dbtsetup';
          } else if (transformType === 'ui') {
            window.location.href = '/pipeline/dbtsetup';
          } else {
            setIsLoading(false);
          }
        });
      }
    }, [session]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <ActionsMenu
        eleType="dbtworkspace"
        anchorEl={anchorEl}
        open={open}
        handleClose={handleClose}
      />
      <PageHead title="DDP: Transform" />
      <main className={styles.main}>
        <Typography sx={{ fontWeight: 700 }} variant="h4" gutterBottom color="#000">
          Transformation
        </Typography>
        <Typography sx={{ fontWeight: 400, marginBottom: '60px' }} variant="h6" gutterBottom color="#808080">
          Please select one method you would like to proceed with to setup
        </Typography>

        <Grid container spacing={2} columns={12}>
          <Grid item xs={6}>
            <Box
              height={550}
              bgcolor="white"
              color="grey"
              textAlign="left"
              lineHeight={2}
              display="flex"
              flexDirection="column"
              justifyContent="space-between"
              sx={{ padding: '30px', marginRight: '20px' }}
            >
              <Image src={Github} alt="github_transform" style={{ width: 'auto', height: '300px'}} />
              <Typography sx={{ fontWeight: 550 }} variant="h5" align="left" color="#000">
                Github Users <span>(for advanced users)</span>
              </Typography>
              <Typography sx={{ fontWeight: 400 }} variant="h6" gutterBottom color="#808080">
                Create a project to effortlessly integrate your dbt repository by providing your repository URL and
                authentication details in further steps
              </Typography>
              <Link href="/pipeline/dbtsetup?transform_type=github">
                <Button variant="contained" color="primary" sx={{ width: '100%' }}>
                  Setup using Github
                </Button>
              </Link>
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Box
              height={550}
              bgcolor="white"
              color="grey"
              textAlign="left"
              lineHeight={2}
              display="flex"
              flexDirection="column"
              justifyContent="space-between"
              sx={{ padding: '30px' }}
            >
              <Image src={UI} alt="ui_transform" style={{ width: 'auto', height: '300px'}} />
                <Typography sx={{ fontWeight: 600 }} variant="h5" gutterBottom align="left" color="#000">
                  UI Users <span>(for Non technical users)</span>
                </Typography>
                <Typography sx={{ fontWeight: 400 }} variant="h6" gutterBottom color="#808080">
                  Create a project to effortlessly integrate your dbt repository by providing your repository URL and
                  authentication details in further steps
                </Typography>
              <Link href="/pipeline/dbtsetup?transform_type=ui">
                <Button variant="contained" color="primary" sx={{ width: '100%' }}>
                  Setup using UI
                </Button>
              </Link>
            </Box>
          </Grid>
        </Grid>
      </main>
    </>
  );
};

export default Transform;
