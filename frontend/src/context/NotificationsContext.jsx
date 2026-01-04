import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ResumenNotificaciones, MarcarNotificacionLeida } from '../../wailsjs/go/services/NotificationsService';
import notificationMp3 from '../assets/sounds/notificacion.mp3';
import { useScreenLock } from './ScreenLockContext';

const NotificationsContext = createContext(null);

const DEFAULT_POLL_MS = 30000;

function tryPlayNotificationSound() {
    try {
        const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextCtor) return;

        const ctx = new AudioContextCtor();
        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();

        oscillator.type = 'sine';
        oscillator.frequency.value = 880;

        const now = ctx.currentTime;
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.15, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

        oscillator.connect(gain);
        gain.connect(ctx.destination);

        oscillator.start(now);
        oscillator.stop(now + 0.2);

        oscillator.onended = () => {
            try {
                ctx.close();
            } catch {
                // ignore
            }
        };
    } catch {
        // Algunos entornos bloquean autoplay de audio; ignoramos.
    }
}

export function NotificationsProvider({ children, pollMs = DEFAULT_POLL_MS }) {
    const { user } = useScreenLock();
    const role = user?.rol || 'admin';

    const [items, setItems] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const audioRef = useRef(null);
    const audioUnlockedRef = useRef(false);

    const prevIdsRef = useRef(new Set());
    const hasFetchedOnceRef = useRef(false);

    useEffect(() => {
        // Preparamos un audio real (mp3) para que el sonido sea consistente.
        audioRef.current = new Audio(notificationMp3);
        audioRef.current.preload = 'auto';

        // Muchos navegadores/browsers embebidos bloquean audio hasta que haya interacción del usuario.
        // Lo “desbloqueamos” con el primer click/tap.
        const unlock = async () => {
            if (!audioRef.current || audioUnlockedRef.current) return;
            try {
                audioRef.current.muted = true;
                await audioRef.current.play();
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
                audioRef.current.muted = false;
                audioUnlockedRef.current = true;
            } catch {
                // Si falla, igual dejamos fallback (beep) y reintentaremos luego.
            }
        };

        window.addEventListener('pointerdown', unlock, { once: true });
        return () => window.removeEventListener('pointerdown', unlock);
    }, []);

    const refresh = async ({ playSoundOnNew = false } = {}) => {
        const res = await ResumenNotificaciones(role, 10);
        const list = Array.isArray(res?.items) ? res.items : [];

        const nextIds = new Set(list.map(n => n.id));
        const prevIds = prevIdsRef.current;

        const newOnes = [];
        for (const n of list) {
            if (!prevIds.has(n.id)) newOnes.push(n.id);
        }

        setItems(list);
        setUnreadCount(res?.unread_count || 0);
        prevIdsRef.current = nextIds;

        if (playSoundOnNew && hasFetchedOnceRef.current && newOnes.length > 0) {
            // 1) Intentar MP3
            try {
                if (audioRef.current) {
                    audioRef.current.currentTime = 0;
                    await audioRef.current.play();
                } else {
                    throw new Error('no-audio');
                }
            } catch {
                // 2) Fallback: beep
                tryPlayNotificationSound();
            }
        }

        hasFetchedOnceRef.current = true;
    };

    useEffect(() => {
        refresh({ playSoundOnNew: false });
        const id = setInterval(() => refresh({ playSoundOnNew: true }), pollMs);
        return () => clearInterval(id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pollMs, role]);

    const markAsRead = async (id) => {
        await MarcarNotificacionLeida(id);
        await refresh({ playSoundOnNew: false });
    };

    const notifications = useMemo(() => {
        return items.map(n => ({
            id: n.id,
            titulo: n.titulo,
            text: n.mensaje || '',
            time: n.fecha_creacion,
            unread: !n.leida,
        }));
    }, [items]);

    const value = useMemo(() => ({
        notifications,
        unreadCount,
        refresh,
        markAsRead,
    }), [notifications, unreadCount]);

    return (
        <NotificationsContext.Provider value={value}>
            {children}
        </NotificationsContext.Provider>
    );
}

export function useNotifications() {
    const ctx = useContext(NotificationsContext);
    if (!ctx) {
        throw new Error('useNotifications debe usarse dentro de NotificationsProvider');
    }
    return ctx;
}
