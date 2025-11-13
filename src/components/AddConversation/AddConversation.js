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
    Tab
} from '@mui/material';
import { Circle, Search, Clear } from '@mui/icons-material';
import './AddConversation.scss';
import { formatChatTimestamp } from '../../utils/DateFnc';
import { stringAvatar } from '../../utils/StringAvatar';
import { fetchCustomerLists } from '../../API/CustomerLists/CustomerLists';
import { useLocation } from 'react-router-dom';
import { LoginContext } from '../../context/LoginData';

const AddConversation = ({ onCustomerSelect = () => { }, selectedCustomer = null, selectedTag, selectedStatus = 'All' }) => {

    const [searchTerm, setSearchTerm] = useState('');
    const [tabValue, setTabValue] = useState(0);
    const [chatMembers, setChatMembers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const location = useLocation();
    const [currentPage, setCurrentPage] = useState(1);
    const containerRef = useRef(null);
    const pageSize = 100;
    const searchTimeoutRef = useRef(null);
    const { auth, PERMISSION_SET } = useContext(LoginContext);

    const can = (perm) => PERMISSION_SET?.has(perm);

    const transformMemberData = useCallback((items) => {
        return items?.map((item) => {
            const name = item?.CustomerName || item?.CustomerPhone;
            const includesNumber = /\d/.test(name);
            return {
                ...item,
                name: name,
                avatar: includesNumber ? "icon" : null,
                avatarConfig: includesNumber ? null : stringAvatar(name),
            };
        }) || [];
    }, []);

    const loadMembers = useCallback(async (page = 1, reset = false, search = null) => {
        if (loading || (!reset && !hasMore)) return;

        if (!auth?.token || !auth?.userId) {
            console.log('⚠️ No auth token available, skipping conversation load');
            return;
        }

        setLoading(true);
        try {
            // Use the provided search term or the current searchTerm state if not provided
            const searchToUse = search !== null ? search : searchTerm;
            const response = await fetchCustomerLists(page, pageSize, searchToUse, auth?.userId);
            const transformedData = transformMemberData(response.data);

            setChatMembers(prev => ({
                data: reset ? transformedData : [...(prev.data || []), ...transformedData],
                total: response.total
            }));

            const moreAvailable = response?.hasMore ?? transformedData.length > 0;
            setHasMore(moreAvailable);

            // ✅ Only advance page if more data exists
            if (moreAvailable) setCurrentPage(page);
        } catch (error) {
            console.error('Error loading members:', error);
        } finally {
            setLoading(false);
        }
    }, [loading, pageSize, transformMemberData, searchTerm]);

    useEffect(() => {
        loadMembers(1, true);

        // Cleanup function to clear any pending timeouts
        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, []);

    const debouncedSearch = useCallback((value) => {
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        searchTimeoutRef.current = setTimeout(() => {
            loadMembers(1, true, value); // ✅ Pass the latest search value explicitly
        }, 500);
    }, [loadMembers]);

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

        // More sensitive scroll detection - trigger when 80px from bottom
        if (scrollTop + clientHeight >= scrollHeight - 80) {
            console.log('Scroll triggered - Loading page:', currentPage + 1);
            loadMembers(currentPage + 1, false);
        }
    }, [loading, hasMore, currentPage, loadMembers]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        container.addEventListener('scroll', handleScroll, { passive: true });
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
            })

    return (
        <div className="customer_lists_mainDiv_2">
            <div className="customer_lists_header">
                <Typography variant="h6" className="header_title">Chat Members</Typography>
                {/* <Chip
                    label={`${chatMembers?.data?.filter(member => member.isOnline).length || 0} online`}
                    size="small"
                    color="primary"
                    variant="outlined"
                /> */}
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
                </Tabs>
            </div>

            <div className="customer_lists_main">
                <ul ref={containerRef} style={{ maxHeight: '80vh', overflowY: 'auto' }}>
                    {can(16) ? (
                        <>
                            {loading && (!chatMembers?.data || chatMembers?.data.length === 0) ? (
                                // When first load is happening
                                <li style={{ textAlign: 'center', padding: '20px' }}>
                                    <Typography variant="body2" color="textSecondary">
                                        Loading conversations...
                                    </Typography>
                                </li>
                            ) : filteredMembers?.length > 0 ? (
                                filteredMembers.map((member) => {
                                    return (
                                        <li key={member.id}>
                                            <div
                                                className={`member-item ${selectedCustomer?.CustomerId === member.CustomerId ? 'active' : ''}`}
                                                onClick={() => onCustomerSelect(member)}
                                            >
                                                <div className="member-avatar">
                                                    <Avatar {...member.avatarConfig} />
                                                </div>
                                                <div className="member-info">
                                                    <div className="member-header">
                                                        <Typography variant="subtitle1" className="member-name">
                                                            {member.name}
                                                        </Typography>
                                                    </div>
                                                    <div className="member-message">
                                                        <Typography variant="body2" className="last-message">
                                                            {member.CustomerPhone}
                                                        </Typography>
                                                    </div>
                                                </div>
                                            </div>
                                        </li>
                                    )
                                })
                            ) : (
                                <li style={{ textAlign: 'center', padding: '20px' }}>
                                    <Typography variant="body2" color="textSecondary">
                                        No conversations found.
                                    </Typography>
                                </li>
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
                        <div className="no-access-message1">
                            <Typography variant="body2" color="error">
                                🚫 You don’t have access to view ATM Binding Customers lists.
                            </Typography>
                        </div>
                    )}
                </ul>
            </div>
        </div>
    )
}

export default AddConversation
