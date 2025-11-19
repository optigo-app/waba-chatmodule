import { addMessageHandler, addMessageHandlerFromAssigningUser, addStatusHandler, getSocket, isSocketConnected } from '../../socket';
import { FileText, Image, Video, Pin, Star, Clock3, ArrowLeft, UserPlus } from 'lucide-react';
import { pinConversationApi } from '../../API/PinConversation/PinConversation';
import toast from 'react-hot-toast';
import { Check, CheckCheck, AlertCircle } from "lucide-react";
import { unPinConversationApi } from '../../API/unPinConversation/UnPinConversation';
import { favoriteApi } from '../../API/FavoriteApi/FavoriteApi';
import { unFavoriteApi } from '../../API/UnFavoriteApi/UnFavoriteApi';
import { useLocation, useNavigate } from 'react-router-dom';
import { archieveApi } from '../../API/ArchieveAPi/ArchieveApi';
import { unArchieveApi } from '../../API/UnArchieveApi/UnArchieveApi';
import { LoginContext } from '../../context/LoginData';
import { useArchieveContext } from '../../contexts/ArchieveContext';
import OneSignal from 'react-onesignal';
import React, { useEffect, useState, useCallback, useRef, useContext } from 'react';
import {
    Avatar,
    Badge,
    Typography,
    Box,
    Chip,
    TextField,
    InputAdornment,
    Tabs,
    Tab,
    Menu,
    MenuItem,
    IconButton,
    Tooltip,
    CircularProgress
} from '@mui/material';
import {Clear, MoreVert, Search } from '@mui/icons-material';
import './CustomerLists.scss';
import { fetchConversationLists } from '../../API/ConverLists/ConversationLists';
import { formatChatTimestamp } from '../../utils/DateFnc';
import { stringAvatar } from '../../utils/StringAvatar';
import AddCustomerDialog from '../AddCustomerDialog/AddCustomerDialog';

// Utility to generate message preview based on type
const getMessagePreview = (msg) => {
    switch (msg?.MessageType) {
        case "text":
            return msg?.Message || "";
        case "image":
            return "📷 Photo";
        case "video":
            return "🎥 Video";
        case "document":
            return "📄 document";
        case "file":
            return "📄 File";
        default:
            return "New message";
    }
};

// Process API response to match the format used by handleSocketUpdate
const processApiResponse = (apiData) => {
    if (!apiData || !Array.isArray(apiData)) return [];

    return apiData.map(conversation => {
        // Parse the LastMessage if it's a JSON string
        let lastMessage = conversation.LastMessage;
        if (typeof lastMessage === 'string') {
            try {
                const parsed = JSON.parse(lastMessage);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    lastMessage = parsed[0]; // Get the first message if it's an array
                } else if (parsed && typeof parsed === 'object') {
                    lastMessage = parsed;
                }
            } catch (e) {
                console.error('Error parsing LastMessage:', e);
            }
        }

        // Parse tags if they exist
        let tags = [];
        if (conversation.TagList) {
            try {
                tags = typeof conversation.TagList === 'string'
                    ? JSON.parse(conversation.TagList)
                    : conversation.TagList;
            } catch (e) {
                console.error('Error parsing TagList:', e);
            }
        }

        // Format the conversation data to match the structure used by handleSocketUpdate
        return {
            ...conversation,
            ConversationId: conversation.Id, // Ensure ConversationId is set
            lastMessage: conversation.LastMessage ? getMessagePreview(lastMessage) : '',
            lastMessageTime: formatChatTimestamp(lastMessage?.DateTime || conversation.DateTime),
            lastMessageStatus: lastMessage?.Status,
            lastMessageDirection: lastMessage?.Direction,
            unreadCount: conversation.UnReadMsgCount || 0,
            tags: tags,
            name: conversation.CustomerName || conversation.CustomerPhone || 'Unknown',
            avatar: /\d/.test(conversation.CustomerName || conversation.CustomerPhone || '') ? 'icon' : null,
            avatarConfig: /\d/.test(conversation.CustomerName || conversation.CustomerPhone || '')
                ? null
                : stringAvatar(conversation.CustomerName || conversation.CustomerPhone || '')
        };
    });
};

