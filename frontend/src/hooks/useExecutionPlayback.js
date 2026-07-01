import { useState, useCallback, useRef, useEffect } from 'react';

const SPEED_MAP = { 0.5: 3000, 1: 1500, 2: 750, 4: 375 };

/**
 * Custom hook that manages step-by-step playback of execution events.
 *
 * Returns a `state` object (activeLine, variables, callStack, consoleLines, …)
 * plus control functions: play, pause, stepForward, stepBack, reset, setSpeed.
 */
export default function useExecutionPlayback(events = []) {
  const [currentStep, setCurrentStep] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const timerRef = useRef(null);

  // Derived state — rebuilt from events[0..currentStep]
  const [activeLine, setActiveLine] = useState(null);
  const [activeCode, setActiveCode] = useState('');
  const [variables, setVariables] = useState(new Map()); // name -> {name, value, dtype, size, addr, scope, animState}
  const [callStack, setCallStack] = useState([]);          // [{name, args, line}]
  const [activeScope, setActiveScope] = useState('<module>');
  const [lastEventType, setLastEventType] = useState(null);
  const [highlightVar, setHighlightVar] = useState(null);   // variable name to flash
  const [dataFlowEvent, setDataFlowEvent] = useState(null); // for arrow animations
  const [execError, setExecError] = useState(null);         // runtime error state

  // ─── Process a single event ─────────────────────────────────
  const processEvent = useCallback((event) => {
    if (!event) return;
    setLastEventType(event.type);

    switch (event.type) {
      case 'line':
        setActiveLine(event.line);
        setActiveCode(event.code || '');
        setActiveScope(event.scope || '<module>');
        setHighlightVar(null);
        setDataFlowEvent(null);
        break;

      case 'var_declare':
        setVariables(prev => {
          const next = new Map(prev);
          next.set(event.name, {
            name: event.name,
            value: event.value,
            dtype: event.dtype,
            size: event.size,
            addr: event.addr,
            scope: event.scope,
            animState: 'entering',  // triggers slide-in + glow
          });
          return next;
        });
        setHighlightVar(event.name);
        setDataFlowEvent({ type: 'assign', target: event.name, line: event.line });
        break;

      case 'var_update':
        setVariables(prev => {
          const next = new Map(prev);
          const existing = next.get(event.name) || {};
          next.set(event.name, {
            ...existing,
            value: event.value,
            oldValue: event.old_value,
            dtype: event.dtype,
            size: event.size,
            addr: event.addr,
            scope: event.scope,
            animState: 'updating',  // triggers gold → green flash
          });
          return next;
        });
        setHighlightVar(event.name);
        setDataFlowEvent({ type: 'assign', target: event.name, line: event.line });
        break;

      case 'func_call':
        setCallStack(prev => [...prev, {
          name: event.name,
          args: event.args || {},
          line: event.line,
          code: event.code || '',
        }]);
        setActiveScope(event.name);
        setDataFlowEvent({ type: 'call', target: event.name, line: event.line });
        break;

      case 'func_return': {
        setCallStack(prev => {
          const next = [...prev];
          // Mark top frame as returning before we pop it (for animation)
          if (next.length > 0 && next[next.length - 1].name === event.name) {
            next[next.length - 1] = {
              ...next[next.length - 1],
              returning: true,
              returnValue: event.return_value,
            };
          }
          return next;
        });
        // Delayed pop so the animation can play
        setTimeout(() => {
          setCallStack(prev => {
            const next = [...prev];
            if (next.length > 0 && next[next.length - 1].name === event.name) {
              next.pop();
            }
            return next;
          });
          // Remove variables belonging to this scope
          setVariables(prev => {
            const next = new Map(prev);
            for (const [key, val] of next) {
              if (val.scope === event.name) {
                next.set(key, { ...val, animState: 'leaving' });
              }
            }
            return next;
          });
          // Further delayed cleanup
          setTimeout(() => {
            setVariables(prev => {
              const next = new Map(prev);
              for (const [key, val] of next) {
                if (val.animState === 'leaving') next.delete(key);
              }
              return next;
            });
          }, 400);
        }, 600);
        setDataFlowEvent({ type: 'return', source: event.name, returnValue: event.return_value });
        break;
      }

      case 'print_output':
        setDataFlowEvent({
          type: 'print',
          sourceVars: event.source_vars || [],
          text: event.output_text || '',
        });
        break;

      case 'input_request':
        setIsPlaying(false);
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
        break;

      case 'error':
        setActiveLine(event.line || activeLine);
        setExecError({
          type: event.error_type,
          message: event.message,
          traceback: event.traceback,
          line: event.line,
        });
        // Stop playback when an error occurs
        setIsPlaying(false);
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
        break;

      default:
        break;
    }

    // Clear animation states after a delay
    setTimeout(() => {
      setVariables(prev => {
        let changed = false;
        const next = new Map(prev);
        for (const [key, val] of next) {
          if (val.animState === 'entering' || val.animState === 'updating') {
            next.set(key, { ...val, animState: 'idle' });
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    }, 1200);
  }, []);

  // ─── Rebuild state from scratch for a given step index ──────
  const rebuildState = useCallback((targetStep) => {
    // Reset everything
    setActiveLine(null);
    setActiveCode('');
    setVariables(new Map());
    setCallStack([]);
    setActiveScope('<module>');
    setHighlightVar(null);
    setDataFlowEvent(null);
    setLastEventType(null);
    setExecError(null);

    if (targetStep < 0 || !events.length) return;

    // Replay all events up to targetStep without animations
    for (let i = 0; i <= Math.min(targetStep, events.length - 1); i++) {
      const ev = events[i];

      switch (ev.type) {
        case 'line':
          line = ev.line; code = ev.code || ''; scope = ev.scope || '<module>';
          break;
        case 'var_declare':
          vars.set(ev.name, {
            name: ev.name, value: ev.value, dtype: ev.dtype,
            size: ev.size, addr: ev.addr, scope: ev.scope, animState: 'idle',
          });
          break;
        case 'var_update':
          vars.set(ev.name, {
            ...(vars.get(ev.name) || {}),
            name: ev.name, value: ev.value, dtype: ev.dtype,
            size: ev.size, addr: ev.addr, scope: ev.scope, animState: 'idle',
          });
          break;
        case 'func_call':
          stack.push({ name: ev.name, args: ev.args || {}, line: ev.line, code: ev.code || '' });
          scope = ev.name;
          break;
        case 'func_return':
          if (stack.length && stack[stack.length - 1].name === ev.name) stack.pop();
          for (const [key, val] of vars) { if (val.scope === ev.name) vars.delete(key); }
          scope = stack.length ? stack[stack.length - 1].name : '<module>';
          break;
        case 'print_output':
        case 'input_request':
          // Outputs are displayed in real-time natively, animation state ignores them.
          break;
        case 'error':
          line = ev.line || line;
          setExecError({
            type: ev.error_type,
            message: ev.message,
            traceback: ev.traceback,
            line: ev.line,
          });
          break;
      }
    }

    setActiveLine(line);
    setActiveCode(code);
    setVariables(vars);
    setCallStack([...stack]);
    setActiveScope(scope);
  }, [events]);

  // ─── Step forward ───────────────────────────────────────────
  const stepForward = useCallback(() => {
    setCurrentStep(prev => {
      const next = Math.min(prev + 1, events.length - 1);
      if (next > prev && events[next]) {
        processEvent(events[next]);
      }
      return next;
    });
  }, [events, processEvent]);

  // ─── Step back (rebuild) ────────────────────────────────────
  const stepBack = useCallback(() => {
    setCurrentStep(prev => {
      const next = Math.max(prev - 1, -1);
      rebuildState(next);
      return next;
    });
  }, [rebuildState]);

  // ─── Play / Pause ──────────────────────────────────────────
  const play = useCallback(() => {
    if (currentStep >= events.length - 1) return;
    setIsPlaying(true);
  }, [currentStep, events.length]);

  const pause = useCallback(() => {
    setIsPlaying(false);
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  // ─── Reset ─────────────────────────────────────────────────
  const reset = useCallback(() => {
    pause();
    setCurrentStep(-1);
    rebuildState(-1);
  }, [pause, rebuildState]);

  // ─── Auto-play on events change ────────────────────────────
  useEffect(() => {
    if (events.length > 0 && currentStep === -1) {
      // Auto-start playback when new events arrive
      setCurrentStep(0);
      rebuildState(-1); // clear state
      processEvent(events[0]);
      setIsPlaying(true);
    }
  }, [events]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Play timer ────────────────────────────────────────────
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setCurrentStep(prev => {
          const next = prev + 1;
          if (next >= events.length) {
            setIsPlaying(false);
            clearInterval(timerRef.current);
            timerRef.current = null;
            return prev;
          }
          processEvent(events[next]);
          return next;
        });
      }, SPEED_MAP[speed] || 1500);
    }
    return () => {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    };
  }, [isPlaying, speed, events, processEvent]);

  return {
    state: {
      activeLine,
      activeCode,
      variables,
      callStack,
      activeScope,
      currentStep,
      totalSteps: events.length,
      isPlaying,
      speed,
      lastEventType,
      highlightVar,
      dataFlowEvent,
      execError,
    },
    play,
    pause,
    stepForward,
    stepBack,
    reset,
    setSpeed,
  };
}
