import React, { useContext, useState } from 'react';
import useSWR from 'swr';
import moment from 'moment';
import { httpPut } from '@/helpers/http';
// import axios from 'axios';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableRow,
    TablePagination,
    Typography,
    Box,
    CircularProgress
} from '@mui/material';
import { useSession } from 'next-auth/react';
import { GlobalContext } from '@/contexts/ContextProvider';
import { errorToast } from '../ToastMessage/ToastHelper';

interface Notification {
    id: number;
    urgent: boolean;
    author: string;
    message: string;
    read_status: boolean;
    timestamp: string;
}


const ManageNotifications = ({ mutateUnreadCount }: any) => {
    const [page, setPage] = useState(0);
    const [limit, setLimit] = useState(25);
    const { data, isLoading, mutate } = useSWR(`notifications/?page=${page + 1}&limit=${limit}`);

    const { data: session }: any = useSession();
    const globalContext = useContext(GlobalContext);

    const handleMarkAsRead = async (notification: Notification) => {
        try {
            await httpPut(
                session,
                `notifications/`,
                {
                    notification_id: notification.id,
                    read_status: !notification.read_status
                }
            );
        }
        catch (err: any) {
            console.error(err);
            errorToast(err.message, [], globalContext);
        } finally {
            mutate();
            mutateUnreadCount();
        }
    };

    const handlePageChange = (event: any, value: number) => {
        setPage(value);
    };

    const handleLimitChange = (event: any) => {
        setLimit(event.target.value);
        setPage(0);  // Reset to the first page whenever limit changes
    };

    if (isLoading) return <CircularProgress />;

    return (
        <Box sx={{mt: 4}}>
            <TableContainer>
                <Table>
                    <TableBody>
                        {data?.res?.map((notification: Notification) => (
                            <TableRow key={notification.id} sx={{ backgroundColor: notification.urgent && !notification.read_status ? '#ffebee' : 'inherit' }}>
                                <TableCell width={'90%'} sx={{ p: 1.5 }}>
                                    <Box display='flex' alignItems='center' gap={3} >
                                        <Box sx={{
                                            width: 6, height: 6,
                                            backgroundColor: notification.read_status ?
                                                '#949392' : notification.urgent ?
                                                    'red' : '#00897B',
                                            borderRadius: '50%'
                                        }} />
                                        <Box width='90%' sx={{opacity: notification.read_status ? 0.7: 1}}>
                                            <Typography color="#000" variant='subtitle1'
                                                sx={{ fontWeight: 600, fontSize: 13 }}>
                                                <span style={{ fontWeight: 700 }}>From: </span>{notification.author}
                                            </Typography>
                                            <Typography color={"#4a4a4a"} variant='subtitle2'
                                                sx={{ fontWeight: 600, fontSize: 14 }}>
                                                    {notification.message}
                                            </Typography>
                                            <Typography color={"#4a4a4a"} variant='h6'
                                                sx={{ fontWeight: 700, fontSize: 13 }}>
                                                {moment(new Date(notification.timestamp)).fromNow()}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </TableCell>
                                <TableCell >
                                    <Typography color="primary" variant='subtitle2'
                                        sx={{ fontWeight: 600, fontSize: 12, cursor: "pointer", whiteSpace: 'nowrap' }}
                                        onClick={() => handleMarkAsRead(notification)}>
                                        {notification.read_status ? 'Mark as Unread' : 'Mark as Read'}
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            <TablePagination
                component='div'
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
