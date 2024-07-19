import { Box, Button, TextField, Typography } from '@mui/material';
import Image from 'next/image';
import SavedIcon from '@/assets/icons/folder.svg';
import InfoIcon from '@/assets/icons/info.svg';
import DalgoIcon from '@/assets/icons/dalgoIcon.svg';
import CopyIcon from '@/assets/icons/content_copy.svg';
import ThumbsupIcon from '@/assets/icons/thumb_up.svg';
import ThumbsDownIcon from '@/assets/icons/thumb_up (1).svg';
export default function DataAnalysis() {
  return (
    <>
      <Box // main box
        sx={{
          p: '3rem 3rem',
          width: '100%',
          display: 'flex',
          gap: '1rem',
        }}
      >
        <Box // two common boxes
          sx={{
            ...customCss,
            width: '42%',
          }}
        >
          <Box sx={{ width: '100%' }}>
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
                <Box
                  sx={{
                    display: 'flex',
                    borderRadius: '4px',
                    backgroundColor: '#EEEEEE',
                    fontWeight: 700,
                    fontSize: '14px',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0.5rem',
                    flexGrow: 1,
                  }}
                >
                  <Image
                    style={{ marginRight: 8 }}
                    src={SavedIcon}
                    alt="logout icon"
                  />
                  Saved Sessions
                </Box>
                <Box sx={{ flexGrow: 1 }}>
                  <Button
                    variant="contained"
                    id="create-new-button"
                    sx={{ width: '100%' }}
                  >
                    <Typography sx={{ fontWeight: 700, fontSize: '16px' }}>
                      + New
                    </Typography>
                  </Button>
                </Box>
              </Box>
            </Box>
            {/* second box */}
            <Box sx={{ width: '100%', padding: '1.5rem 0' }}>
              <hr></hr>
            </Box>
            {/* Third box with sql editor */}

            <Box sx={{ width: '100%', marginTop: '1.5rem 0' }}>
              <Typography
                sx={{ color: '#758397', fontWeight: '600', fontSize: '14px' }}
              >
                SQL Filter*
              </Typography>

              {/* This contains the sql filter */}
              <TextField
                id="outlined-multiline-static"
                sx={{ backgroundColor: 'transparent' }}
                defaultValue=""
                fullWidth
                multiline
                rows={7}
              />
            </Box>

            {/* foruth box with some buttons */}
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '0.75rem',
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  width: '100%',
                  marginTop: '1.5rem',
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    width: '100%',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                  }}
                >
                  <Typography
                    sx={{
                      fontWeight: '600',
                      fontSize: '14px',
                      color: '#758397',
                    }}
                  >
                    Select a prompt*
                  </Typography>
                  <Typography
                    sx={{
                      fontWeight: '500',
                      fontSize: '12px',
                      color: '#758397',
                    }}
                  >
                    (Choose any one from the given prompts)
                  </Typography>
                </Box>
              </Box>

              <Box
                sx={{
                  display: 'flex',
                  gap: '12px',
                  width: '100%',
                  flexWrap: 'wrap',
                }}
              >
                <Button
                  variant="contained"
                  id="create-new-button"
                  sx={{ flex: '1 1 auto', padding: '0.75rem 1.37rem' }}
                >
                  <Typography sx={{ fontWeight: 600, fontSize: '14px' }}>
                    Brightspots
                  </Typography>
                </Button>
                <Button
                  variant="contained"
                  id="create-new-button"
                  sx={{ flex: '1 1 auto', padding: '0.75rem 1.37rem' }}
                >
                  <Typography sx={{ fontWeight: 600, fontSize: '14px' }}>
                    Areas of development
                  </Typography>
                </Button>
                <Button
                  variant="contained"
                  id="create-new-button"
                  sx={{ flex: '1 1 auto', padding: '0.75rem 1.37rem' }}
                >
                  <Typography sx={{ fontWeight: 600, fontSize: '14px' }}>
                    Summarize
                  </Typography>
                </Button>
              </Box>

              <Typography
                sx={{ fontWeight: 600, fontSize: '16px', color: '#3C4C63' }}
              >
                OR
              </Typography>

              <Button
                variant="contained"
                sx={{ width: '100%', padding: '13px 0', borderRadius: '6px' }}
              >
                + Add a custom prompt
              </Button>
            </Box>
            <Button
              variant="contained"
              sx={{
                width: '6.75rem',
                marginTop: '6rem',
                padding: '8px 0',
                borderRadius: '5px',
              }}
            >
              Submit
            </Button>
          </Box>
        </Box>

        {/* ANALYSIS ONE */}
        <Box sx={{ ...customCss, width: '58%' }}>
          {/* inside the bottom box we will keep everything */}
          <Box sx={{ width: '100%' }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                color: '#0F2440',
                fontWeight: 600,
                fontSize: '20px',
              }}
            >
              LLM Summary
              <Image
                style={{ width: '1rem', height: '1rem' }}
                src={InfoIcon}
                alt="info icon"
              />
            </Box>
            {/* THIS IS THE SUMMARY UI PORTION */}
            <Box
              sx={{
                height: '32rem',
                border: '2px solid #F5F5F5',
                borderRadius: '6px',
                marginTop: '2rem',
                position: 'relative',
              }}
            >
              <Image
                style={{
                  width: '2.5rem',
                  height: '2.5rem',
                  position: 'relative',
                  top: '2rem',
                  left: '2rem',
                }}
                src={DalgoIcon}
                alt="logout icon"
              />

              <Box
                sx={{
                  display: 'flex',
                  gap: '0.87rem',
                  position: 'absolute',
                  bottom: '1.5rem',
                  right: '1.25rem',
                }}
              >
                <Image
                  style={{
                    width: '1.063rem',
                    height: '1.25rem',
                  }}
                  src={CopyIcon}
                  alt="logout icon"
                />
                <Image
                  style={{
                    width: '1.25rem',
                    height: '1rem',
                  }}
                  src={ThumbsupIcon}
                  alt="logout icon"
                />
                <Image
                  style={{
                    width: '1.25rem',
                    height: '1rem',
                  }}
                  src={ThumbsDownIcon}
                  alt="logout icon"
                />
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: '12px', marginTop: '2rem' }}>
              <Button
                variant="contained"
                sx={{
                  width: '6.75rem',
                  padding: '8px 0',
                  borderRadius: '6px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #626262',
                  color: '#626262',
                  '&:hover': {
                    color: '#FFFFFF',
                  },
                }}
              >
                Save as
              </Button>
              <Button
                variant="contained"
                sx={{ width: '6.75rem', padding: '8px 0', borderRadius: '6px' }}
              >
                Download
              </Button>
            </Box>
          </Box>
        </Box>
      </Box>
    </>
  );
}

const customCss = {
  display: 'flex',
  boxShadow: '0 4px 8px rgba(9, 37, 64, 0.08)',
  backgroundColor: '#FFFFFF',
  borderRadius: '12px',
  padding: '2rem',
  //   borderColor: '#FFFFFF',
};
