import React, { useContext, useEffect, useState } from 'react';
import { PageHead } from '@/components/PageHead';
import { httpGet, httpPost, httpDelete } from '@/helpers/http';
import styles from '@/styles/Home.module.css';
import { Box, Grid, Typography, Button } from '@mui/material';
import { ActionsMenu } from '../../components/UI/Menu/Menu';
import Image from 'next/image';
import Github from '@/assets/images/github_transform.png';
import UI from '@/assets/images/ui_transform.png';
import { useSession } from 'next-auth/react';
import DBTTransformType from '@/components/DBT/DBTTransformType';
import ConfirmationDialog from '@/components/Dialog/ConfirmationDialog';
import { errorToast } from '@/components/ToastMessage/ToastHelper';
import { GlobalContext } from '@/contexts/ContextProvider';

export type TransformType = 'github' | 'ui' | 'none' | null;

interface TransformTypeResponse {
  transform_type: TransformType;
}

export const fetchTransformType = async (session: any) => {
  try {
    const { transform_type } = await httpGet(session, 'dbt/dbt_transform/');

    return { transform_type: transform_type as TransformType };
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const Transform = () => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [confirmationOpen, setConfirmationOpen] = useState<boolean>(false);
  const [transformClickedOn, setTransformClickedOn] = useState<TransformType>('none');
  const [selectedTransform, setSelectedTransform] = useState<TransformType>(null);
  const [dialogLoader, setDialogLoader] = useState<boolean>(false);
  const { data: session } = useSession();
  const globalContext = useContext(GlobalContext);
  const permissions = globalContext?.Permissions.state || [];

  const open = Boolean(anchorEl);
  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSetup = (transformType: TransformType) => {
    setTransformClickedOn(transformType);
    setConfirmationOpen(true);
  };

  useEffect(() => {
    if (session) {
      fetchTransformType(session)
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

  const handleSelectTransformTypeConfirm = async () => {
    setDialogLoader(true);
    if (transformClickedOn === 'ui') {
      try {
        // setup local project
        await httpPost(session, 'transform/dbt_project/', {
          default_schema: 'intermediate',
        });

        // create system transform tasks
        await httpPost(session, `prefect/tasks/transform/`, {});

        // hit sync sources api
        await httpPost(session, `transform/dbt_project/sync_sources/`, {});

        setSelectedTransform('ui');
      } catch (err: any) {
        console.error('Error occurred while setting up:', err);
        if (err.cause) {
          errorToast(err.cause.detail, [], globalContext);
        } else {
          errorToast(err.message, [], globalContext);
        }
        // roll back the changes
        await httpDelete(session, 'transform/dbt_project/dbtrepo');
      }
    } else if (transformClickedOn === 'github') {
      setSelectedTransform('github');
    }
    // close the dialogx
    setConfirmationOpen(false);
    setDialogLoader(false);
  };

  return (
    <>
      <ActionsMenu
        eleType="dbtworkspace"
        anchorEl={anchorEl}
        open={open}
        handleClose={handleClose}
      />

      <ConfirmationDialog
        loading={dialogLoader}
        show={confirmationOpen}
        handleClose={() => setConfirmationOpen(false)}
        handleConfirm={handleSelectTransformTypeConfirm}
        message={`You have opted to continue using the ${
          transformClickedOn === 'ui' ? 'UI' : 'GitHub'
        } method to
        set up your transformation`}
      />

      <PageHead title="Dalgo | Transform" />
      <main className={styles.main}>
        {selectedTransform === 'none' ? (
          <Box>
            <Typography sx={{ fontWeight: 700 }} variant="h4" gutterBottom color="#000">
              Transformation
            </Typography>
            <Typography
              sx={{ fontWeight: 400, marginBottom: '40px' }}
              variant="h6"
              gutterBottom
              color="#808080"
            >
              Please select one method you would like to proceed with:
            </Typography>

            <Grid container spacing={2} columns={12}>
              <Grid item xs={12} md={6}>
                <Box
                  height="450px"
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
                    style={{
                      height: '60%',
                      width: 'auto',
                    }}
                  />
                  <Typography sx={{ fontWeight: 600 }} variant="h5" align="left" color="#000">
                    UI Users <span style={{ color: 'grey' }}>(Click and Configure)</span>
                  </Typography>
                  <Typography
                    sx={{ fontWeight: 400, marginBottom: '10px' }}
                    variant="body1"
                    color="#808080"
                  >
                    Use the UI to build your transformation workflow using a simple and intuitive
                    user interface.
                  </Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    sx={{ width: '100%' }}
                    onClick={() => handleSetup('ui')}
                    disabled={!permissions.includes('can_create_dbt_workspace')}
                  >
                    Setup using UI
                  </Button>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box
                  height="450px"
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
                    src={Github}
                    alt="github_transform"
                    style={{
                      height: '60%',
                      width: 'auto',
                    }}
                  />
                  <Typography sx={{ fontWeight: 600 }} variant="h5" align="left" color="#000">
                    Github Users <span style={{ color: 'grey' }}>(Code)</span>
                  </Typography>
                  <Typography
                    sx={{ fontWeight: 400 }}
                    variant="body1"
                    color="#808080"
                    style={{
                      maxHeight: '40%',
                      overflowY: 'auto',
                      marginBottom: '10px',
                    }}
                  >
                    Create a project to integrate your dbt repository by providing your repository
                    URL and authentication details.
                  </Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    sx={{ width: '100%' }}
                    onClick={() => handleSetup('github')}
                    disabled={!permissions.includes('can_create_dbt_workspace')}
                  >
                    Setup using Github
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Box>
        ) : selectedTransform && ['ui', 'github'].includes(selectedTransform) ? (
          <DBTTransformType transformType={selectedTransform}></DBTTransformType>
        ) : (
          ''
        )}
      </main>
    </>
  );
};

export default Transform;
