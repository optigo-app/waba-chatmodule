import React, { useState, useEffect, useCallback } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Typography,
    Box
} from '@mui/material';
import { addCustomer } from '../../API/AddCustomer/AddCustomer';
import toast from 'react-hot-toast';

const AddCustomerDialog = ({
    open,
    onClose,
    selectedMember,
    auth,
    onSuccess
}) => {
    const [customerName, setCustomerName] = useState('');
    const [debouncedCustomerName, setDebouncedCustomerName] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedCustomerName(customerName);
        }, 300);

        return () => clearTimeout(timer);
    }, [customerName]);

    const handleSaveCustomer = useCallback(async () => {
        if (!selectedMember?.CustomerPhone) {
            toast.error("Missing customer phone number. Cannot add customer.");
            return;
        }

        if (!debouncedCustomerName.trim()) {
            toast.error("Please enter a customer name.");
            return;
        }

        setLoading(true);
        try {
            const response = await addCustomer(
                selectedMember.CustomerPhone,
                selectedMember?.userId || 1,
                debouncedCustomerName.trim()
            );

            if (response) {
                toast.success("Customer added successfully!");
                onSuccess?.();
                handleClose();
            } else {
                toast.error("Failed to add customer");
            }
        } catch (error) {
            console.error("Error adding customer", error);
            toast.error("Something went wrong while adding the customer.");
        } finally {
            setLoading(false);
        }
    }, [selectedMember, debouncedCustomerName, auth?.userId, onSuccess]);

    const handleClose = useCallback(() => {
        setCustomerName('');
        setDebouncedCustomerName('');
        setLoading(false);
        onClose();
    }, [onClose]);

    const handleCustomerNameChange = useCallback((e) => {
        setCustomerName(e.target.value);
    }, []);

    const handleKeyPress = useCallback((e) => {
        if (e.key === 'Enter' && !loading && debouncedCustomerName.trim()) {
            handleSaveCustomer();
        }
    }, [handleSaveCustomer, loading, debouncedCustomerName]);

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="sm"
            fullWidth
        >
            <DialogTitle>
                <Typography variant="h6" component="div" sx={{ fontWeight: 600, color: '#111827' }}>
                    Add Customer
                </Typography>
            </DialogTitle>
            <DialogContent>
                <Box sx={{ pt: 2 }}>
                    <TextField
                        fullWidth
                        label="Mobile Number"
                        value={selectedMember?.CustomerPhone || ''}
                        disabled
                        variant="outlined"
                        margin="normal"
                        sx={{
                            mb: 2,
                            '& .MuiOutlinedInput-root': {
                                backgroundColor: '#f9fafb',
                            }
                        }}
                    />
                    <TextField
                        fullWidth
                        label="Customer Name"
                        value={customerName}
                        onChange={handleCustomerNameChange}
                        onKeyPress={handleKeyPress}
                        variant="outlined"
                        margin="normal"
                        placeholder="Enter customer name"
                        disabled={loading}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                '&:hover fieldset': {
                                    borderColor: '#c1c1c1',
                                },
                                '&.Mui-focused fieldset': {
                                    borderColor: '#1976d2',
                                },
                            }
                        }}
                    />
                </Box>
            </DialogContent>
            <DialogActions sx={{ p: 3, pt: 2 }}>
                <Button
                    onClick={handleClose}
                    variant="outlined"
                    disabled={loading}
                    sx={{
                        textTransform: 'none',
                        fontWeight: 500,
                        borderColor: '#e0e0e0',
                        color: '#6b7280',
                        '&:hover': {
                            borderColor: '#c1c1c1',
                            backgroundColor: '#f9fafb',
                        }
                    }}
                >
                    Cancel
                </Button>
                <Button
                    onClick={handleSaveCustomer}
                    variant="contained"
                    disabled={!debouncedCustomerName.trim() || loading}
                    sx={{
                        textTransform: 'none',
                        fontWeight: 500,
                        backgroundColor: '#1976d2',
                        '&:hover': {
                            backgroundColor: '#1565c0',
                        },
                        '&:disabled': {
                            backgroundColor: '#e0e0e0',
                            color: '#9e9e9e',
                        }
                    }}
                >
                    {loading ? 'Saving...' : 'Save'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AddCustomerDialog;
