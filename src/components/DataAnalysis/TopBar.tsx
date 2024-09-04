import { Box, Button, Typography } from "@mui/material";
import Image from "next/image";
import SavedIcon from '@/assets/icons/folder.svg';
import InfoIcon from '@/assets/icons/info.svg';
export const TopBar = ({handleOpenSavedSession}:any) => {
    return <>
        <Box
            sx={{
                width: '100%',
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
            }}
        >
            <Box
                sx={{
                    display: 'flex',
                    gap: '0.2rem',
                    justifyContent: 'center',
                    alignItems: 'center',
                    color: '#0F2440',
                    fontWeight: 600,
                    fontSize: '20px',
                }}
            >
                Parameters
                <Image
                    style={{ width: '1rem', height: '1rem' }}
                    src={InfoIcon}
                    alt="logout icon"
                />
            </Box>
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    flexWrap: 'wrap',
                }}
            >
                <Button
                    sx={{
                        display: 'flex',
                        borderRadius: '4px',
                        backgroundColor: '#EEEEEE',
                        fontWeight: 700,
                        fontSize: '14px',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexGrow: 1,
                        height: '2rem',
                    }}
                    onClick={ handleOpenSavedSession}
                >
                    <Image
                        style={{ marginRight: 8 }}
                        src={SavedIcon}
                        alt="logout icon"
                    />
                    Saved Sessions
                </Button>
                <Box sx={{ flexGrow: 1 }}>
                    <Button
                        variant="contained"
                        id="create-new-button"
                        sx={{ width: '100%', height: '2rem' }}
                    >
                        <Typography sx={{ fontWeight: 700, fontSize: '16px' }}>
                            + New
                        </Typography>
                    </Button>
                </Box>
            </Box>
        </Box>

    </>
}

