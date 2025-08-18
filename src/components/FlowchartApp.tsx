import React, { useState, useCallback, useMemo } from 'react';
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
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Download, Play, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface ParsedStep {
  id: string;
  text: string;
  level: number;
  branch?: string;
  isParallel: boolean;
  parentId?: string;
}

const FlowchartApp = () => {
  const [promptText, setPromptText] = useState(`Step 1: Start
Step 2a: Resume Upload
Step 2b: Skills/Interests Input
Step 3: AI matches jobs/domains
Step 4: AI suggests roadmaps and courses
Step 5: Company search and interview prep
Step 6: Receive insights`);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

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
            type: 'default',
            position: { x: xPosition, y: yPosition },
            data: { 
              label: step.text 
            },
            style: {
              width: nodeWidth,
              height: nodeHeight,
              background: isParallelLevel ? '#fef3c7' : '#dbeafe',
              border: '2px solid',
              borderColor: isParallelLevel ? '#f59e0b' : '#3b82f6',
              borderRadius: '8px',
              fontSize: '12px',
              padding: '8px'
            },
            sourcePosition: Position.Bottom,
            targetPosition: Position.Top,
          });
        });
      } else {
        // Single node, centered
        const step = levelSteps[0];
        newNodes.push({
          id: step.id,
          type: 'default',
          position: { x: -nodeWidth / 2, y: yPosition },
          data: { 
            label: step.text 
          },
          style: {
            width: nodeWidth,
            height: nodeHeight,
            background: '#dbeafe',
            border: '2px solid #3b82f6',
            borderRadius: '8px',
            fontSize: '12px',
            padding: '8px'
          },
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
  }, [promptText, setNodes, setEdges, parsePrompt]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const clearDiagram = useCallback(() => {
    setNodes([]);
    setEdges([]);
    toast.info('Diagram cleared');
  }, [setNodes, setEdges]);

  const exportDiagram = useCallback(() => {
    toast.info('Export functionality coming soon!');
  }, []);

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
              <Button variant="outline" onClick={exportDiagram}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Right Panel - Flowchart */}
      <div className="flex-1 bg-slate-50">
        <ReactFlow
          nodes={nodes}
          edges={edges}
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