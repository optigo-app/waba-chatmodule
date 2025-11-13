import { useEffect, useRef } from 'react';

const useLazyLoading = (callback, hasMore, isLoading) => {
    const observer = useRef();

    const lastElementRef = (node) => {
        if (isLoading) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && hasMore) {
                callback();
            }
        });
        if (node) observer.current.observe(node);
    };

    return lastElementRef;
};

export default useLazyLoading;