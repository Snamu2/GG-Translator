import React, { useState } from 'react';
import { 
  AppBar, Toolbar, Typography, IconButton, Box,
  ThemeProvider, createTheme, Tooltip, useMediaQuery
} from '@mui/material';
import { styled } from '@mui/system';
import { motion, AnimatePresence } from 'framer-motion';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  shape: {
    borderRadius: 8,
  },
});

const DropdownContainer = styled(motion.div)(({ theme }) => ({
  position: 'absolute',
  top: '100%',
  left: 0,
  backgroundColor: theme.palette.background.paper,
  borderRadius: '4px',
  boxShadow: '0px 5px 15px rgba(0,0,0,0.2)',
  overflow: 'hidden',
  zIndex: 1000,
  minWidth: 'auto',
  [theme.breakpoints.down('sm')]: {
    width: '100%', // 모바일에서는 전체 너비
  },
}));

const DropdownItem = styled(motion.div)(({ theme }) => ({
  padding: '12px 20px',
  cursor: 'pointer',
  whiteSpace: 'nowrap', // 텍스트 한 줄 유지
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
}));

const NavItem = styled(Box)({
  position: 'relative',
  cursor: 'pointer',
});

const AnimatedNavigation = ({ handleLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <ThemeProvider theme={theme}>
      <AppBar position="static">
        <Toolbar>
          <NavItem 
            onMouseEnter={() => setIsOpen(true)}
            onMouseLeave={() => setIsOpen(false)}
          >
            <Typography 
              variant="h6" 
              component="div" 
              sx={{ 
                fontFamily: '"Noto Sans", sans-serif',
                fontOpticalSizing: 'auto',
                fontWeight: 'bold',
                fontStyle: 'normal',
                flexGrow: 1,
                fontSize: isMobile ? '0.9rem' : '1rem',
              }}
            >
              GG Dictionary
            </Typography>
            <AnimatePresence>
              {isOpen && (
                <DropdownContainer
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <Tooltip title="Go to GG Translator">
                    <DropdownItem
                      whileHover={{ backgroundColor: theme.palette.action.hover }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <a href="/" style={{ textDecoration: 'none', color: theme.palette, display: 'block' }}>
                        <Typography
                          sx={{
                            fontFamily: '"Noto Sans", sans-serif',
                            fontOpticalSizing: 'auto',
                            fontWeight: 'bold',
                            fontStyle: 'normal',
                            fontSize: '0.9rem'
                          }}
                        >
                          GG Translator
                        </Typography>
                      </a>
                    </DropdownItem>
                  </Tooltip>
                </DropdownContainer>
              )}
            </AnimatePresence>
          </NavItem>
          <Box sx={{ flexGrow: 1 }} />
          <Tooltip title="Logout">
            <IconButton color="inherit" onClick={handleLogout}>
              <ExitToAppIcon />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>
    </ThemeProvider>
  );
};

export default AnimatedNavigation;