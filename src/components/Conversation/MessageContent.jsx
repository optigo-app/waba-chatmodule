import React, { useEffect, useState } from 'react';
import { Box, CircularProgress, IconButton, Skeleton, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { ChevronDown, Download, FileText } from 'lucide-react';
import { Emoji } from 'emoji-picker-react';
import { FormatDateIST } from '../../utils/DateFnc';
import DynamicTemplate from '../DynamicTemplate/DynamicTemplate';
import QuickReactionMenu from './QuickReactionMenu';

const imageDimsCache = new Map();

/**
 * Converts a raw emoji character into its unified hex string format.
 * Handles ZWJ sequences and skin tone variations.
 */
const charToUnified = (char) => {
    if (!char) return null;
    return Array.from(char)
        .map(c => c.codePointAt(0).toString(16))
        .filter(hex => hex !== 'fe0f') // Remove variations selector
        .join('-');
};

/**
 * Detects URLs in text and wraps them in styled anchor tags.
 */
const renderMessageWithLinks = (text, theme) => {
    if (!text) return text;
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);

    return parts.map((part, index) => {
        if (part.match(urlRegex)) {
            return (
                <a
                    key={index}
                    href={part}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                        color: theme.palette.primary.main,
                        textDecoration: 'none',
                        fontWeight: 500,
                        wordBreak: 'break-all',
                        transition: 'opacity 0.2s',
                    }}
                    onMouseOver={(e) => {
                        e.target.style.opacity = 0.8;
                        e.target.style.textDecoration = 'underline';
                    }}
                    onMouseOut={(e) => {
                        e.target.style.opacity = 1;
                        e.target.style.textDecoration = 'none';
                    }}
                >
                    {part}
                </a>
            );
        }
        return part;
    });
};

