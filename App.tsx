// Add TypeScript type definitions for the Web Speech API to fix compilation errors.
// The browser-specific SpeechRecognition API is not part of the standard TypeScript library definitions.
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
  start: () => void;
  stop: () => void;
}

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { Controls } from './components/Controls';
import { TranscriptDisplay } from './components/TranscriptDisplay';
import { EventType, DetailLevel, TranscriptItem, Status } from './types';
import { generateDescription } from './services/geminiService';

const App: React.FC = () => {
  const [eventType, setEventType] = useState<EventType>(EventType.GENERAL);
  const [detailLevel, setDetailLevel] = useState<DetailLevel>(DetailLevel.STANDARD);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<TranscriptItem[]>([]);
  const [status, setStatus] = useState<Status>(Status.IDLE);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const lastTranscriptSegment = useRef<string>("");
  const isProcessingRef = useRef<boolean>(false);
  const restartTimerRef = useRef<number | null>(null);

  useEffect(() => {
    isProcessingRef.current = isProcessing;
  }, [isProcessing]);

  const speakDescription = (text: string) => {
    if (!text || text.trim().toUpperCase() === 'NONE') {
        if (isProcessingRef.current) setStatus(Status.LISTENING);
        return;
    };
    
    setStatus(Status.SPEAKING);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.1;
    utterance.pitch = 1;
    
    utterance.onend = () => {
      if (isProcessingRef.current) {
        setStatus(Status.LISTENING);
      } else {
        setStatus(Status.IDLE);
      }
    };
    
    window.speechSynthesis.speak(utterance);
    setTranscript(prev => [...prev, { type: 'description', text }]);
  };

  const analyzeTranscriptSegment = useCallback(async (segment: string) => {
    if (segment.trim().length < 5) return; // Avoid analyzing very short segments
    setStatus(Status.ANALYZING);
    try {
      const description = await generateDescription(segment, eventType, detailLevel);
      speakDescription(description);
    } catch (error) {
      console.error("Error generating description:", error);
      setStatus(Status.ERROR);
      setTranscript(prev => [...prev, { type: 'error', text: 'Failed to generate description.' }]);
      setTimeout(() => { if (isProcessingRef.current) setStatus(Status.LISTENING); }, 2000);
    }
  }, [eventType, detailLevel]);


  const stopProcessing = useCallback(() => {
    if (restartTimerRef.current) {
        clearTimeout(restartTimerRef.current);
        restartTimerRef.current = null;
    }
    if (recognitionRef.current) {
      // Prevent the onend handler from restarting the service
      recognitionRef.current.onend = null;
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(track => track.stop());
      audioStreamRef.current = null;
    }
    window.speechSynthesis.cancel();
    setIsProcessing(false);
    setStatus(Status.IDLE);
    if(lastTranscriptSegment.current) {
        analyzeTranscriptSegment(lastTranscriptSegment.current);
        lastTranscriptSegment.current = "";
    }
  }, [analyzeTranscriptSegment]);

  const startRecognition = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        setTranscript(prev => [...prev, { type: 'transcript', text: finalTranscript }]);
        lastTranscriptSegment.current = finalTranscript;
        analyzeTranscriptSegment(finalTranscript);
      }
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error", event.error);
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setTranscript(prev => [...prev, { type: 'error', text: 'Speech recognition permission was denied. Please allow microphone access.' }]);
        stopProcessing();
      } else if (event.error === 'audio-capture') {
        setTranscript(prev => [...prev, { type: 'error', text: 'No microphone was found. Ensure a microphone is installed.' }]);
        stopProcessing();
      }
    };
    
    recognition.onend = () => {
      if (isProcessingRef.current) {
        console.log("Speech recognition ended. Attempting to restart in 1 second...");
        // Use a timeout to prevent rapid restart loops on persistent errors
        restartTimerRef.current = window.setTimeout(() => {
          // Final check to ensure we should still be running before restarting
          if (isProcessingRef.current) {
            startRecognition();
          }
        }, 1000);
      }
    };

    recognition.start();
    recognitionRef.current = recognition;
  }, [analyzeTranscriptSegment, stopProcessing]);


  const startProcessing = async () => {
    if (isProcessing) return;
    setTranscript([]);
    setIsProcessing(true);
    setStatus(Status.LISTENING);

    try {
      audioStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      startRecognition();
    } catch (err) {
      console.error("Error accessing microphone:", err);
      setStatus(Status.ERROR);
      setTranscript([{ type: 'error', text: 'Microphone access denied. Please allow microphone permissions.' }]);
      setIsProcessing(false);
      return;
    }
  };
  
  useEffect(() => {
    return () => {
      stopProcessing();
    };
  }, [stopProcessing]);


  return (
    <div className="min-h-screen bg-base-200 dark:bg-dark-base-200 text-base-content dark:text-dark-base-content font-sans">
      <Header />
      <main className="container mx-auto p-4 md:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <Controls
              eventType={eventType}
              setEventType={setEventType}
              detailLevel={detailLevel}
              setDetailLevel={setDetailLevel}
              isProcessing={isProcessing}
              startProcessing={startProcessing}
              stopProcessing={stopProcessing}
              status={status}
            />
          </div>
          <div className="lg:col-span-2">
            <TranscriptDisplay transcript={transcript} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;