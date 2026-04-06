/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calculator, 
  Play, 
  RotateCcw, 
  Info, 
  CheckCircle2, 
  AlertCircle,
  TrendingUp,
  Hash
} from 'lucide-react';
import { create, all } from 'mathjs';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

const math = create(all);

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [funcString, setFuncString] = useState('x^3');
  const [targetValue, setTargetValue] = useState('10');
  const [isCalculating, setIsCalculating] = useState(false);
  const [result, setResult] = useState<{ x: number; area: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const solveByRectangles = useCallback(async () => {
    setIsCalculating(true);
    setError(null);
    setResult(null);
    setProgress(0);

    // Small delay to allow UI to update
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      // Parse the function using mathjs to handle natural input like 5x^2
      const node = math.parse(funcString);
      const compiled = node.compile();
      const target = parseFloat(targetValue);

      if (isNaN(target)) {
        throw new Error('Please enter a valid target value');
      }

      const stepSize = 0.0001;
      const h = 0.00001;
      let currentX = 0.0;
      let accumulatedArea = 0.0;

      const getDerivative = (x: number) => {
        const y1 = compiled.evaluate({ x });
        const y2 = compiled.evaluate({ x: x + h });
        return (y2 - y1) / h;
      };

      // To prevent blocking the main thread for too long, we'll process in chunks
      const CHUNK_SIZE = 50000;
      
      const runChunk = (): Promise<{ x: number; area: number } | null> => {
        return new Promise((resolve) => {
          let iterations = 0;
          while (accumulatedArea < target && currentX <= 1000 && iterations < CHUNK_SIZE) {
            const yPrime = getDerivative(currentX);
            accumulatedArea += yPrime * stepSize;
            currentX += stepSize;
            iterations++;
          }

          if (accumulatedArea >= target || currentX > 1000) {
            resolve({ x: currentX, area: accumulatedArea });
          } else {
            // Update progress
            setProgress(Math.min(95, (accumulatedArea / target) * 100));
            resolve(null);
          }
        });
      };

      let finalResult = null;
      while (!finalResult) {
        finalResult = await runChunk();
        // Yield to browser
        await new Promise(resolve => setTimeout(resolve, 0));
      }

      setResult({
        x: Number(finalResult.x.toFixed(4)),
        area: Number(finalResult.area.toFixed(4))
      });
      setProgress(100);
    } catch (err: any) {
      setError(err.message || 'An error occurred during calculation. Check the function.');
    } finally {
      setIsCalculating(false);
    }
  }, [funcString, targetValue]);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans selection:bg-indigo-100 p-4 md:p-8" dir="ltr">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <header className="mb-12 text-center">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center justify-center p-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-200 mb-6"
          >
            <Calculator size={32} />
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-bold tracking-tight text-slate-900 mb-3"
          >
            Rectangle Method Equation Solver
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-slate-500 text-lg"
          >
            An intuitive tool for solving equations using the rectangle method
          </motion.p>
        </header>

        {/* Main Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100 overflow-hidden"
        >
          <div className="p-8">
            <div className="space-y-6">
              {/* Function Input */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 ml-1">
                  <TrendingUp size={16} className="text-indigo-500" />
                  Enter the function
                </label>
                <div className="relative group">
                  <input 
                    type="text"
                    value={funcString}
                    onChange={(e) => setFuncString(e.target.value)}
                    placeholder="e.g., x^3 + 2x"
                    className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-lg focus:outline-none focus:border-indigo-500 focus:bg-white transition-all duration-200 group-hover:border-slate-200"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-mono bg-white px-2 py-1 rounded-lg border border-slate-100 shadow-sm">
                    f(x)
                  </div>
                </div>
                <p className="text-xs text-slate-400 ml-1">You can use standard multiplication and powers (e.g., 5x^2)</p>
              </div>

              {/* Target Value Input */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 ml-1">
                  <Hash size={16} className="text-indigo-500" />
                  Target Value (What should it equal?)
                </label>
                <input 
                  type="number"
                  value={targetValue}
                  onChange={(e) => setTargetValue(e.target.value)}
                  placeholder="Enter a number..."
                  className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-lg focus:outline-none focus:border-indigo-500 focus:bg-white transition-all duration-200"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button 
                  onClick={solveByRectangles}
                  disabled={isCalculating}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-lg transition-all duration-300 shadow-lg",
                    isCalculating 
                      ? "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none" 
                      : "bg-indigo-600 text-white hover:bg-indigo-700 active:scale-[0.98] shadow-indigo-200"
                  )}
                >
                  {isCalculating ? (
                    <>
                      <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                      Calculating...
                    </>
                  ) : (
                    <>
                      <Play size={20} fill="currentColor" />
                      Calculate Solution
                    </>
                  )}
                </button>
                
                <button 
                  onClick={() => {
                    setFuncString('x^3');
                    setTargetValue('10');
                    setResult(null);
                    setError(null);
                  }}
                  className="p-4 bg-slate-100 text-slate-600 rounded-2xl hover:bg-slate-200 transition-colors"
                  title="Reset"
                >
                  <RotateCcw size={24} />
                </button>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <AnimatePresence>
            {isCalculating && (
              <motion.div 
                initial={{ height: 0 }}
                animate={{ height: 4 }}
                exit={{ height: 0 }}
                className="w-full bg-slate-100 overflow-hidden"
              >
                <motion.div 
                  className="h-full bg-indigo-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Results Area */}
          <div className="bg-slate-50/50 border-t border-slate-100 p-8">
            <AnimatePresence mode="wait">
              {error && (
                <motion.div 
                  key="error"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-700"
                >
                  <AlertCircle className="shrink-0 mt-0.5" size={20} />
                  <p className="font-medium">{error}</p>
                </motion.div>
              )}

              {result && (
                <motion.div 
                  key="result"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <div className="flex items-center gap-2 text-green-600 font-bold mb-2">
                    <CheckCircle2 size={20} />
                    Calculation Complete!
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                      <p className="text-slate-500 text-sm mb-1">Solution (x)</p>
                      <p className="text-3xl font-black text-indigo-600 tabular-nums">
                        {result.x}
                      </p>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                      <p className="text-slate-500 text-sm mb-1">Final Accumulated Area</p>
                      <p className="text-3xl font-black text-slate-800 tabular-nums">
                        {result.area}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 text-indigo-700 text-sm flex gap-3">
                    <Info className="shrink-0 mt-0.5" size={18} />
                    <p>
                      The solution was found by summing small rectangles of width 0.0001 along the x-axis, 
                      where each rectangle's height is determined by the function's derivative at that point.
                    </p>
                  </div>
                </motion.div>
              )}

              {!isCalculating && !result && !error && (
                <motion.div 
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-8"
                >
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                    <Calculator size={32} />
                  </div>
                  <p className="text-slate-400 font-medium">Enter a function and target value to begin</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Footer Info */}
        <footer className="mt-12 text-center text-slate-400 text-sm">
          <p>© 2026 - Based on the Rectangle Method for Equation Solving</p>
        </footer>
      </div>
    </div>
  );
}
