import React from 'react';
import { Box } from '@mui/material';
// Make sure to put your actual image file in the assets folder and update this path
import loaderImage from '../assets/loader.png';

const Loader = () => {
  return (
    <Box className="app-loader-screen">
      <img src={loaderImage} alt="Loading..." className="loader-img" />
    </Box>
  );
};

export default Loader;