import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
} from '@mui/material';
import { LocalHospital, AccountCircle, Dashboard, ExitToApp } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setAnchorEl(null);
  };

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <AppBar 
      position="static" 
      sx={{ 
        background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
      }}
    >
      <Toolbar sx={{ px: { xs: 2, md: 4 } }}>
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            cursor: 'pointer',
            flexGrow: 1 
          }}
          onClick={() => navigate('/')}
        >
          <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', mr: 2 }}>
            <LocalHospital />
          </Avatar>
          <Typography 
            variant="h5" 
            component="div" 
            fontWeight="bold"
            sx={{ display: { xs: 'none', sm: 'block' } }}
          >
            MyMedicalBuddy
          </Typography>
          <Typography 
            variant="h6" 
            component="div" 
            fontWeight="bold"
            sx={{ display: { xs: 'block', sm: 'none' } }}
          >
            MMB
          </Typography>
        </Box>
        
        {user ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button 
              color="inherit" 
              startIcon={<Dashboard />}
              onClick={() => navigate('/dashboard')}
              sx={{ display: { xs: 'none', md: 'flex' } }}
            >
              Dashboard
            </Button>
            {user.role === 'user' && (
              <Button 
                color="inherit" 
                onClick={() => navigate('/submit-case')}
                sx={{ display: { xs: 'none', md: 'flex' } }}
              >
                Submit Case
              </Button>
            )}
            <IconButton
              size="large"
              onClick={handleMenu}
              color="inherit"
            >
              <AccountCircle />
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleClose}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              <MenuItem disabled>
                <Typography variant="body2" color="text.secondary">
                  {user.name} ({user.role})
                </Typography>
              </MenuItem>
              <MenuItem onClick={() => { navigate('/dashboard'); handleClose(); }}>
                <Dashboard sx={{ mr: 1 }} /> Dashboard
              </MenuItem>
              {user.role === 'user' && (
                <MenuItem onClick={() => { navigate('/submit-case'); handleClose(); }}>
                  Submit Case
                </MenuItem>
              )}
              <MenuItem onClick={handleLogout}>
                <ExitToApp sx={{ mr: 1 }} /> Logout
              </MenuItem>
            </Menu>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button 
              color="inherit" 
              onClick={() => navigate('/login')}
              sx={{ fontWeight: 'bold' }}
            >
              Sign In
            </Button>
            <Button 
              variant="outlined"
              onClick={() => navigate('/register')}
              sx={{ 
                color: 'white',
                borderColor: 'white',
                fontWeight: 'bold',
                '&:hover': {
                  borderColor: 'rgba(255,255,255,0.8)',
                  bgcolor: 'rgba(255,255,255,0.1)'
                }
              }}
            >
              Register
            </Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;