import { Box, Button, TextField, InputAdornment } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import { colors } from './ingestStyles';

interface SearchToolbarProps {
  searchText: string;
  onSearchChange: (value: string) => void;
  onAddSource: () => void;
  canCreateSource: boolean;
}

export default function SearchToolbar({
  searchText,
  onSearchChange,
  onAddSource,
  canCreateSource,
}: SearchToolbarProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: 3,
        py: 2,
        borderBottom: `1px solid ${colors.borderLight}`,
      }}
    >
      <TextField
        placeholder="Search sources & connections..."
        variant="outlined"
        size="small"
        value={searchText}
        onChange={(e) => onSearchChange(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon sx={{ color: colors.textTertiary, fontSize: 20 }} />
            </InputAdornment>
          ),
        }}
        sx={{
          width: 380,
          '& .MuiOutlinedInput-root': {
            backgroundColor: colors.warmGrey,
            borderRadius: '10px',
            '& .MuiOutlinedInput-notchedOutline': {
              border: `1px solid ${colors.borderLight}`,
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: colors.primary,
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: colors.primary,
              borderWidth: '1.5px',
            },
          },
        }}
      />
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        disabled={!canCreateSource}
        onClick={onAddSource}
        sx={{
          borderRadius: '10px',
          px: 2.5,
          fontWeight: 700,
          textTransform: 'none',
        }}
      >
        Add Data Source
      </Button>
    </Box>
  );
}
