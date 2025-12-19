import React, { useMemo, useState, useEffect, memo, useRef } from 'react'
import ReplyPreview from '../ReplyToComponents/ReplyPreview'
import { IconButton, Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material'
import AttachFile from '@mui/icons-material/AttachFile'
import ImageIcon from '@mui/icons-material/Image'
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary'
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile'
import EmojiPicker from 'emoji-picker-react'
import TextField from '@mui/material/TextField'
import { SendHorizontal, Smile } from 'lucide-react'
import debounce from 'lodash.debounce'

const ChatBox = ({
    mediaFiles,
    replyToMessage,
    handleCancelReply,
    handleAttachClick,
    toggleEmojiPicker,
    showPicker,
    emojiPickerRef,
    showMedia,
    fileInputRef,
    openFilePicker,
    imageParams,
    videoParams,
    docsParams,
    handleFileChange,
    inputValue,
    setInputValue,
    handleKeyPress,
    handleSendMessage
}) => {
    const inputRef = useRef(null);
    const attachButtonRef = useRef(null);

    // ✅ Focus whenever replyToMessage becomes true
    useEffect(() => {
        if (replyToMessage?.id !== "" && inputRef.current) {
            inputRef.current.focus();
        }
    }, [replyToMessage]);

    const [tempQuery, setTempQuery] = useState(inputValue || '')

    // ✅ Debounce updates to parent setInputValue (100ms after typing stops)
    const debouncedUpdateInputValue = useMemo(
        () =>
            debounce((value) => {
                setInputValue(value)
            }, 100),
        [setInputValue]
    )

    useEffect(() => {
        debouncedUpdateInputValue(tempQuery)
        return () => {
            debouncedUpdateInputValue.cancel()
        }
    }, [tempQuery, debouncedUpdateInputValue])

    const onEmojiClick = (emojiData) => {
        const emoji = emojiData?.emoji || '';
        setTempQuery((prev) => prev + emoji);

        // keep the cursor in input
        if (inputRef.current) {
            inputRef.current.focus();
        }
    };

    return (
        <div className="message-input-area">
            {replyToMessage && (
                <ReplyPreview message={replyToMessage} onCancel={handleCancelReply} />
            )}

            <div className="input-container">
                <IconButton ref={attachButtonRef} size="small" className="attach-button" onClick={handleAttachClick}>
                    <AttachFile />
                </IconButton>

                <IconButton size="small" className="attach-button" onClick={toggleEmojiPicker}>
                    <Smile />
                </IconButton>

                {showPicker && (
                    <div className="emoji-picker-container" ref={emojiPickerRef}>
                        <EmojiPicker
                            onEmojiClick={onEmojiClick}
                            width={350}
                            height={400}    
                            searchDisabled={false}
                            skinTonesDisabled={true}
                            previewConfig={{ showPreview: true }}
                            emojiStyle="apple"
                        />
                    </div>
                )}

                <Menu
                    anchorEl={attachButtonRef.current}
                    open={Boolean(attachButtonRef.current) && Boolean(showMedia)}
                    onClose={handleAttachClick}
                    onClick={(e) => e.stopPropagation()}
                    sx={{ zIndex: (theme) => theme.zIndex.modal + 20 }}
                    PaperProps={{
                        elevation: 0,
                        sx: {
                            minWidth: 200,
                            borderRadius: 2,
                            py: 0.5,
                            mb: 1,
                            boxShadow: "0px 6px 18px rgba(0,0,0,0.12), 0px 3px 6px rgba(0,0,0,0.08)",
                        },
                    }}
                    transformOrigin={{ horizontal: 'left', vertical: 'bottom' }}
                    anchorOrigin={{ horizontal: 'left', vertical: 'top' }}
                >
                    <MenuItem
                        onClick={(e) => {
                            handleAttachClick(e);
                            openFilePicker(e, imageParams);
                        }}
                        sx={{ py: 1.1, px: 2, borderRadius: 1.5 }}
                    >
                        <ListItemIcon sx={{ minWidth: '34px', color: '#0046FF' }}>
                            <ImageIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary="Photo" />
                    </MenuItem>

                    <MenuItem
                        onClick={(e) => {
                            handleAttachClick(e);
                            openFilePicker(e, videoParams);
                        }}
                        sx={{ py: 1.1, px: 2, borderRadius: 1.5 }}
                    >
                        <ListItemIcon sx={{ minWidth: '34px', color: '#FF8040' }}>
                            <VideoLibraryIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary="Video" />
                    </MenuItem>

                    <MenuItem
                        onClick={(e) => {
                            handleAttachClick(e);
                            openFilePicker(e, docsParams);
                        }}
                        sx={{ py: 1.1, px: 2, borderRadius: 1.5 }}
                    >
                        <ListItemIcon sx={{ minWidth: '34px', color: '#9929EA' }}>
                            <InsertDriveFileIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary="Document" />
                    </MenuItem>
                </Menu>

                <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                    multiple
                />

                <TextField
                    fullWidth
                    inputRef={inputRef}
                    multiline
                    autoFocus={replyToMessage?.Id !== '' ? true : false}
                    maxRows={4}
                    value={tempQuery}
                    onChange={(e) => setTempQuery(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            handleKeyPress(e)
                            setTempQuery('')
                        }
                    }}
                    placeholder={
                        mediaFiles?.length > 0
                            ? 'Type a caption...'
                            : 'Type a message...'
                    }
                    variant="outlined"
                    size="small"
                    className="message-input"
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            borderRadius: '24px',
                            backgroundColor: '#f9fafb',
                        },
                    }}
                />

                <IconButton
                    onClick={() => {
                        handleSendMessage()
                        setTempQuery('')
                    }}
                    disabled={!tempQuery.trim() && (!mediaFiles || mediaFiles.length === 0)}
                    className="send-button"
                    color="primary"
                >
                    <SendHorizontal style={{ marginLeft: '2px' }} />
                </IconButton>
            </div>
        </div>
    )
}

export default memo(ChatBox)
