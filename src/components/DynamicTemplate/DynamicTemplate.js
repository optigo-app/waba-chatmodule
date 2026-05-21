import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './DynamicTemplate.scss';
import { Skeleton, IconButton } from '@mui/material';
import { ChevronLeft, ChevronRight, ExternalLink, Phone } from 'lucide-react';

const DynamicTemplate = ({
    templateName = 'album',
    params = {},
    language = 'en',
    components = []
}) => {
    const [templateData, setTemplateData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const token = JSON?.parse(sessionStorage.getItem('userData')) || {};
    console.log(token?.isMeta,'token--->>>');
    debugger
    const API_BASE_URL = token?.isMeta == 1 ? process.env.REACT_APP_META_TEMP_BASE_URL : process.env.REACT_APP_MPL_TEMP_BASE_URL;

    useEffect(() => {
        const fetchTemplate = async () => {
            if (templateName) {
                setLoading(true);
                try {
                    const response = await axios.get(
                        `${API_BASE_URL}/${token?.whatsappPhoneNo}/message_templates?name=${templateName}`,
                        {
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': token?.isMeta == 1 ? 'Bearer ' + token?.whatsappKey : 'Bearer HCtiBj7qarnyrvlOYaOicsPNuSYRDhtaoTSIahd9WJnWJmUnorBgE0h99w34dDVQ0jZIUtjvCRbGBc8AEC5Rwt9QR6nKqjsaseDQaOTQKm60lOO6HM5sTxgj2j8'
                            }
                        }
                    );

                    if (response.data?.data?.length > 0) {
                        setTemplateData(response.data.data[0]);
                    } else {
                        setError('Template not found');
                    }
                } catch (err) {
                    console.error('Error fetching template:', err);
                    setError('Failed to load template');
                } finally {
                    setLoading(false);
                }
            }
        };

        fetchTemplate();
    }, [templateName]);

    const carouselRef = useRef(null);
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(true);

    const handleScroll = (e) => {
        const { scrollLeft, scrollWidth, clientWidth } = e.target;
        setShowLeftArrow(scrollLeft > 10);
        setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    };

    const scrollCarousel = (direction) => {
        if (carouselRef.current) {
            const clientWidth = carouselRef.current.clientWidth;
            // Scroll by almost full width to show the next card clearly
            const scrollAmount = direction === 'left' ? -clientWidth : clientWidth;
            carouselRef.current.scrollBy({
                left: scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    const renderTemplateComponent = (component, isCarouselCard = false) => {
        if (!component) return null;

        switch (component.type) {
            case 'HEADER':
                if (component.format === 'IMAGE') {
                    const imageUrl = component.example?.header_handle?.[0] || component.example?.header_url?.[0];
                    return (
                        <div className="template-header image">
                            {imageUrl ? (
                                <img src={imageUrl} alt="Header" className="header-image" />
                            ) : (
                                <Skeleton variant="rectangular" width="100%" height={200} />
                            )}
                        </div>
                    );
                }
                return component.text ? <div className="template-header text">{component.text}</div> : null;

            case 'BODY':
                let bodyText = component.text || '';
                // Replace placeholders with params if not in a carousel card (params usually apply to main body)
                if (!isCarouselCard) {
                    Object.entries(params).forEach(([key, value], index) => {
                        const placeholder = new RegExp(`\\{\\{\\s*${index + 1}\\s*\\}\\}`, 'g');
                        bodyText = bodyText.replace(placeholder, value || '');
                    });
                }

                return (
                    <div className="template-body">
                        {bodyText.split('\n').map((line, i) => (
                            <p key={i}>{line}</p>
                        ))}
                    </div>
                );

            case 'FOOTER':
                return (
                    <div className="template-footer">
                        {component.text}
                    </div>
                );

            case 'BUTTONS':
                return (
                    <div className="template-buttons">
                        {component.buttons?.map((button, i) => {
                            const isUrl = button.type === 'URL';
                            const isCall = button.type === 'PHONE_NUMBER';
                            const isQuickReply = button.type === 'QUICK_REPLY';

                            return (
                                <button
                                    key={i}
                                    className={`template-button ${button.type?.toLowerCase() || ''}`}
                                    onClick={() => {
                                        if (isUrl && button.url) window.open(button.url, '_blank');
                                        if (isCall && button.phone_number) window.location.href = `tel:${button.phone_number}`;
                                    }}
                                >
                                    {isUrl && <ExternalLink size={16} className="button-icon" />}
                                    {isCall && <Phone size={16} className="button-icon" />}
                                    {button.text}
                                </button>
                            );
                        })}
                    </div>
                );

            case 'CAROUSEL':
                return (
                    <div className="template-carousel-wrapper">
                        {showLeftArrow && (
                            <IconButton 
                                className="carousel-nav-btn left" 
                                onClick={() => scrollCarousel('left')}
                                size="small"
                            >
                                <ChevronLeft size={20} />
                            </IconButton>
                        )}
                        
                        <div 
                            className="template-carousel" 
                            ref={carouselRef}
                            onScroll={handleScroll}
                        >
                            <div className="carousel-container">
                                {component.cards?.map((card, cardIndex) => (
                                    <div key={cardIndex} className="carousel-card">
                                        {card.components?.map((cardComp, compIndex) => (
                                            <div key={compIndex} className="card-component-wrapper">
                                                {renderTemplateComponent(cardComp, true)}
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {showRightArrow && component.cards?.length > 1 && (
                            <IconButton 
                                className="carousel-nav-btn right" 
                                onClick={() => scrollCarousel('right')}
                                size="small"
                            >
                                <ChevronRight size={20} />
                            </IconButton>
                        )}
                    </div>
                );

            default:
                return null;
        }
    };

    if (loading) {
        return <div className="loading">
            <Skeleton
                variant="rounded"
                className="media-skeleton"
                sx={{
                    width: "350px",
                    height: "220px",
                }}
            />
        </div>;
    }

    if (error) {
        return <div className="error">{error}</div>;
    }

    if (!templateData) {
        return null;
    }

    return (
        <div className="whatsapp-template">
            {templateData.components?.map((component, index) => (
                <div key={`${component.type}-${index}`}>
                    {renderTemplateComponent(component)}
                </div>
            ))}
        </div>
    );
};

export default DynamicTemplate;