const CustomerLists = ({ onCustomerSelect = () => { }, selectedCustomer = null, selectedStatus = 'All', selectedTag = 'All', isConversationRead = false, viewConversationRead = false, onConversationList = () => { } }) => {

    const location = useLocation();
    const navigate = useNavigate();
    const { archieve, addArchieve } = useArchieveContext();
    const [searchTerm, setSearchTerm] = useState('');
    const [tabValue, setTabValue] = useState(0);
    const [chatMembers, setChatMembers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [tempConversationId, setTempConversationId] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectMember, setSelectMember] = useState({});
    const [addCustomerDialogOpen, setAddCustomerDialogOpen] = useState(false);
    const [selectedMemberForDialog, setSelectedMemberForDialog] = useState(null);
    const containerRef = useRef(null);
    const pageSize = 100;
    const searchTimeoutRef = useRef(null);
    const { auth, PERMISSION_SET, isSyncing } = useContext(LoginContext);
    console.log("auth",auth)

    const can = (perm) => PERMISSION_SET?.has(perm);

    const handleCloseMenu = () => {
        setAnchorEl(null);
    };

    const transformMemberData = (items) => {
        return items?.map((item) => {
            const name = item?.CustomerName || item?.CustomerPhone;
            const includesNumber = /\d/.test(name);
            const tagList = item?.TagList ? JSON.parse(item.TagList) : [];
            const lastMessageData = JSON?.parse(item?.LastMessage)?.[0];

            return {
                ...item,
                name: item?.CustomerName || item?.CustomerPhone,
                avatar: includesNumber ? "icon" : null,
                avatarConfig: includesNumber ? null : stringAvatar(name),
                status: item?.Status,
                ticketStatus: selectedStatus?.ticketStatus,
                lastMessage: lastMessageData?.Message || 'No message',
                lastMessageTime: formatChatTimestamp(lastMessageData?.DateTime),
                lastMessageStatus: lastMessageData?.Status,
                lastMessageDirection: lastMessageData?.Direction,
                unreadCount: item?.UnReadMsgCount,
                ConversationId: Number(lastMessageData?.ConversationId),
                tags: tagList,
            };
        }) || [];
    };

    const loadMembers = useCallback(async (page = 1, reset = false, search = null) => {
        if (loading || (!reset && !hasMore)) return;

        if (!auth?.token || !auth?.userId) {
            console.log('⚠️ No auth token available, skipping conversation load');
            return;
        }

        setLoading(true);
        try {
            const searchToUse = search !== null ? search : searchTerm;
            const response = await fetchConversationLists(page, pageSize, auth?.userId, searchToUse);

            // Process both rd and rd1 data
            const currentConversations = processApiResponse(response.data?.rd || []);
            const searchResults = response.data?.rd1?.map(customer => ({
                ...customer,
                Id: customer.CustomerId,
                name: customer.CustomerName || customer.CustomerPhone,
                lastMessage: '',
                lastMessageTime: new Date().toISOString(),
                unreadCount: 0,
                isSearchResult: true // Flag to identify search results
            })) || [];

            // Combine both, but keep them separate for rendering
            const mergedConversations = searchToUse
                ? [
                    ...searchResults,
                    ...currentConversations
                ]
                : currentConversations;

            // Sort by last message time (newest first)
            const sortedConversations = mergedConversations.sort((a, b) => {
                return new Date(b.lastMessageTime) - new Date(a.lastMessageTime);
            });

            setChatMembers(prev => ({
                data: reset ? sortedConversations : [...(prev.data || []), ...sortedConversations],
                total: Math.max(response.total, sortedConversations.length)
            }));

            const moreAvailable = response?.hasMore ?? sortedConversations.length > 0;
            setHasMore(moreAvailable);

            if (moreAvailable) setCurrentPage(page);
        } catch (error) {
            console.error('Error loading members:', error);
        } finally {
            setLoading(false);
        }
    }, [loading, pageSize, processApiResponse, searchTerm]);

    // Effect to refresh customer list when sync completes
    useEffect(() => {
        if (isSyncing === false) {
            // Refresh the customer list when sync completes
            loadMembers(1, true);
        }
    }, [isSyncing]);

    // Create a stable reference for socket callbacks
    const loadMembersRef = useRef(loadMembers);
    useEffect(() => {
        loadMembersRef.current = loadMembers;
    }, [loadMembers]);

    const debouncedSearch = useCallback((value) => {
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        searchTimeoutRef.current = setTimeout(() => {
            loadMembers(1, true, value); // ✅ Pass the latest search value explicitly
        }, 500);
    }, [loadMembers]);

    // Only load members after authentication is confirmed
    useEffect(() => {
        if (auth?.token && auth?.userId) {
            loadMembers(1, true);
        }
    }, [auth?.token, auth?.userId]); // Only reload when auth changes

    const handleSearchChange = (e) => {
        const value = e.target.value;
        setSearchTerm(value);

        if (value === '') {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
            loadMembers(1, true, '');
        } else {
            debouncedSearch(value); // ✅ Uses latest input
        }
    };

    const handleScroll = useCallback(() => {
        if (!containerRef.current || loading || !hasMore) return;

        const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
        if (scrollTop + clientHeight >= scrollHeight - 80) {
            loadMembers(currentPage + 1);
        }
    }, [loading, hasMore, currentPage, loadMembers]);


    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        container.addEventListener('scroll', handleScroll);
        return () => container.removeEventListener('scroll', handleScroll);
    }, [handleScroll]);

    const handleTabChange = (e, newValue) => {
        setTabValue(newValue);
    };

    const filteredMembers =
        // Start with all members
        chatMembers?.data
            // Filter by archive status based on route
            ?.filter((member) => {
                if (location.pathname === '/archieve') {
                    return member.IsArchived === 1;
                } else {
                    return member.IsArchived !== 1; // Show non-archived in other routes
                }
            })
            // Search by name
            ?.filter((member) =>
                member?.CustomerName?.toLowerCase().includes(searchTerm.toLowerCase())
            )
            // Filter by tab (e.g. All, Assigned, Needs Attention, Done)
            // Filter by tab (e.g. All, Escalated, Favorite)
            ?.filter((member) => {
                const isFavorite = member.IsStar === 1;
                switch (tabValue) {
                    case 1: return member.ticketStatus === 'escalated';
                    case 2: return isFavorite && tabValue === 2;
                    default: return true;
                }
            })
            // Filter by Sidebar status selection (e.g. Unread, favorite)
            ?.filter((member) => {
                if (!selectedStatus || selectedStatus === 'All') return true;
                const statusKey = selectedStatus.toLowerCase();
                const isFavorite = member.IsStar === 1;
                return member.ticketStatus === statusKey || (isFavorite && statusKey === 'favorite');
            })
            // Filter by selected tag
            ?.filter((member) => {
                if (!selectedTag || selectedTag === 'All') return true;
                return member.tags && member.tags.some(tag => tag.TagId === selectedTag.Id);
            });


    const getStatusColor = (status) => {
        switch (status) {
            case 'online':
                return '#4caf50';
            case 'away':
                return '#ff9800';
            case 'offline':
                return '#9e9e9e';
            default:
                return '#9e9e9e';
        }
    };

    const archivedCount = chatMembers?.data?.filter(m => m.IsArchived === 1)?.length || 0;

    const getMessageStatusIcon = (member) => {
        if (member?.lastMessageDirection !== 1) return null;

        const status = typeof member?.lastMessageStatus === 'number' ? member.lastMessageStatus : -1;

        switch (status) {
            case 0: // Queued/Sending
                return <Clock3 size={17} style={{ marginRight: 5, color: "#9e9e9e" }} />;

            case 1: // Sent (single grey tick)
                return <Check size={17} style={{ marginRight: 5, color: "#9e9e9e" }} />;

            case 2: // Delivered (double grey tick)
                return <CheckCheck size={17} style={{ marginRight: 5, color: "#9e9e9e" }} />;

            case 3: // Read (double blue tick)
                return <CheckCheck size={17} style={{ marginRight: 5, color: "#1F51FF" }} />;

            case 4: // Failed
                return <AlertCircle size={17} style={{ marginRight: 5, color: "#ff4444" }} />;

            default:
                return null;
        }
    };

    useEffect(() => {
        addArchieve(archivedCount);
    }, [chatMembers]);

    const handlePinChat = async (member, shouldPin) => {
        if (!member?.ConversationId || !member?.UserId) {
            toast.error("Missing Conversation ID or User ID. Cannot pin/unpin this chat.");
            return;
        }

        try {
            // If trying to pin, check the limit first
            if (shouldPin === "Pin") {
                const pinnedCount = chatMembers.data?.filter(m => m.IsPin === 1).length || 0;
                if (pinnedCount >= 3) {
                    toast.error("You can only pin up to 3 chats. Please unpin a chat first.");
                    return;
                }
            }

            const response = shouldPin === "Pin"
                ? await pinConversationApi(member.ConversationId, member.UserId, auth?.userId)
                : await unPinConversationApi(member.ConversationId, member.UserId, auth?.userId);

            if (response?.Status === "200") {
                toast.success(`Chat ${shouldPin === "Pin" ? 'pinned' : 'unpinned'} successfully`);
                loadMembers(currentPage, true);
            } else {
                toast.error(`Failed to ${shouldPin === "Pin" ? 'pin' : 'unpin'} chat`);
            }
        } catch (error) {
            console.error("Error handling pin chat", error);
            toast.error("Something went wrong while pinning/unpinning the chat.");
        }
    };

    const handleFavoriteChat = async (member, shouldFavorite) => {
        if (!member?.ConversationId || !member?.UserId) {
            toast.error("Missing Conversation ID or User ID. Cannot pin/unpin this chat.");
            return;
        }

        try {
            const response = shouldFavorite === "Favorite"
                ? await favoriteApi(member.ConversationId, member.UserId, auth?.userId)
                : await unFavoriteApi(member.ConversationId, member.UserId, auth?.userId);

            if (response?.Status === "200") {
                toast.success(`Chat ${shouldFavorite === "Favorite" ? 'favorited' : 'unfavorited'} successfully`);
                loadMembers(currentPage, true);
            } else {
                toast.error(`Failed to ${shouldFavorite === "Favorite" ? 'favorite' : 'unfavorite'} chat`);
            }
        } catch (error) {
            console.error("Error handling favorite chat", error);
            toast.error("Something went wrong while favoriting/unfavoriting the chat.");
        }
    };

    const handleArchieveChat = async (member, shouldArchieve) => {
        if (!member?.ConversationId || !member?.UserId) {
            toast.error("Missing Conversation ID or User ID. Cannot archive/unarchive this chat.");
            return;
        }

        try {
            const response = shouldArchieve === "Archive"
                ? await archieveApi(member.ConversationId, member.UserId, auth?.userId)
                : await unArchieveApi(member.ConversationId, member.UserId, auth?.userId);

            if (response?.Status === "200") {
                toast.success(`Chat ${shouldArchieve === "Archive" ? 'archived' : 'unarchived'} successfully`);
                loadMembers(currentPage, true);
            } else {
                toast.error(`Failed to ${shouldArchieve === "Archive" ? 'archive' : 'unarchive'} chat`);
            }
        } catch (error) {
            console.error("Error handling favorite chat", error);
            toast.error("Something went wrong while archiving/unarchiving the chat.");
        }
    };

    const handleAddCustomer = (member) => {
        if (!member?.CustomerPhone) {
            toast.error("Missing customer phone number. Cannot add customer.");
            return;
        }
        
        setSelectedMemberForDialog(member);
        setAddCustomerDialogOpen(true);
    };

    const handleCloseAddCustomerDialog = () => {
        setAddCustomerDialogOpen(false);
        setSelectedMemberForDialog(null);
    };

    const handleAddCustomerSuccess = () => {
        loadMembers(currentPage, true);
    };

    const handleMenuAction = (action, member) => {
        setSelectMember(member);
        onConversationList(member);

        if (action === "Pin" || action === "UnPin") {
            handlePinChat(member, action === "Pin" ? "Pin" : "UnPin");
        }

        if (action === "Star" || action === "UnStar") {
            handleFavoriteChat(member, action === "Star" ? "Favorite" : "UnFavorite");
        }

        if (action === "Archive" || action === "UnArchive") {
            handleArchieveChat(member, action === "Archive" ? "Archive" : "UnArchive", loadMembers, currentPage);
        }

        if (action === "AddCustomer") {
            handleAddCustomer(member);
        }

        handleCloseMenu();
    };

    const showNotification = useCallback(async (title, message, icon = null) => {
        if (!("Notification" in window)) return;

        // Ask for permission if not already granted
        if (Notification.permission === "default") {
            await Notification.requestPermission();
        }

        if (Notification.permission === "granted") {
            new Notification(
                title, {
                body: message,
                icon: icon || "/logo.png",
                badge: "/logo.png",
                requireInteraction: true, // keeps notification until user clicks/dismisses
            });
        }
    }, []);

    const handleSocketUpdate = (data, isStatusChange = false) => {
        setChatMembers((prev) => {
            if (!prev?.data) return prev;

            const updatedData = [...prev.data];
            const index = updatedData.findIndex(
                (member) => Number(member.ConversationId) === Number(data?.ConversationId)
            );

            const messagePreview = getMessagePreview(data);
            const formattedTime = formatChatTimestamp(data?.DateTime);

            if (index !== -1) {
                const currentChat = updatedData[index];

                // 🛡️ Prevent duplicate re-renders for same message
                const isSameMessage =
                    currentChat.lastMessage === messagePreview &&
                    currentChat.lastMessageTime === formattedTime;

                if (isSameMessage && !isStatusChange) {
                    return prev; // same message received again → skip
                }

                // ✅ Update chat data
                const updatedChat = {
                    ...currentChat,
                    lastMessage: messagePreview,
                    lastMessageTime: formattedTime,
                    lastMessageStatus: data?.Status ?? data?.status ?? currentChat.lastMessageStatus,
                    lastMessageDirection: data?.Direction ?? currentChat.lastMessageDirection,
                };

                // If this is a message status update, we won't increment unread count.
                if (!isStatusChange) {
                    updatedChat.unreadCount = (currentChat.unreadCount || 0) + 1;
                }

                // If message status indicates read/delivered, you could reset unread count
                if (isStatusChange && data?.Status === 1 /* example: delivered */) {
                    updatedChat.unreadCount = 0;
                }

                // Move updated chat to top if new message (not just a status update)
                updatedData.splice(index, 1);
                if (!isStatusChange) {
                    updatedData.unshift(updatedChat);
                } else {
                    // for status change, maintain position
                    updatedData.splice(index, 0, updatedChat);
                }
            } else {
                // ✅ Add new chat if not found (rare case)
                const newChat = {
                    ConversationId: data?.ConversationId,
                    name: data?.CustomerName || data?.CustomerPhone || data?.SenderInfo || "Unknown",
                    lastMessage: messagePreview,
                    lastMessageTime: formattedTime,
                    lastMessageStatus: data?.Status ?? data?.status,
                    lastMessageDirection: data?.Direction,
                    unreadCount: isStatusChange ? 0 : 1,
                    avatar: /\d/.test(data?.CustomerName || data?.SenderInfo || "") ? "icon" : null,
                    avatarConfig: /\d/.test(data?.CustomerName || data?.SenderInfo || "")
                        ? null
                        : stringAvatar(data?.CustomerName || data?.SenderInfo || ""),
                };
                updatedData.unshift(newChat);
            }

            return { ...prev, data: updatedData };
        });
    };

    // Optimized socket listener setup - only depend on auth token, not currentPage
    useEffect(() => {
        if (!auth?.token || !auth?.userId) return;

        const handleNewMessage = (data) => handleSocketUpdate(data, false);
        const handleStatusChange = (data) => handleSocketUpdate(data, true);
        const handleNewMessageFromAssigningUser = (data) => handleSocketUpdate(data, false);

        const removeMessageHandler = addMessageHandler(handleNewMessage);
        const removeStatusHandler = addStatusHandler(handleStatusChange);
        const removeMessageHandlerFromAssigningUser =
            addMessageHandlerFromAssigningUser(handleNewMessageFromAssigningUser);

        return () => {
            removeMessageHandler();
            removeStatusHandler();
            removeMessageHandlerFromAssigningUser();
        };
    }, [auth?.token, auth?.userId]);


    // Trigger load when reading starts

    useEffect(() => {
        const conversationId = selectedCustomer?.ConversationId;

        if ((isConversationRead || viewConversationRead) && conversationId !== tempConversationId) {
            setTempConversationId(conversationId);
            loadMembers(currentPage, true);
        }
    }, [isConversationRead, viewConversationRead, selectedCustomer?.ConversationId, tempConversationId]);

    return (
        <div className="customer_lists_mainDiv">
            <div className="customer_lists_header">
                {location?.pathname === "/archieve" ? (
                    <div className="header-archive">
                        <IconButton
                            className="back-button"
                            onClick={() => navigate(-1)} // 👈 Go back to the previous page
                            size="small"
                        >
                            <ArrowLeft />
                        </IconButton>
                        <Typography variant="h6" className="header_title_archieve">Archived Chats</Typography>
                    </div>
                ) : (
                    <Typography variant="h6" className="header_title">Chat Members</Typography>
                )}

                {can(7) &&
                    <Chip
                        label={`${archieve} archive`}
                        size="small"
                        color="primary"
                        variant="outlined"
                        onClick={() => navigate('/archieve')}
                    />
                }
            </div>

            {/* Search Input */}
            <div className="customer_lists_search">
                <TextField
                    fullWidth
                    placeholder="Search conversations"
                    variant="outlined"
                    size="small"
                    value={searchTerm}
                    onChange={handleSearchChange}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <Search fontSize="small" />
                            </InputAdornment>
                        ),
                        endAdornment: searchTerm && (
                            <InputAdornment
                                position="end"
                                style={{ cursor: 'pointer' }}
                                onClick={() => {
                                    // First clear the search term
                                    setSearchTerm('');
                                    // Then immediately call loadMembers with empty search
                                    loadMembers(1, true, '');
                                }}
                            >
                                <Clear fontSize="small" />
                            </InputAdornment>
                        ),
                    }}
                />
            </div>

            {/* Filters */}
            <div className="customer_lists_filters">
                <Tabs
                    value={tabValue}
                    onChange={handleTabChange}
                    variant="fullWidth"
                    textColor="primary"
                    indicatorColor="primary"
                >
                    <Tab label="All" />
                    <Tab label="Escalated" />
                    <Tab label="Favorite" />
                    {/* <Tab label="Assigned" />
                    <Tab label="Needs Attention" />
                    <Tab label="Done" /> */}
                </Tabs>
            </div>

            <div className="customer_lists_main" >
                <ul ref={containerRef} style={{ maxHeight: '80vh', overflowY: 'auto' }}>
                    {can(15) ? (
                        <>
                            {/* ✅ Initial Loading (only when no data yet) */}
                            {loading && (!chatMembers?.data || chatMembers?.data.length === 0) ? (
                                <li
                                    style={{
                                        textAlign: 'center',
                                        display: 'flex',
                                        justifyContent: 'center',
                                        padding: '20px'
                                    }}
                                >
                                    <Typography variant="body2" color="textSecondary">
                                        No conversations found.
                                    </Typography>
                                </li>
                            ) : (
                                filteredMembers?.length > 0 ? (
                                    <>

                                        {/* Regular Conversations */}
                                        {filteredMembers
                                            .filter(member => !member.isSearchResult)
                                            .map((member) => {
                                                const isSelectedAndReading =
                                                    selectedCustomer?.Id === member.Id &&
                                                    ((isConversationRead || viewConversationRead) ||
                                                        (isConversationRead && viewConversationRead));
                                                const isSelected = selectedCustomer?.Id === member.Id;
                                                const shouldShowUnreadBadge =
                                                    member.unreadCount > 0 && !isSelectedAndReading;

                                                // Parse the LastMessage JSON string
                                                const lastMessageData = member.LastMessage ? JSON.parse(member.LastMessage) : [];

                                                return (
                                                    <li
                                                        key={member.Id}
                                                        className={`member-item ${isSelected ? 'active' : ''} ${isSelectedAndReading ? 'reading' : ''}`}
                                                        onClick={() => onCustomerSelect(member)}
                                                    >
                                                        <div className={`member-item ${isSelected ? 'active' : ''} ${isSelectedAndReading ? 'reading' : ''}`}>
                                                            <div className="member-avatar">
                                                                <Avatar {...member.avatarConfig} />
                                                            </div>

                                                            <div className="member-info">
                                                                <div className="member-header">
                                                                    <Typography
                                                                        variant="subtitle1"
                                                                        className={shouldShowUnreadBadge ? 'member-name-unread' : 'member-name'}
                                                                    >
                                                                        {member.name}
                                                                    </Typography>

                                                                    {(member?.lastMessage && member?.lastMessage !== 'No message') && (
                                                                        <Typography variant="caption" className="member-time">
                                                                            {member?.lastMessageTime}
                                                                        </Typography>
                                                                    )}
                                                                </div>

                                                                <div className="member-message">
                                                                    <Typography
                                                                        variant="body2"
                                                                        className={shouldShowUnreadBadge ? 'last-message-unread' : 'last-message'}
                                                                        style={{ display: 'flex', alignItems: 'center' }}
                                                                    >
                                                                        <span style={{ display: 'flex', alignItems: 'center' }}>
                                                                            {getMessageStatusIcon(member)}
                                                                            {member.lastMessage !== 'No message' ? (
                                                                                member.lastMessage
                                                                            ) : (
                                                                                <span
                                                                                    style={{
                                                                                        display: 'inline-flex',
                                                                                        alignItems: 'center',
                                                                                        gap: '4px'
                                                                                    }}
                                                                                >
                                                                                    {lastMessageData?.[0]?.MessageType === 'image' && (
                                                                                        <>
                                                                                            <Image size={12} /> Image
                                                                                        </>
                                                                                    )}
                                                                                    {lastMessageData?.[0]?.MessageType === 'video' && (
                                                                                        <>
                                                                                            <Video size={14} /> Video
                                                                                        </>
                                                                                    )}
                                                                                    {lastMessageData?.[0]?.MessageType === 'document' && (
                                                                                        <>
                                                                                            <FileText size={12} /> Document
                                                                                        </>
                                                                                    )}
                                                                                    {!lastMessageData?.[0]?.MessageType && 'Text'}
                                                                                </span>
                                                                            )}
                                                                        </span>
                                                                    </Typography>

                                                                    {shouldShowUnreadBadge && (
                                                                        <Badge
                                                                            badgeContent={member.unreadCount}
                                                                            color="primary"
                                                                            className="unread-badge"
                                                                        />
                                                                    )}

                                                                    <div className="member-actions-bar">
                                                                        {member?.IsPin === 1 && (
                                                                            <Tooltip title="Pinned" arrow>
                                                                                <IconButton
                                                                                    size="small"
                                                                                    color="primary"
                                                                                    className="action-btn"
                                                                                >
                                                                                    <Pin size={17} />
                                                                                </IconButton>
                                                                            </Tooltip>
                                                                        )}

                                                                        {member?.IsStar === 1 && (
                                                                            <Tooltip title="Starred" arrow>
                                                                                <IconButton
                                                                                    size="small"
                                                                                    color="warning"
                                                                                    className="action-btn"
                                                                                >
                                                                                    <Star size={17} />
                                                                                </IconButton>
                                                                            </Tooltip>
                                                                        )}
                                                                        {/* Add Customer Button */}
                                                                        {member?.CustomerId == 0 && member?.CustomerName == "" &&
                                                                            < Tooltip title="Add to Customer" arrow>
                                                                                <IconButton
                                                                                    size="small"
                                                                                    className="action-btn add-customer-btn"
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        handleAddCustomer(member);
                                                                                    }}
                                                                                    sx={{
                                                                                        color: '#ffffff',
                                                                                        backgroundColor: '#3b82f6 !important',
                                                                                        border: '2px solid #2563eb',
                                                                                        borderRadius: '12px',
                                                                                        padding: '8px',
                                                                                        // minWidth: '25px',
                                                                                        // minHeight: '25px',
                                                                                        boxShadow: '0 2px 8px rgba(59, 130, 246, 0.25)',
                                                                                        transition: 'all 0.3s ease-in-out',
                                                                                        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                                                                        '&:hover': {
                                                                                            backgroundColor: '#1d4ed8',
                                                                                            borderColor: '#1e40af',
                                                                                            transform: 'scale(1.1) translateY(-2px)',
                                                                                            boxShadow: '0 8px 25px rgba(59, 130, 246, 0.4)',
                                                                                            background: 'linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)',
                                                                                        },
                                                                                        '&:active': {
                                                                                            transform: 'scale(0.95) translateY(0px)',
                                                                                            boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)',
                                                                                        }
                                                                                    }}
                                                                                >
                                                                                    <UserPlus size={17} />
                                                                                </IconButton>
                                                                            </Tooltip>
                                                                        }
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* 3-dot menu */}
                                                        <div className={`member-actions ${isSelected ? 'active' : ''}`}>
                                                            <IconButton
                                                                size="small"
                                                                sx={{ padding: 0, marginRight: '2px' }}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setAnchorEl(e.currentTarget);
                                                                    setSelectMember(member);
                                                                    onConversationList(member);
                                                                }}
                                                            >
                                                                <MoreVert fontSize="small" />
                                                            </IconButton>
                                                        </div>
                                                    </li>
                                                );
                                            })}

                                        {/* Search Results Group */}
                                        {searchTerm && filteredMembers.some(m => m.isSearchResult) && (
                                            <div className="search-results-group">
                                                <div className="group-header">Start New Conversation</div>
                                                {filteredMembers
                                                    .filter(member => member.isSearchResult)
                                                    .map((member) => (
                                                        <li
                                                            key={`search-${member.Id}`}
                                                            className="member-item search-result"
                                                            onClick={() => onCustomerSelect(member)}
                                                        >
                                                            <div className="member-avatar">
                                                                <Avatar {...stringAvatar(member.name)} />
                                                            </div>
                                                            <div className="member-details">
                                                                <div className="member-name">
                                                                    {member.name}
                                                                    {/* <span className="member-phone">
                                                                        {member.CustomerPhone}
                                                                    </span> */}
                                                                </div>
                                                            </div>
                                                        </li>
                                                    ))}
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    // Only show "No conversations" when not loading
                                    !loading && (
                                        <li
                                            style={{
                                                textAlign: 'center',
                                                display: 'flex',
                                                justifyContent: 'center',
                                                padding: '20px'
                                            }}
                                        >
                                            <Typography variant="body2" color="textSecondary">
                                                No conversations found.
                                            </Typography>
                                        </li>
                                    )
                                )
                            )}

                            {/* ✅ Show pagination loader only when fetching next pages */}
                            {loading && chatMembers?.data?.length > 0 && hasMore && (
                                <li
                                    style={{
                                        textAlign: 'center',
                                        display: 'flex',
                                        justifyContent: 'center',
                                        padding: '10px'
                                    }}
                                >
                                    <Typography variant="caption" color="textSecondary">
                                        Loading more...
                                    </Typography>
                                </li>
                            )}
                        </>
                    ) : (
                        <div className="no-access-message">
                            <Typography variant="body2" color="error">
                                🚫 You don’t have access to view customer lists.
                            </Typography>
                        </div>
                    )}

                    {/* {loading && chatMembers?.data?.length > 0 && currentPage > 0 && ( */}
                    {currentPage > 1 && (
                        <li style={{ textAlign: 'center', display: "flex", justifyContent: "center", padding: '20px' }}>
                            <Typography variant="body2" color="textSecondary">
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    padding: '20px',
                                    borderBottom: '1px solid #e0e0e0',
                                    gap: "15px",
                                }}>
                                    <CircularProgress size={35} />
                                    Loading more conversations...
                                </div>
                            </Typography>
                        </li>
                    )}
                </ul>
                <MenuAction
                    anchorEl={anchorEl}
                    handleCloseMenu={handleCloseMenu}
                    handleMenuAction={handleMenuAction}
                    member={selectMember}
                />

                {/* Add Customer Dialog */}
                <AddCustomerDialog
                    open={addCustomerDialogOpen}
                    onClose={handleCloseAddCustomerDialog}
                    selectedMember={selectedMemberForDialog}
                    auth={auth}
                    onSuccess={handleAddCustomerSuccess}
                />
            </div>
        </div >
    );
};

