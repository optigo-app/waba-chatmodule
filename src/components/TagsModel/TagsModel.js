import React, { useContext } from 'react'
import './TagsModel.scss'
import { Box, Typography, TextField, IconButton, Avatar, Paper, Divider, Modal, Button, Chip, MenuItem } from '@mui/material';
import { addTagsApi } from '../../API/AddTags/AddTags';
import toast from 'react-hot-toast';
import { useTagsContext } from '../../contexts/TagsContexts';
import { LoginContext } from '../../context/LoginData';

const TagsModel = ({ openTagModal, setOpenTagModal, tags, addTags, removeTags, tagInput, setTagInput, color, setColor, selectedCustomer, handleFetchtags }) => {
    const { triggerRefetch } = useTagsContext();
    const auth = useContext(LoginContext);

    const handleAddTags = async () => {
        if (selectedCustomer?.CustomerId) {
            try {
                const response = await addTagsApi(selectedCustomer.CustomerId, tagInput, auth?.userId)
                if (response?.rd?.[0]?.stat === 1) {
                    toast.success("Tag added successfully");
                    handleFetchtags();
                    triggerRefetch(); // Trigger refetch in sidebar
                    setOpenTagModal(false);
                    addTags({ label: tagInput });
                    setTagInput('');
                } else {
                    toast.error("Tag added failed")
                }
            } catch (error) {
                console.log("TCL: handleAddTags -> error", error)
            }
        }
    }

    return (
        <Modal open={openTagModal} onClose={() => setOpenTagModal(false)}>
            <Box
                sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: 400,
                    bgcolor: 'background.paper',
                    boxShadow: 24,
                    borderRadius: 2,
                    p: 3
                }}
            >
                <Typography variant="h6" sx={{ marginBottom: "15px" }} gutterBottom>Add Tags</Typography>


                {/* Input + Color */}
                <Box sx={{ display: 'flex', gap: 1, my: 1 }}>
                    <TextField
                        fullWidth
                        label="Tag"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                    />
                    {/* <TextField
                        select
                        label="Color"
                        value={color || ''}
                        onChange={(e) => setColor(e.target.value)}
                        sx={{ width: 120 }}
                    >
                        <MenuItem value="#fde68a">Yellow</MenuItem>
                        <MenuItem value="#bbf7d0">Green</MenuItem>
                        <MenuItem value="#bfdbfe">Blue</MenuItem>
                        <MenuItem value="#fecaca">Red</MenuItem>
                    </TextField> */}
                </Box>

                {/* Chip Preview */}
                {/* <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {tags.map((tag, index) => (
                        <Chip
                            key={index}
                            label={tag.label}
                            onDelete={() =>
                                removeTags(tag)
                            }
                            sx={{ backgroundColor: '#eee' }}
                        // sx={{ backgroundColor: tag.color || '#eee' }}
                        />
                    ))}
                </Box> */}

                {/* Action buttons */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Button onClick={() => setOpenTagModal(false)}>Cancel</Button>
                    <Button
                        variant="contained"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                if (tagInput.trim()) {
                                    handleAddTags()
                                }
                            }
                        }}
                        onClick={() => {
                            if (tagInput.trim()) {
                                handleAddTags()
                                // addTags({ label: tagInput, color });
                                // setColor('');
                            }
                        }}
                    >
                        Add
                    </Button>
                </Box>
            </Box>
        </Modal>
    )
}

export default TagsModel
