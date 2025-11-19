import React, { useState, useRef, useContext, useCallback, useEffect } from 'react';
import { Box, CircularProgress, Typography, Avatar, Skeleton } from '@mui/material';
import { ChevronDown, ChevronDownCircle, SmilePlus, Download, Clock3, Check, CheckCheck, AlertCircle } from 'lucide-react';
import MediaPreview from '../MediaPreview/MediaPreview';
import DynamicTemplate from '../DynamicTemplate/DynamicTemplate';
import { LoginContext } from '../../context/LoginData';
import { FormatDateIST } from '../../utils/DateFnc';

const MessageArea = ({
    showMedia,
    setShowMedia,
    loading,
    mediaFiles,
    setMediaFiles,
    handleClosePreview,
    containerRef,
    showScrollToBottom,
    setContextMenu,
    selectedCustomer,
    scrollToBottom,
    groupMessagesByDate,
    formatDateHeader,
    getMessageStatusIcon: getMessageStatusIconProp,
    parseTemplateData,
    getMediaSrcForMessage,
    handleMediaClick,
    handleReactionClick,
    handleMenuClick,
    handleContextMenu,
    scrollToMessage,
    handleReply,
    handleForward,
    blinkMessageId,
    setBlinkMessageId,
    loadedMedia,
    setLoadedMedia,
    getMediaKey,
    markLoaded,
    uploadProgress
}) => {
    console.log("selectedCustomer", selectedCustomer)
    const [hoveredMessageId, setHoveredMessageId] = useState(null);
    const messagesEndRef = useRef(null);
    const { PERMISSION_SET } = useContext(LoginContext);

    const can = (perm) => PERMISSION_SET.has(perm);

    useEffect(() => {
        if (mediaFiles?.length > 0) {
            setShowMedia(false)
        }
    }, [mediaFiles])

    const getMessageStatusIcon = (msg) => {
        const status = typeof msg?.Status === 'number' ? msg.Status :
            (msg?.Status === 'pending' ? 0 : -1);

        // Status mapping:
        // 0 - Queue (sending/queued)
        // 1 - Sent
        // 2 - Delivered
        // 3 - Read
        // 4 - Failed

        // Show clock for messages that are queued/sending (0) or pending
        if (status === 0 || msg?.Status === 'pending') {
            return (
                <Typography variant="caption" sx={{ color: '#fff', ml: 0.5 }}>
                    <Clock3 size={18} />
                </Typography>
            );
        }

        // Failed status (4)
        if (status === 4) {
            return (
                <Typography variant="caption" sx={{ color: '#ff4444', ml: 0.5 }}>
                    {/* ❗ */}
                    <AlertCircle size={18} style={{ color: "#ff4444", marginTop: "2px" }} />
                </Typography>
            );
        }

        // Read status (3) - Double yellow tick
        if (status === 3) {
            return (
                <Typography variant="caption" sx={{ color: '#ffef00', fontWeight: "bold", ml: 0.5 }}>
                    {/* ✓✓ */}
                    <CheckCheck size={18} style={{ color: "#ffef00", marginTop: "2px" }} />
                </Typography>
            );
        }

        // Delivered status (2) - Double grey tick
        if (status === 2) {
            return (
                <Typography variant="caption" sx={{ color: '#fff', ml: 0.5 }}>
                    {/* ✓✓ */}
                    <CheckCheck size={18} style={{ color: "#fff", marginTop: "2px" }} />
                </Typography>
            );
        }

        // Sent status (1) - Single grey tick
        if (status === 1) {
            return (
                <Typography variant="caption" sx={{ color: '#fff', ml: 0.5 }}>
                    {/* ✓ */}
                    <Check size={18} style={{ color: "#fff", marginTop: "2px" }} />
                </Typography>
            );
        }

        return null; // No status to display
    };

    return (
        <div
            className="messages-area"
            style={{
                position: "relative",
                ...(showMedia && {
                    "::before": {
                        content: '""',
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        pointerEvents: "none",
                        zIndex: 1,
                    },
                }),
            }}
            onContextMenu={(e) => {
                e.preventDefault();

                if (can(8)) {
                    setContextMenu({
                        mouseX: e.clientX + 2,
                        mouseY: e.clientY + 2,
                    });
                }
            }}
        >
            {loading ? (
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        height: '100%',
                        minHeight: '300px', 
                        gap: 2
                    }}
                >
                    <CircularProgress size={50} thickness={4} />
                    <Typography variant="body1" color="textSecondary">
                        Loading conversation...
                    </Typography>
                </Box>
            ) : mediaFiles?.length > 0 ? (
                <MediaPreview
                    mediaFiles={mediaFiles}
                    scrollToBottom={scrollToBottom}
                    setMediaFiles={setMediaFiles}
                    handleClosePreview={handleClosePreview}
                    uploadProgress={uploadProgress}
                />
            ) : (
                <>
                    <div
                        className="messages-list"
                        ref={containerRef}
                        style={{
                            maxHeight: '100vh',
                            overflowY: 'auto',
                            overflowX: 'hidden',
                            transition: 'filter 0.3s ease-in-out',
                            position: 'relative',
                            backgroundImage: 'url(/bg-3.jpg)',
                            backgroundSize: 'contain',
                            backgroundPosition: 'center',
                            backgroundRepeat: 'repeat',
                            backgroundAttachment: 'fixed',
                        }}
                    >
                        {/* Scroll to Bottom Button */}
                        {showScrollToBottom && (
                            <div
                                className="scroll-to-bottom"
                                onClick={() => scrollToBottom()}
                                title="Scroll to bottom"
                                style={{
                                    position: 'fixed',
                                    bottom: '100px',
                                    right: '30px',
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    backgroundColor: 'white',
                                    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    zIndex: 1000,
                                    transition: 'all 0.3s ease',
                                }}
                            >
                                <ChevronDownCircle size={40} color="#8e4ff3" />
                            </div>
                        )}

                        {Object.entries(groupMessagesByDate).map(([date, dateMessages], dateIdx, allDates) => {
                            return (
                                <React.Fragment key={`date-group-${date}`}>
                                    {dateMessages?.some(
                                        message =>
                                            (message.Direction === 0 && message.ConversationId == selectedCustomer?.ConversationId) ||
                                            message.Direction === 1
                                    ) && (
                                            <div key={dateIdx} className="date-group">
                                                {/* Date Header */}
                                                <div className="date-header" style={{
                                                    display: 'flex',
                                                    justifyContent: 'center',
                                                    margin: '20px 0 10px 0'
                                                }}>
                                                    <Typography
                                                        variant="caption"
                                                        sx={{
                                                            backgroundColor: '#d6d6d6ff',
                                                            padding: '4px 12px',
                                                            borderRadius: '12px',
                                                            color: '#000',
                                                            fontSize: '12px'
                                                        }}
                                                    >
                                                        {formatDateHeader(date)}
                                                    </Typography>
                                                </div>

                                                {/* Messages for this date */}
                                                {dateMessages
                                                    ?.filter(message =>
                                                        (message.Direction === 0 && message.ConversationId == selectedCustomer?.ConversationId) ||
                                                        message.Direction === 1
                                                    )
                                                    .map((msg, index) => {
                                                        return (
                                                            <div
                                                                key={msg.Id ?? msg.fileName}
                                                                className={`message-item ${msg.Direction === 1 ? 'user-message' : 'customer-message'}`}
                                                                style={{ cursor: 'context-menu' }}
                                                                data-message-id={msg.Id ?? msg.fileName}
                                                            >
                                                                {msg.Direction === 0 && (
                                                                    // <Avatar src={'./avatar.jpg'} alt="Customer" sx={{ width: 32, height: 32, mr: 1 }} />
                                                                    <Avatar
                                                                        {...(selectedCustomer?.avatarConfig || {})}
                                                                        sx={{ width: 32, height: 32, mr: 1, fontSize: 12, background: selectedCustomer?.avatarConfig != null ? '#8e4ff3' : "#BDBDBD", color: '#fff' }}
                                                                    />
                                                                )}

                                                                <div className="message-content" style={{ flexDirection: 'column' }}
                                                                    onMouseEnter={() => setHoveredMessageId(msg?.messageId || msg?.id || index)}
                                                                    onMouseLeave={() => setHoveredMessageId(null)}
                                                                >
                                                                    <div className={`message-bubble ${blinkMessageId === (msg.Id ?? msg.fileName) ? 'blink-message' : ''}`} style={{ display: msg?.MessageType === "text" ? 'flex' : "" }}>
                                                                        <div className="message-actions">
                                                                            <button className="reaction-btn" onClick={(e) => handleReactionClick(e, msg)}>
                                                                                <SmilePlus size={16} />
                                                                            </button>
                                                                            {msg?.MessageType !== 'template' &&
                                                                                <button
                                                                                    className="menu-btn"
                                                                                    onClick={(e) => {
                                                                                        handleMenuClick(e, msg);
                                                                                        handleContextMenu(e, msg);
                                                                                    }}
                                                                                >
                                                                                    <ChevronDown size={16} />
                                                                                </button>
                                                                            }
                                                                        </div>
                                                                        {/* Reply Preview (Quoted message) */}
                                                                        {msg.ContextType === 2 && (
                                                                            <div className="">
                                                                                <div className="reply-preview" style={{
                                                                                    display: 'flex',
                                                                                    flexDirection: "column",
                                                                                    gap: '8px',
                                                                                    padding: '8px',
                                                                                    backgroundColor: msg.Direction === 0 ? 'rgb(227 210 253)' : 'rgb(202 209 255 / 33%)',
                                                                                    borderRadius: '8px',
                                                                                    marginBottom: '8px',
                                                                                    borderLeft: msg.Direction === 0 ? '3px solid #8136fb' : '3px solid #fff',
                                                                                    cursor: msg.ContextId ? 'pointer' : 'default',
                                                                                    opacity: msg.ContextId ? 1 : 0.7
                                                                                }}
                                                                                    onClick={() => msg.ContextId && scrollToMessage(msg.ContextId, containerRef)}  // Jump to original message
                                                                                >
                                                                                    <div className="reply-content" style={{ flex: 1 }}>
                                                                                        <div className="reply-sender" style={{
                                                                                            fontSize: '12px',
                                                                                            fontWeight: 600,
                                                                                            color: msg.Direction === 0 ? '#000' : '#fff',
                                                                                            marginBottom: '2px'
                                                                                        }}>
                                                                                            {msg.SenderInfo != '' ? msg.SenderInfo : msg.Sender}
                                                                                        </div>
                                                                                        <div className="reply-text" style={{
                                                                                            fontSize: '12px',
                                                                                            color: msg.Direction === 0 ? '#000' : '#fff',
                                                                                            overflow: 'hidden',
                                                                                            textOverflow: 'ellipsis',
                                                                                            whiteSpace: 'nowrap'
                                                                                        }}>
                                                                                            {msg?.ReplyContextMsg?.length > 50
                                                                                                ? `${msg?.ReplyContextMsg.substring(0, 50)}...`
                                                                                                : msg?.ReplyContextMsg}
                                                                                        </div>
                                                                                        {!msg.ContextId && (
                                                                                            <div className="original-not-available">
                                                                                                Original message not available
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                                {msg?.MessageType === "text" && (
                                                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem' }}>
                                                                                        <Typography variant="body2" className="message-text" style={{ flex: 1, marginRight: 0 }}>
                                                                                            {msg?.MessageType === 'template' ? "" : msg.Message}
                                                                                        </Typography>
                                                                                        {/* Message status inline for reply messages */}
                                                                                        <div className="message-status" style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                                                                                            <Typography variant="caption" className="message-time" sx={{ marginTop: '0 !important' }}>
                                                                                                {msg.dateTime
                                                                                                    ? msg.dateTime
                                                                                                    : msg.DateTime && FormatDateIST(msg.DateTime, "dd-mm-yyyy").time}
                                                                                            </Typography>
                                                                                            {msg.Direction == 1 && !msg.isUploading && (
                                                                                                <Box sx={{ display: "flex", alignItems: "center" }}>
                                                                                                    {getMessageStatusIcon(msg)}
                                                                                                </Box>
                                                                                            )}
                                                                                        </div>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        )}

                                                                        {/* Text - Only show when NOT a reply (ContextType !== 2) */}
                                                                        {msg.ContextType !== 2 && msg?.MessageType === "text" && (
                                                                            <Typography variant="body2" className="message-text">
                                                                                {msg?.MessageType === 'template' ? "" : msg.Message}
                                                                            </Typography>
                                                                        )}

                                                                        {msg?.MessageType === 'template' && (() => {
                                                                            const templateData = parseTemplateData(msg);
                                                                            return (
                                                                                <DynamicTemplate
                                                                                    templateName={templateData.templateName}
                                                                                    params={templateData.params}
                                                                                    language={templateData.language}
                                                                                    components={templateData.components}
                                                                                />
                                                                            );
                                                                        })()}

                                                                        {/* Image */}
                                                                        {msg?.MessageType === "image" && ((_, index) => {
                                                                            const mediaKey = getMediaKey(msg, index);
                                                                            const src = getMediaSrcForMessage(msg);
                                                                            return (
                                                                                <div className="message-image" style={{ position: 'relative' }}>
                                                                                    {/* Skeleton until loaded */}
                                                                                    {!loadedMedia[mediaKey] && (
                                                                                        <Skeleton
                                                                                            variant="rounded"
                                                                                            className="media-skeleton"
                                                                                            sx={{
                                                                                                borderRadius: 1.5,
                                                                                                width: "220px",
                                                                                                height: "220px",
                                                                                            }}
                                                                                        />
                                                                                    )}

                                                                                    <div onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        e.preventDefault();
                                                                                        handleMediaClick({
                                                                                            mediaItems: [{
                                                                                                url: src,
                                                                                                mimeType: 'image/*',
                                                                                                filename: 'image'
                                                                                            }]
                                                                                        }, 0);
                                                                                    }} style={{ cursor: 'pointer' }}>
                                                                                        {src &&
                                                                                            <img
                                                                                                src={src}
                                                                                                alt="sent-img"
                                                                                                onLoad={() => markLoaded(mediaKey)}
                                                                                                onError={() => markLoaded(mediaKey)}
                                                                                                style={{ display: 'block', borderRadius: 12, opacity: loadedMedia[mediaKey] ? 1 : 0, maxWidth: '100%', height: 'auto' }}
                                                                                            />
                                                                                        }
                                                                                    </div>

                                                                                    {msg.isUploading && (
                                                                                        <div className="progress-overlay">
                                                                                            <svg className="progress-circle" viewBox="0 0 36 36">
                                                                                                <path className="progress-bg" d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831" />
                                                                                                <path
                                                                                                    className="progress-bar"
                                                                                                    strokeDasharray={`${msg.percent}, 100`}
                                                                                                    d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831"
                                                                                                />
                                                                                                <text x="18" y="20.35" className="progress-text">{msg.percent}%</text>
                                                                                            </svg>
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            );
                                                                        })()}

                                                                        {/* Video */}
                                                                        {msg?.MessageType === "video" && ((_, index) => {
                                                                            const mediaKey = getMediaKey(msg, index);
                                                                            const src = getMediaSrcForMessage(msg);
                                                                            return (
                                                                                <div className="message-video" style={{ position: 'relative' }}>
                                                                                    {!loadedMedia[mediaKey] && (
                                                                                        <Skeleton
                                                                                            variant="rounded"
                                                                                            className="media-skeleton"
                                                                                            sx={{
                                                                                                width: "220px",
                                                                                                height: "220px",
                                                                                            }}
                                                                                        />
                                                                                    )}

                                                                                    <div onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        e.preventDefault();
                                                                                        handleMediaClick({
                                                                                            mediaItems: [{
                                                                                                url: src,
                                                                                                mimeType: 'video/*',
                                                                                                filename: 'video'
                                                                                            }]
                                                                                        }, 0);
                                                                                    }} style={{ cursor: 'pointer' }}>
                                                                                        {src &&
                                                                                            <video
                                                                                                src={src}
                                                                                                controls
                                                                                                onLoadedData={() => markLoaded(mediaKey)}
                                                                                                onError={() => markLoaded(mediaKey)}
                                                                                                style={{ borderRadius: 12, opacity: loadedMedia[mediaKey] ? 1 : 0, maxWidth: '100%' }}
                                                                                                onClick={(e) => e.stopPropagation()}
                                                                                            />
                                                                                        }
                                                                                    </div>

                                                                                    {msg.isUploading && (
                                                                                        <div className="progress-overlay">
                                                                                            <svg className="progress-circle" viewBox="0 0 36 36">
                                                                                                <path className="progress-bg" d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831" />
                                                                                                <path className="progress-bar" strokeDasharray={`${msg.percent}, 100`} d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831" />
                                                                                                <text x="18" y="20.35" className="progress-text">{msg.percent}%</text>
                                                                                            </svg>
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            );
                                                                        })()}

                                                                        {/* Document */}
                                                                        {msg?.MessageType === "document" && ((_, index) => {
                                                                            const href = getMediaSrcForMessage(msg);

                                                                            // For docs we can still show a brief skeleton bar for polish
                                                                            return (
                                                                                <div className="message-document" style={{ position: 'relative' }}>
                                                                                    <div style={{
                                                                                        display: "flex",
                                                                                        alignItems: "center",
                                                                                        gap: "5px"
                                                                                    }}>
                                                                                        <div className="doc-icon">📄</div>
                                                                                        <div className="doc-info">
                                                                                            <span className="doc-name">{msg.fileName || "Document"}</span>
                                                                                            <span className="doc-type">{msg.fileType || "Unknown type"}</span>
                                                                                        </div>
                                                                                        <a
                                                                                            href={href}
                                                                                            download
                                                                                            className="doc-download"
                                                                                        >
                                                                                            <Download size={20} />
                                                                                        </a>
                                                                                    </div>

                                                                                    {msg.isUploading && (
                                                                                        <div className="progress-overlay">
                                                                                            <svg className="progress-circle" viewBox="0 0 36 36">
                                                                                                <path className="progress-bg" d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831" />
                                                                                                <path className="progress-bar" strokeDasharray={`${msg.percent}, 100`} d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831" />
                                                                                                <text x="18" y="20.35" className="progress-text">{msg.percent}%</text>
                                                                                            </svg>
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            );
                                                                        })()}


                                                                        {/* Optional caption under media */}
                                                                        {msg?.MessageType !== 'text' && msg?.Message && (
                                                                            <Typography variant="body2" className="message-text" sx={{ mt: 0.5 }}>
                                                                                {msg?.MessageType === 'template' ? "" : msg.Message}
                                                                            </Typography>
                                                                        )}

                                                                        {/* Footer - Only show when NOT a reply (ContextType !== 2) */}
                                                                        {msg.ContextType !== 2 && (
                                                                            <div className="message-status">
                                                                                <Typography variant="caption" className="message-time">
                                                                                    {msg.dateTime
                                                                                        ? msg.dateTime
                                                                                        : msg.DateTime && FormatDateIST(msg.DateTime, "dd-mm-yyyy").time}
                                                                                </Typography>

                                                                                {msg.Direction == 1 && !msg.isUploading && (
                                                                                    <Box sx={{ display: "flex", alignItems: "center", marginTop: 0.5 }}>
                                                                                        <Box sx={{ display: "flex", alignItems: "center", mt: 0.5 }}>
                                                                                            {getMessageStatusIcon(msg)}
                                                                                        </Box>
                                                                                    </Box>
                                                                                )}
                                                                            </div>
                                                                        )}

                                                                        {msg?.ReactionEmojis && msg.ReactionEmojis !== "" && msg.ReactionEmojis !== "[]" && (
                                                                            <div className="message-reaction">
                                                                                <span>
                                                                                    {(() => {
                                                                                        try {
                                                                                            const reactions = JSON.parse(msg.ReactionEmojis);

                                                                                            if (Array.isArray(reactions)) {
                                                                                                return reactions.map(r => r.Reaction).join(" ");
                                                                                            }

                                                                                            return "";
                                                                                        } catch (e) {
                                                                                            console.error("ReactionEmojis parse error:", e);
                                                                                            return "";
                                                                                        }
                                                                                    })()}
                                                                                </span>
                                                                            </div>
                                                                        )}

                                                                    </div>
                                                                    {msg?.Direction == 1 && (
                                                                        <Box className="message-username-sendinfo" sx={{
                                                                            marginTop: msg?.Direction === 1 && msg?.ReactionEmojis && msg?.ReactionEmojis !== "" && msg.ReactionEmojis !== "[]" ? "20px" : "0px"
                                                                        }}>
                                                                            @{msg?.SenderInfo}
                                                                        </Box>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )
                                                    })}

                                            </div>
                                        )}
                                </React.Fragment>
                            )
                        })}
                        <div ref={messagesEndRef} />
                    </div>
                </>
            )}
        </div>
    )
}

export default MessageArea;