export default CustomerLists;

const MenuAction = ({
    anchorEl,
    handleCloseMenu,
    handleMenuAction,
    member
}) => {
    const handleMenuItemClick = (action) => {
        handleMenuAction(action, member);
    };

    return (
        <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleCloseMenu}
            anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
            }}
            transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
            }}
            onClick={(e) => e.stopPropagation()}
        >
            <MenuItem
                onClick={() => handleMenuItemClick(member?.IsPin === 1 ? "UnPin" : "Pin")}
            >
                📌 {member?.IsPin === 1 ? "Unpin" : "Pin"}
            </MenuItem>
            <MenuItem
                onClick={() => handleMenuItemClick(member?.IsStar === 1 ? "UnStar" : "Star")}
            >
                ⭐ {member?.IsStar === 1 ? "Unfavorite" : "Favorite"}
            </MenuItem>
            <MenuItem
                onClick={() => handleMenuItemClick(member?.IsArchived === 1 ? "UnArchive" : "Archive")}
            >
                📂 {member?.IsArchived === 1 ? "Unarchive" : "Archive"}
            </MenuItem>
            <MenuItem
                onClick={() => handleMenuItemClick("AddCustomer")}
            >
                👤 Add to Customer
            </MenuItem>
        </Menu>
    );
};