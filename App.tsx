
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Theme, HistoryItem } from './types';
import { geminiService } from './services/geminiService';
import { speechService } from './services/speechService';
import { evaluateExpression } from './utils/mathEngine';

const App: React.FC = () => {
  const [display, setDisplay] = useState<string>('');
  const [result, setResult] = useState<string>('');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [theme, setTheme] = useState<Theme>(Theme.LIGHT);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme) setTheme(savedTheme);
    
    const savedHistory = localStorage.getItem('calc-history');
    if (savedHistory) setHistory(JSON.parse(savedHistory));
  }, []);

  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.documentElement.classList.toggle('dark', theme === Theme.DARK);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('calc-history', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [display, result]);

  const handleInput = (val: string) => {
    if (result && !isNaN(Number(val))) {
        setDisplay(val);
        setResult('');
    } else {
        setDisplay(prev => prev + val);
    }
  };

  const clear = () => {
    setDisplay('');
    setResult('');
  };

  const backspace = () => {
    setDisplay(prev => prev.slice(0, -1));
  };

  const calculate = useCallback(() => {
    if (!display) return;
    const res = evaluateExpression(display);
    setResult(res);
    
    const newItem: HistoryItem = {
      id: Date.now().toString(),
      expression: display,
      result: res,
      timestamp: Date.now()
    };
    setHistory(prev => [newItem, ...prev].slice(0, 50));
    speechService.speak(`The result is ${res}`);
  }, [display]);

  const toggleTheme = () => setTheme(prev => prev === Theme.LIGHT ? Theme.DARK : Theme.LIGHT);

  const startVoiceInput = () => {
    setIsListening(true);
    setVoiceError(null);
    
    speechService.startListening(
      async (text) => {
        setIsListening(false);
        setIsProcessing(true);
        
        // REQUESTED LOG: Explicitly label the transcript for debugging
        console.log("Transcript:", text);
        
        const expression = await geminiService.parseVoiceCommand(text);
        
        if (expression) {
          setDisplay(expression);
          const res = evaluateExpression(expression);
          setResult(res);
          setHistory(prev => [{
            id: Date.now().toString(),
            expression: text,
            result: res,
            timestamp: Date.now()
          }, ...prev]);
          speechService.speak(`The answer for "${text}" is ${res}`);
        } else {
          speechService.speak("Sorry, I could not understand that calculation.");
          setVoiceError("AI couldn't interpret that command.");
          setTimeout(() => setVoiceError(null), 3000);
        }
        setIsProcessing(false);
      },
      (err) => {
        console.error("Speech Recognition Error:", err);
        setIsListening(false);
        if (err === 'no-speech') {
          setVoiceError("No speech detected.");
        } else if (err === 'not-allowed') {
          setVoiceError("Microphone access denied.");
        } else {
          setVoiceError("Voice command failed.");
        }
        setTimeout(() => setVoiceError(null), 3000);
      }
    );
  };

  const copyResult = () => {
    if (result) {
        navigator.clipboard.writeText(result);
        alert("Result copied!");
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-white dark:bg-gray-900 shadow-2xl relative overflow-hidden transition-colors">
      
      {/* Header */}
      <header className="px-6 py-4 flex justify-between items-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-md z-10 border-b border-gray-200 dark:border-gray-800">
        <h1 className="text-xl font-bold tracking-tight text-indigo-600 dark:text-indigo-400">Smart AI Calc</h1>
        <div className="flex items-center gap-4">
          <button onClick={() => setShowHistory(!showHistory)} className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors" title="History">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
          <button onClick={toggleTheme} className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors" title="Toggle Theme">
            {theme === Theme.LIGHT ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 9H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* Display Screen */}
      <div className="flex-1 flex flex-col justify-end px-6 py-8 text-right bg-gradient-to-b from-gray-50/50 to-white dark:from-gray-900 dark:to-gray-950 overflow-hidden">
        <div ref={scrollRef} className="overflow-y-auto max-h-full">
            <div className="text-gray-400 dark:text-gray-500 text-lg mono-font mb-2 break-all min-h-[2rem]">
            {display}
            </div>
            <div className="text-5xl font-bold tracking-tight text-gray-900 dark:text-white break-all flex items-center justify-end">
            {result && <span className="text-indigo-500 mr-2 text-2xl">=</span>}
            {result || '0'}
            </div>
        </div>
        {result && (
            <div className="flex justify-end mt-4">
                <button 
                  onClick={copyResult}
                  className="px-3 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
                >
                    Copy
                </button>
            </div>
        )}
      </div>

      {/* Voice Mic Overlay */}
      {isListening && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-indigo-600/95 backdrop-blur-xl text-white animate-in fade-in duration-200">
            <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mb-6 animate-pulse">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
            </div>
            <p className="text-xl font-medium">Listening...</p>
            <p className="text-sm opacity-70 mt-2">"Try: 10 plus 20"</p>
            <button 
                onClick={() => { setIsListening(false); speechService.stopListening(); }}
                className="mt-12 px-6 py-2 rounded-full border border-white/30 hover:bg-white/10 transition-colors"
            >
                Cancel
            </button>
        </div>
      )}

      {/* Status Indicators */}
      {voiceError && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-50 px-6 py-2 bg-red-500 text-white rounded-full shadow-lg text-sm font-medium animate-bounce whitespace-nowrap">
            {voiceError}
        </div>
      )}

      {isProcessing && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-gray-900/80 backdrop-blur-sm text-white">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-lg">Analyzing Command...</p>
        </div>
      )}

      {/* History Side Panel */}
      {showHistory && (
        <div className="absolute inset-0 z-40 bg-white dark:bg-gray-900 transition-all transform animate-in slide-in-from-right duration-300">
            <header className="px-6 py-4 flex justify-between items-center border-b dark:border-gray-800">
                <h2 className="text-xl font-bold">History</h2>
                <button onClick={() => setShowHistory(false)} className="p-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </header>
            <div className="overflow-y-auto h-[calc(100%-4rem)] p-4 space-y-4">
                {history.length === 0 ? (
                    <div className="text-center text-gray-400 mt-20">No history yet</div>
                ) : (
                    history.map(item => (
                        <div key={item.id} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors"
                             onClick={() => { setDisplay(item.expression); setResult(item.result); setShowHistory(false); }}>
                            <div className="text-sm text-gray-500 dark:text-gray-400 mono-font mb-1">{item.expression}</div>
                            <div className="text-xl font-bold text-indigo-500">= {item.result}</div>
                            <div className="text-[10px] text-gray-400 mt-2">{new Date(item.timestamp).toLocaleTimeString()}</div>
                        </div>
                    ))
                )}
                {history.length > 0 && (
                    <button 
                        onClick={() => setHistory([])}
                        className="w-full py-3 text-red-500 font-medium hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                    >
                        Clear History
                    </button>
                )}
            </div>
        </div>
      )}

      {/* Keypad Section */}
      <div className="p-6 pb-10 bg-white dark:bg-gray-950 rounded-t-[3rem] shadow-[0_-8px_30px_rgb(0,0,0,0.04)] dark:shadow-none">
        
        {/* Scientific Bar */}
        <div className="flex justify-between mb-6 overflow-x-auto no-scrollbar gap-2 pb-2">
            {['sin', 'cos', 'tan', 'log', 'ln', 'sqrt', 'fact', '(', ')', 'π', 'e'].map(op => (
                <button 
                    key={op}
                    onClick={() => handleInput(op === 'fact' ? 'fact(' : op + '(')}
                    className="flex-shrink-0 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg text-sm font-semibold btn-animation"
                >
                    {op === 'fact' ? 'n!' : op}
                </button>
            ))}
        </div>

        <div className="calculator-grid">
          <button onClick={clear} className="col-span-1 bg-red-50 dark:bg-red-900/20 text-red-500 p-5 rounded-2xl font-bold btn-animation">C</button>
          <button onClick={backspace} className="col-span-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 p-5 rounded-2xl font-bold btn-animation">⌫</button>
          <button onClick={() => handleInput('%')} className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 p-5 rounded-2xl font-bold btn-animation">%</button>
          <button onClick={() => handleInput('÷')} className="bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 p-5 rounded-2xl font-bold text-2xl btn-animation">÷</button>
          
          {[7, 8, 9].map(n => (
            <button key={n} onClick={() => handleInput(n.toString())} className="bg-gray-50 dark:bg-gray-800/50 text-gray-800 dark:text-gray-100 p-5 rounded-2xl font-semibold text-xl btn-animation">{n}</button>
          ))}
          <button onClick={() => handleInput('×')} className="bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 p-5 rounded-2xl font-bold text-2xl btn-animation">×</button>

          {[4, 5, 6].map(n => (
            <button key={n} onClick={() => handleInput(n.toString())} className="bg-gray-50 dark:bg-gray-800/50 text-gray-800 dark:text-gray-100 p-5 rounded-2xl font-semibold text-xl btn-animation">{n}</button>
          ))}
          <button onClick={() => handleInput('−')} className="bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 p-5 rounded-2xl font-bold text-2xl btn-animation">−</button>

          {[1, 2, 3].map(n => (
            <button key={n} onClick={() => handleInput(n.toString())} className="bg-gray-50 dark:bg-gray-800/50 text-gray-800 dark:text-gray-100 p-5 rounded-2xl font-semibold text-xl btn-animation">{n}</button>
          ))}
          <button onClick={() => handleInput('+')} className="bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 p-5 rounded-2xl font-bold text-2xl btn-animation">+</button>

          <button onClick={() => handleInput('0')} className="col-span-1 bg-gray-50 dark:bg-gray-800/50 text-gray-800 dark:text-gray-100 p-5 rounded-2xl font-semibold text-xl btn-animation">0</button>
          <button onClick={() => handleInput('.')} className="bg-gray-50 dark:bg-gray-800/50 text-gray-800 dark:text-gray-100 p-5 rounded-2xl font-bold btn-animation">.</button>
          
          <button 
            onClick={calculate}
            className="col-span-2 bg-indigo-600 hover:bg-indigo-700 text-white p-5 rounded-2xl font-bold text-2xl shadow-lg shadow-indigo-200 dark:shadow-none btn-animation"
          >
            =
          </button>
        </div>

        {/* Floating Voice Button */}
        <div className="flex justify-center mt-6">
            <button 
                onClick={startVoiceInput}
                className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full shadow-lg hover:shadow-xl hover:border-indigo-500 dark:hover:border-indigo-400 transition-all btn-animation"
            >
                <div className="p-1 bg-indigo-500 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                </div>
                <span className="text-gray-700 dark:text-gray-200 font-medium">Ask Assistant</span>
            </button>
        </div>
      </div>
    </div>
  );
};

export default App;
