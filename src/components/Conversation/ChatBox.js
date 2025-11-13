import React, { useMemo, useState, useEffect, memo, useRef } from 'react'
import ReplyPreview from '../ReplyToComponents/ReplyPreview'
import { IconButton } from '@mui/material'
import AttachFile from '@mui/icons-material/AttachFile'
import Image from '@mui/icons-material/Image'
import EmojiPicker from 'emoji-picker-react'
import TextField from '@mui/material/TextField'
import { SendHorizontal, Video, Smile, FileText } from 'lucide-react'
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
                <IconButton size="small" className="attach-button" onClick={handleAttachClick}>
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
                            skinTonesDisabled={false}
                            previewConfig={{ showPreview: false }}
                        />
                    </div>
                )}

                {showMedia && (
                    <div className="floating-card">
                        <div className="floating-card-1">
                            <div className="menu-item" onClick={(e) => openFilePicker(e, imageParams)}>
                                <Image size={25} color={'#0046FF'} /> <span>Photo</span>
                            </div>
                            <div className="menu-item" onClick={(e) => openFilePicker(e, videoParams)}>
                                <Video size={27} color={'#FF8040'} /> <span>Video</span>
                            </div>
                            <div className="menu-item" onClick={(e) => openFilePicker(e, docsParams)}>
                                <FileText size={25} color={'#9929EA'} /> <span>Document</span>
                            </div>

                            <input
                                type="file"
                                ref={fileInputRef}
                                style={{ display: 'none' }}
                                onChange={handleFileChange}
                                multiple
                            />
                        </div>
                    </div>
                )}

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
