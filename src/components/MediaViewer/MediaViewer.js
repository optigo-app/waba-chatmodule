import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  useTheme,
  CircularProgress,
  Slide
} from '@mui/material';
import {
  Close as CloseIcon,
  Download as DownloadIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Description as DescriptionIcon,
  PictureAsPdf as PdfIcon,
  InsertDriveFile as FileIcon
} from '@mui/icons-material';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Keyboard, Thumbs, Zoom } from 'swiper/modules';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/zoom';
import 'swiper/css/thumbs';

import './MediaViewer.scss';

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

// Helper to deduce file type from extension if not provided
const getMediaType = (item) => {
  if (item.type) return item.type;
  const ext = item.name?.split('.').pop()?.toLowerCase();
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return 'image';
  if (['mp4', 'webm', 'ogg'].includes(ext)) return 'video';
  if (['pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt'].includes(ext)) return 'document';
  return 'unknown';
};

const MediaViewer = ({ mediaItems = [], initialIndex = 0, onClose }) => {
  const theme = useTheme();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [thumbsSwiper, setThumbsSwiper] = useState(null);
  const swiperRef = useRef(null);

  useEffect(() => {
    if (swiperRef.current && swiperRef.current.swiper) {
      swiperRef.current.swiper.slideTo(initialIndex, 0);
    }
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  const handleDownload = (e) => {
    e.stopPropagation();
    const currentMedia = mediaItems[currentIndex];
    if (currentMedia?.src) {
      const link = document.createElement('a');
      link.href = currentMedia.src;
      link.download = currentMedia.name || `media-${currentIndex}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleClose = () => {
    onClose && onClose();
  };

  // Renderers
  const renderImage = (item) => (
    <div className="swiper-zoom-container">
      <img src={item.src} alt={item.name} loading="lazy" />
    </div>
  );

  const VideoRenderer = ({ item, isActive }) => {
    const videoRef = useRef(null);

    useEffect(() => {
      // Auto-pause when slide is not active
      if (!isActive && videoRef.current) {
        videoRef.current.pause();
      }
    }, [isActive]);

    return (
      <div className="video-container">
        <video
          ref={videoRef}
          src={item.src}
          controls
          className="media-video"
        // ResizeObserver loop limit fix strategy: 
        // Avoid 100% height on fluid containers if it causes layout thrashing
        />
      </div>
    );
  };

  const renderDocument = (item) => {
    const ext = item.name?.split('.').pop()?.toLowerCase();
    let Icon = FileIcon;
    let color = theme.palette.text.secondary;

    if (ext === 'pdf') {
      Icon = PdfIcon;
      color = '#F40F02';
    } else if (['doc', 'docx'].includes(ext)) {
      Icon = DescriptionIcon;
      color = '#2B579A';
    } else if (['xls', 'xlsx'].includes(ext)) {
      Icon = DescriptionIcon; // Or specific excel icon
      color = '#217346';
    }

    return (
      <Box className="document-preview-card">
        <Icon sx={{ fontSize: 80, color, mb: 2 }} />
        <Typography variant="h6" className="doc-name">{item.name}</Typography>
        <Typography variant="body2" color="textSecondary">{item.size}</Typography>

        <Box mt={3}>
          <IconButton
            onClick={handleDownload}
            sx={{ bgcolor: theme.palette.primary.main, color: '#fff', '&:hover': { bgcolor: theme.palette.primary.dark } }}
          >
            <DownloadIcon />
          </IconButton>
        </Box>
      </Box>
    );
  };

  if (!mediaItems || mediaItems.length === 0) return null;

  return (
    <Dialog
      fullScreen
      open={true}
      onClose={handleClose}
      TransitionComponent={Transition}
      className="media-viewer-dialog"
    >
      <AppBar position="fixed" className="media-viewer-appbar">
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={handleClose} aria-label="close">
            <CloseIcon />
          </IconButton>
          <Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="div" noWrap>
            {mediaItems[currentIndex]?.name || `Media ${currentIndex + 1} of ${mediaItems.length}`}
          </Typography>
          <IconButton color="inherit" onClick={handleDownload}>
            <DownloadIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Box className="media-viewer-content">
        {mediaItems.length === 1 ? (
          // Single Item View - No Swiper
          <Box className="media-slide-content single-view">
            {(() => {
              const item = mediaItems[0];
              const type = getMediaType(item);
              if (type === 'image') return <img src={item.src} alt={item.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />;
              if (type === 'video') return <VideoRenderer item={item} isActive={true} />;
              if (type === 'document') return renderDocument(item);
              return null;
            })()}
          </Box>
        ) : (
          // Multi Item View - With Swiper
          <>
            <Swiper
              ref={swiperRef}
              modules={[Navigation, Pagination, Keyboard, Thumbs, Zoom]}
              initialSlide={initialIndex}
              spaceBetween={30}
              slidesPerView={1}
              navigation={{
                prevEl: '.custom-prev',
                nextEl: '.custom-next'
              }}
              pagination={{ clickable: true, dynamicBullets: true }}
              keyboard={{ enabled: true }}
              zoom={true}
              thumbs={{ swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null }}
              onSlideChange={(swiper) => setCurrentIndex(swiper.activeIndex)}
              className="main-swiper"
            >
              {mediaItems.map((item, index) => {
                const type = getMediaType(item);
                return (
                  <SwiperSlide key={index}>
                    {({ isActive }) => (
                      <Box className="media-slide-content">
                        {type === 'image' && renderImage(item)}
                        {type === 'video' && <VideoRenderer item={item} isActive={isActive} />}
                        {type === 'document' && renderDocument(item)}
                        {type === 'unknown' && (
                          <Box display="flex" flexDirection="column" alignItems="center">
                            <Typography variant="h5" color="error">Unsupported Media Type</Typography>
                            <Typography>{item.name}</Typography>
                          </Box>
                        )}
                      </Box>
                    )}
                  </SwiperSlide>
                );
              })}
            </Swiper>

            {/* Custom Navigation Helper */}
            <div className="custom-prev swiper-nav-btn"><ChevronLeftIcon fontSize="large" /></div>
            <div className="custom-next swiper-nav-btn"><ChevronRightIcon fontSize="large" /></div>
          </>
        )}
      </Box>

      {/* Thumbnails Strip */}
      {mediaItems.length > 1 && (
        <Box className="thumbnails-container">
          <Swiper
            onSwiper={setThumbsSwiper}
            spaceBetween={10}
            slidesPerView={'auto'}
            freeMode={true}
            watchSlidesProgress={true}
            modules={[Thumbs, Navigation]}
            className="thumbs-swiper"
          >
            {mediaItems.map((item, idx) => {
              const type = getMediaType(item);
              return (
                <SwiperSlide key={idx} className="thumb-slide">
                  {type === 'image' ? (
                    <img src={item.src} alt="thumb" />
                  ) : (
                    <Box className={`thumb-placeholder ${type}`}>
                      {type === 'video' && '🎬'}
                      {type === 'document' && '📄'}
                    </Box>
                  )}
                </SwiperSlide>
              )
            })}
          </Swiper>
        </Box>
      )}
    </Dialog>
  );
};

export default MediaViewer;