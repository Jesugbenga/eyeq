
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
    [Status.IDLE]: { text: 'Ready to start', color: 'text-gray-500 dark:text-gray-400' },
    [Status.LISTENING]: { text: 'Listening...', color: 'text-blue-500' },
    [Status.ANALYZING]: { text: 'Analyzing...', color: 'text-purple-500' },
    [Status.SPEAKING]: { text: 'Speaking...', color: 'text-green-500' },
    [Status.ERROR]: { text: 'An error occurred', color: 'text-red-500' },
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
    <div className="bg-base-100 dark:bg-dark-base-300 p-6 rounded-2xl shadow-lg space-y-6 sticky top-8">
      <div>
        <h2 className="text-xl font-bold mb-4">Configuration</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="event-type" className="block text-sm font-medium text-base-content-secondary dark:text-dark-base-content-secondary mb-1">
              Event Type
            </label>
            <select
              id="event-type"
              value={eventType}
              onChange={(e) => setEventType(e.target.value as EventType)}
              disabled={isProcessing}
              className="w-full bg-base-200 dark:bg-dark-base-200 border border-base-300 dark:border-dark-base-100 rounded-lg p-2.5 focus:ring-2 focus:ring-brand-primary focus:border-brand-primary disabled:opacity-50"
            >
              {EVENT_TYPE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="detail-level" className="block text-sm font-medium text-base-content-secondary dark:text-dark-base-content-secondary mb-1">
              Description Detail
            </label>
            <select
              id="detail-level"
              value={detailLevel}
              onChange={(e) => setDetailLevel(e.target.value as DetailLevel)}
              disabled={isProcessing}
              className="w-full bg-base-200 dark:bg-dark-base-200 border border-base-300 dark:border-dark-base-100 rounded-lg p-2.5 focus:ring-2 focus:ring-brand-primary focus:border-brand-primary disabled:opacity-50"
            >
              {DETAIL_LEVEL_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      <div className="border-t border-base-300 dark:border-dark-base-100 pt-6">
        <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold">Status</h3>
            <div className="flex items-center space-x-2">
                {isProcessing && <ProcessingIcon className="h-5 w-5 animate-spin text-brand-primary" />}
                <span className={`font-semibold ${statusConfig[status].color}`}>{statusConfig[status].text}</span>
            </div>
        </div>
        
        {!isProcessing ? (
          <button
            onClick={startProcessing}
            className="w-full flex items-center justify-center bg-brand-primary text-white font-bold py-3 px-4 rounded-lg hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary transition-all duration-200 shadow-md"
            aria-label="Start processing audio"
          >
            <MicrophoneIcon className="h-5 w-5 mr-2" />
            Start Session
          </button>
        ) : (
          <button
            onClick={stopProcessing}
            className="w-full flex items-center justify-center bg-red-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200 shadow-md"
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
