import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, Volume2, Gauge, AlertCircle, RefreshCw } from 'lucide-react';
import { synthesizeSpeech } from '../../services/api';

const LANGUAGE_LOCALE_MAP = {
  'english': 'en-US',
  'tamil': 'ta-IN',
  'tanglish': 'ta-IN',
  'malayalam': 'ml-IN',
  'hindi': 'hi-IN',
  'telugu': 'te-IN',
  'kannada': 'kn-IN',
  'spanish': 'es-ES',
  'french': 'fr-FR',
  'german': 'de-DE'
};

export function getLanguageLocale(languageName) {
  if (!languageName) return 'en-US';
  const norm = languageName.trim().toLowerCase();
  if (LANGUAGE_LOCALE_MAP[norm]) return LANGUAGE_LOCALE_MAP[norm];
  if (norm.startsWith('ta')) return 'ta-IN';
  if (norm.startsWith('ml')) return 'ml-IN';
  if (norm.startsWith('hi')) return 'hi-IN';
  if (norm.startsWith('te')) return 'te-IN';
  if (norm.startsWith('kn')) return 'kn-IN';
  if (norm.startsWith('en')) return 'en-US';
  return 'en-US';
}

export default function AudioPlayer({ text, language = 'English' }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rate, setRate] = useState(1.0);
  const [error, setError] = useState(null);

  const audioRef = useRef(null);
  const audioUrlRef = useRef(null);

  // Stop and clean up audio when text or language changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
    setIsPlaying(false);
    setIsPaused(false);
    setLoading(false);
    setError(null);

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = null;
      }
    };
  }, [text, language]);

  const handlePlay = async () => {
    if (!text || loading) return;

    // 1. If audio already loaded and currently paused, resume playback
    if (audioRef.current && isPaused) {
      try {
        await audioRef.current.play();
        setIsPlaying(true);
        setIsPaused(false);
        return;
      } catch (err) {
        console.warn('Resume failed, fetching fresh audio:', err);
      }
    }

    // 2. If audio is already loaded and ready, play from start
    if (audioRef.current) {
      try {
        audioRef.current.currentTime = 0;
        audioRef.current.playbackRate = rate;
        await audioRef.current.play();
        setIsPlaying(true);
        setIsPaused(false);
        return;
      } catch (err) {
        console.warn('Playback failed, refetching:', err);
      }
    }

    // 3. Request high-fidelity TTS audio from backend API
    setLoading(true);
    setError(null);

    try {
      const cleanText = text
        .replace(/^[•\-\*✓\d\.\)\s]+/gm, '')
        .replace(/[*#_~`]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      const res = await synthesizeSpeech({
        text: cleanText || text,
        language: language,
        speed: rate
      });

      const audioBlob = res.data;
      if (!audioBlob || audioBlob.size < 50) {
        throw new Error('TTS service returned empty audio data.');
      }

      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
      }

      const audioUrl = URL.createObjectURL(audioBlob);
      audioUrlRef.current = audioUrl;

      const audio = new Audio(audioUrl);
      audio.playbackRate = rate;

      audio.onplay = () => {
        setIsPlaying(true);
        setIsPaused(false);
        setLoading(false);
      };

      audio.onpause = () => {
        if (!audio.ended) {
          setIsPlaying(false);
          setIsPaused(true);
        }
      };

      audio.onended = () => {
        setIsPlaying(false);
        setIsPaused(false);
      };

      audio.onerror = (e) => {
        console.error('Audio playback error:', e);
        setIsPlaying(false);
        setIsPaused(false);
        setLoading(false);
        setError('Audio playback error occurred.');
      };

      audioRef.current = audio;
      await audio.play();
    } catch (err) {
      console.error('TTS error:', err);
      const msg = err.response?.data?.detail || err.message || `Failed to generate audio for ${language}.`;
      setError(msg);
      setIsPlaying(false);
      setIsPaused(false);
    } finally {
      setLoading(false);
    }
  };

  const handlePause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPaused(true);
      setIsPlaying(false);
    }
  };

  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setIsPaused(false);
  };

  const handleRateChange = (newRate) => {
    setRate(newRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = newRate;
    }
  };

  const locale = getLanguageLocale(language);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/60 rounded-xl">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-sm">
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Volume2 className="w-4 h-4 animate-pulse" />
            )}
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <span>Audio Summary Reader</span>
              <span className="px-1.5 py-0.2 rounded bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-[10px] font-medium">
                {language} ({locale})
              </span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              {loading
                ? 'Synthesizing audio voice...'
                : isPlaying
                ? 'Playing audio summary...'
                : isPaused
                ? 'Paused'
                : 'Ready to listen'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isPlaying ? (
            <button
              onClick={handlePause}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg transition-colors shadow-sm"
            >
              <Pause className="w-3.5 h-3.5" /> Pause
            </button>
          ) : (
            <button
              onClick={handlePlay}
              disabled={loading || !text}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg transition-colors shadow-sm disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Synthesizing...
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" /> {isPaused ? 'Resume' : 'Listen'}
                </>
              )}
            </button>
          )}

          {(isPlaying || isPaused) && (
            <button
              onClick={handleStop}
              className="p-1.5 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
              title="Stop playback"
            >
              <Square className="w-4 h-4 fill-current" />
            </button>
          )}

          {/* Speed selector */}
          <div className="flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-0.5 text-xs text-slate-600 dark:text-slate-300">
            <Gauge className="w-3 h-3 ml-1 text-slate-400" />
            {[0.75, 1.0, 1.25, 1.5].map((s) => (
              <button
                key={s}
                onClick={() => handleRateChange(s)}
                className={`px-1.5 py-0.5 rounded text-[11px] font-medium transition-colors ${
                  rate === s
                    ? 'bg-indigo-600 text-white'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="text-xs text-red-800 dark:text-red-200 bg-red-50 dark:bg-red-950/40 p-2.5 rounded-xl border border-red-200 dark:border-red-800 flex items-center gap-2 animate-fade-in">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
