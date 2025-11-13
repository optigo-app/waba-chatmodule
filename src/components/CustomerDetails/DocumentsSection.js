import React from 'react';
import { Description, Download } from '@mui/icons-material';
import useLazyLoading from './useLazyLoading';
import './CustomerDetails.scss';

const DocumentsSection = ({ 
    documents, 
    mediaCache, 
    isLoading, 
    hasMore, 
    onLoadMore, 
    onDocumentClick,
    onDownload,
    paginationFlag
}) => {
    // Lazy loading hook
    const lastDocumentElementRef = useLazyLoading(onLoadMore, hasMore && paginationFlag, isLoading);
    
    // Show nothing if loading and no items
    if (isLoading && documents.length === 0) {
        return null;
    }

    // Show "No items" message if no items after loading
    if (documents.length === 0) {
        return (
            <div className="no-items-message">
                <div className="no-items-icon">
                    <Description className="media-icon" />
                </div>
                <p>No documents found</p>
            </div>
        );
    }

    return (
        <div className="documents-tab">
            <div className="documents-content">
                <div className="documents-header">
                    <span className="documents-count">{documents.length} documents</span>
                </div>
                <div className="documents-list">
                    {documents.map((doc, index) => {
                        // Apply ref to the last element for lazy loading
                        const isLastElement = index === documents.length - 1;
                        return (
                            <div 
                                ref={isLastElement ? lastDocumentElementRef : null}
                                key={doc.Id} 
                                className="document-item" 
                                onClick={() => onDocumentClick(doc)}
                            >
                                <div className="document-icon">
                                    <Description />
                                </div>
                                <div className="document-info">
                                    <div className="document-name" title={doc.MediaName || `Document ${doc.Id}`}>
                                        {doc.MediaName || `Document ${doc.Id}`}
                                    </div>
                                    <div className="document-type" title={doc.MimeType || 'Document'}>
                                        {doc.MimeType || 'Document'}
                                    </div>
                                </div>
                                <button
                                    className="download-btn"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDownload(doc.MediaUrl, doc.MediaName || `document_${doc.Id}`);
                                    }}
                                    title="Download document"
                                >
                                    <Download />
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

export default DocumentsSection;