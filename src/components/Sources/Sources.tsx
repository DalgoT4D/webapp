import { useState, useContext, useMemo, useEffect } from 'react';
import useSWR from 'swr';
import { CircularProgress, Box, Button, Typography } from '@mui/material';
import { List } from '../List/List';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import { useSession } from 'next-auth/react';
import { httpDelete, httpGet } from '@/helpers/http';
import SourceForm from './SourceForm';
import ConfirmationDialog from '../Dialog/ConfirmationDialog';
import connectionIcon from '@/assets/icons/connection.svg';
import { errorToast, successToast } from '../ToastMessage/ToastHelper';
import { GlobalContext } from '@/contexts/ContextProvider';
import Image from 'next/image';
import { ActionsMenu } from '../UI/Menu/Menu';

const headers = {
  values: ['Source details', 'Type'],
  sortable: [true, false],
};

interface SourceDefinitionsApiResponse {
  sourceDefinitionId: string;
  name: string;
  sourceType: string;
  releaseStage: string;
  protocolVersion: string;
  maxSecondsBetweenMessages: number;
  documentationUrl: string;
  dockerRepository: string;
  dockerImageTag: string;
}

type AutoCompleteOption = {
  id: string;
  label: string;
  dockerRepository: string;
  dockerImageTag: string;
  tag: string;
};

export const Sources = () => {
  const { data: session }: any = useSession();
  const globalContext = useContext(GlobalContext);
  const [loading, setLoading] = useState<boolean>(false);
  const [sourceDefs, setSourceDefs] = useState<Array<AutoCompleteOption>>([]);

  const { data, isLoading, mutate } = useSWR(`airbyte/sources`);

  const [showSourceDialog, setShowSourceDialog] = useState<boolean>(false);
  const [showConfirmDeleteDialog, setShowConfirmDeleteDialog] = useState<boolean>(false);
  const [sourceIdToEdit, setSourceIdToEdit] = useState<string>('');
  const [sourceToBeDeleted, setSourceToBeDeleted] = useState<any>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [deleteSourceLoading, setDeleteSourceLoading] = useState(false);

  const permissions = globalContext?.Permissions.state || [];
  const handleEditSource = () => {
    handleClose();
    setShowSourceDialog(true);
  };

  const open = Boolean(anchorEl);
  const handleClick = (sourceId: string, event: HTMLElement | null) => {
    setSourceIdToEdit(sourceId);
    setSourceToBeDeleted(sourceId);
    setAnchorEl(event);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  let rows = [];
  let rowValues = [];

  rowValues = useMemo(() => {
    if (data && data.length >= 0) {
      return data.map((source: any) => [source.name, source.sourceName]);
    }
    return [];
  }, [data, sourceDefs]);

  rows = useMemo(() => {
    if (data && data.length >= 0) {
      return data.map((source: any, idx: number) => [
        <Box key={idx} sx={{ display: 'flex', alignItems: 'center' }}>
          <Image style={{ marginRight: 10 }} src={connectionIcon} alt="connection icon" />
          <Typography variant="body1" fontWeight={600}>
            {source.name}
          </Typography>
        </Box>,
        <Typography key={source.sourceName} variant="subtitle2" fontWeight={600}>
          {source.sourceName}
          <br />
          <Typography variant="subtitle2" fontWeight={400}>
            {sourceDefs?.map((item) =>
              item?.id == source?.sourceDefinitionId ? `${item.dockerRepository}:${item?.tag}` : ''
            )}
          </Typography>
        </Typography>,
        <Box sx={{ justifyContent: 'end', display: 'flex' }} key={'box-' + idx}>
          <Button
            aria-controls={open ? 'basic-menu' : undefined}
            aria-haspopup="true"
            aria-expanded={open ? 'true' : undefined}
            onClick={(event) =>
              globalContext?.CurrentOrg.state.is_demo
                ? {}
                : handleClick(source.sourceId, event.currentTarget)
            }
            variant="contained"
            key={'menu-' + idx}
            color="info"
            sx={{ px: 0, minWidth: 32 }}
          >
            <MoreHorizIcon />
          </Button>
        </Box>,
      ]);
    }
    return [];
  }, [data, sourceDefs]);

  const handleClickOpen = () => {
    setShowSourceDialog(true);
  };

  const handleDeleteSource = () => {
    handleClose();
    setShowConfirmDeleteDialog(true);
  };

  const handleCancelDeleteSource = () => {
    setSourceToBeDeleted(null);
    setShowConfirmDeleteDialog(false);
  };

  const deleteSource = async (sourceId: any) => {
    try {
      setDeleteSourceLoading(true);
      const response = await httpDelete(session, `airbyte/sources/${sourceId}`);
      if (response.success) {
        successToast('Source deleted', [], globalContext);
        mutate();
      } else {
        errorToast('Something went wrong. Please try again', [], globalContext);
      }
    } catch (err: any) {
      console.error(err);
      errorToast(err.message, [], globalContext);
    } finally {
      setDeleteSourceLoading(false);
    }
    handleCancelDeleteSource();
  };

  const fetchSourceDefinitions = async () => {
    setLoading(true);
    try {
      const data: Array<SourceDefinitionsApiResponse> = await httpGet(
        session,
        'airbyte/source_definitions'
      );
      const sourceDefRows: AutoCompleteOption[] = data?.map(
        (element: SourceDefinitionsApiResponse) => {
          return {
            label: element.name,
            id: element.sourceDefinitionId,
            dockerRepository: element.dockerRepository,
            dockerImageTag: element.dockerImageTag,
            tag: element?.dockerImageTag,
          } as AutoCompleteOption;
        }
      );
      setSourceDefs(sourceDefRows);
    } catch (err: any) {
      console.error(err);
      errorToast(err.message, [], globalContext);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (session) {
      fetchSourceDefinitions();
    }
  }, [session]);

  if (isLoading) {
    return <CircularProgress />;
  }

  return (
    <>
      <ActionsMenu
        eleType="source"
        anchorEl={anchorEl}
        hasEditPermission={permissions.includes('can_edit_source')}
        hasDeletePermission={permissions.includes('can_delete_source')}
        open={open}
        handleClose={handleClose}
        handleEdit={handleEditSource}
        handleDelete={handleDeleteSource}
      />

      <SourceForm
        mutate={mutate}
        loading={loading}
        setLoading={setLoading}
        sourceDefs={sourceDefs}
        showForm={showSourceDialog}
        setShowForm={setShowSourceDialog}
        sourceId={sourceIdToEdit}
      />
      <List
        hasCreatePermission={permissions.includes('can_create_source')}
        openDialog={() => {
          setSourceIdToEdit('');
          setSourceToBeDeleted(null);
          handleClickOpen();
        }}
        title="Source"
        headers={headers}
        rows={rows}
        rowValues={rowValues}
      />
      <ConfirmationDialog
        loading={deleteSourceLoading}
        show={showConfirmDeleteDialog}
        handleClose={() => handleCancelDeleteSource()}
        handleConfirm={() => deleteSource(sourceToBeDeleted)}
        message="This will delete the source permanentely and remove from the listing. It will also delete any connections related to it."
      />
    </>
  );
};
