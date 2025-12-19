import React from 'react';
import { Box, IconButton, Menu } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { SmilePlus } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';

const QuickReactionMenu = ({
    open,
    anchorEl,
    onOpen,
    onClose,
    onSelectEmoji,
}) => {
    const theme = useTheme();

    const reactions = ['1f44d', '2764-fe0f', '1f602', '1f62e', '1f64f'];

    const handlePick = (emojiData, event) => {
        event?.stopPropagation?.();
        onSelectEmoji?.(emojiData);
        onClose?.();
    };

    return (
        <>
            {/* Trigger Button */}
            <IconButton
                size="small"
                onClick={onOpen}
                aria-controls={open ? 'account-menu' : undefined}
                aria-haspopup="true"
                aria-expanded={open ? 'true' : undefined}
                sx={{
                    width: 28,
                    height: 28,
                    color: theme.palette.text.secondary,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.12),
                        color: theme.palette.primary.main,
                    },
                }}
            >
                <SmilePlus size={16} />
            </IconButton>

            {/* Reaction Menu */}
            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={onClose}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                transformOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                PaperProps={{
                    elevation: 0,
                    sx: {
                        borderRadius: 3.5,
                        p: -0,
                        m: 0,
                        backdropFilter: 'blur(10px)',
                        backgroundColor: alpha(theme.palette.background.paper, 0.12),
                        boxShadow: theme.palette.shadow.boxShadow1,
                        overflow: 'hidden',
                    },
                }}
                MenuListProps={{ sx: { p: 0 } }}
            >
                <Box onClick={(e) => e.stopPropagation()}>
                    <EmojiPicker
                        reactionsDefaultOpen={true}
                        allowExpandReactions={true}
                        reactions={reactions}
                        onReactionClick={handlePick}
                        onEmojiClick={handlePick}
                        emojiStyle="apple"
                        skinTonesDisabled={true}
                        width="100%"
                        height={360}
                    />
                </Box>
            </Menu>
        </>
    );
};

export default QuickReactionMenu;
