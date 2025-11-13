import React, { useState, useRef, useEffect } from 'react';
import { X, Paperclip } from 'lucide-react';
import './MediaPreview.scss';
import WordPreview from '../WordPreview/WordPreview';
import ExcelPreview from '../ExcelPreview/ExcelPreview';

const MediaPreview = ({ mediaFiles, scrollToBottom, setMediaFiles = () => { }, handleClosePreview }) => {
    const fileInputRef = useRef(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [mediaItems, setMediaItems] = useState([]);
    console.log("TCL: MediaPreview -> mediaItems", mediaItems)

    // Update mediaItems when mediaFiles changes
    useEffect(() => {
        const normalizedItems = mediaFiles.map((file, index) => ({
            id: `${file.name}-${file.lastModified}-${index}`, // stable id
            type: file.type.startsWith("image/")
                ? "image"
                : file.type.startsWith("video/")
                    ? "video"
                    : "file",
            file,
            url:
                file.type.startsWith("image/") || file.type.startsWith("video/")
                    ? URL.createObjectURL(file)
                    : null,
            name: file.name,
        }));

        setMediaItems(normalizedItems);

        // Clean up object URLs to prevent memory leaks
        return () => {
            normalizedItems.forEach((item) => {
                if (item.url) {
                    URL.revokeObjectURL(item.url);
                }
            });
        };
    }, [mediaFiles]);

    const currentMedia = mediaItems[currentIndex];
    console.log("TCL: MediaPreview -> currentMedia", currentMedia)

    // Handlers
    const handleClose = () => {
        // Clear media files and hide the media preview
        handleClosePreview();

        // Use setTimeout to ensure the message area is fully rendered before scrolling
        setTimeout(() => {
            if (typeof scrollToBottom === 'function') {
                scrollToBottom("smooth");
            }
        }, 100);
    };

    const handleAddMore = () => fileInputRef.current?.click();

    const removeMedia = (id) => {
        // Remove from mediaItems
        setMediaItems((prev) => {
            const filtered = prev.filter((item) => item.id !== id);
            if (filtered.length === 0) {
                setCurrentIndex(0);
                // If this was the last item, close the preview
                handleClose();
            } else if (currentIndex >= filtered.length) {
                setCurrentIndex(filtered.length - 1);
            }
            return filtered;
        });

        // Also remove from mediaFiles if setMediaFiles is provided
        if (typeof setMediaFiles === 'function') {
            setMediaFiles((prev) => {
                const filtered = prev.filter(
                    (file, index) => `${file.name}-${file.lastModified}-${index}` !== id
                );

                // If this was the last file, the preview will be closed by the mediaItems update above

                if (typeof scrollToBottom === 'function') {
                    scrollToBottom("instant");
                }
                return filtered;
            });
        }
    };


    return (
        <div className="media-preview-container">
            <div className="media-preview-overlay">
                {/* Header */}
                <div className="media-preview-header">
                    <button className="close-btn" onClick={handleClose}>
                        <X size={24} />
                    </button>
                    <div className="media-counter">
                        {currentIndex + 1} of {mediaItems.length}
                    </div>
                    <button className="add-more-btn" style={{ visibility: "hidden" }} onClick={handleAddMore}>
                        <Paperclip size={20} />
                    </button>
                </div>

                {/* Main Media Display */}
                <div className="media-display-area">
                    <div className="media-container">
                        {currentMedia?.file?.type === 'image' && (
                            <img
                                src={currentMedia.file.preview}
                                alt={currentMedia.file.name || 'media'}
                                className="media-item"
                            />
                        )}

                        {currentMedia?.file?.type === 'video' && (
                            <video src={currentMedia.file.preview} className="media-item" controls />
                        )}
                        {currentMedia?.file?.type === 'file' && (
                            <>
                                {currentMedia.file.name.endsWith('.pdf') ? (
                                    // <iframe
                                    //     src={URL.createObjectURL(currentMedia.file)}
                                    //     className="file-preview"
                                    //     title={currentMedia.name}
                                    //     style={{ width: "80%", height: "100%" }}
                                    // />
                                    <div className="no-preview-container">
                                        <div className="file-icon">
                                            <img src="./pdf.png" alt="Pdf" style={{ height: "100px", width: "100%" }} />
                                        </div>
                                        <div className="file-name">{currentMedia.file.name}</div>
                                        <div className="file-meta">
                                            {(currentMedia.file.size / 1024).toFixed(1)} KB · {currentMedia.file.name.split('.').pop().toUpperCase()}
                                        </div>
                                        <div className="no-preview-text">No preview available</div>
                                    </div>
                                ) : currentMedia.file.name.endsWith('.doc') || currentMedia.file.name.endsWith('.docx') ? (
                                    <div className="file-preview-docx">
                                        <WordPreview fileObject={currentMedia.file} />
                                    </div>
                                ) : currentMedia.file.name.endsWith('.xls') || currentMedia.file.name.endsWith('.xlsx') || currentMedia.file.name.endsWith('.csv') ? (
                                    // ✅ Excel Placeholder instead of ExcelPreview
                                    <div className="no-preview-container">
                                        <div className="file-icon">
                                            <img src="./excel.png" alt="Excel" style={{ height: "100px", width: "100%" }} />
                                        </div>
                                        <div className="file-name">{currentMedia.file.name}</div>
                                        <div className="file-meta">
                                            {(currentMedia.file.size / 1024).toFixed(1)} KB · {currentMedia.file.name.split('.').pop().toUpperCase()}
                                        </div>
                                        <div className="no-preview-text">No preview available</div>
                                    </div>
                                ) : currentMedia.file.name.endsWith('.txt') ? (
                                    <div className="file-preview-text">
                                        {currentMedia.file.text().then(text => text)}
                                    </div>
                                ) : (
                                    <div className="file-placeholder">
                                        <span>Preview not available for {currentMedia.file.name}</span>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* Thumbnails */}
                {mediaItems.length > 0 && (
                    <div className="thumbnails-container">
                        {mediaItems.map((item, index) => {
                            console.log("TCL: MediaPreview -> item", item.file.preview)
                            const mime = item.file?.type || ""; // e.g. "application/pdf"
                            console.log("TCL: MediaPreview -> mime", mime)
                            let thumbSrc = "📄";  // default placeholder

                            console.log("TCL: MediaPreview -> mime.startsWith()", mime.startsWith("image"))
                            if (mime.startsWith("image")) {
                                console.log("gies here")
                                thumbSrc = item.file.preview; // real image
                            } else if (mime.startsWith("video")) {
                                thumbSrc = "./video.png";
                            } else if (mime === "file") {
                                if (item.file.name.endsWith('.pdf')) {
                                    thumbSrc = "./pdf.png";
                                } else if (item.file.name.endsWith('.doc') || item.file.name.endsWith('.docx')) {
                                    thumbSrc = "./word.png";
                                } else if (item.file.name.endsWith('.xls') || item.file.name.endsWith('.xlsx')) {
                                    thumbSrc = "./excel.png";
                                } else if (item.file.name.endsWith('.txt')) {
                                    thumbSrc = "./txt.png";
                                }
                            }

                            return (
                                <div
                                    key={item.id}
                                    className={`thumbnail ${index === currentIndex ? "active" : ""}`}
                                    onClick={() => setCurrentIndex(index)}
                                >
                                    <img src={thumbSrc} alt={item.name} className="media-item" />
                                    <button
                                        className="remove-thumbnail"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            removeMedia(item.id);
                                        }}
                                    >
                                        <X size={18} color="white" />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MediaPreview;