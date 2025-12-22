import React, { useEffect, useState } from 'react';
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
    const [menuOrigins, setMenuOrigins] = useState({
        anchorOrigin: { vertical: 'top', horizontal: 'center' },
        transformOrigin: { vertical: 'bottom', horizontal: 'center' },
    });
    const [pickerHeight, setPickerHeight] = useState(360);

    const reactions = ['1f44d', '2764-fe0f', '1f602', '1f62e', '1f64f'];

    const handlePick = (emojiData, event) => {
        event?.stopPropagation?.();
        onSelectEmoji?.(emojiData);
        onClose?.();
    };

    useEffect(() => {
        if (!open || !anchorEl) return;

        const rect = anchorEl.getBoundingClientRect();
        const vw = window.innerWidth || 0;
        const vh = window.innerHeight || 0;

        const estimatedMenuWidth = 360;
        const margin = 12;

        const availableDown = Math.max(0, vh - rect.bottom - margin);
        const availableUp = Math.max(0, rect.top - margin);

        // Prefer opening where we have more space, but still allow opening down
        // when there's a reasonable amount of room.
        const openDown = availableDown >= 320 || availableDown >= availableUp;
        
        const verticalAnchor = openDown ? 'bottom' : 'top';
        const verticalTransform = openDown ? 'top' : 'bottom';

        const availableInDirection = openDown ? availableDown : availableUp;
        // Keep it readable but never overflow viewport
        const nextPickerHeight = Math.max(220, Math.min(360, availableInDirection - 72));
        setPickerHeight(nextPickerHeight);

        const preferRight = rect.right + estimatedMenuWidth > vw - margin;
        const preferLeft = rect.left - estimatedMenuWidth < margin;

        let horizontal = 'center';
        if (preferRight) horizontal = 'right';
        else if (preferLeft) horizontal = 'left';

        setMenuOrigins({
            anchorOrigin: { vertical: verticalAnchor, horizontal },
            transformOrigin: { vertical: verticalTransform, horizontal },
        });
    }, [open, anchorEl]);

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
                anchorOrigin={menuOrigins.anchorOrigin}
                transformOrigin={menuOrigins.transformOrigin}
                marginThreshold={12}
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
                        maxWidth: 'min(360px, calc(100vw - 24px))',
                        maxHeight: 'calc(100vh - 24px)',
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
                        height={pickerHeight}
                    />
                </Box>
            </Menu>
        </>
    );
};

export default QuickReactionMenu;
