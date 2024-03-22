import React, { useEffect, useState } from 'react';
import { PageHead } from '@/components/PageHead';
import { httpGet } from '@/helpers/http';
import styles from '@/styles/Home.module.css';
import { Box, Grid, Typography, Button } from '@mui/material';
import { useRouter } from 'next/router';
import { ActionsMenu } from '../../components/UI/Menu/Menu';
import Image from 'next/image';
import Github from '@/assets/images/github_transform.png';
import UI from '@/assets/images/ui_transform.png';
import { useSession } from 'next-auth/react';
import ConfirmationDialogTransform from '@/components/Dialog/ConfirmationDialogTransform';
import DBTTransformType from '@/components/DBT/DBTTransformType';

export type TransformType = 'github' | 'ui' | 'none' | null;

const Transform = () => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [confirmationOpen, setConfirmationOpen] = useState<boolean>(false);
  const [selectedTransform, setSelectedTransform] =
    useState<TransformType>(null);
  const router = useRouter();
  const { data: session } = useSession();

  const open = Boolean(anchorEl);

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSetup = (transformType: TransformType) => {
    setSelectedTransform(transformType);
    setConfirmationOpen(true);
  };

  console.log('selectedTransform:', selectedTransform);

  useEffect(() => {
    const fetchTransformType = async () => {
      try {
        const { transform_type } = await httpGet(session, 'dbt/dbt_transform/');

        return { transform_type: transform_type as TransformType };
      } catch (error) {
        console.error(error);
        throw error;
      }
    };

    interface TransformTypeResponse {
      transform_type: TransformType;
    }

    if (session) {
      fetchTransformType()
        .then((response: TransformTypeResponse) => {
          const transformType = response.transform_type;
          if (transformType === 'ui' || transformType === 'github')
            setSelectedTransform(transformType);
          else setSelectedTransform('none');
        })
        .catch((error) => {
          setSelectedTransform('none');
          console.error('Error fetching transform type:', error);
        });
    }
  }, [session]);

  return (
    <>
      <ActionsMenu
        eleType="dbtworkspace"
        anchorEl={anchorEl}
        open={open}
        handleClose={handleClose}
      />
      <ConfirmationDialogTransform
        open={confirmationOpen}
        handleClose={() => setConfirmationOpen(false)}
        transformType={selectedTransform}
      />

      <PageHead title="DDP: Transform" />
      <main className={styles.main}>
        {selectedTransform === 'none' ? (
          <Box>
            <Typography
              sx={{ fontWeight: 700 }}
              variant="h4"
              gutterBottom
              color="#000"
            >
              Transformation
            </Typography>
            <Typography
              sx={{ fontWeight: 400, marginBottom: '60px' }}
              variant="h6"
              gutterBottom
              color="#808080"
            >
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
                  sx={{ padding: '30px' }}
                >
                  <Image
                    src={UI}
                    alt="ui_transform"
                    style={{ width: 'auto' }}
                  />
                  <Typography
                    sx={{ fontWeight: 600 }}
                    variant="h5"
                    gutterBottom
                    align="left"
                    color="#000"
                  >
                    UI Users <span>(for Non technical users)</span>
                  </Typography>
                  <Typography
                    sx={{ fontWeight: 400 }}
                    variant="h6"
                    gutterBottom
                    color="#808080"
                  >
                    Create a project to effortlessly integrate your dbt
                    repository by providing your repository URL and
                    authentication details in further steps
                  </Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    sx={{ width: '100%' }}
                    onClick={() => handleSetup('ui')}
                  >
                    Setup using UI
                  </Button>
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
                  sx={{ padding: '30px', marginRight: '20px' }}
                >
                  <Image
                    src={Github}
                    alt="github_transform"
                    style={{ width: 'auto' }}
                  />
                  <Typography
                    sx={{ fontWeight: 550 }}
                    variant="h5"
                    align="left"
                    color="#000"
                  >
                    Github Users <span>(for advanced users)</span>
                  </Typography>
                  <Typography
                    sx={{ fontWeight: 400 }}
                    variant="h6"
                    gutterBottom
                    color="#808080"
                  >
                    Create a project to effortlessly integrate your dbt
                    repository by providing your repository URL and
                    authentication details in further steps
                  </Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    sx={{ width: '100%' }}
                    onClick={() => handleSetup('github')}
                  >
                    Setup using Github
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Box>
        ) : selectedTransform &&
          ['ui', 'github'].includes(selectedTransform) ? (
          <DBTTransformType
            transformType={selectedTransform}
          ></DBTTransformType>
        ) : (
          ''
        )}
      </main>
    </>
  );
};

export default Transform;
