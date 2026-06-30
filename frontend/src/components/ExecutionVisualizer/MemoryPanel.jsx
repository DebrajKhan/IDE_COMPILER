import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Helper Functions ---
const sizeLabel = (bytes) => {
  if (bytes === undefined || bytes === null) return '0 Bytes';
  if (bytes < 1024) return `${bytes} Bytes`;
  return `${(bytes / 1024).toFixed(1)} KB`;
};

const typeColor = (dtype) => {
  const map = {
    int: '#4ec9b0', float: '#4ec9b0', bool: '#4ec9b0',
    str: '#ce9178', list: '#dcdcaa', dict: '#dcdcaa', vector: '#dcdcaa',
    tuple: '#c586c0', set: '#c586c0', NoneType: '#858585', pointer: '#c586c0',
    object: '#569cd6', struct: '#569cd6', class: '#569cd6',
    array: '#dcdcaa', primitive: '#4ec9b0',
  };
  return map[dtype] || '#9cdcfe';
};

const valueDisplay = (value) => {
  if (value === null || value === undefined) return 'None';
  if (typeof value === 'object') return JSON.stringify(value).slice(0, 30);
  return String(value);
};

/**
 * Smart pointer index resolver.
 * 1. First: try to find iter.value as an ELEMENT in the array (for-each loops).
 * 2. Fallback: if iter.value is a valid INDEX into the array (range loops).
 * Returns -1 if no match.
 */
const getPointerIndex = (iterValue, items) => {
  // Value-match first (handles `for val in arr:` where val IS an element)
  const valueIdx = items.findIndex(item =>
    item === iterValue || String(item) === String(iterValue)
  );
  if (valueIdx !== -1) return valueIdx;

  // Index-match fallback (handles `for i in range(n):` where i IS an index)
  if (Number.isInteger(iterValue) && iterValue >= 0 && iterValue < items.length) {
    return iterValue;
  }

  return -1;
};

