import React, { useEffect, useState } from 'react';
import useSWR from 'swr';
import moment from 'moment';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  TablePagination,
  Typography,
  Box,
  CircularProgress,
  Checkbox,
  Paper,
  IconButton,
} from '@mui/material';
import {
  ErrorOutline,
  KeyboardArrowDown,
  KeyboardArrowUp,
} from '@mui/icons-material';

interface Notification {
  id: number;
  urgent: boolean;
  author: string;
  message: string;
  read_status: boolean;
  timestamp: string;
}

const ManageNotifications = ({
  tabWord,
  checkedRows,
  setCheckedRows,
  mutateAllRow,
  setMutateAllRows,
}: any) => {
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  const handleRowClick = (id: number) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  const message_status = tabWord === 'read' ? 1 : tabWord === 'unread' ? 0 : '';
  const readQuery = tabWord === 'all' ? '' : `&read_status=${message_status}`;

  const { data, isLoading, mutate } = useSWR(
    `notifications/v1?limit=${pageSize}&page=${
      currentPageIndex + 1
    }${readQuery}`
  );

  useEffect(() => {
    if (data) {
      setTotalCount(data.total_notifications || 0);
    }
  }, [data]);

  useEffect(() => {
    if (mutateAllRow) {
      mutate();
      setMutateAllRows(false);
    }
  }, [mutateAllRow]);

  const handleCheckboxChange = (id: number) => {
    setCheckedRows((prevChecked: any) => {
      if (prevChecked.includes(id)) {
        return prevChecked.filter(
          (notificationId: number) => notificationId !== id
        );
      } else {
        return [...prevChecked, id];
      }
    });
  };

  const handleCheckUncheckAll = () => {
    if (data?.res.length === checkedRows.length) {
      setCheckedRows([]);
    } else {
      const allNotificationIds = data?.res.map(
        (notification: Notification) => notification.id
      );
      setCheckedRows(allNotificationIds);
    }
  };

  const handlePagination = (newPageIndex: number, newPageSize: number) => {
    setCurrentPageIndex(newPageIndex);
    setPageSize(newPageSize);
    mutate();
  };

  const truncateText = (text: string, length: number) => {
    return text.length > length ? `${text.slice(0, length)}...` : text;
  };
  if (isLoading) return <CircularProgress />;

  const showingNotificationCount = data?.res.length || 0;

  return (
    <Box sx={{ mt: 1.5 }}>
      <Box
        sx={{
          padding: '12px 1%',
          display: 'flex',
          justifyContent: 'flex-start',
          alignItems: 'center',
          gap: '2.5rem',
          backgroundColor: '#00897B0A',
        }}
      >
        <Checkbox
          checked={
            data?.res.length > 0 && data?.res.length === checkedRows.length
          }
          onChange={handleCheckUncheckAll}
        />
        <Typography sx={{fontWeight: 500, color: "#0F2440CC"}}>
          Select all <strong>|</strong> Showing {showingNotificationCount} of{' '}
          {data?.total_notifications || 0} notifications
        </Typography>
      </Box>
      <TableContainer
        component={Paper}
        sx={{
          borderRadius: '4px',
          overflowY: 'auto',
          height: '420px',
          flexGrow: 1,
          boxShadow: '0px 4px 8px 0px #00000014',
        }}
      >
        <Table
          sx={{
            minWidth: 650,
            borderCollapse: 'collapse',
          }}
        >
          <TableBody>
            {data?.res?.map((notification: Notification) => {
              const isMessageLong = notification.message.length > 100;

              return (
                <TableRow
                  key={notification.id}
                  sx={{
                    backgroundColor: 'inherit',
                    '&:hover': {
                      backgroundColor: '#F5FAFA',
                    },
                  }}
                >
                  <TableCell
                    sx={{
                      padding: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Checkbox
                      checked={checkedRows.includes(notification.id)}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleCheckboxChange(notification.id);
                      }}
                    />
                  </TableCell>

                  <TableCell
                    width={'90%'}
                    sx={{
                      p: 1.5,
                      whiteSpace: 'normal',
                      overflow: 'hidden',
                      textOverflow:
                        expandedRow === notification.id ? 'clip' : 'ellipsis',
                      maxWidth: '200px',
                      fontWeight: '600',
                      fontSize: '14px',
                      color: 'rgba(15, 36, 64, 0.8)',
                      transition: 'max-width 0.3s ease, white-space 0.3s ease',
                    }}
                  >
                    <Box display="flex" alignItems="center" gap={3}>
                      <Box
                        width="90%"
                        sx={{
                          color: notification.read_status
                            ? '#798696'
                            : '#0F2440E0',
                        }}
                      >
                        <Typography sx={{ fontWeight: 500, fontSize: '15px' }}>
                          {/* Truncate the text only when it's not expanded */}
                          {expandedRow === notification.id
                            ? notification.message
                            : truncateText(notification.message, 100)}
                        </Typography>
                        <Typography sx={{ fontWeight: 600, fontSize: '12px' }}>
                          {moment(new Date(notification.timestamp)).fromNow()}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>

                  <TableCell
                    sx={{
                      padding: '12px',
                      fontWeight: '600',
                      fontSize: '14px',
                      color: 'rgba(15, 36, 64, 0.8)',
                    }}
                  >
                    <Typography
                      color="primary"
                      variant="subtitle2"
                      sx={{
                        fontWeight: 600,
                        fontSize: 12,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {notification.urgent ? (
                        <ErrorOutline sx={{ color: 'red' }} />
                      ) : (
                        ''
                      )}
                    </Typography>
                  </TableCell>

                  {/* Display arrow icon within the same cell if the message is long */}
                  {isMessageLong ? (
                    <TableCell
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                      }}
                      onClick={() =>
                        isMessageLong && handleRowClick(notification.id)
                      }
                    >
                      <IconButton size="small">
                        {expandedRow === notification.id ? (
                          <KeyboardArrowUp
                            sx={{ transition: 'transform 0.3s ease' }}
                          />
                        ) : (
                          <KeyboardArrowDown
                            sx={{ transition: 'transform 0.3s ease' }}
                          />
                        )}
                      </IconButton>
                    </TableCell>
                  ) : (
                    <TableCell />
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination Component */}
      <TablePagination
        rowsPerPageOptions={[10, 20]}
        component="div"
        count={totalCount} // Total number of notifications
        rowsPerPage={pageSize}
        page={currentPageIndex}
        onPageChange={(e, newPage) => {
          handlePagination(newPage, pageSize);
        }}
        onRowsPerPageChange={(e) => {
          const newPageSize = parseInt(e.target.value, 10);
          setPageSize(newPageSize);
          setCurrentPageIndex(0); // Reset to first page when changing rows per page
          handlePagination(0, newPageSize);
        }}
      />
    </Box>
  );
};

export default ManageNotifications;
