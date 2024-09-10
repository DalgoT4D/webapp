import React, { useContext, useState } from 'react';
import useSWR from 'swr';
import moment from 'moment';
import { httpPut } from '@/helpers/http';
// import axios from 'axios';
import { ErrorOutline } from '@mui/icons-material';
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
} from '@mui/material';

interface Notification {
  id: number;
  urgent: boolean;
  author: string;
  message: string;
  read_status: boolean;
  timestamp: string;
}

const ManageNotifications = ({ tabWord, checkedRows, setCheckedRows }: any) => {
  console.log(tabWord, 'tabwordddd');
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(25);
  const message_status = tabWord === 'read' ? 1 : tabWord === 'unread' ? 0 : '';
  const { isLoading, mutate } = useSWR(
    `notifications/?page=${
      page + 1
    }&limit=${limit}&read_status=${message_status}`
  );

  const handlePageChange = (event: any, value: number) => {
    setPage(value);
  };

  const handleLimitChange = (event: any) => {
    setLimit(event.target.value);
    setPage(0);
  };

  const handleCheckboxChange = (id: string) => {
    setCheckedRows((prevChecked: any) => {
      if (prevChecked.includes(id)) {
        return prevChecked.filter((notificationId) => notificationId !== id);
      } else {
        return [...prevChecked, id];
      }
    });
  };
  const handleCheckUncheckAll = () => {
  
    if(data.res.length === checkedRows.length){
        setCheckedRows([]);
        return;
    }
    const allNotificationIds = data.res.map((notification: any) => notification.id);
    setCheckedRows(allNotificationIds);
  };
  console.log(checkedRows, "checkreows")
  console.log(checkedRows)
  console.log(data.res.length === checkedRows, "yesorno")
  if (isLoading) return <CircularProgress />;

  return (
    <Box sx={{ mt: 4 }}>
      <TableContainer>
        <Box sx={{paddingLeft: "1rem",display:"flex" ,justifyContent:"flex-start", alignItems: "center", gap: "2.5rem"}} >
            <Checkbox
            checked={data.res.length === checkedRows.length}
            onChange={handleCheckUncheckAll}
            />
            <Typography>
            Showing 06 of 40 notifications
            </Typography>
        </Box>
        <Table>
          <TableBody>
            {data?.res?.map((notification: any) => (
              <TableRow
                key={notification.id}
                sx={{
                //   backgroundColor:
                //     notification.urgent && !notification.read_status
                //       ? '#ffebee'
                //       : 'inherit',
                }}
              >
                <TableCell sx={{display: "flex", alignItems:"center"}}>
                  <Checkbox
                    checked={checkedRows.includes(notification.id)}
                    onChange={() => handleCheckboxChange(notification.id)}
                  />
                {notification.urgent ?<ErrorOutline  sx={{color: "red"}}/> :""}
                </TableCell>
                
               
                <TableCell width={'90%'} sx={{ p: 1.5 }}>
                  <Box display="flex" alignItems="center" gap={3}>
                    <Box
                    //   sx={{
                    //     width: 6,
                    //     height: 6,
                    //     backgroundColor: notification.read_status
                    //       ? '#949392'
                    //       : notification.urgent
                    //       ? 'red'
                    //       : '#00897B',
                    //     borderRadius: '50%',
                    //   }}
                    />

                    {/* {notification.urgent ?<ErrorOutline  sx={{color: "red"}}/> :""} */}
                    <Box
                      width="90%"
                      sx={{ opacity: notification.read_status ? 0.7 : 1 }}
                    >
                      <Typography
                        color="#000"
                        variant="subtitle1"
                        sx={{ fontWeight: 600, fontSize: 13 }}
                      >
                        <span style={{ fontWeight: 700 }}>From: </span>
                        {notification.author}
                      </Typography>
                      <Typography
                        color={'#4a4a4a'}
                        variant="subtitle2"
                        sx={{ fontWeight: 600, fontSize: 14 }}
                      >
                        {notification.message}
                      </Typography>
                      <Typography
                        color={'#4a4a4a'}
                        variant="h6"
                        sx={{ fontWeight: 700, fontSize: 13 }}
                      >
                        {moment(new Date(notification.timestamp)).fromNow()}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  {/* <Typography color="primary" variant='subtitle2'
                                        sx={{ fontWeight: 600, fontSize: 12, cursor: "pointer", whiteSpace: 'nowrap' }}
                                        onClick={() => handleMarkAsRead(notification)}>
                                        {notification.read_status ? 'Mark as Unread' : 'Mark as Read'}
                                    </Typography> */}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={data?.total_notifications || 0}
        page={page}
        onPageChange={handlePageChange}
        rowsPerPage={limit}
        onRowsPerPageChange={handleLimitChange}
      />
    </Box>
  );
};

export default ManageNotifications;

const data = {
  res: [
    {
      id: '1',
      author: 'John Doe',
      message: 'System update scheduled at midnight.',
      timestamp: new Date().toISOString(),
      urgent: true,
      read_status: false,
    },
    {
      id: '2',
      author: 'Jane Smith',
      message: 'Your report is due tomorrow.',
      timestamp: new Date(Date.now() - 3600 * 1000 * 2).toISOString(), // 2 hours ago
      urgent: false,
      read_status: true,
    },
    {
      id: '3',
      author: 'HR Department',
      message: 'Please complete your timesheet.',
      timestamp: new Date(Date.now() - 3600 * 1000 * 24 * 1).toISOString(), // 1 day ago
      urgent: false,
      read_status: false,
    },
    {
      id: '4',
      author: 'Admin',
      message: 'Security update is required immediately.',
      timestamp: new Date(Date.now() - 3600 * 1000 * 5).toISOString(), // 5 hours ago
      urgent: true,
      read_status: true,
    },
    {
      id: '5',
      author: 'John Doe',
      message: 'System update scheduled at midnight.',
      timestamp: new Date().toISOString(),
      urgent: true,
      read_status: false,
    },
    {
      id: '6',
      author: 'Jane Smith',
      message: 'Your report is due tomorrow.',
      timestamp: new Date(Date.now() - 3600 * 1000 * 2).toISOString(), // 2 hours ago
      urgent: false,
      read_status: true,
    },
    {
      id: '7',
      author: 'HR Department',
      message: 'Please complete your timesheet.',
      timestamp: new Date(Date.now() - 3600 * 1000 * 24 * 1).toISOString(), // 1 day ago
      urgent: false,
      read_status: false,
    },
    {
      id: '8',
      author: 'Admin',
      message: 'Security update is required immediately.',
      timestamp: new Date(Date.now() - 3600 * 1000 * 5).toISOString(), // 5 hours ago
      urgent: true,
      read_status: true,
    },
    {
      id: '9',
      author: 'John Doe',
      message: 'System update scheduled at midnight.',
      timestamp: new Date().toISOString(),
      urgent: true,
      read_status: false,
    },
    {
      id: '10',
      author: 'Jane Smith',
      message: 'Your report is due tomorrow.',
      timestamp: new Date(Date.now() - 3600 * 1000 * 2).toISOString(), // 2 hours ago
      urgent: false,
      read_status: true,
    },
  ],
  total_notifications: 4,
};
