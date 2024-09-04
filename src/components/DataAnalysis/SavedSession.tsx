import {
  Box,
  Dialog,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  Paper,
  TableHead,
  TableRow,
  Button,
  TablePagination,
} from '@mui/material';

import Image from 'next/image';
import InfoIcon from '@/assets/icons/info.svg';
import CloseIcon from "@/assets/icons/close_small.svg";
import ArrowIcon from "@/assets/icons/arrow_back_ios.svg"
import { useEffect, useState } from 'react';
import { httpGet } from '@/helpers/http';
import { useSession } from 'next-auth/react';



export const SavedSession = ({ open, onClose, handleEditSession }: { open: boolean, onClose: any, handleEditSession:any }) => {
  const {data: session} = useSession();
  const [pageSize, setPageSize] = useState(0);
  const [totalCount, setTotalCount] = useState(0); // Total count of rows
  const [pageCount, setPageCount] = useState(0); // Total number of pages
  const [currentPageIndex, setCurrentPageIndex] = useState(1); // Page index
  const [savedSessions, setSavedSession] = useState([]);

  useEffect(()=>{
  const getSavedSessions = async ()=>{
    const response = await httpGet(session, `warehouse/ask/sessions?limit=${10}&offset=${pageSize}`);
    console.log(response, "response");
    setSavedSession(response)
  }
  getSavedSessions();
  },[session])

  return (
    <>
      <Dialog
        onClose={onClose}
        aria-labelledby="simple-dialog-title"
        open={open}
        fullScreen
        PaperProps={{
          sx: {
            width: '70%',
            height: '80%',
            margin: 0,
            maxWidth: 'none',
            borderRadius: "12px",
            boxShadow: "0px 4px 8px 0px rgba(9, 37, 64, 0.08)"

          },
        }}
      >
        {/* MAIN BOX */}
        <Box
          sx={{
            width: '100%',
            padding: '2rem 1.75rem',
          }}
        >
          <Box
            sx={{
              width: '100%',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: "1rem"
            }}
          >
            <Box
              sx={{
                display: 'flex',
                gap: '0.2rem',
                justifyContent: 'center',
                alignItems: 'center',
                color: '#0F2440',
                fontWeight: 700,
                fontSize: '24px',
              }}
            >
              Saved Sessions
              <Image
                style={{ width: '1rem', height: '1rem' }}
                src={InfoIcon}
                alt="info icon"
              />
            </Box>
            <Image src={CloseIcon} style={{ cursor: "pointer" }} onClick={onClose} alt="close icon" />

          </Box>

          <TableContainer
            component={Paper}
            sx={{ borderRadius: '4px', overflow: 'hidden' }}
          >
            <Table
              sx={{ minWidth: 650, borderCollapse: 'collapse' }}
              aria-label="simple table"
            >
              <TableHead sx={{ backgroundColor: '#00897B' }}>
                <TableRow sx={{ padding: 0 }}>
                  <TableCell
                    sx={{
                      color: '#FFFFFF',
                      fontWeight: '700',
                      fontSize: '16px',
                      padding: '10px',
                      borderRadius: '4px 0 0 4px',
                      width: '5%',
                    }}
                  ></TableCell>
                  <TableCell
                    sx={{
                      color: '#FFFFFF',
                      fontWeight: '700',
                      fontSize: '16px',
                      padding: '10px',
                      width: '20%',
                    }}
                  >
                    Created On
                  </TableCell>
                  <TableCell
                    sx={{
                      color: '#FFFFFF',
                      fontWeight: '700',
                      fontSize: '16px',
                      padding: '10px',
                      width: '20%',
                    }}
                  >
                    Updated On
                  </TableCell>
                  <TableCell
                    sx={{
                      color: '#FFFFFF',
                      fontWeight: '700',
                      fontSize: '16px',
                      padding: '10px',
                      width: '25%',
                    }}
                  >
                    Name
                  </TableCell>
                  <TableCell
                    sx={{
                      color: '#FFFFFF',
                      fontWeight: '700',
                      fontSize: '16px',
                      padding: '10px',
                      borderRadius: '0 4px 4px 0',
                      width: '30%',
                    }}
                  >
                    Created By
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {savedSessions.map((row:any, idx) => (
                  <TableRow
                    key={row.session_id}
                    sx={{
                      '&:last-child td, &:last-child th': { border: 0 },
                      padding: 0,
                      position: 'relative',
                      '&:hover': {
                        borderColor: 'rgba(0, 137, 123, 0.04)',
                        backgroundColor: '#F5FAFA',
                      },
                      '&:hover .hover-button': {
                        visibility: 'visible',
                        border: 0,
                        backgroundColor: '#F5FAFA',
                        opacity: 1,
                      },
                      border: '1px solid transparent',
                    }}
                  >
                    <TableCell
                      sx={{
                        fontWeight: '700',
                        fontSize: '14px',
                        color: 'rgba(15, 36, 64, 0.8)',
                        padding: '12px',
                      }}
                    >
                      {idx}
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: '700',
                        fontSize: '14px',
                        color: 'rgba(15, 36, 64, 0.8)',
                        padding: '12px',
                        borderRaduis: "0"
                      }}
                    >
                      {row.createdOn}
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: '700',
                        fontSize: '14px',
                        color: 'rgba(15, 36, 64, 0.8)',
                        padding: '12px',
                      }}
                    >
                      {row.updatedOn}
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: '700',
                        fontSize: '14px',
                        color: 'rgba(15, 36, 64, 0.8)',
                        padding: '12px',
                      }}
                    >
                      {row.session_name}
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: '700',
                        fontSize: '14px',
                        color: 'rgba(15, 36, 64, 0.8)',
                        padding: '12px',
                        position: 'relative',
                      }}
                    >
                      {row.createdBy}
                      <Button
                        className="hover-button"
                        size="small"
                        sx={{
                          visibility: 'hidden',
                          opacity: 0,
                          transition: 'visibility 0s, opacity 0.3s linear',
                          position: 'absolute',
                          right: 16,
                          top: 8
                        }}
                        onClick={()=>{
                          handleEditSession({
                          prompt: row.response[0].prompt,
                          summary: row?.response[0]?.response,
                          oldSessionId: row.session_id,
                          session_status: row.session_status,
                          session_name: row.session_name,
                          sqlText: row?.request_meta?.sql,
                          taskId: row.request_uuid 
                        });
                        console.log(row.request_meta.sql, "meta")
                        onClose();
                        }
                      
                      }
                      >
                        OPEN    <Image src={ArrowIcon} alt="close icon" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}


              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
                rowsPerPageOptions={[5, 10, 25, 100]}
                component="div"
                count={totalCount}
                rowsPerPage={pageSize}
                page={currentPageIndex - 1}
                onPageChange={(e, newPage) => setCurrentPageIndex(newPage + 1)}
                onRowsPerPageChange={(e: any) => {
                  setPageSize(e.target.value);
                  setCurrentPageIndex(1);
                }}
              />
        </Box>
      </Dialog>
    </>
  );
};
