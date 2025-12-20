import React from 'react';
import useLazyLoading from './useLazyLoading';
import './CustomerDetails.scss';
import { Image, Play } from 'lucide-react';

const MediaSection = ({
    mediaItems,
    mediaCache,
    isLoading,
    hasMore,
    onLoadMore,
    onMediaClick,
    paginationFlag
}) => {
    // Combine images and videos
    const combinedMedia = [...(mediaItems.images || []), ...(mediaItems.videos || [])];

    // Lazy loading hook
    const lastMediaElementRef = useLazyLoading(onLoadMore, hasMore && paginationFlag, isLoading);

    // Show nothing if loading and no items
    if (isLoading && combinedMedia.length === 0) {
        return null;
    }

    // Show "No items" message if no items after loading
    if (combinedMedia.length === 0) {
        return (
            <div className="no-items-message">
                <div className="no-items-icon">
                    <Image className="media-icon" />
                </div>
                <div className="no-items-text">
                    <div className="no-items-title">No media found</div>
                    <div className="no-items-subtitle">Shared photos and videos will appear here</div>
                </div>
            </div>
        );
    }

    return (
        <div className="media-section">
            <h4>Media</h4>
            <div className="media-grid">
                {combinedMedia.map((item, index) => {
                    const isVideo = item.MessageType === 'video';
                    // Apply ref to the last element for lazy loading
                    const isLastElement = index === combinedMedia.length - 1;
                    return (
                        <div
                            ref={isLastElement ? lastMediaElementRef : null}
                            key={item.Id}
                            className="media-item"
                            onClick={() => onMediaClick(item)}
                            title={item.MediaName || (isVideo ? 'Video' : 'Image')}
                        >
                            <div className="media-thumbnail-container">
                                {isVideo ? (
                                    <video
                                        className="media-thumbnail"
                                        preload="metadata"
                                        playsInline
                                        muted
                                    >
                                        <source src={mediaCache[item.MediaUrl] || ''} type="video/mp4" />
                                        Your browser does not support the video tag.
                                    </video>
                                ) : (
                                    <img
                                        src={mediaCache[item.MediaUrl] || ''}
                                        alt=""
                                        className="media-thumbnail"
                                        onError={(e) => { e.target.style.display = 'none'; }}
                                    />
                                )}
                                <div className="media-overlay">
                                    {isVideo ? <Play className="media-icon" /> : <Image className="media-icon" />}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
            {/* Manual load more button for non-lazy loading scenarios */}
            {!paginationFlag && hasMore && (
                <div className="load-more-container">
                    <button
                        className="load-more-button"
                        onClick={onLoadMore}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Loading...' : 'Load More'}
                    </button>
                </div>
            )}
        </div>
    );
};

export default MediaSection;