const MessageContent = ({
    msg,
    isOutgoing,
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

    const [imageDims, setImageDims] = useState(null);

    useEffect(() => {
        setImageDims(null);
    }, [msg?.Id, msg?.MediaUrl, msg?.fileName]);

    const UploadProgressOverlay = ({ percent, size = 52 }) => {
        const safePercent = Math.max(0, Math.min(100, Number(percent) || 0));
        const thickness = size <= 40 ? 4.5 : 4;
        const labelFontSize = size <= 40 ? 10 : 12;

        return (
            <Box
                className="progress-overlay"
                sx={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 2,
                    backgroundColor: alpha(theme.palette.background.paper, 0.92),
                    backdropFilter: 'blur(4px)',
                    borderRadius: 2,
                }}
            >
                <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                    <CircularProgress
                        variant="determinate"
                        value={100}
                        size={size}
                        thickness={thickness}
                        sx={{ color: alpha(theme.palette.text.primary, 0.12) }}
                    />
                    <CircularProgress
                        variant="determinate"
                        value={safePercent}
                        size={size}
                        thickness={thickness}
                        sx={{
                            color: theme.palette.primary.main,
                            position: 'absolute',
                            left: 0,
                            top: 0,
                        }}
                    />
                    <Box
                        sx={{
                            position: 'absolute',
                            inset: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <Typography
                            variant="caption"
                            sx={{
                                fontWeight: 700,
                                color: theme.palette.text.primary,
                                lineHeight: 1,
                                fontSize: labelFontSize,
                            }}
                        >
                            {Math.round(safePercent)}%
                        </Typography>
                    </Box>
                </Box>
            </Box>
        );
    };

    return (
        <div className="message-content" style={{ flexDirection: 'column' }}>
            <Box
                className="message-bubble"
                sx={{
                    '&&': {
                        display: msg?.MessageType === 'text' ? 'flex' : 'block',
                        flexDirection: 'column',
                        gap: 0.5,
                        position: 'relative',
                        zIndex: 1,
                        overflow: 'visible !important',
                        maxWidth: { xs: '90%', sm: 420 },
                        padding: '4px !important',
                        borderRadius: (isOutgoing
                            ? '16px 16px 4px 16px'
                            : '16px 16px 16px 4px') + ' !important',
                        background: (isOutgoing
                            ? alpha(theme.palette.background.light, 0.85)
                            : alpha(theme.palette.background.paper, 0.85)) + ' !important',
                        backdropFilter: 'blur(12px) saturate(180%)',
                        color: theme.palette.text.primary + ' !important',
                        border: `1px solid ${alpha(isOutgoing ? theme.palette.primary.main : theme.palette.divider, 0.12)} !important`,
                        boxShadow: `0 4px 24px ${alpha('#000', 0.08)}` + ' !important',
                    },

                    '&& .message-text': {
                        color: theme.palette.text.primary + ' !important',
                        fontWeight: 450,
                        letterSpacing: '0.01em',
                        marginRight: '0px !important',
                        padding: '8px 12px 4px 12px !important',
                        ...(msg?.MessageType !== 'template' ? { paddingRight: '36px !important' } : {}),
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
                            padding: '6px 8px',
                            backgroundColor: alpha(theme.palette.text.primary, 0.04),
                            borderRadius: '6px',
                            marginBottom: '4px',
                            borderLeft: `4px solid ${theme.palette.primary.main}`,
                            cursor: msg.ContextId ? 'pointer' : 'default',
                            opacity: msg.ContextId ? 1 : 0.7,
                            transition: 'background-color 0.2s',
                            '&:hover': {
                                backgroundColor: msg.ContextId ? alpha(theme.palette.text.primary, 0.08) : alpha(theme.palette.text.primary, 0.04),
                            }
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
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem', width: '100%' }}>
                            <Typography variant="body2" className="message-text" style={{ flex: 1, marginRight: 0 }}>
                                {msg?.MessageType === 'template' ? "" : renderMessageWithLinks(msg.Message, theme)}
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
                                            color: alpha(theme.palette.text.primary, 0.45) + ' !important',
                                        },
                                        fontSize: 10,
                                        fontWeight: 500,
                                        letterSpacing: '0.02em',
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
                                padding: '8px 12px 6px 12px',
                            },
                            fontSize: '0.925rem',
                            fontWeight: 450,
                            lineHeight: 1.6,
                            letterSpacing: '0.01em',
                        }}
                    >
                        {msg?.MessageType === 'template' ? "" : renderMessageWithLinks(msg.Message, theme)}
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

                    const cachedDims = src ? imageDimsCache.get(src) : null;
                    const dimsForCalc = imageDims || cachedDims;

                    const mediaWidth = 220;
                    const computedHeight = dimsForCalc?.w && dimsForCalc?.h
                        ? Math.max(140, Math.min(220, Math.round(mediaWidth * (dimsForCalc.h / dimsForCalc.w))))
                        : 220;

                    return (
                        <div
                            className="message-image"
                            style={{
                                position: 'relative',
                                width: mediaWidth,
                                height: computedHeight,
                                borderRadius: '8px',
                                overflow: 'hidden',
                            }}
                        >
                            {/* Skeleton until loaded */}
                            {!loadedMedia[mediaKey] && (
                                <Skeleton
                                    variant="rounded"
                                    className="media-skeleton"
                                    sx={{
                                        borderRadius: 0,
                                        position: 'absolute',
                                        inset: 0,
                                        width: '100%',
                                        height: '100%',
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
                                        onLoad={(e) => {
                                            const w = e?.currentTarget?.naturalWidth || 0;
                                            const h = e?.currentTarget?.naturalHeight || 0;
                                            if (w > 0 && h > 0) {
                                                const nextDims = { w, h };
                                                setImageDims(nextDims);
                                                if (src) {
                                                    imageDimsCache.set(src, nextDims);
                                                }
                                            }
                                            markLoaded(mediaKey);
                                        }}
                                        onError={() => markLoaded(mediaKey)}
                                        style={{
                                            display: 'block',
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover',
                                            opacity: loadedMedia[mediaKey] ? 1 : 0,
                                        }}
                                    />
                                }
                            </div>

                            {msg.isUploading && (
                                <UploadProgressOverlay percent={msg.percent} />
                            )}
                        </div>
                    );
                })()}

                {/* Video */}
                {msg?.MessageType === "video" && ((_, index) => {
                    const mediaKey = getMediaKey(msg, index);
                    const src = getMediaSrcForMessage(msg);
                    return (
                        <div
                            className="message-video"
                            style={{
                                position: 'relative',
                                width: 220,
                                height: 220,
                                borderRadius: 12,
                                overflow: 'hidden',
                            }}
                        >
                            {!loadedMedia[mediaKey] && (
                                <Skeleton
                                    variant="rounded"
                                    className="media-skeleton"
                                    sx={{
                                        borderRadius: 0,
                                        position: 'absolute',
                                        inset: 0,
                                        width: '100%',
                                        height: '100%',
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
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover',
                                            opacity: loadedMedia[mediaKey] ? 1 : 0,
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                }
                            </div>

                            {msg.isUploading && (
                                <UploadProgressOverlay percent={msg.percent} />
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
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1.5,
                                    width: 300,
                                    padding: '8px',
                                    backgroundColor: alpha(theme.palette.text.primary, 0.03),
                                    borderRadius: '8px',
                                }}
                            >
                                <Box
                                    sx={{
                                        width: 34,
                                        height: 34,
                                        borderRadius: 2,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        backgroundColor: alpha(theme.palette.primary.main, 0.12),
                                        color: theme.palette.primary.main,
                                        flex: '0 0 auto'
                                    }}
                                >
                                    <FileText size={18} />
                                </Box>

                                <Box sx={{ minWidth: 0, flex: '1 1 auto', display: 'flex', flexDirection: 'column' }}>
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            fontWeight: 600,
                                            color: theme.palette.text.primary,
                                            lineHeight: 1.2,
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis'
                                        }}
                                        title={msg.fileName || 'Document'}
                                    >
                                        {msg.fileName || 'Document'}
                                    </Typography>
                                    <Typography
                                        variant="caption"
                                        sx={{
                                            color: alpha(theme.palette.text.primary, 0.7),
                                            lineHeight: 1.2,
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis'
                                        }}
                                        title={msg.fileType || 'Unknown type'}
                                    >
                                        {msg.fileType || 'Unknown type'}
                                    </Typography>
                                </Box>

                                <IconButton
                                    component="a"
                                    href={href}
                                    download
                                    size="small"
                                    className="doc-download"
                                    sx={{
                                        color: alpha(theme.palette.text.primary, 0.75),
                                        flex: '0 0 auto',
                                        '&:hover': {
                                            color: theme.palette.text.primary,
                                            backgroundColor: alpha(theme.palette.text.primary, 0.06),
                                        }
                                    }}
                                    title="Download"
                                >
                                    <Download size={18} />
                                </IconButton>
                            </Box>

                            {msg.isUploading && (
                                <UploadProgressOverlay percent={msg.percent} size={40} />
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
                            mt: 1,
                            '&&': {
                                color: theme.palette.text.primary + ' !important',
                                padding: '0 8px 4px 8px !important',
                            },
                            lineHeight: 1.5,
                            fontWeight: 450,
                        }}
                    >
                        {msg?.MessageType === 'template' ? "" : renderMessageWithLinks(msg.Message, theme)}
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
                            mt: '2px !important',
                            mr: '2px !important',
                            mb: '2px !important',
                            whiteSpace: 'nowrap',
                            alignSelf: 'flex-end',
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
                                        return reactions.map((r, idx) => {
                                            const unified = r?.Unified || charToUnified(r?.Reaction);
                                            return (
                                                <React.Fragment key={idx}>
                                                    {unified ? (
                                                        <Emoji unified={unified} size={18} emojiStyle="apple" />
                                                    ) : (
                                                        r?.Reaction
                                                    )}
                                                </React.Fragment>
                                            );
                                        });
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
