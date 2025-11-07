
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
            <p className="text-sm bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 px-4 py-2 rounded-lg">
                {item.text}
            </p>
        </div>
    );
  }

  return (
    <div className={`flex items-start space-x-4 my-4 ${isDescription ? 'justify-start' : 'justify-start'}`}>
      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${isDescription ? 'bg-brand-secondary text-white' : 'bg-base-300 dark:bg-dark-base-100'}`}>
        {isDescription ? <SparklesIcon className="w-6 h-6" /> : <UserIcon className="w-6 h-6" />}
      </div>
      <div className={`p-4 rounded-lg max-w-xl ${isDescription ? 'bg-brand-secondary/10 dark:bg-brand-secondary/20' : 'bg-base-100 dark:bg-dark-base-300'}`}>
        <p className={`text-base-content dark:text-dark-base-content`}>{item.text}</p>
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
        <div className="bg-base-100 dark:bg-dark-base-300 p-4 rounded-2xl shadow-lg h-[calc(100vh-10rem)] flex flex-col">
            <h2 className="text-xl font-bold mb-4 px-2">Live Feed</h2>
            <div className="flex-grow overflow-y-auto pr-2">
                {transcript.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-base-content-secondary dark:text-dark-base-content-secondary">
                            Start a session to see the live transcript and descriptions.
                        </p>
                    </div>
                ) : (
                    transcript.map((item, index) => <TranscriptItemView key={index} item={item} />)
                )}
                <div ref={endOfMessagesRef} />
            </div>
        </div>
    );
};
