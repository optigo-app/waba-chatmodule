import React from 'react';
import { Link as LinkIcon, Share } from '@mui/icons-material';
import useLazyLoading from './useLazyLoading';
import './CustomerDetails.scss';

const LinksSection = ({ 
    links, 
    isLoading, 
    hasMore, 
    onLoadMore, 
    onShare,
    paginationFlag
}) => {
    // Lazy loading hook
    const lastLinkElementRef = useLazyLoading(onLoadMore, hasMore && paginationFlag, isLoading);
    
    // Show nothing if loading and no items
    if (isLoading && links.length === 0) {
        return null;
    }

    // Show "No items" message if no items after loading
    if (links.length === 0) {
        return (
            <div className="no-items-message">
                <div className="no-items-icon">
                    <LinkIcon className="media-icon" />
                </div>
                <p>No links found</p>
            </div>
        );
    }

    return (
        <div className="links-tab">
            <div className="links-content">
                <div className="links-header">
                    <span className="links-count">{links.length} links</span>
                </div>
                <div className="links-list">
                    {links.map((link, index) => {
                        // Apply ref to the last element for lazy loading
                        const isLastElement = index === links.length - 1;
                        return (
                            <div 
                                ref={isLastElement ? lastLinkElementRef : null}
                                key={link.Id} 
                                className="link-item"
                            >
                                <div className="link-icon">
                                    <LinkIcon />
                                </div>
                                <div className="link-info">
                                    <div className="link-title" title={link.MediaName || `Link ${link.Id}`}>
                                        {link.MediaName || `Link ${link.Id}`}
                                    </div>
                                    <div className="link-url" title={link.MediaUrl}>
                                        {link.MediaUrl}
                                    </div>
                                </div>
                                <button 
                                    className="share-btn" 
                                    onClick={() => onShare(link.MediaUrl)}
                                    title="Share link"
                                >
                                    <Share />
                                </button>
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
        </div>
    );
};

export default LinksSection;