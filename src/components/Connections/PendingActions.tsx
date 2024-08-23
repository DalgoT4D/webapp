import React, { useState, useEffect } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Typography,
  Button,
  Box,
} from '@mui/material';
import connectionIcon from '@/assets/icons/connection.svg';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { httpGet } from '@/helpers/http';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import SchemaChangeDetailsForm from './SchemaChangeDetailsForm';

const PendingActionsAccordion = () => {
  const [schemaChangeData, setSchemaChangeData] = useState<any[]>([]);
  const [openPopup, setOpenPopup] = useState(false);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string>('');
  const [connectionNameMap, setConnectionNameMap] = useState<
    Record<string, string>
  >({});
  const { data: session }: any = useSession();

  const handleViewClick = (connectionId: string) => {
    setSelectedConnectionId(connectionId);
    setOpenPopup(true);
  };

  const fetchData = async () => {
    try {
      const schemaChangeResponse = await httpGet(
        session,
        'airbyte/v1/connection/schema_change'
      );
      setSchemaChangeData(schemaChangeResponse);

      const connectionDataResponse = await httpGet(
        session,
        'airbyte/v1/connections'
      );
      const connectionMap: Record<string, string> = {};
      connectionDataResponse.forEach((connection: any) => {
        connectionMap[connection.connectionId] = connection.name;
      });
      setConnectionNameMap(connectionMap);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if(session){
      fetchData();
    }
  }, [session]);

  if (!schemaChangeData || schemaChangeData.length === 0) {
    return null;
  }

  return (
    <>
      <Accordion sx={{ marginBottom: '16px' }}>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel1a-content"
          id="panel1a-header"
        >
          <Typography variant="h6" fontWeight={800}>
            Pending Actions ({schemaChangeData.length})
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ width: '100%' }}>
            {schemaChangeData.map((schemaChange: any, index: number) => {
              const connectionId = schemaChange.connection_id;
              const connectionName = connectionNameMap[connectionId];
              const schemaChangeType = schemaChange.change_type;

              const labelStyles = {
                color: schemaChangeType === 'breaking' ? 'white' : '#D35D5D',
                backgroundColor:
                  schemaChangeType === 'breaking' ? '#D35D5D' : 'transparent',
                border: `1px solid #D35D5D`,
                borderRadius: '3px',
                padding: '2px 6px',
                fontSize: '0.6rem',
                fontWeight: 'bold',
              };

              return (
                <Box
                  key={index}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '20px',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Image
                      style={{ marginRight: 10 }}
                      src={connectionIcon}
                      alt="connection icon"
                    />
                    <Typography variant="body1" fontWeight={800}>
                      {connectionName} &nbsp;&nbsp;&nbsp;
                      {schemaChangeType && (
                        <Typography component="span" sx={labelStyles}>
                          {schemaChangeType === 'breaking'
                            ? 'Breaking'
                            : 'Updates'}
                        </Typography>
                      )}
                    </Typography>
                  </Box>
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 'bold' }}
                  ></Typography>
                  <Button
                    variant="outlined"
                    onClick={() => handleViewClick(connectionId)}
                  >
                    View
                  </Button>
                </Box>
              );
            })}
          </Box>
        </AccordionDetails>
      </Accordion>
      <Dialog open={openPopup} onClose={() => setOpenPopup(false)}>
        <DialogContent>
          <SchemaChangeDetailsForm
            setConnectionId={setSelectedConnectionId}
            connectionId={selectedConnectionId}
            mutate={() => {}}
            showForm={openPopup}
            setShowForm={setOpenPopup}
            fetchPendingActions={fetchData}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PendingActionsAccordion;
