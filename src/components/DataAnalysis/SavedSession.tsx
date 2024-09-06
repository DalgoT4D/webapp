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
  Tooltip,
  Button,
  TablePagination,
  CircularProgress,
  Typography,
} from '@mui/material';

import Image from 'next/image';
import InfoIcon from '@/assets/icons/info.svg';
import CloseIcon from '@mui/icons-material/Close';
import ArrowIcon from '@/assets/icons/arrow_back_ios.svg';
import { memo, useContext, useEffect, useState } from 'react';
import { httpGet } from '@/helpers/http';
import { useSession } from 'next-auth/react';
import moment from 'moment';
import { errorToast } from '../ToastMessage/ToastHelper';
import { GlobalContext } from '@/contexts/ContextProvider';

export const SavedSession = memo(
  ({
    open,
    onClose,
    handleEditSession,
  }: {
    open: boolean;
    onClose: any;
    handleEditSession: any;
  }) => {
    const { data: session } = useSession();
    const globalContext = useContext(GlobalContext);
    const [pageSize, setPageSize] = useState(5); // Default rows per page
    const [totalCount, setTotalCount] = useState(0); // Total count of rows
    const [currentPageIndex, setCurrentPageIndex] = useState(0); // Page index starts from 0
    const [savedSessions, setSavedSession] = useState([]);
    const [loading, setLoading] = useState(false);
    const [activeRow, setActiveRow] = useState<string | null>(null); // State to track the clicked row

    const getSavedSessions = async (pageIndex: number, rowsPerPage: number) => {
      setLoading(true);
      try {
        const offset = pageIndex * rowsPerPage;
        const response = await httpGet(
          session,
          `warehouse/ask/sessions?limit=${rowsPerPage}&offset=${offset}`
        );
        console.log(response, 'response');
        if (!response.rows) {
          errorToast('Something went wrong', [], globalContext);
          return;
        }
        setSavedSession(response.rows);
        setTotalCount(response.total_rows);
      } catch (error: any) {
        console.log(error);
        errorToast(error.message, [], globalContext);
      } finally {
        setLoading(false);
      }
    };

    useEffect(() => {
      if (session) {
        getSavedSessions(currentPageIndex, pageSize);
      }
    }, [session, currentPageIndex, pageSize]);

    const handlePagination = (newPageIndex: number, newPageSize: number) => {
      setCurrentPageIndex(newPageIndex);
      getSavedSessions(newPageIndex, newPageSize);
    };

    const formatDate = (date: string) => {
      return moment(date).format('MMM DD, YYYY');
    };

    const trimText = (text: string, maxLength: number) => {
      if (text.length > maxLength) {
        return `${text.substring(0, maxLength)}...`;
      }
      return text;
    };

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
              borderRadius: '12px',
              boxShadow: '0px 4px 8px 0px rgba(9, 37, 64, 0.08)',
            },
          }}
        >
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
                marginBottom: '1rem',
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
              <CloseIcon onClick={onClose} sx={{ cursor: 'pointer' }} />
            </Box>
            <TableContainer
              component={Paper}
              sx={{
                borderRadius: '4px',
                overflowY: 'auto',
                height: '400px',
                flexGrow: 1,
              }}
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
                        width: '15%',
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
                        width: '15%',
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
                        width: '10%',
                      }}
                    >
                      Status
                    </TableCell>
                    <TableCell
                      sx={{
                        color: '#FFFFFF',
                        fontWeight: '700',
                        fontSize: '16px',
                        padding: '10px',
                        borderRadius: '0 4px 4px 0',
                        width: '40%',
                      }}
                    >
                      Created By
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <CircularProgress />
                  ) : (
                    savedSessions?.map((row: any, idx) => (
                      <TableRow
                        key={row.session_id}
                        sx={{
                          padding: 0,
                          position: 'relative',
                          backgroundColor:
                            activeRow === row.session_id
                              ? '#E0F7FA'
                              : 'inherit',
                          '&:hover': {
                            backgroundColor: '#F5FAFA',
                          },
                          '&:hover .hover-button': {
                            visibility: 'visible',
                            opacity: 1,
                          },
                          border: 'none',
                          boxShadow: 'none',
                        }}
                        onClick={() => setActiveRow(row.session_id)}
                      >
                        <TableCell
                          sx={{
                            fontWeight: '600',
                            fontSize: '14px',
                            color: 'rgba(15, 36, 64, 0.8)',
                            padding: '12px',
                          }}
                        >
                          {idx + 1 + currentPageIndex * pageSize}
                        </TableCell>
                        <TableCell
                          sx={{
                            fontWeight: '600',
                            fontSize: '14px',
                            color: 'rgba(15, 36, 64, 0.8)',
                            padding: '12px',
                          }}
                        >
                          {formatDate(row.created_at)}
                        </TableCell>
                        <TableCell
                          sx={{
                            fontWeight: '600',
                            fontSize: '14px',
                            color: 'rgba(15, 36, 64, 0.8)',
                            padding: '12px',
                          }}
                        >
                          {formatDate(row.updated_at)}
                        </TableCell>
                        <TableCell
                          sx={{
                            fontWeight: '600',
                            fontSize: '14px',
                            color: 'rgba(15, 36, 64, 0.8)',
                            padding: '12px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            maxWidth: '200px',
                          }}
                        >
                          <Tooltip title={row.session_name}>
                            <span>{trimText(row.session_name, 30)}</span>
                          </Tooltip>
                        </TableCell>
                        <TableCell
                          sx={{
                            fontWeight: '600',
                            fontSize: '14px',
                            color: 'rgba(15, 36, 64, 0.8)',
                            padding: '12px',
                          }}
                        >
                          {row.session_status}
                        </TableCell>
                        <TableCell
                          sx={{
                            fontWeight: '600',
                            fontSize: '14px',
                            color: 'rgba(15, 36, 64, 0.8)',
                            padding: '12px',
                            position: 'relative',
                          }}
                        >
                          {row.created_by.email}
                          <Button
                            className="hover-button"
                            size="small"
                            sx={{
                              visibility: 'hidden',
                              opacity: 0,
                              transition: 'visibility 0s, opacity 0.3s',
                              position: 'absolute',
                              right: 16,
                              top: 8,
                            }}
                            onClick={() => {
                              handleEditSession({
                                prompt: row.response[0].prompt,
                                summary: row?.response[0]?.response,
                                oldSessionId: row.session_id,
                                session_status: row.session_status,
                                session_name: row.session_name,
                                sqlText: row?.request_meta?.sql,
                                taskId: row.request_uuid,
                              });
                              onClose();
                            }}
                          >
                            OPEN <Image src={ArrowIcon} alt="close icon" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            {!!savedSessions.length && (
              <TablePagination
                rowsPerPageOptions={[5, 10]}
                component="div"
                count={totalCount}
                rowsPerPage={pageSize}
                page={currentPageIndex}
                onPageChange={(e, newPage) => {
                  handlePagination(newPage, pageSize);
                }}
                onRowsPerPageChange={(e: any) => {
                  const newPageSize = parseInt(e.target.value, 10);
                  setPageSize(newPageSize);
                  setCurrentPageIndex(0);
                  handlePagination(0, newPageSize);
                }}
              />
            )}
          </Box>
        </Dialog>
      </>
    );
  }
);

SavedSession.displayName = 'Saved-Session';
