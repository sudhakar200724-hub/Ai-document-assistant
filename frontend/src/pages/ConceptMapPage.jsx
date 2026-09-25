import React, { useState, useEffect } from 'react';
import { Network, ZoomIn, ZoomOut, RotateCcw, FileText, Info, Sparkles, RefreshCw } from 'lucide-react';
import { getConceptMap } from '../services/api';

export default function ConceptMapPage({ activeDoc }) {
  const [mapData, setMapData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    if (activeDoc) {
      loadMap();
    }
  }, [activeDoc]);

  const loadMap = async () => {
    if (!activeDoc) return;
    setLoading(true);
    setSelectedNode(null);
    try {
      const res = await getConceptMap(activeDoc.id);
      setMapData(res.data);
      if (res.data.nodes?.length > 0) {
        setSelectedNode(res.data.nodes[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!activeDoc) {
    return (
      <div className="p-12 text-center text-slate-400">
        <FileText className="w-12 h-12 mx-auto mb-3 opacity-30 text-indigo-500" />
        <h3 className="text-base font-semibold text-slate-700 dark:text-slate-200">No Document Selected</h3>
        <p className="text-xs mt-1">Please select an active document to view its visual concept map.</p>
      </div>
    );
  }

  // Position nodes in a clean radial layout around root
  const nodes = mapData?.nodes || [];
  const edges = mapData?.edges || [];

  const centerX = 340;
  const centerY = 240;
  const radius = 170;

  const nodePositions = {};
  nodes.forEach((n, idx) => {
    if (idx === 0) {
      nodePositions[n.id] = { x: centerX, y: centerY };
    } else {
      const angle = ((idx - 1) / (nodes.length - 1)) * 2 * Math.PI - Math.PI / 2;
      nodePositions[n.id] = {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle)
      };
    }
  });

  const getCategoryColor = (cat) => {
    switch (cat?.toLowerCase()) {
      case 'root theme':
        return '#c026d3'; // Fuchsia
      case 'methodology':
        return '#9333ea'; // Purple
      case 'component':
        return '#db2777'; // Pink
      case 'dataset':
        return '#a855f7'; // Light Purple
      case 'evaluation':
        return '#ec4899'; // Vibrant Pink
      case 'outcome':
        return '#e11d48'; // Rose Pink
      default:
        return '#7c3aed'; // Violet
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-gradient-to-tr from-pink-500/15 to-purple-500/15 text-pink-600 dark:text-purple-400 border border-pink-200/50 dark:border-purple-800/50">
              <Network className="w-5 h-5 text-pink-600 dark:text-purple-400" />
            </span>
            <span>Visual Concept Knowledge Graph</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Hierarchical mapping of core entities, architectural layers, and interconnecting mechanisms in "{activeDoc.title}".
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoom((z) => Math.min(z + 0.15, 1.8))}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-pink-50 dark:hover:bg-pink-950/40 hover:text-pink-600 dark:hover:text-pink-300 hover:border-pink-300 text-slate-600 dark:text-slate-300 transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoom((z) => Math.max(z - 0.15, 0.6))}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-pink-50 dark:hover:bg-pink-950/40 hover:text-pink-600 dark:hover:text-pink-300 hover:border-pink-300 text-slate-600 dark:text-slate-300 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoom(1)}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-pink-50 dark:hover:bg-pink-950/40 hover:text-pink-600 dark:hover:text-pink-300 hover:border-pink-300 text-slate-600 dark:text-slate-300 transition-colors"
            title="Reset Zoom"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Interactive Visual Graph Canvas */}
        <div className="lg:col-span-8 p-4 rounded-2xl bg-white dark:bg-slate-800 border border-pink-100/80 dark:border-purple-950/60 shadow-xs overflow-hidden relative min-h-[500px] flex items-center justify-center">
          {loading ? (
            <div className="text-center space-y-2">
              <RefreshCw className="w-6 h-6 animate-spin text-pink-500 mx-auto" />
              <p className="text-xs text-slate-400">Extracting concept hierarchy...</p>
            </div>
          ) : (
            <div
              className="w-full h-full flex items-center justify-center transition-transform duration-200"
              style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
            >
              <svg width="680" height="480" viewBox="0 0 680 480" className="select-none">
                {/* Connecting Edges */}
                {edges.map((e, idx) => {
                  const src = nodePositions[e.source];
                  const tgt = nodePositions[e.target];
                  if (!src || !tgt) return null;

                  return (
                    <g key={idx}>
                      <line
                        x1={src.x}
                        y1={src.y}
                        x2={tgt.x}
                        y2={tgt.y}
                        stroke="#94a3b8"
                        strokeWidth="1.5"
                        strokeDasharray="4 2"
                        opacity="0.6"
                      />
                    </g>
                  );
                })}

                {/* Nodes */}
                {nodes.map((n, idx) => {
                  const pos = nodePositions[n.id];
                  if (!pos) return null;
                  const isSelected = selectedNode?.id === n.id;
                  const isRoot = idx === 0;
                  const color = getCategoryColor(n.category);

                  return (
                    <g
                      key={n.id}
                      transform={`translate(${pos.x}, ${pos.y})`}
                      onClick={() => setSelectedNode(n)}
                      className="cursor-pointer transition-transform hover:scale-105"
                    >
                      <circle
                        r={isRoot ? 36 : 26}
                        fill={color}
                        opacity={isSelected ? 1 : 0.9}
                        stroke={isSelected ? '#ffffff' : 'none'}
                        strokeWidth={isSelected ? 3 : 0}
                        className="shadow-md"
                      />
                      <text
                        textAnchor="middle"
                        dy={isRoot ? 4 : 3}
                        fill="#ffffff"
                        fontSize={isRoot ? 11 : 9}
                        fontWeight="bold"
                        pointerEvents="none"
                      >
                        {n.label.length > 12 ? n.label.slice(0, 11) + '..' : n.label}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          )}
        </div>

        {/* Concept Inspector Sidebar */}
        <div className="lg:col-span-4 p-6 rounded-2xl bg-white dark:bg-slate-800 border border-purple-100/80 dark:border-pink-950/60 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider pb-2 border-b border-slate-100 dark:border-slate-700">
            <Info className="w-4 h-4 text-pink-500" />
            Concept Inspector
          </div>

          {selectedNode ? (
            <div className="space-y-4 animate-fade-in">
              <div>
                <span
                  className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider text-white inline-block mb-1.5 shadow-2xs"
                  style={{ backgroundColor: getCategoryColor(selectedNode.category) }}
                >
                  {selectedNode.category}
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {selectedNode.label}
                </h3>
              </div>

              <div className="p-3.5 rounded-xl bg-purple-50/20 dark:bg-slate-900 border border-purple-100/60 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                {selectedNode.description}
              </div>

              <div className="text-xs text-slate-400 flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700">
                <span>Primary Document Page:</span>
                <span className="font-semibold text-pink-700 dark:text-pink-300">
                  Page {selectedNode.page_reference || 1}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-xs text-slate-400">
              Click any node in the graph to inspect definition and contextual connections.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
