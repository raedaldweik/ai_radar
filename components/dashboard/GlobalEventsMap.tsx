import React, { useEffect, useRef, useState, useContext, useCallback } from 'react';
import { globalEventsData } from '../../data/dashboard';
import { LanguageContext } from '../../i18n/LanguageContext';

// Mapbox GL JS is loaded from a script tag in index.html
declare const mapboxgl: any;

export const GlobalEventsMap: React.FC = () => {
    const { t } = useContext(LanguageContext);
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<any>(null);
    const userInteractingRef = useRef(false);
    const [spinEnabled, setSpinEnabled] = useState(true);
    const spinEnabledRef = useRef(spinEnabled);

    useEffect(() => {
        spinEnabledRef.current = spinEnabled;
    }, [spinEnabled]);

    const spinGlobe = useCallback(() => {
        const map = mapRef.current;
        if (!map || !spinEnabledRef.current || userInteractingRef.current) return;

        const secondsPerRevolution = 120;
        const maxSpinZoom = 5;
        const slowSpinZoom = 3;

        const zoom = map.getZoom();
        if (zoom < maxSpinZoom) {
            let distancePerSecond = 360 / secondsPerRevolution;
            if (zoom > slowSpinZoom) {
                const zoomDif = (maxSpinZoom - zoom) / (maxSpinZoom - slowSpinZoom);
                distancePerSecond *= zoomDif;
            }
            const center = map.getCenter();
            center.lng -= distancePerSecond;
            map.easeTo({ center, duration: 1000, easing: (n: number) => n });
        }
    }, []);
    
    useEffect(() => {
        if (mapRef.current || !mapContainerRef.current) return;

        mapboxgl.accessToken = 'pk.eyJ1IjoicmFlZGR3ZWlrIiwiYSI6ImNtMTZqZGtpeTBta2cydnM4NjBkenhsMG8ifQ.r3ufHWJMoGh_DCH3XDhDAg';
        
        const map = new mapboxgl.Map({
            container: mapContainerRef.current,
            style: 'mapbox://styles/mapbox/standard-satellite',
            projection: 'globe',
            zoom: 1.5,
            center: [-90, 40],
        });
        mapRef.current = map;
        
        map.on('style.load', () => {
            map.setFog({});
        });

        map.on('load', () => {
             globalEventsData.forEach(event => {
                const el = document.createElement('div');
                el.className = 'event-marker';

                const popup = new mapboxgl.Popup({ offset: 25, closeButton: false })
                    .setHTML(
                        `<div class="p-2">
                            <h4 class="font-bold text-sky-400 mb-1 text-base">${event.eventName}</h4>
                            <p class="text-sm text-slate-300">${event.city}, ${event.country}</p>
                            <p class="text-xs text-slate-400 italic mt-1">${event.date}</p>
                        </div>`
                    );

                new mapboxgl.Marker(el)
                    .setLngLat([event.lng, event.lat])
                    .setPopup(popup)
                    .addTo(map);
            });
            spinGlobe();
        });

        const onInteractionStart = () => { userInteractingRef.current = true; };
        const onInteractionEnd = () => { userInteractingRef.current = false; spinGlobe(); };

        map.on('mousedown', onInteractionStart);
        map.on('touchstart', onInteractionStart);
        map.on('mouseup', onInteractionEnd);
        map.on('touchend', onInteractionEnd);
        map.on('dragend', onInteractionEnd);
        map.on('pitchend', onInteractionEnd);
        map.on('rotateend', onInteractionEnd);
        map.on('moveend', spinGlobe);

        return () => {
            map.off('mousedown', onInteractionStart);
            map.off('touchstart', onInteractionStart);
            map.off('mouseup', onInteractionEnd);
            map.off('touchend', onInteractionEnd);
            map.off('dragend', onInteractionEnd);
            map.off('pitchend', onInteractionEnd);
            map.off('rotateend', onInteractionEnd);
            map.off('moveend', spinGlobe);
            map.remove();
        };
    }, [spinGlobe]);

    useEffect(() => {
        if (mapRef.current) {
            if (spinEnabled) {
                spinGlobe();
            } else {
                mapRef.current.stop();
            }
        }
    }, [spinEnabled, spinGlobe]);

    const toggleSpin = () => {
        setSpinEnabled(prev => !prev);
    };

    return (
        <div className="relative w-full h-96">
            <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />
            <button
                onClick={toggleSpin}
                className="font-bold text-xs leading-5 bg-slate-800/60 backdrop-blur text-white absolute top-4 left-1/2 z-10 border border-white/10 w-36 -ml-[72px] block cursor-pointer py-2 px-4 rounded-full transition-colors hover:bg-slate-700/80"
                aria-label={spinEnabled ? t('dashboard.pauseRotation') : t('dashboard.startRotation')}
            >
                {/* FIX: The `t` function's second argument must be an options object, not a string. Corrected by removing the invalid argument. */}
                {spinEnabled ? t('dashboard.pauseRotation') : t('dashboard.startRotation')}
            </button>
        </div>
    );
};
