import React, { useContext, useEffect, useState } from 'react'
import './Sidebar.scss'
import { HomeIcon, Users, Bell, Megaphone, MessageCircle } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTagsContext } from '../../contexts/TagsContexts'
import { fetchAllTagsApi } from '../../API/FetchTags/FetchAllTagsApi'
import { LoginContext } from '../../context/LoginData'
import CryptoJS from "crypto-js";

const Sidebar = ({ onStatusSelect, selectedStatus, onTagSelect, selectedTag }) => {

    const location = useLocation();
    const [allTagLists, setAllTagsLists] = useState([]);
    const { refetchTrigger } = useTagsContext();
    const [activePath, setActivePath] = useState(location.pathname);
    const { auth } = useContext(LoginContext);
    const navigate = useNavigate();
    const token = JSON.parse(sessionStorage.getItem("token"));
    const Token = {
        ...token, userId: auth?.userId, id: auth?.id, username: auth?.username
    }

    const local = "http://localhost:3000";
    const live = "https://nxtwababroadcast.optigoapps.com";

    const isLocal = process.env.NODE_ENV === "development" ? local : live;

    const SECRET_KEY = "chat-broadcast-config";

    const encryptToken = (token) => {
        if (!token) return "";
        try {
            const ciphertext = CryptoJS.AES.encrypt(JSON.stringify(token), SECRET_KEY).toString();
            return encodeURIComponent(ciphertext); // safe for URL
        } catch (error) {
            console.error('Error encrypting token:', error);
            return "";
        }
    };

    const menuItems = [
        { path: '/', icon: <HomeIcon />, label: 'Inbox' },
        { path: '/add-conversation', icon: <Users />, label: 'Add Conversation' },
        { path: `${isLocal}?token=${encryptToken(Token)}`, icon: <Megaphone />, label: 'CRM Broadcast' },
        // { path: '/notification', icon: <Bell />, label: 'Notification' },
        // { path: '/users', icon: <Users />, label: 'Users' },
        // { path: '/documents', icon: <FileText />, label: 'Documents' },
        // { path: '/settings', icon: <Settings />, label: 'Settings' },
    ];
    // Add archive menu dynamically if count > 1
    // if (archieve > 0) {
    //     menuItems.push({ path: '/archieve', icon: <ArchiveRestore />, label: "Archieve" });
    // }

    const handleStatusClick = (status) => {
        if (selectedStatus === status) {
            onStatusSelect('All'); // Reset to default
        } else {
            onStatusSelect(status);
        }
    };

    const handleTagsClick = (tag) => {
        if (selectedTag === tag) {
            onTagSelect('All'); // Reset to default
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

    return (
        <div className="sidebar_mainDiv">
            <div className="sidebar-content">
                <div>
                    <div className="agentic-chat-header" onClick={() => navigate("/")}>
                        <div className="agentic-chat-header__icon">
                            <div className="icon-bg">
                                <MessageCircle className="icon" />
                            </div>
                            <h1 className="title">Agentic chat</h1>
                        </div>
                    </div>
                    <div className="sidebar_main">
                        <ul>
                            {menuItems.map((item) => (
                                <li key={item.path}>
                                    {item?.label === "CRM Broadcast" ? (
                                        <a
                                            href={`${isLocal}?token=${encryptToken(Token)}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            {item.icon}
                                            <span>{item.label}</span>
                                        </a>
                                    ) : (
                                        <Link
                                            onClick={() => setActivePath(item.path)}
                                            to={item.path}
                                            className={
                                                activePath === item.path ||
                                                    (activePath === "/archieve" && item.path === "/")
                                                    ? "active"
                                                    : ""
                                            }
                                        >
                                            {item.icon}
                                            <span>{item.label}</span>
                                        </Link>
                                    )}
                                </li>
                            ))}

                        </ul>
                    </div>

                    {allTagLists?.length > 0 &&
                        <div className="sidebar_main_tags">
                            <div className="sidebar_tags_label">Tags</div>
                            <ul>
                                {allTagLists.map((tag) => {
                                    return (
                                        <li
                                            key={tag.TagId}
                                            className={selectedTag?.Id === tag.Id ? 'active' : ''}
                                            onClick={() => handleTagsClick(tag)}
                                        >
                                            <span style={{ backgroundColor: tag.color || '#e0f2f1' }}>
                                                {tag.TagName}
                                            </span>
                                        </li>
                                    )
                                })}
                            </ul>
                        </div>
                    }
                </div>

                {/* This empty div pushes the content above it to take available space */}
                <div style={{ flexGrow: 1 }}></div>

                {/* Powered by section at the bottom */}
                <div className="powered-by">
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