// --- Sub-Component: Array/Vector/String Block Visualizer ---
const ArrayBlockVisualizer = ({ name, value, iterators, meta, highlightVar }) => {
  const items = typeof value === 'string'
    ? value.split('')
    : (Array.isArray(value) ? value : []);

  const totalBytes = meta.size || 0;
  const isHighlight = highlightVar === name;

  // Pre-compute which iterators point to which array indices
  // Derived from the SAME state snapshot in a single pass — no async delay.
  const pointerMap = {};
  iterators.forEach(iter => {
    const targetIdx = getPointerIndex(iter.value, items);
    if (targetIdx !== -1) {
      if (!pointerMap[targetIdx]) pointerMap[targetIdx] = [];
      pointerMap[targetIdx].push(iter);
    }
  });

  return (
    <div className={`mb-6 p-4 rounded-lg border-2 transition-colors duration-300 ${isHighlight ? 'border-blue-500 bg-[#1e1e2e]' : 'border-gray-700 bg-[#181825]'}`}>
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-2 items-center">
          <span className="font-mono text-lg font-bold text-white">{name}</span>
          <span className="text-xs px-2 py-0.5 rounded border" style={{ color: typeColor(meta.dtype), borderColor: typeColor(meta.dtype) }}>
            {meta.dtype}
          </span>
          <span className="text-xs text-gray-500 font-mono">
            [{items.length} elements]
          </span>
        </div>
        <div className="text-xs text-gray-400 font-mono flex items-center gap-2">
          <span>Allocated:</span>
          <span className="bg-blue-900/40 text-blue-300 px-2 py-1 rounded font-bold border border-blue-800/50">
            {sizeLabel(totalBytes)}
          </span>
        </div>
      </div>
      <div className="flex flex-wrap gap-1 relative pb-8">
        <AnimatePresence>
          {items.map((item, index) => (
            <motion.div
              key={`${name}-el-${index}`}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 20, delay: index * 0.05 }}
              className="relative flex flex-col items-center"
            >
              <div
                className="w-10 h-10 border flex items-center justify-center rounded font-mono text-sm bg-[#11111b] text-white shadow-lg"
                style={{ borderColor: typeColor(meta.dtype) }}
              >
                {item === ' ' ? '␣' : valueDisplay(item)}
              </div>
              <span className="text-[10px] text-gray-500 mt-1">[{index}]</span>

              {/* Pointer indicators — layoutId enables smooth spring slide between indices */}
              {pointerMap[index] && pointerMap[index].map(iter => (
                <motion.div
                  key={`ptr-${iter.name}`}
                  layoutId={`pointer-${iter.name}`}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 flex flex-col items-center"
                >
                  <span className="text-red-500 text-xs mt-[-4px]">↑</span>
                  <span className="text-red-400 text-xs font-bold font-mono">{iter.name}</span>
                </motion.div>
              ))}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

// --- Sub-Component: Object/Struct Visualizer ---
const ObjectBlockVisualizer = ({ name, value, meta, highlightVar }) => {
  const isHighlight = highlightVar === name;
  const totalBytes = meta.size || 0;
  const fields = (typeof value === 'object' && value !== null && !Array.isArray(value)) ? Object.entries(value) : [];

  return (
    <div className={`mb-6 p-4 rounded-lg border-2 transition-colors duration-300 ${isHighlight ? 'border-blue-500 bg-[#1e1e2e]' : 'border-gray-700 bg-[#181825]'}`}>
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-2 items-center">
          <span className="font-mono text-lg font-bold text-white">{name}</span>
          <span className="text-xs px-2 py-0.5 rounded border" style={{ color: typeColor(meta.dtype), borderColor: typeColor(meta.dtype) }}>
            {meta.dtype || 'object'}
          </span>
        </div>
        <div className="text-xs text-gray-400 font-mono flex items-center gap-2">
          <span>Allocated:</span>
          <span className="bg-purple-900/40 text-purple-300 px-2 py-1 rounded font-bold border border-purple-800/50">
            {sizeLabel(totalBytes)}
          </span>
        </div>
      </div>
      <div className="bg-[#11111b] rounded border border-gray-700 p-3 flex flex-col gap-2">
        {fields.length === 0 ? (
          <div className="text-gray-500 text-sm font-mono italic">No exposed fields</div>
        ) : (
          fields.map(([fieldName, fieldData]) => (
            <div key={fieldName} className="flex items-center justify-between border-b border-gray-800 pb-2 last:border-0 last:pb-0">
              <span className="font-mono text-sm text-blue-300">{fieldName}</span>
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm text-white">
                  {typeof fieldData === 'object' && fieldData !== null ? valueDisplay(fieldData.value) : valueDisplay(fieldData)}
                </span>
                <span className="text-[10px] text-gray-500 w-16 text-right">
                  {sizeLabel(fieldData?.size || 0)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// --- Main Panel Component ---
// ALL state (iterators, arrays, primitives) is derived from the
// same `variables` Map in a SINGLE synchronous pass. No setTimeout,
// no async delays — guarantees frame-perfect consistency.
export default function MemoryPanel({ variables, highlightVar }) {
  const entries = [...variables.entries()];

  // Single-pass derivation from the same state snapshot
  const arrays = [];
  const objects = [];
  const iterators = [];
  const primitives = [];

  entries.forEach(([name, v]) => {
    const isGDBObj = v.dtype === 'object' || v.dtype === 'struct' || v.dtype === 'class';
    const isArrayType = v.dtype === 'array' || v.dtype === 'list' || v.dtype === 'vector' || v.dtype === 'str' || v.dtype === 'tuple';

    if (isGDBObj || (typeof v.value === 'object' && v.value !== null && !Array.isArray(v.value))) {
      objects.push({ name, ...v });
    }
    else if (isArrayType || Array.isArray(v.value) || typeof v.value === 'string') {
      arrays.push({ name, ...v });
    }
    else {
      // ALL numeric primitives become potential iterator pointers
      if (typeof v.value === 'number') {
        iterators.push({ name, value: v.value });
      }
      primitives.push({ name, ...v });
    }
  });

  return (
    <div className="mem-panel h-full flex flex-col p-4 bg-[#1e1e2e] text-white overflow-y-auto">
      <div className="flex items-center gap-2 mb-6 border-b border-gray-700 pb-2">
        <span className="text-xl">💾</span>
        <span className="font-bold text-sm tracking-wider text-gray-300">RAM MEMORY</span>
        <span className="ml-auto bg-gray-700 text-xs px-2 py-1 rounded-full">{entries.length} items</span>
      </div>

      {entries.length === 0 && (
        <div className="flex-1 flex items-center justify-center text-gray-500 opacity-50">
          No variables allocated in memory yet.
        </div>
      )}

      {/* Render Objects and Classes */}
      {objects.map((obj) => (
        <ObjectBlockVisualizer
          key={obj.name}
          name={obj.name}
          value={obj.value}
          meta={obj}
          highlightVar={highlightVar}
        />
      ))}

      {/* Render Arrays / Vectors / Strings */}
      {arrays.map((arr) => (
        <ArrayBlockVisualizer
          key={arr.name}
          name={arr.name}
          value={arr.value}
          meta={arr}
          iterators={iterators}
          highlightVar={highlightVar}
        />
      ))}

      {/* Render Primitives (Standard Variables) */}
      {primitives.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-700">
          <h4 className="text-xs text-gray-500 mb-3 font-mono">Standard Variables</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <AnimatePresence>
              {primitives.map((prim) => (
                <motion.div
                  key={prim.name}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="flex flex-col bg-[#181825] border border-gray-700 p-2 rounded relative overflow-hidden"
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-mono text-sm font-bold text-blue-300">{prim.name}</span>
                    <span className="text-[10px] uppercase text-gray-500">{prim.dtype}</span>
                  </div>
                  <div className="font-mono text-lg mb-1">{valueDisplay(prim.value)}</div>
                  <div className="text-[10px] text-gray-500 text-right mt-auto border-t border-gray-800 pt-1">
                    {sizeLabel(prim.size)}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}