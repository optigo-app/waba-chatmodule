import React from 'react';
import { Box, IconButton, Skeleton, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { ChevronDown, Download } from 'lucide-react';
import { Emoji } from 'emoji-picker-react';
import { FormatDateIST } from '../../utils/DateFnc';
import DynamicTemplate from '../DynamicTemplate/DynamicTemplate';
import QuickReactionMenu from './QuickReactionMenu';

const MessageContent = ({
    msg,
    isOutgoing,
    blinkMessageId,
    shouldShowActions,
    isReactionMenuOpenForCurrent,
    reactionMenuAnchorEl,
    setHoveredMessageId,
    currentHoverId,
    setReactionMenuAnchorEl,
    setReactionMenuMessageId,
    closeReactionMenu,
    handleMessageEmojiClick,
    handleMenuClick,
    handleContextMenu,
    scrollToMessage,
    containerRef,
    parseTemplateData,
    getMediaKey,
    getMediaSrcForMessage,
    loadedMedia,
    markLoaded,
    handleMediaClick,
    getMessageStatusIcon,
}) => {
    const theme = useTheme();

    return (
        <div className="message-content" style={{ flexDirection: 'column' }}>
            <Box
                className={`message-bubble ${blinkMessageId === (msg.Id ?? msg.fileName) ? 'blink-message' : ''}`}
                sx={{
                    '&&': {
                        display: msg?.MessageType === 'text' ? 'flex' : 'block',
                        flexDirection: 'column',
                        gap: 0.5,
                        position: 'relative',
                        zIndex: 1,
                        overflow: 'visible !important',
                        maxWidth: { xs: '90%', sm: 420 },
                        padding: (msg?.MessageType === 'text' ? '10px 12px 8px 12px' : '8px') + ' !important',
                        borderRadius: (isOutgoing
                            ? '18px 18px 0px 18px'
                            : '18px 18px 18px 0px') + ' !important',
                        backgroundColor: (isOutgoing
                            ? alpha(theme.palette.primary.main, 0.15)
                            : theme.palette.background.paper) + ' !important',
                        color: theme.palette.text.primary + ' !important',
                        // border: (`1px solid ${isOutgoing
                        //     ? alpha(theme.palette.primary.main, 0.22)
                        //     : (theme.palette.borderColor?.extraLight || theme.palette.divider)
                        //     }`) + ' !important',
                        boxShadow: (`0 2px 10px ${alpha('#000', 0.08)}`) + ' !important',
                    },

                    '&& .message-text': {
                        color: theme.palette.text.primary + ' !important',
                        marginRight: '0px !important',
                        ...(msg?.MessageType !== 'template' ? { paddingRight: '28px' } : {}),
                    },
                    '&& .message-time': {
                        color: alpha(theme.palette.text.primary, 0.65) + ' !important',
                    },
                }}
            >
                <Box
                    className="message-actions"
                    sx={{
                        '&&': {
                            position: 'absolute !important',
                            top: '50% !important',
                            left: isOutgoing ? '0px !important' : 'auto !important',
                            right: isOutgoing ? 'auto !important' : '0px !important',
                            marginRight: '0px !important',
                            transform: `translate(${isOutgoing ? '-110%' : '110%'}, -50%) !important`,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '2px',
                            padding: '2px',
                            borderRadius: '999px',
                            backgroundColor: alpha(theme.palette.background.paper, 0.92) + ' !important',
                            border: `1px solid ${theme.palette.borderColor?.extraLight || theme.palette.divider}`,
                            boxShadow: `0 6px 14px ${alpha('#000', 0.12)}`,
                            opacity: (shouldShowActions ? 1 : 0) + ' !important',
                            pointerEvents: (shouldShowActions ? 'auto' : 'none') + ' !important',
                            transition: 'opacity 160ms ease, transform 160ms ease',
                            zIndex: '6 !important',
                            whiteSpace: 'nowrap',
                        },
                    }}
                >
                    <QuickReactionMenu
                        open={isReactionMenuOpenForCurrent}
                        anchorEl={reactionMenuAnchorEl}
                        onOpen={(e) => {
                            e.stopPropagation();
                            setHoveredMessageId(currentHoverId);
                            setReactionMenuAnchorEl(e.currentTarget);
                            setReactionMenuMessageId(currentHoverId);
                        }}
                        onClose={(e) => {
                            e?.stopPropagation?.();
                            closeReactionMenu();
                        }}
                        onSelectEmoji={(emoji) => {
                            if (typeof handleMessageEmojiClick === 'function') {
                                handleMessageEmojiClick(emoji, msg);
                            }
                            closeReactionMenu();
                        }}
                    />
                </Box>

                {msg?.MessageType !== 'template' && (
                    <IconButton
                        className="menu-btn"
                        size="small"
                        onClick={(e) => {
                            handleMenuClick(e, msg);
                            handleContextMenu(e, msg);
                        }}
                        sx={{
                            '&&': {
                                position: 'absolute !important',
                                top: '3px !important',
                                right: '3px !important',
                                left: 'auto !important',
                                padding: '0px !important',
                                color: theme.palette.text.secondary + ' !important',
                                opacity: shouldShowActions ? 1 : 0,
                                pointerEvents: shouldShowActions ? 'auto' : 'none',
                                backgroundColor: alpha(theme.palette.primary.main, 0.10),
                                boxShadow: '0 6px 14px ' + alpha('#000', 0.12),
                                transition: 'opacity 160ms ease',
                                zIndex: 3,
                            },
                        }}
                    >
                        <ChevronDown size={24} />
                    </IconButton>
                )}
                {/* Reply Preview (Quoted message) */}
                {msg.ContextType === 2 && (
                    <div className="">
                        <div className="reply-preview" style={{
                            display: 'flex',
                            flexDirection: "column",
                            gap: '8px',
                            padding: '8px',
                            backgroundColor: alpha(theme.palette.primary.main, isOutgoing ? 0.12 : 0.08),
                            borderRadius: '8px',
                            marginBottom: '8px',
                            borderLeft: `3px solid ${theme.palette.primary.main}`,
                            cursor: msg.ContextId ? 'pointer' : 'default',
                            opacity: msg.ContextId ? 1 : 0.7
                        }}
                            onClick={() => msg.ContextId && scrollToMessage(msg.ContextId, containerRef)}  // Jump to original message
                        >
                            <div className="reply-content" style={{ flex: 1 }}>
                                <div className="reply-sender" style={{
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    color: theme.palette.text.primary,
                                    marginBottom: '2px'
                                }}>
                                    {msg.SenderInfo != '' ? msg.SenderInfo : msg.Sender}
                                </div>
                                <div className="reply-text" style={{
                                    fontSize: '12px',
                                    color: theme.palette.text.secondary,
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
                                <Box
                                    className="message-status"
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'flex-end',
                                        gap: 0.5,
                                        flexShrink: 0,
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    <Typography
                                        variant="caption"
                                        className="message-time"
                                        sx={{
                                            '&&': {
                                                display: 'inline-flex !important',
                                                alignItems: 'center',
                                                marginTop: '0px !important',
                                                lineHeight: 1,
                                                color: alpha(theme.palette.text.primary, 0.65) + ' !important',
                                            },
                                            fontSize: 11,
                                        }}
                                    >
                                        {msg.dateTime
                                            ? msg.dateTime
                                            : msg.DateTime && FormatDateIST(msg.DateTime, "dd-mm-yyyy").time}
                                    </Typography>
                                    {msg.Direction == 1 && !msg.isUploading && (
                                        <Box sx={{ display: "flex", alignItems: "center", lineHeight: 1 }}>
                                            {getMessageStatusIcon(msg)}
                                        </Box>
                                    )}
                                </Box>
                            </div>
                        )}
                    </div>
                )}

                {/* Text - Only show when NOT a reply (ContextType !== 2) */}
                {msg.ContextType !== 2 && msg?.MessageType === "text" && (
                    <Typography
                        variant="body2"
                        className="message-text"
                        sx={{
                            '&&': {
                                color: theme.palette.text.primary + ' !important',
                            },
                            fontSize: 14,
                            lineHeight: 1.45,
                            pr: 1,
                        }}
                    >
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
                    <Typography
                        variant="body2"
                        className="message-text"
                        sx={{
                            mt: 0.5,
                            '&&': {
                                color: theme.palette.text.primary + ' !important',
                            },
                        }}
                    >
                        {msg?.MessageType === 'template' ? "" : msg.Message}
                    </Typography>
                )}

                {/* Footer - Only show when NOT a reply (ContextType !== 2) */}
                {msg.ContextType !== 2 && (
                    <Box
                        className="message-status"
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-end',
                            gap: 0.5,
                            mt: '4px !important',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        <Typography
                            variant="caption"
                            className="message-time"
                            sx={{
                                '&&': {
                                    color: alpha(theme.palette.text.primary, 0.65) + ' !important',
                                    display: 'inline-flex !important',
                                    alignItems: 'center',
                                    marginTop: '0px !important',
                                    lineHeight: 1,
                                },
                                fontSize: 11,
                            }}
                        >
                            {msg.dateTime
                                ? msg.dateTime
                                : msg.DateTime && FormatDateIST(msg.DateTime, "dd-mm-yyyy").time}
                        </Typography>

                        {msg.Direction == 1 && !msg.isUploading && (
                            <Box sx={{ display: "flex", alignItems: "center", lineHeight: 1 }}>
                                {getMessageStatusIcon(msg)}
                            </Box>
                        )}
                    </Box>
                )}

                {msg?.ReactionEmojis && msg.ReactionEmojis !== "" && msg.ReactionEmojis !== "[]" && (
                    <div className="message-reaction">
                        <span>
                            {(() => {
                                try {
                                    const reactions = JSON.parse(msg.ReactionEmojis);

                                    if (Array.isArray(reactions)) {
                                        return reactions.map((r, idx) => (
                                            <React.Fragment key={idx}>
                                                {idx > 0 ? ' ' : null}
                                                {r?.Unified ? (
                                                    <Emoji unified={r.Unified} size={18} emojiStyle="apple" />
                                                ) : (
                                                    r?.Reaction
                                                )}
                                            </React.Fragment>
                                        ));
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

            </Box>
            {msg?.Direction == 1 && (
                <Box className="message-username-sendinfo" sx={{
                    marginTop: msg?.Direction === 1 && msg?.ReactionEmojis && msg?.ReactionEmojis !== "" && msg.ReactionEmojis !== "[]" ? "20px" : "0px"
                }}>
                    @{msg?.SenderInfo}
                </Box>
            )}
        </div>
    );
};

export default MessageContent;
