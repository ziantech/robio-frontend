/* eslint-disable @next/next/no-img-element */
'use client';

import {
  Dialog,
  DialogContent,
  IconButton,
  Box
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import RotateRightIcon from '@mui/icons-material/RotateRight';
import { useState } from 'react';

export default function ImageViewer({
  open,
  onClose,
  imageUrl
}: {
  open: boolean;
  onClose: () => void;
  imageUrl: string;
}) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  const handleZoomIn = () => setZoom((z) => z + 0.2);
  const handleZoomOut = () => setZoom((z) => Math.max(0.2, z - 0.2));
  const handleRotate = () => setRotation((r) => r + 90);

  const resetState = () => {
    setZoom(1);
    setRotation(0);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth={false}
      fullWidth
      fullScreen
      PaperProps={{
        sx: {
          backgroundColor: 'rgba(0, 0, 0, 0.95)',
          boxShadow: 'none',
        },
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: 16,
          right: 16,
          zIndex: 1000,
          display: 'flex',
          gap: 1,
        }}
      >
        <IconButton onClick={handleZoomIn} sx={{ color: 'white' }}>
          <ZoomInIcon />
        </IconButton>
        <IconButton onClick={handleZoomOut} sx={{ color: 'white' }}>
          <ZoomOutIcon />
        </IconButton>
        <IconButton onClick={handleRotate} sx={{ color: 'white' }}>
          <RotateRightIcon />
        </IconButton>
        <IconButton onClick={handleClose} sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </Box>

      <DialogContent
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          overflow: 'auto',
          p: 4,
          boxSizing: 'border-box',
        }}
      >
        <img
          src={imageUrl}
          alt="Zoomed"
          style={{
            transform: `scale(${zoom}) rotate(${rotation}deg)`,
            transition: 'transform 0.3s',
            maxWidth: '100%',
            maxHeight: '90vh',
            borderRadius: 8,
            objectFit: 'contain',
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
