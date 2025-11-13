import React, { useState, useEffect, useContext } from "react";
import './AssigneeDropdown.scss';
import {
    Box,
    Typography,
    Avatar,
    Select,
    MenuItem,
    ListItemIcon,
    ListItemText,
    FormControl,
    AvatarGroup,
} from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import { addAssignUser } from "../../API/AssignUser/AssignUserApi";
import toast from "react-hot-toast";
import { removeAssignUser } from "../../API/UnAssignUser/UnAssignUserApi";
import { LoginContext } from "../../context/LoginData";

export const colors = [
    "#FF5722", "#4CAF50", "#2196F3", "#FFC107", "#E91E63", "#9C27B0", "#3F51B5", "#00BCD4",
    "#FF9800", "#9E9E9E", "#795548", "#607D8B", "#8BC34A", "#FFEB3B", "#FF4081", "#673AB7",
    "#ff7f50", "#F44336", "#3F51B5", "#CDDC39", "#03A9F4", "#9C27B0", "#FF1744", "#00E5FF",
    "#9E9E9E", "#4CAF50", "#00BCD4", "#8B4513", "#6A5ACD", "#F08080", "#32CD32", "#FF6347"
];

const dummyUsers = [
    { id: 1, name: "Alice Johnson" },
    { id: 2, name: "Bob Smith" },
    { id: 3, name: "Charlie Brown" },
    { id: 4, name: "Diana Prince" },
    { id: 5, name: "Ethan Hunt" },
    { id: 6, name: "John snow" },
    { id: 7, name: "Daenerys Targaryen" },
    { id: 8, name: "Sansa Stark" },
    { id: 9, name: "Arya Stark" },
    { id: 10, name: "Bran Stark" },
];

export const getRandomAvatarColor = (name) => {
    const charSum = name
        ?.split("")
        ?.reduce((sum, char) => sum + char?.charCodeAt(0), 0);
    return colors[charSum % colors.length];
};

const AssigneeDropdown = ({ options, label, assignedList = [], selectedCustomer, fetchAssigneeList }) => {
    const [assigned, setAssigned] = useState(options);
    const { auth } = useContext(LoginContext);

    const handleAssign = async (userId) => {
        if (!selectedCustomer?.ConversationId) {
            console.error('No conversation selected');
            return;
        }

        try {
            const response = await addAssignUser(selectedCustomer.ConversationId, userId, auth?.userId);

            if (response) {
                toast.success("User assigned successfully");
                fetchAssigneeList();
                setAssigned((prev) =>
                    prev.includes(userId) ? prev : [...prev, userId]
                );
            }
        } catch (err) {
            console.error("Assign failed:", err);
            toast.error("Failed to assign user");
        }
    };

    const handleUnAssign = async (userId) => {
        if (!selectedCustomer?.ConversationId) {
            console.error('No conversation selected');
            return;
        }

        try {
            const response = await removeAssignUser(selectedCustomer.ConversationId, userId, auth?.userId);

            if (response) {
                toast.success("User unassigned successfully");
                fetchAssigneeList();
                setAssigned((prev) =>
                    prev.includes(userId) ? prev : [...prev, userId]
                );
            }
        } catch (err) {
            console.error("Assign failed:", err);
            toast.error("Failed to unassign user");
        }
    };

    return (
        <Box className="form-group_ll">
            <Typography variant="subtitle1" className="form-label">{label}</Typography>

            {/* Avatar Group for assigned users */}
            <Box>
                <AvatarGroup max={5}>
                    {options.map((option) => {
                        const conversationIds = option?.ConversationIds ? JSON.parse(option.ConversationIds) : [];

                        const isAssigned = conversationIds.some(item =>
                            item.ConversationId === selectedCustomer?.ConversationId &&
                            item.UserId === option.UserId
                        );
                        if (!isAssigned) return null;

                        return (
                            <Avatar
                                key={option.UserId}
                                sx={{
                                    width: 28,
                                    height: 28,
                                    fontSize: "14px",
                                    backgroundColor: getRandomAvatarColor(option.FullName),
                                }}
                            >
                                {option.FirstName?.charAt(0).toUpperCase()}
                            </Avatar>
                        );
                    })}

                </AvatarGroup>
            </Box>

            <FormControl fullWidth size="small">
                <Select
                    value="" // always empty → no chip shown
                    displayEmpty
                    renderValue={() => "Assign User"}
                    sx={{
                        borderRadius: "8px",
                        "& .MuiSelect-select": {
                            paddingY: "6px",
                        },
                    }}
                >
                    {options.map((option) => {
                        const conversationIds = option?.ConversationIds ? JSON.parse(option.ConversationIds) : [];

                        const isAssigned = conversationIds.some(item =>
                            item.ConversationId === selectedCustomer?.ConversationId &&
                            item.UserId === option.UserId
                        );

                        return (
                            <MenuItem
                                key={option.UserId}
                                value={option.UserId}
                                onClick={() => { isAssigned ? handleUnAssign(option.UserId) : handleAssign(option.UserId) }}
                                sx={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                }}
                            >
                                <Box sx={{ display: "flex", alignItems: "center", width: "100%" }}>
                                    <Avatar
                                        sx={{
                                            width: 28,
                                            height: 28,
                                            fontSize: "14px",
                                            backgroundColor: getRandomAvatarColor(option?.FullName),
                                            mr: 1.5,
                                        }}
                                    >
                                        {option.FirstName?.charAt(0)}
                                    </Avatar>
                                    <ListItemText primary={option.FullName} />
                                    {isAssigned && <CheckIcon sx={{ color: "#06923E" }} />}
                                </Box>
                            </MenuItem>
                        );
                    })}
                </Select>
            </FormControl>
        </Box>
    );
};

export default AssigneeDropdown;
