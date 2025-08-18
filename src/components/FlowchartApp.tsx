import React, { useState, useCallback, useMemo, useRef } from 'react';
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

interface ParsedStep {
  id: string;
  text: string;
  level: number;
  branch?: string;
  isParallel: boolean;
  parentId?: string;
}

const FlowchartApp = () => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [promptText, setPromptText] = useState(`Step 1: Start
Step 2a: Resume Upload
Step 2b: Skills/Interests Input
Step 3: AI matches jobs/domains
Step 4: AI suggests roadmaps and courses
Step 5: Company search and interview prep
Step 6: Receive insights`);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const nodeTypes: NodeTypes = useMemo(() => ({
    editable: EditableNode,
  }), []);

  const parsePrompt = useCallback((text: string): ParsedStep[] => {
    const lines = text.split('\n').filter(line => line.trim());
    const steps: ParsedStep[] = [];
    
    lines.forEach((line, index) => {
      const trimmed = line.trim();
      
      // Match patterns like "Step 1:", "Step 2a:", "2.", "1)", etc.
      const stepMatch = trimmed.match(/^(?:Step\s+)?(\d+)([a-z]?)[\s\.\):\-]*(.+)$/i);
      
      if (stepMatch) {
        const [, stepNum, branch, text] = stepMatch;
        const level = parseInt(stepNum);
        const isParallel = !!branch;
        
        steps.push({
          id: `step-${stepNum}${branch}`,
          text: text.trim(),
          level,
          branch: branch || undefined,
          isParallel,
          parentId: isParallel ? `step-${level - 1}` : undefined
        });
      } else if (trimmed) {
        // Fallback for lines that don't match the pattern
        steps.push({
          id: `step-${index + 1}`,
          text: trimmed,
          level: index + 1,
          isParallel: false
        });
      }
    });
    
    return steps;
  }, []);

  // Interactive editing functions
  const handleNodeEdit = useCallback((nodeId: string, newLabel: string) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, label: newLabel } }
          : node
      )
    );
    toast.success('Node updated');
  }, [setNodes]);

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
    const horizontalSpacing = 250;

    Object.keys(stepGroups).sort((a, b) => parseInt(a) - parseInt(b)).forEach((levelKey) => {
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
              backgroundColor: isParallelLevel ? '#fef3c7' : '#dbeafe',
              borderColor: isParallelLevel ? '#f59e0b' : '#3b82f6',
              onEdit: handleNodeEdit,
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
            backgroundColor: '#dbeafe',
            borderColor: '#3b82f6',
            onEdit: handleNodeEdit,
            onDelete: handleNodeDelete,
            onColorChange: handleNodeColorChange,
          } as EditableNodeData,
          sourcePosition: Position.Bottom,
          targetPosition: Position.Top,
        });
      }

      yPosition += verticalSpacing;
    });

    // Create edges
    for (let i = 0; i < Object.keys(stepGroups).length - 1; i++) {
      const currentLevel = parseInt(Object.keys(stepGroups).sort((a, b) => parseInt(a) - parseInt(b))[i]);
      const nextLevel = parseInt(Object.keys(stepGroups).sort((a, b) => parseInt(a) - parseInt(b))[i + 1]);
      
      const currentSteps = stepGroups[currentLevel];
      const nextSteps = stepGroups[nextLevel];
      
      if (currentSteps.length === 1 && nextSteps.length === 1) {
        // Simple connection
        newEdges.push({
          id: `e-${currentSteps[0].id}-${nextSteps[0].id}`,
          source: currentSteps[0].id,
          target: nextSteps[0].id,
          type: 'smoothstep',
          style: { stroke: '#6b7280', strokeWidth: 2 }
        });
      } else if (currentSteps.length === 1 && nextSteps.length > 1) {
        // Fan out from single to multiple
        nextSteps.forEach(nextStep => {
          newEdges.push({
            id: `e-${currentSteps[0].id}-${nextStep.id}`,
            source: currentSteps[0].id,
            target: nextStep.id,
            type: 'smoothstep',
            style: { stroke: '#f59e0b', strokeWidth: 2 }
          });
        });
      } else if (currentSteps.length > 1 && nextSteps.length === 1) {
        // Fan in from multiple to single
        currentSteps.forEach(currentStep => {
          newEdges.push({
            id: `e-${currentStep.id}-${nextSteps[0].id}`,
            source: currentStep.id,
            target: nextSteps[0].id,
            type: 'smoothstep',
            style: { stroke: '#f59e0b', strokeWidth: 2 }
          });
        });
      } else {
        // Multiple to multiple (connect each to each)
        currentSteps.forEach(currentStep => {
          nextSteps.forEach(nextStep => {
            newEdges.push({
              id: `e-${currentStep.id}-${nextStep.id}`,
              source: currentStep.id,
              target: nextStep.id,
              type: 'smoothstep',
              style: { stroke: '#6b7280', strokeWidth: 1 }
            });
          });
        });
      }
    }

    setNodes(newNodes);
    setEdges(newEdges);
    toast.success('Flowchart generated successfully!');
  }, [promptText, setNodes, setEdges, parsePrompt, handleNodeEdit, handleNodeDelete, handleNodeColorChange]);

  const addNewNode = useCallback(() => {
    const newNodeId = `node-${Date.now()}`;
    const newNode: Node = {
      id: newNodeId,
      type: 'editable',
      position: { x: Math.random() * 400 - 200, y: Math.random() * 400 },
      data: {
        label: 'New Node',
        backgroundColor: '#dbeafe',
        borderColor: '#3b82f6',
        onEdit: handleNodeEdit,
        onDelete: handleNodeDelete,
        onColorChange: handleNodeColorChange,
      } as EditableNodeData,
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
    };
    
    setNodes((nds) => [...nds, newNode]);
    toast.success('New node added');
  }, [setNodes, handleNodeEdit, handleNodeDelete, handleNodeColorChange]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const clearDiagram = useCallback(() => {
    setNodes([]);
    setEdges([]);
    toast.info('Diagram cleared');
  }, [setNodes, setEdges]);

  const exportToPNG = useCallback(async () => {
    if (!reactFlowWrapper.current) return;
    
    try {
      const canvas = await html2canvas(reactFlowWrapper.current, {
        backgroundColor: '#f8fafc',
        scale: 2,
      });
      
      const link = document.createElement('a');
      link.download = 'flowchart.png';
      link.href = canvas.toDataURL();
      link.click();
      
      toast.success('Flowchart exported as PNG');
    } catch (error) {
      toast.error('Failed to export as PNG');
      console.error('Export error:', error);
    }
  }, []);

  const exportToPDF = useCallback(async () => {
    if (!reactFlowWrapper.current) return;
    
    try {
      const canvas = await html2canvas(reactFlowWrapper.current, {
        backgroundColor: '#f8fafc',
        scale: 2,
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF();
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      
      let position = 0;
      
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      pdf.save('flowchart.pdf');
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
            
            <div className="flex gap-2">
              <Button onClick={generateFlowchart} className="flex-1">
                <Play className="w-4 h-4 mr-2" />
                Generate
              </Button>
              <Button variant="outline" onClick={clearDiagram}>
                <Trash2 className="w-4 h-4 mr-2" />
                Clear
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Right Panel - Flowchart */}
      <div className="flex-1 bg-slate-50 relative" ref={reactFlowWrapper}>
        <FlowchartToolbar 
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
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.2}
          maxZoom={2}
          style={{ backgroundColor: '#f8fafc' }}
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