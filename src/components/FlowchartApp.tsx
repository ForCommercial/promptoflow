import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  Position,
  NodeTypes,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Download, Play, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { EditableNode, EditableNodeData } from './EditableNode';
import { FlowchartToolbar } from './FlowchartToolbar';
import { UserGuide } from './UserGuide';

interface ParsedStep {
  id: string;
  text: string;
  level: number;
  branch?: string;
  isParallel: boolean;
  parentId?: string;
  continuesFromIds?: string[];
}

const FlowchartApp = () => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [promptText, setPromptText] = useState(`Step 1: Start project
Step 2a: Resume Upload
Step 2b: Skills/Interests Input  
Step 3: AI matches jobs/domains
Step 4a: Technical roadmap
Step 4b: Soft skills development
Step 5: Company search and interview prep
Step 6: Receive insights and recommendations`);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [showGuide, setShowGuide] = useState(false);
  const nodeTypes: NodeTypes = useMemo(() => ({
    editable: EditableNode,
  }), []);

  const fixStepLevels = useCallback((steps: ParsedStep[]): ParsedStep[] => {
    if (steps.length === 0) return steps;
    
    // Group by original numeric level
    const levelGroups: { [key: number]: Array<ParsedStep & { _originalLevel?: number; _continuesFromTokens?: string[] }> } = {};
    (steps as Array<ParsedStep & { _originalLevel?: number; _continuesFromTokens?: string[] }>).forEach((step) => {
      const ol = step._originalLevel ?? step.level;
      if (!levelGroups[ol]) levelGroups[ol] = [];
      levelGroups[ol].push(step);
    });
    
    const sortedOriginalLevels = Object.keys(levelGroups).map(Number).sort((a, b) => a - b);
    const oldToNewLevel: Record<number, number> = {};
    const result: Array<ParsedStep & { _continuesFromTokens?: string[]; continuesFromIds?: string[] }> = [];
    let currentOutputLevel = 1;
    
    // Build mapping and remap step ids/levels
    sortedOriginalLevels.forEach((originalLevel) => {
      oldToNewLevel[originalLevel] = currentOutputLevel;
      const stepsAtLevel = levelGroups[originalLevel];
      stepsAtLevel.forEach((step) => {
        const newLevel = currentOutputLevel;
        result.push({
          ...step,
          level: newLevel,
          id: step.branch ? `step-${newLevel}${step.branch}` : `step-${newLevel}`,
        });
      });
      currentOutputLevel++;
    });

    // Resolve continuesFrom tokens to actual ids using the new level mapping
    result.forEach((step) => {
      if (step._continuesFromTokens && step._continuesFromTokens.length) {
        const ids: string[] = [];
        step._continuesFromTokens.forEach((token: string) => {
          const m = token.match(/^(\d+)([a-z]?)$/i);
          if (m) {
            const oldLevel = parseInt(m[1], 10);
            const branch = m[2] || '';
            const mappedLevel = oldToNewLevel[oldLevel] ?? oldLevel;
            ids.push(`step-${mappedLevel}${branch}`);
          }
        });
        step.continuesFromIds = ids;
      }
    });
    
    return result as ParsedStep[];
  }, []);

  const parsePrompt = useCallback((text: string): ParsedStep[] => {
    const lines = text.split('\n').filter(line => line.trim());
    const rawSteps: (ParsedStep & { _originalLevel: number; _continuesFromTokens?: string[] })[] = [];
    
    lines.forEach((line, index) => {
      const trimmed = line.trim();
      
      // Base match: Step X (optional branch a-z)
      const baseMatch = trimmed.match(/^(?:Step\s+)?(\d+)([a-z]?)\s*[.:)-]*\s*(.*)$/i);
      
      if (baseMatch) {
        const [, stepNumStr, branchLetter, restRaw] = baseMatch;
        const originalLevel = parseInt(stepNumStr, 10);
        const branch = branchLetter || undefined;
        let rest = restRaw.trim();
        let continuesFromTokens: string[] | undefined;

        // Detect "(from 2a) ..." or "from 2a: ..." or "continue from 2a,2b - ..."
        const fromParen = rest.match(/^\(\s*(?:from|continue\s+from)\s+([0-9]+[a-z]?(?:\s*,\s*[0-9]+[a-z]?)*?)\s*\)\s*[:-]?\s*(.*)$/i);
        const fromInline = rest.match(/^(?:from|continue\s+from)\s+([0-9]+[a-z]?(?:\s*,\s*[0-9]+[a-z]?)*?)\s*[:-]?\s*(.*)$/i);
        if (fromParen) {
          continuesFromTokens = fromParen[1].split(/\s*,\s*/).map(s => s.toLowerCase());
          rest = fromParen[2].trim();
        } else if (fromInline) {
          continuesFromTokens = fromInline[1].split(/\s*,\s*/).map(s => s.toLowerCase());
          rest = fromInline[2].trim();
        }
        
        rawSteps.push({
          id: `step-${stepNumStr}${branch || ''}`,
          text: rest,
          level: originalLevel,
          branch,
          isParallel: !!branch,
          parentId: branch ? `step-${originalLevel - 1}` : undefined,
          _originalLevel: originalLevel,
          _continuesFromTokens: continuesFromTokens,
        });
      } else if (trimmed) {
        // Fallback for lines that don't match the pattern
        const fallbackLevel = index + 1;        rawSteps.push({
          id: `step-${fallbackLevel}`,
          text: trimmed,
          level: fallbackLevel,
          isParallel: false,
          _originalLevel: fallbackLevel,
        } as ParsedStep & { _originalLevel: number });
      }
    });
      // Normalize levels and resolve continuation references
    const fixedSteps = fixStepLevels(rawSteps as unknown as ParsedStep[]);
    return fixedSteps;
  }, [fixStepLevels]);  // Granular handlers for compatibility (no history tracking)
  const handleNodeEditGranular = useCallback((nodeId: string, newLabel: string) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, label: newLabel } }
          : node
      )
    );
  }, [setNodes]);

  const handleNodeIdEditGranular = useCallback((nodeId: string, newNodeId: string) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId
          ? { ...node, id: newNodeId, data: { ...node.data, nodeId: newNodeId } }
          : node
      )
    );
    // Update edges to reflect ID change
    setEdges((eds) =>
      eds.map((edge) => ({
        ...edge,
        source: edge.source === nodeId ? newNodeId : edge.source,
        target: edge.target === nodeId ? newNodeId : edge.target,
      }))
    );
  }, [setNodes, setEdges]);

  const handleMarkerEditGranular = useCallback((nodeId: string, marker: string, isStart: boolean) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId
          ? { 
              ...node, 
              data: { 
                ...node.data, 
                [isStart ? 'startMarker' : 'endMarker']: marker 
              } 
            }
          : node
      )
    );
  }, [setNodes]);

  const handleNodePositionChangeGranular = useCallback((nodeId: string, newPosition: { x: number, y: number }) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId
          ? { ...node, position: newPosition }
          : node
      )
    );
  }, [setNodes]);

  // Original handlers for backward compatibility
  const handleNodeEdit = useCallback((nodeId: string, newLabel: string) => {
    handleNodeEditGranular(nodeId, newLabel);
    toast.success('Node updated');
  }, [handleNodeEditGranular]);

  const handleNodeIdEdit = useCallback((nodeId: string, newNodeId: string) => {
    handleNodeIdEditGranular(nodeId, newNodeId);
    toast.success('Node ID updated');
  }, [handleNodeIdEditGranular]);

  const handleMarkerEdit = useCallback((nodeId: string, marker: string, isStart: boolean) => {
    handleMarkerEditGranular(nodeId, marker, isStart);
    toast.success(`${isStart ? 'Start' : 'End'} marker updated`);
  }, [handleMarkerEditGranular]);
  const handleMarkerToggle = useCallback((nodeId: string, markerType: 'start' | 'end', enabled: boolean) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId
          ? { 
              ...node, 
              data: { 
                ...node.data, 
                [markerType === 'start' ? 'isStartNode' : 'isEndNode']: enabled,
                [markerType === 'start' ? 'startMarker' : 'endMarker']: enabled ? (markerType === 'start' ? '▶' : '🏁') : undefined
              } 
            }
          : node
      )
    );
    toast.success(`${markerType === 'start' ? 'Start' : 'End'} marker ${enabled ? 'added' : 'removed'}`);
  }, [setNodes]);
  // Interactive editing functions
  const handleNodeDelete = useCallback((nodeId: string) => {
    setNodes((nds) => nds.filter((node) => node.id !== nodeId));
    setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
    toast.success('Node deleted');
  }, [setNodes, setEdges]);
  const handleNodeColorChange = useCallback((nodeId: string, backgroundColor: string, borderColor: string) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId
          ? { 
              ...node, 
              data: { 
                ...node.data, 
                backgroundColor, 
                borderColor 
              } 
            }
          : node
      )
    );
    toast.success('Node color updated');
  }, [setNodes]);
  const generateFlowchart = useCallback(() => {
    const parsedSteps = parsePrompt(promptText);
    
    if (parsedSteps.length === 0) {
      toast.error('Please enter a valid plan with steps');
      return;
    }

    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];
    
    // Group parallel steps
    const stepGroups = parsedSteps.reduce((groups, step) => {
      const key = step.level;
      if (!groups[key]) groups[key] = [];
      groups[key].push(step);
      return groups;
    }, {} as Record<number, ParsedStep[]>);

    let yPosition = 0;
    const nodeWidth = 200;
    const nodeHeight = 60;
    const verticalSpacing = 100;
    const horizontalSpacing = 250;    const sortedLevels = Object.keys(stepGroups).sort((a, b) => parseInt(a) - parseInt(b));
    
    sortedLevels.forEach((levelKey, levelIndex) => {
      const levelSteps = stepGroups[parseInt(levelKey)];
      const isParallelLevel = levelSteps.length > 1;
      
      if (isParallelLevel) {
        // Position parallel nodes side by side
        const totalWidth = (levelSteps.length - 1) * horizontalSpacing;
        const startX = -totalWidth / 2;
        
        levelSteps.forEach((step, index) => {
          const xPosition = startX + (index * horizontalSpacing);
          
          newNodes.push({
            id: step.id,
            type: 'editable',
            position: { x: xPosition, y: yPosition },
            data: { 
              label: step.text,
              nodeId: step.id,
              backgroundColor: isParallelLevel ? '#fef3c7' : '#dbeafe',
              borderColor: isParallelLevel ? '#f59e0b' : '#3b82f6',
              isStartNode: levelIndex === 0 && index === 0,
              isEndNode: levelIndex === sortedLevels.length - 1,
              startMarker: levelIndex === 0 && index === 0 ? '▶' : undefined,
              endMarker: levelIndex === sortedLevels.length - 1 ? '🏁' : undefined,
              onEdit: handleNodeEditGranular,
              onIdEdit: handleNodeIdEditGranular,
              onMarkerEdit: handleMarkerEditGranular,
              onMarkerToggle: handleMarkerToggle,
              onDelete: handleNodeDelete,
              onColorChange: handleNodeColorChange,
            } as EditableNodeData,
            sourcePosition: Position.Bottom,
            targetPosition: Position.Top,
          });
        });
      } else {
        // Single node, centered
        const step = levelSteps[0];
        newNodes.push({
          id: step.id,
          type: 'editable',
          position: { x: -nodeWidth / 2, y: yPosition },
          data: { 
            label: step.text,
            nodeId: step.id,
            backgroundColor: '#dbeafe',
            borderColor: '#3b82f6',
            isStartNode: levelIndex === 0,
            isEndNode: levelIndex === sortedLevels.length - 1,
            startMarker: levelIndex === 0 ? '▶' : undefined,
            endMarker: levelIndex === sortedLevels.length - 1 ? '🏁' : undefined,
            onEdit: handleNodeEditGranular,
            onIdEdit: handleNodeIdEditGranular,
            onMarkerEdit: handleMarkerEditGranular,
            onMarkerToggle: handleMarkerToggle,
            onDelete: handleNodeDelete,
            onColorChange: handleNodeColorChange,
          } as EditableNodeData,
          sourcePosition: Position.Bottom,
          targetPosition: Position.Top,
        });
      }

      yPosition += verticalSpacing;
    });    // Create edges
    const edgeLevels = Object.keys(stepGroups)
      .map((n) => parseInt(n))
      .sort((a, b) => a - b);    for (let i = 1; i < edgeLevels.length; i++) {
      const currentLevel = edgeLevels[i];
      const prevLevel = edgeLevels[i - 1];
      const currentSteps = stepGroups[currentLevel];
      const prevSteps = stepGroups[prevLevel] || [];

      currentSteps.forEach((nextStep) => {
        const cont = (nextStep as ParsedStep & { continuesFromIds?: string[] }).continuesFromIds;
        if (cont && cont.length) {
          // Explicit continuation: connect only from specified sources
          cont.forEach((sourceId) => {
            newEdges.push({
              id: `e-${sourceId}-${nextStep.id}`,
              source: sourceId,
              target: nextStep.id,
              type: 'smoothstep',
              style: { stroke: '#6b7280', strokeWidth: 2 },
              deletable: true,
            });
          });
        } else {
          // Default behavior: connect from previous level
          if (prevSteps.length === 1) {
            newEdges.push({
              id: `e-${prevSteps[0].id}-${nextStep.id}`,
              source: prevSteps[0].id,
              target: nextStep.id,
              type: 'smoothstep',
              style: { stroke: '#6b7280', strokeWidth: 2 },
              deletable: true,
            });
          } else if (prevSteps.length > 1) {
            prevSteps.forEach((prevStep) => {
              newEdges.push({
                id: `e-${prevStep.id}-${nextStep.id}`,
                source: prevStep.id,
                target: nextStep.id,
                type: 'smoothstep',
                style: { stroke: '#f59e0b', strokeWidth: 2 },
                deletable: true,
              });
            });
          }
        }
      });
    }

    setNodes(newNodes);
    setEdges(newEdges);
    toast.success('Flowchart generated successfully!');
  }, [promptText, setNodes, setEdges, parsePrompt, handleNodeEditGranular, handleNodeIdEditGranular, handleMarkerEditGranular, handleMarkerToggle, handleNodeDelete, handleNodeColorChange]);
  const addNewNode = useCallback(() => {
    const newNodeId = `node-${Date.now()}`;
    const newNode: Node = {
      id: newNodeId,
      type: 'editable',
      position: { x: Math.random() * 400 - 200, y: Math.random() * 400 },      data: {
        label: 'New Node',
        nodeId: newNodeId,
        backgroundColor: '#dbeafe',
        borderColor: '#3b82f6',
        onEdit: handleNodeEditGranular,
        onIdEdit: handleNodeIdEditGranular,
        onMarkerEdit: handleMarkerEditGranular,
        onMarkerToggle: handleMarkerToggle,
        onDelete: handleNodeDelete,
        onColorChange: handleNodeColorChange,
      } as EditableNodeData,
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
    };
    
    setNodes((nds) => [...nds, newNode]);
    toast.success('New node added');
  }, [setNodes, handleNodeEditGranular, handleNodeIdEditGranular, handleMarkerEditGranular, handleMarkerToggle, handleNodeDelete, handleNodeColorChange]);
  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => addEdge({
        ...params,
        type: 'smoothstep',
        style: { stroke: '#6b7280', strokeWidth: 2 },
        deletable: true
      }, eds));
      toast.success('Connection created');
    },
    [setEdges]
  );
  const onEdgesDelete = useCallback((edgesToDelete: Edge[]) => {
    setEdges((eds) => eds.filter((edge) => !edgesToDelete.find(e => e.id === edge.id)));
    toast.success('Connection deleted');
  }, [setEdges]);
  const clearDiagram = useCallback(() => {
    setNodes([]);
    setEdges([]);
    toast.info('Diagram cleared');
  }, [setNodes, setEdges]);  const exportToPNG = useCallback(async () => {
    if (!reactFlowWrapper.current) return;
      try {
      // Get only the ReactFlow viewport for cleaner export
      const reactFlowElement = reactFlowWrapper.current.querySelector('.react-flow');
      if (!reactFlowElement) {
        toast.error('Could not find flowchart to export');
        return;
      }
      
      // Wait longer to ensure all edges are fully rendered and animations completed
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const canvas = await html2canvas(reactFlowElement as HTMLElement, {
        backgroundColor: '#f8fafc',
        scale: 2,
        useCORS: true,
        allowTaint: true,
        foreignObjectRendering: true,
        logging: false,
        width: reactFlowElement.scrollWidth,
        height: reactFlowElement.scrollHeight,
        onclone: (clonedDoc) => {
          // Force all edge elements to be visible and styled properly
          const clonedEdges = clonedDoc.querySelectorAll('.react-flow__edge, .react-flow__edge-path, .react-flow__edge path, .react-flow__edges');
          clonedEdges.forEach((edge) => {
            const element = edge as HTMLElement;
            element.style.display = 'block';
            element.style.visibility = 'visible';
            element.style.opacity = '1';
            element.style.pointerEvents = 'none';
            
            // Force stroke properties for SVG paths
            if (element.tagName === 'path') {
              element.style.stroke = element.style.stroke || '#6b7280';
              element.style.strokeWidth = element.style.strokeWidth || '2';
              element.style.fill = 'none';
            }
          });
          
          // Ensure SVG elements are properly styled
          const svgElements = clonedDoc.querySelectorAll('svg');
          svgElements.forEach((svg) => {
            svg.style.display = 'block';
            svg.style.visibility = 'visible';
            svg.style.opacity = '1';
          });
          
          // Force render all ReactFlow edge containers
          const edgeContainers = clonedDoc.querySelectorAll('.react-flow__edges, .react-flow__edge-wrapper');
          edgeContainers.forEach((container) => {
            (container as HTMLElement).style.display = 'block';
            (container as HTMLElement).style.visibility = 'visible';
            (container as HTMLElement).style.opacity = '1';
          });
        },
        ignoreElements: (element) => {
          // Only ignore UI controls, keep all flowchart elements
          return element.closest('.react-flow__controls') !== null ||
                 element.closest('.react-flow__minimap') !== null ||
                 element.closest('[data-testid="rf__toolbar"]') !== null;
        }
      });
      
      const link = document.createElement('a');
      link.download = `prompttoflow-${new Date().toISOString().split('T')[0]}.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      link.click();
      
      toast.success('Flowchart exported as PNG');
    } catch (error) {
      toast.error('Failed to export as PNG');
      console.error('Export error:', error);
    }
  }, []);  const exportToPDF = useCallback(async () => {
    if (!reactFlowWrapper.current) return;
    
    try {
      // Get only the ReactFlow viewport for cleaner export
      const reactFlowElement = reactFlowWrapper.current.querySelector('.react-flow');
      if (!reactFlowElement) {
        toast.error('Could not find flowchart to export');
        return;
      }
      
      // Wait longer to ensure all edges are fully rendered and animations completed
      await new Promise(resolve => setTimeout(resolve, 300));
        
      const canvas = await html2canvas(reactFlowElement as HTMLElement, {
        backgroundColor: '#f8fafc',
        scale: 2,
        useCORS: true,
        allowTaint: true,
        foreignObjectRendering: true,
        logging: false,
        width: reactFlowElement.scrollWidth,
        height: reactFlowElement.scrollHeight,
        onclone: (clonedDoc) => {
          // Force all edge elements to be visible and styled properly
          const clonedEdges = clonedDoc.querySelectorAll('.react-flow__edge, .react-flow__edge-path, .react-flow__edge path, .react-flow__edges');
          clonedEdges.forEach((edge) => {
            const element = edge as HTMLElement;
            element.style.display = 'block';
            element.style.visibility = 'visible';
            element.style.opacity = '1';
            element.style.pointerEvents = 'none';
            
            // Force stroke properties for SVG paths
            if (element.tagName === 'path') {
              element.style.stroke = element.style.stroke || '#6b7280';
              element.style.strokeWidth = element.style.strokeWidth || '2';
              element.style.fill = 'none';
            }
          });
          
          // Ensure SVG elements are properly styled
          const svgElements = clonedDoc.querySelectorAll('svg');
          svgElements.forEach((svg) => {
            svg.style.display = 'block';
            svg.style.visibility = 'visible';
            svg.style.opacity = '1';
          });
          
          // Force render all ReactFlow edge containers
          const edgeContainers = clonedDoc.querySelectorAll('.react-flow__edges, .react-flow__edge-wrapper');
          edgeContainers.forEach((container) => {
            (container as HTMLElement).style.display = 'block';
            (container as HTMLElement).style.visibility = 'visible';
            (container as HTMLElement).style.opacity = '1';
          });
        },
        ignoreElements: (element) => {
          // Only ignore UI controls, keep all flowchart elements
          return element.closest('.react-flow__controls') !== null ||
                 element.closest('.react-flow__minimap') !== null ||
                 element.closest('[data-testid="rf__toolbar"]') !== null;
        }
      });
      
      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 0;
      
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }
      
      pdf.save(`prompttoflow-${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('Flowchart exported as PDF');
    } catch (error) {
      toast.error('Failed to export as PDF');
      console.error('Export error:', error);
    }
  }, []);

  const saveProject = useCallback(() => {
    const project = {
      promptText,
      nodes,
      edges,
      timestamp: new Date().toISOString()
    };
    
    localStorage.setItem('flowchart-project', JSON.stringify(project));
    toast.success('Project saved locally');
  }, [promptText, nodes, edges]);

  return (
    <div className="h-screen flex">
      {/* Left Panel - Input */}
      <div className="w-1/3 p-4 border-r border-border bg-background">
        <Card className="h-full p-4">
          <div className="flex flex-col h-full">
            <div className="mb-4">
              <h2 className="text-xl font-semibold mb-2">Prompt to Flowchart</h2>
              <p className="text-sm text-muted-foreground">
                Enter your structured plan below. Use format like "Step 1:", "Step 2a:", etc.
              </p>
            </div>
            
            <div className="flex-1 mb-4">
              <Textarea
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                placeholder="Enter your plan here..."
                className="h-full resize-none"
              />
            </div>
            
            <div className="flex gap-2 mb-3">
              <Button onClick={generateFlowchart} className="flex-1">
                <Play className="w-4 h-4 mr-2" />
                Generate
              </Button>
              <Button variant="outline" onClick={clearDiagram}>
                <Trash2 className="w-4 h-4 mr-2" />
                Clear
              </Button>
            </div>
            
            <Button 
              variant="secondary" 
              onClick={() => setShowGuide(!showGuide)} 
              className="w-full"
            >
              {showGuide ? 'Hide Guide' : 'Show Guide & Examples'}
            </Button>
            
            {showGuide && (
              <div className="mt-4">
                <UserGuide />
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Right Panel - Flowchart */}      <div className="flex-1 bg-slate-50 relative" ref={reactFlowWrapper}>        <FlowchartToolbar 
          onAddNode={addNewNode}
          onExportPNG={exportToPNG}
          onExportPDF={exportToPDF}
          onSaveProject={saveProject}
        />
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onEdgesDelete={onEdgesDelete}
          deleteKeyCode={['Backspace', 'Delete']}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.2}
          maxZoom={2}
          style={{ backgroundColor: '#f8fafc' }}
          edgesFocusable={true}
          edgesReconnectable={true}
        >
          <Background color="#e2e8f0" size={1} />
          <Controls />
          <MiniMap 
            nodeColor={() => '#3b82f6'}
            nodeStrokeWidth={3}
            zoomable
            pannable
          />
        </ReactFlow>
      </div>
    </div>
  );
};

export default FlowchartApp;