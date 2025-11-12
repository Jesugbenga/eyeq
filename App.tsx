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
  const analysisTimerRef = useRef<number | null>(null);
  const accumulatedTranscriptRef = useRef<string>("");
  const interimIndexRef = useRef<number>(-1);
  const isAnalyzingRef = useRef<boolean>(false);

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
    
    // Prevent concurrent analysis requests
    if (isAnalyzingRef.current) {
      console.log("Analysis already in progress, skipping this segment");
      return;
    }
    
    isAnalyzingRef.current = true;
    setStatus(Status.ANALYZING);
    try {
      const description = await generateDescription(segment, eventType, detailLevel);
      speakDescription(description);
      
      // After analysis completes, check if there's more accumulated transcript to analyze
      // Wait a bit before checking to avoid immediate re-analysis
      setTimeout(() => {
        if (accumulatedTranscriptRef.current.trim() && isProcessingRef.current && !isAnalyzingRef.current) {
          const textToAnalyze = accumulatedTranscriptRef.current.trim();
          accumulatedTranscriptRef.current = "";
          // Recursively call analyzeTranscriptSegment for queued transcript
          analyzeTranscriptSegment(textToAnalyze);
        }
      }, 1000);
    } catch (error) {
      console.error("Error generating description:", error);
      setStatus(Status.ERROR);
      setTranscript(prev => [...prev, { type: 'error', text: 'Failed to generate description.' }]);
      setTimeout(() => { 
        if (isProcessingRef.current) {
          setStatus(Status.LISTENING);
          // Also check for queued transcripts after error recovery
          if (accumulatedTranscriptRef.current.trim() && !isAnalyzingRef.current) {
            const textToAnalyze = accumulatedTranscriptRef.current.trim();
            accumulatedTranscriptRef.current = "";
            analyzeTranscriptSegment(textToAnalyze);
          }
        }
      }, 2000);
    } finally {
      isAnalyzingRef.current = false;
    }
  }, [eventType, detailLevel]);


  const stopProcessing = useCallback(() => {
    // Clear all timers
    if (restartTimerRef.current) {
        clearTimeout(restartTimerRef.current);
        restartTimerRef.current = null;
    }
    if (analysisTimerRef.current) {
        clearTimeout(analysisTimerRef.current);
        analysisTimerRef.current = null;
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
    
    // Clear accumulated transcripts without analyzing
    accumulatedTranscriptRef.current = "";
    lastTranscriptSegment.current = "";
    isAnalyzingRef.current = false;
  }, []);

  const startRecognition = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true; // Enable interim results for real-time display
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';
      let hasFinal = false;
      let hasInterim = false;
      
      // Process all results (both final and interim)
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript + ' ';
          hasFinal = true;
        } else {
          interimTranscript += result[0].transcript + ' ';
          hasInterim = true;
        }
      }
      
      // Handle final transcripts - remove interim (don't show final transcript)
      if (hasFinal && finalTranscript.trim()) {
        const cleanedTranscript = finalTranscript.trim();
        
        // Remove interim result (don't add final transcript to display)
        setTranscript(prev => {
          // Remove interim result
          const filtered = prev.filter((_, idx) => idx !== interimIndexRef.current);
          interimIndexRef.current = -1;
          return filtered;
        });
        
        // Add to accumulated transcript for analysis (but don't display it)
        accumulatedTranscriptRef.current += (accumulatedTranscriptRef.current ? ' ' : '') + cleanedTranscript;
        lastTranscriptSegment.current = accumulatedTranscriptRef.current;
        
        // Clear any existing timer
        if (analysisTimerRef.current) {
          clearTimeout(analysisTimerRef.current);
          analysisTimerRef.current = null;
        }
        
        // Set a new timer to analyze after a delay (2 seconds of silence)
        // This allows the user to continue speaking without interruption
        // Only schedule analysis if not already analyzing
        analysisTimerRef.current = window.setTimeout(() => {
          if (accumulatedTranscriptRef.current.trim() && isProcessingRef.current && !isAnalyzingRef.current) {
            const textToAnalyze = accumulatedTranscriptRef.current.trim();
            accumulatedTranscriptRef.current = ""; // Clear after scheduling analysis
            analyzeTranscriptSegment(textToAnalyze);
          } else if (isAnalyzingRef.current) {
            // If analysis is in progress, keep the accumulated transcript for later
            console.log("Analysis in progress, keeping transcript for later analysis");
          }
          analysisTimerRef.current = null;
        }, 2000); // Wait 2 seconds after last speech before analyzing
      } 
      // Handle interim results - show while speaking
      else if (hasInterim && interimTranscript.trim()) {
        const cleanedInterim = interimTranscript.trim();
        
        // Update or add interim transcript
        setTranscript(prev => {
          // If we have an interim item, update it in-place
          if (interimIndexRef.current >= 0 && interimIndexRef.current < prev.length) {
            const newTranscript = [...prev];
            newTranscript[interimIndexRef.current] = { type: 'interim', text: cleanedInterim };
            return newTranscript;
          }
          
          // No interim item exists, add new one at the end
          const newIndex = prev.length;
          interimIndexRef.current = newIndex;
          return [...prev, { type: 'interim', text: cleanedInterim }];
        });
      }
      // No interim and no final - clear interim display if it exists
      else if (!hasInterim && !hasFinal) {
        if (interimIndexRef.current >= 0) {
          setTranscript(prev => {
            const filtered = prev.filter((_, idx) => idx !== interimIndexRef.current);
            interimIndexRef.current = -1;
            return filtered;
          });
        }
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
    // Reset accumulated transcript when starting
    accumulatedTranscriptRef.current = "";
    lastTranscriptSegment.current = "";
    interimIndexRef.current = -1;

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
    <div className="min-h-screen relative text-white font-sans">
      <Header />
      <main className="container mx-auto px-6 lg:px-12 py-8 relative z-10">
        <div className="mb-12 text-center">
          <h1 className="text-5xl lg:text-6xl font-bold mb-4 bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
            Real-time audio description,
            <span className="text-gray-500"> one session away.</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Transform live events into accessible experiences with AI-powered audio descriptions
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
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
            <TranscriptDisplay transcript={transcript} status={status} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;