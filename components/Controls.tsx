
import React from 'react';
import { EventType, DetailLevel, Status } from '../types';
import { EVENT_TYPE_OPTIONS, DETAIL_LEVEL_OPTIONS } from '../constants';
import { MicrophoneIcon, StopIcon, ProcessingIcon } from './Icon';

interface ControlsProps {
  eventType: EventType;
  setEventType: (type: EventType) => void;
  detailLevel: DetailLevel;
  setDetailLevel: (level: DetailLevel) => void;
  isProcessing: boolean;
  startProcessing: () => void;
  stopProcessing: () => void;
  status: Status;
}

const statusConfig = {
    [Status.IDLE]: { text: 'Ready', color: 'text-gray-400' },
    [Status.LISTENING]: { text: 'Listening', color: 'text-blue-400' },
    [Status.ANALYZING]: { text: 'Analyzing', color: 'text-purple-400' },
    [Status.SPEAKING]: { text: 'Speaking', color: 'text-green-400' },
    [Status.ERROR]: { text: 'Error', color: 'text-red-400' },
};

export const Controls: React.FC<ControlsProps> = ({
  eventType,
  setEventType,
  detailLevel,
  setDetailLevel,
  isProcessing,
  startProcessing,
  stopProcessing,
  status,
}) => {
  return (
    <div className="relative z-10 glass rounded-2xl p-8 space-y-8">
      <div className="space-y-6">
        <div>
          <label htmlFor="event-type" className="block text-sm font-medium text-gray-400 mb-3">
            Event Type
          </label>
          <select
            id="event-type"
            value={eventType}
            onChange={(e) => setEventType(e.target.value as EventType)}
            disabled={isProcessing}
            className="w-full glass rounded-xl p-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-glow-orange/50 disabled:opacity-50 transition-all"
          >
            {EVENT_TYPE_OPTIONS.map((option) => (
              <option key={option} value={option} className="bg-cosmic-dark">
                {option}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="detail-level" className="block text-sm font-medium text-gray-400 mb-3">
            Detail Level
          </label>
          <select
            id="detail-level"
            value={detailLevel}
            onChange={(e) => setDetailLevel(e.target.value as DetailLevel)}
            disabled={isProcessing}
            className="w-full glass rounded-xl p-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-glow-orange/50 disabled:opacity-50 transition-all"
          >
            {DETAIL_LEVEL_OPTIONS.map((option) => (
              <option key={option} value={option} className="bg-cosmic-dark">
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="space-y-4 pt-6 border-t border-white/10">
        <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-400">Status</span>
            <div className="flex items-center space-x-2">
                {isProcessing && <ProcessingIcon className="h-4 w-4 animate-spin text-glow-orange" />}
                <span className={`text-sm font-medium ${statusConfig[status].color}`}>{statusConfig[status].text}</span>
            </div>
        </div>
        
        {!isProcessing ? (
          <button
            onClick={startProcessing}
            className="w-full flex items-center justify-center bg-gradient-to-r from-glow-orange to-glow-orange-dark text-white font-semibold py-3.5 px-6 rounded-xl hover:from-glow-orange-dark hover:to-glow-orange focus:outline-none focus:ring-2 focus:ring-glow-orange/50 transition-all duration-200 glow-hover"
            aria-label="Start processing audio"
          >
            <MicrophoneIcon className="h-5 w-5 mr-2" />
            Start Session
          </button>
        ) : (
          <button
            onClick={stopProcessing}
            className="w-full flex items-center justify-center bg-red-500/20 border border-red-500/50 text-red-400 font-semibold py-3.5 px-6 rounded-xl hover:bg-red-500/30 focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all duration-200"
            aria-label="Stop processing audio"
          >
            <StopIcon className="h-5 w-5 mr-2" />
            Stop Session
          </button>
        )}
      </div>
    </div>
  );
};
