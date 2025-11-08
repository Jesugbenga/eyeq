
import React, { useRef, useEffect } from 'react';
import { TranscriptItem } from '../types';
import { UserIcon, SparklesIcon } from './Icon';

interface TranscriptDisplayProps {
  transcript: TranscriptItem[];
}

const TranscriptItemView: React.FC<{ item: TranscriptItem }> = ({ item }) => {
  const isDescription = item.type === 'description';
  const isError = item.type === 'error';
  
  if (isError) {
    return (
        <div className="text-center my-4">
            <p className="text-sm glass text-red-400 px-4 py-3 rounded-xl border border-red-500/30">
                {item.text}
            </p>
        </div>
    );
  }

  return (
    <div className={`flex items-start space-x-3 my-3 ${isDescription ? 'justify-start' : 'justify-start'}`}>
      <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
        isDescription 
          ? 'bg-gradient-to-br from-glow-orange to-glow-orange-dark' 
          : 'glass border border-white/10'
      }`}>
        {isDescription ? (
          <SparklesIcon className="w-4 h-4 text-white" />
        ) : (
          <UserIcon className="w-4 h-4 text-gray-400" />
        )}
      </div>
      <div className={`flex-1 p-3 rounded-xl max-w-2xl ${
        isDescription 
          ? 'glass border border-glow-orange/20' 
          : 'glass border border-white/5'
      }`}>
        <p className={`text-sm leading-relaxed ${
          isDescription ? 'text-white' : 'text-gray-300'
        }`}>
          {item.text}
        </p>
      </div>
    </div>
  );
};


export const TranscriptDisplay: React.FC<TranscriptDisplayProps> = ({ transcript }) => {
    const endOfMessagesRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [transcript]);

    return (
        <div className="relative z-10 glass rounded-2xl p-6 h-[calc(100vh-12rem)] flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-white">Live Feed</h2>
                {transcript.length > 0 && (
                    <span className="text-xs text-gray-400 font-medium">
                        {transcript.length} {transcript.length === 1 ? 'item' : 'items'}
                    </span>
                )}
            </div>
            <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar">
                {transcript.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                            <div className="w-16 h-16 mx-auto mb-4 glass rounded-full flex items-center justify-center border border-white/10">
                                <SparklesIcon className="w-8 h-8 text-gray-500" />
                            </div>
                            <p className="text-gray-400 text-sm">
                                Start a session to see the live transcript and descriptions.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-1">
                        {transcript.map((item, index) => (
                            <TranscriptItemView key={index} item={item} />
                        ))}
                    </div>
                )}
                <div ref={endOfMessagesRef} />
            </div>
        </div>
    );
};
