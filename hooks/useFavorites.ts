import { useState, useEffect, useCallback } from 'react';

export const useFavorites = () => {
    const [favorites, setFavorites] = useState<Set<string>>(() => {
        const saved = localStorage.getItem('ai-radar-favorites');
        return saved ? new Set(JSON.parse(saved)) : new Set();
    });

    useEffect(() => {
        localStorage.setItem('ai-radar-favorites', JSON.stringify(Array.from(favorites)));
    }, [favorites]);

    const toggleFavorite = useCallback((id: string) => {
        setFavorites(prev => {
            const newFavorites = new Set(prev);
            if (newFavorites.has(id)) {
                newFavorites.delete(id);
            } else {
                newFavorites.add(id);
            }
            return newFavorites;
        });
    }, []);

    const isFavorite = useCallback((id: string) => favorites.has(id), [favorites]);

    return { favorites, toggleFavorite, isFavorite };
};
