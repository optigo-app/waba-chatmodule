import { useContext, useEffect, useMemo, useRef, useState } from 'react'
import './Sidebar.scss'
import { HomeIcon, Users, Megaphone, MessageCircle, Workflow, ChevronLeft } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTagsContext } from '../../contexts/TagsContexts'
import { fetchAllTagsApi } from '../../API/FetchTags/FetchAllTagsApi'
import { LoginContext } from '../../context/LoginData'
import CryptoJS from "crypto-js";
import { IconButton, Tooltip } from '@mui/material'
import TagSidebar from './TagSidebar';

const Sidebar = ({ onStatusSelect, selectedStatus, onTagSelect, selectedTag, isCollapsed = false, onCollapsedChange = () => { } }) => {

    const location = useLocation();
    const [allTagLists, setAllTagsLists] = useState([]);
    const { refetchTrigger } = useTagsContext();
    const [activePath, setActivePath] = useState(location.pathname);
    const { auth } = useContext(LoginContext);
    const navigate = useNavigate();
    const [tagsMenuAnchorEl, setTagsMenuAnchorEl] = useState(null);
    const [tagSearchTerm, setTagSearchTerm] = useState('');
    const tagsMenuListRef = useRef(null);
    const token = JSON.parse(sessionStorage.getItem("token"));
    const Token = {
        ...token, userId: auth?.userId, id: auth?.id, username: auth?.username
    }

    const urls = {
        broadcast: {
            local: "http://localhost:3000",
            live: "https://nxtwababroadcast.optigoapps.com",
            SECRET_KEY: "chat-broadcast-config"
        },
        automation: {
            local: "http://localhost:3000",
            live: "https://zen1.optigoapps.com",
            SECRET_KEY: "chat-automation-config"
        },
    };

    const isLocal = process.env.NODE_ENV === "development";

    const broadcastURL = urls.broadcast[isLocal ? "local" : "live"];
    const automationURL = urls.automation[isLocal ? "local" : "live"];

    const broadcast_SECRET_KEY = urls.broadcast.SECRET_KEY;
    const automation_SECRET_KEY = urls.automation.SECRET_KEY;

    const encryptToken = (token, page) => {
        if (!token) return "";
        try {
            const ciphertext = CryptoJS.AES.encrypt(JSON.stringify(token), page === "broadcast" ? broadcast_SECRET_KEY : automation_SECRET_KEY).toString();
            return encodeURIComponent(ciphertext); // safe for URL
        } catch (error) {
            console.error('Error encrypting token:', error);
            return "";
        }
    };

    const appURLs = {
        broadcast: broadcastURL,
        automation: automationURL,
    };

    const ICON_PROPS = { size: 20, strokeWidth: 2 };

    const menuItems = [
        { type: "internal", path: "/", icon: <HomeIcon {...ICON_PROPS} />, label: "Inbox" },
        { type: "internal", path: "/add-conversation", icon: <Users {...ICON_PROPS} />, label: "Add Conversation" },

        { type: "external", app: "broadcast", icon: <Megaphone {...ICON_PROPS} />, label: "CRM Broadcast" },
        { type: "external", app: "automation", icon: <Workflow {...ICON_PROPS} />, label: "Automation Workflow" }
    ];

    const getTagId = useCallbackSafe((tag) => tag?.TagId ?? tag?.Id ?? tag?.id);

    function useCallbackSafe(fn) {
        return fn;
    }

    const selectedTagId = useMemo(() => getTagId(selectedTag), [selectedTag]);

    const isTagsMenuOpen = Boolean(tagsMenuAnchorEl);
    const handleOpenTagsMenu = (e) => {
        setTagsMenuAnchorEl(e.currentTarget);
        setTagSearchTerm('');
    };
    const handleCloseTagsMenu = () => {
        setTagsMenuAnchorEl(null);
        setTagSearchTerm('');
    };

    const focusMenuItemByDirection = (direction) => {
        const menuListEl = tagsMenuListRef.current;
        if (!menuListEl) return;
        const items = Array.from(menuListEl.querySelectorAll('[role="menuitem"]'));
        if (!items.length) return;

        // Skip items that shouldn't be auto-focused (sticky search row, clear action row, etc.)
        const isSkippable = (el) => el.getAttribute('data-tags-skip-focus') === 'true';
        const firstTagItem = items.find((el) => !isSkippable(el));
        const lastTagItem = [...items].reverse().find((el) => !isSkippable(el));

        if (direction === 'down') {
            firstTagItem?.focus();
        } else if (direction === 'up') {
            lastTagItem?.focus();
        }
    };

    const filteredTagsForMenu = useMemo(() => {
        const list = Array.isArray(allTagLists) ? allTagLists : [];
        const q = String(tagSearchTerm || '').trim().toLowerCase();
        if (!q) return list;
        return list.filter((t) => String(t?.TagName || '').toLowerCase().includes(q));
    }, [allTagLists, tagSearchTerm]);

    const handleTagsClick = (tag) => {
        const clickedId = getTagId(tag);
        if (!clickedId || clickedId === selectedTagId) {
            onTagSelect('All');
        } else {
            onTagSelect(tag);
        }
    };

    const handleFetchAllTags = async () => {
        try {
            const response = await fetchAllTagsApi(auth?.userId);
            if (response?.rd) {
                setAllTagsLists(response.rd);
            }
        } catch (error) {
            console.error('Error fetching all tags:', error);
        }
    };

    useEffect(() => {
        if (auth?.token) {
            handleFetchAllTags();
        }
    }, [refetchTrigger]);

    useEffect(() => {
        setActivePath(location.pathname);
    }, [location.pathname]);

    const handleHeaderIconClick = () => {
        if (isCollapsed) {
            onCollapsedChange(false);
        }
        navigate("/");
    };

    return (
        <div
            className={`sidebar_mainDiv ${isCollapsed ? 'collapsed' : ''}`}
            style={{ width: isCollapsed ? 76 : 260, minWidth: isCollapsed ? 76 : 260 }}
        >
            <div className="sidebar-content">
                <div className="sidebar-sections">
                    <div className="agentic-chat-header">
                        <div className="agentic-chat-header__icon" onClick={handleHeaderIconClick}>
                            <div className="icon-bg">
                                <MessageCircle className="icon" {...ICON_PROPS} />
                            </div>
                            {!isCollapsed && <h1 className="title">Agentic chat</h1>}
                        </div>

                        {!isCollapsed && (
                            <Tooltip title="Collapse sidebar" placement="right" arrow>
                                <IconButton
                                    className="sidebar-toggle"
                                    size="small"
                                    onClick={() => onCollapsedChange(!isCollapsed)}
                                >
                                    <ChevronLeft size={18} />
                                </IconButton>
                            </Tooltip>
                        )}
                    </div>
                    <div className="sidebar_main">
                        <ul style={{ padding: '2px 0px' }} className='sidebar_main_ul'>
                            {menuItems.map((item) => {
                                const isExternal = item.type === "external";
                                const isActive = activePath === item.path ||
                                    (activePath === "/archieve" && item.path === "/");

                                let content = (
                                    <>
                                        {item.icon}
                                        {!isCollapsed && <span>{item.label}</span>}
                                    </>
                                );

                                return (
                                    <li key={item.label} className='sidebar_main_li'>
                                        <Tooltip
                                            title={item.label}
                                            placement="right"
                                            arrow
                                            disableHoverListener={!isCollapsed}
                                            disableFocusListener={!isCollapsed}
                                            disableTouchListener={!isCollapsed}
                                        >
                                            {isExternal ? (
                                                <a
                                                    href={`${appURLs[item.app]}?token=${encryptToken(Token, item.app)}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    {content}
                                                </a>
                                            ) : (
                                                <Link
                                                    to={item.path}
                                                    onClick={() => setActivePath(item.path)}
                                                    className={`sidebar_main_link ${isActive ? "active" : ""}`}
                                                >
                                                    {content}
                                                </Link>
                                            )}
                                        </Tooltip>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>

                    {allTagLists?.length > 0 &&
                        <div className="sidebar_main_tags">
                            {!isCollapsed ? (
                                <>
                                    <div className="sidebar_tags_label">Tags</div>
                                    <ul>
                                        {allTagLists.map((tag) => {
                                            const tagId = getTagId(tag);
                                            return (
                                                <li
                                                    key={tag.TagId}
                                                    className={selectedTagId && tagId && String(selectedTagId) === String(tagId) ? 'active' : ''}
                                                    onClick={() => handleTagsClick(tag)}
                                                >
                                                    <div className="tag-chip">
                                                        <span
                                                            className="tag-dot"
                                                            style={{ backgroundColor: tag.color || '#e0f2f1' }}
                                                        />
                                                        <span className="tag-name">{tag.TagName}</span>
                                                    </div>
                                                </li>
                                            )
                                        })}
                                    </ul>
                                </>
                            ) : (
                                <TagSidebar
                                    isCollapsed={isCollapsed}
                                    selectedTag={selectedTag}
                                    selectedTagId={selectedTagId}
                                    filteredTagsForMenu={filteredTagsForMenu}
                                    tagsMenuAnchorEl={tagsMenuAnchorEl}
                                    isTagsMenuOpen={isTagsMenuOpen}
                                    handleOpenTagsMenu={handleOpenTagsMenu}
                                    handleCloseTagsMenu={handleCloseTagsMenu}
                                    handleTagsClick={handleTagsClick}
                                    tagSearchTerm={tagSearchTerm}
                                    setTagSearchTerm={setTagSearchTerm}
                                    onTagSelect={onTagSelect}
                                    tagsMenuListRef={tagsMenuListRef}
                                    focusMenuItemByDirection={focusMenuItemByDirection}
                                    getTagId={getTagId}
                                    ICON_PROPS={ICON_PROPS}
                                />
                            )}
                        </div>
                    }
                </div>

                {/* Powered by section at the bottom */}
                <div className={isCollapsed ? "powered-by collapsed" : "powered-by"}>
                    <span>Powered by </span>
                    <div className="optigo-logo">
                        <img src="/logo1.png" alt="Optigo logo" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Sidebar
