import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, Volume2, Gauge } from 'lucide-react';

export default function AudioPlayer({ text, language = 'English' }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [rate, setRate] = useState(1.0);
  const [supported, setSupported] = useState(true);
  const utteranceRef = useRef(null);

  useEffect(() => {
    if (!('speechSynthesis' in window)) {
      setSupported(false);
    }
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // When text changes, stop previous speech
  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      setIsPaused(false);
    }
  }, [text]);

  const handlePlay = () => {
    if (!supported || !text) return;

    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      setIsPlaying(true);
      return;
    }

    window.speechSynthesis.cancel();
    // Clean markdown bold or bullet markers before speaking
    const cleanText = text.replace(/[*#•_-]/g, ' ').replace(/\s+/g, ' ').trim();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utteranceRef.current = utterance;

    utterance.rate = rate;
    
    // Attempt language tag matching
    if (language.toLowerCase() === 'tamil' || language.toLowerCase() === 'tanglish') {
      utterance.lang = 'ta-IN';
    } else if (language.toLowerCase() === 'hindi') {
      utterance.lang = 'hi-IN';
    } else {
      utterance.lang = 'en-US';
    }

    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    utterance.onerror = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
    setIsPaused(false);
  };

  const handlePause = () => {
    if (!supported) return;
    if (isPlaying) {
      window.speechSynthesis.pause();
      setIsPaused(true);
      setIsPlaying(false);
    }
  };

  const handleStop = () => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
  };

  const handleRateChange = (newRate) => {
    setRate(newRate);
    if (isPlaying && utteranceRef.current) {
      handleStop();
    }
  };

  if (!supported) {
    return (
      <div className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/40 p-2 rounded border border-amber-200 dark:border-amber-800">
        Audio speech synthesis is not supported on this browser.
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/60 rounded-xl">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-sm">
          <Volume2 className="w-4 h-4 animate-pulse" />
        </div>
        <div>
          <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
            Audio Summary Reader
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            {isPlaying ? 'Playing audio summary...' : isPaused ? 'Paused' : 'Ready to listen'}
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
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg transition-colors shadow-sm"
          >
            <Play className="w-3.5 h-3.5 fill-current" /> {isPaused ? 'Resume' : 'Listen'}
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
  );
}
