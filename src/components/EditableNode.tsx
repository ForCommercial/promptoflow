import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Edit, Trash2, Palette } from 'lucide-react';

export interface EditableNodeData extends Record<string, unknown> {
  label: string;
  nodeId?: string;
  backgroundColor?: string;
  borderColor?: string;
  isStartNode?: boolean;
  isEndNode?: boolean;
  startMarker?: string;
  endMarker?: string;
  onEdit?: (id: string, newLabel: string) => void;
  onIdEdit?: (id: string, newNodeId: string) => void;
  onMarkerEdit?: (id: string, marker: string, isStart: boolean) => void;
  onMarkerToggle?: (id: string, markerType: 'start' | 'end', enabled: boolean) => void;
  onDelete?: (id: string) => void;
  onColorChange?: (id: string, backgroundColor: string, borderColor: string) => void;
}

const colors = [
  { bg: '#dbeafe', border: '#3b82f6', name: 'Blue' },
  { bg: '#fef3c7', border: '#f59e0b', name: 'Yellow' },
  { bg: '#dcfce7', border: '#16a34a', name: 'Green' },
  { bg: '#fde2e8', border: '#e11d48', name: 'Red' },
  { bg: '#f3e8ff', border: '#9333ea', name: 'Purple' },
  { bg: '#e0f2fe', border: '#0891b2', name: 'Cyan' },
  { bg: '#fff7ed', border: '#ea580c', name: 'Orange' },
  { bg: '#f1f5f9', border: '#475569', name: 'Gray' },
];

export const EditableNode: React.FC<NodeProps> = ({
  id, 
  data, 
  selected 
}) => {  const nodeData = data as unknown as EditableNodeData;
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingId, setIsEditingId] = useState(false);
  const [isEditingMarker, setIsEditingMarker] = useState(false);
  const [editValue, setEditValue] = useState(nodeData.label || '');
  const [editIdValue, setEditIdValue] = useState(nodeData.nodeId || id);
  const [editMarkerValue, setEditMarkerValue] = useState('');
  const [editingStartMarker, setEditingStartMarker] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const idInputRef = useRef<HTMLInputElement>(null);
  const markerInputRef = useRef<HTMLInputElement>(null);  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
    if (isEditingId && idInputRef.current) {
      idInputRef.current.focus();
      idInputRef.current.select();
    }
    if (isEditingMarker && markerInputRef.current) {
      markerInputRef.current.focus();
      markerInputRef.current.select();
    }
  }, [isEditing, isEditingId, isEditingMarker]);

  const handleEdit = useCallback(() => {
    setIsEditing(true);
  }, []);

  const handleIdEdit = useCallback(() => {
    setIsEditingId(true);
  }, []);

  const handleMarkerEdit = useCallback((isStart: boolean) => {
    const currentMarker = isStart ? nodeData.startMarker || '▶' : nodeData.endMarker || '🏁';
    setEditMarkerValue(currentMarker);
    setEditingStartMarker(isStart);
    setIsEditingMarker(true);
  }, [nodeData.startMarker, nodeData.endMarker]);

  // Granular real-time handlers for inch-by-inch tracking
  const handleRealTimeEdit = useCallback((newValue: string) => {
    setEditValue(newValue);
    if (nodeData.onEdit) {
      nodeData.onEdit(id, newValue); // Call immediately for every keystroke
    }
  }, [nodeData.onEdit, id]);

  const handleRealTimeIdEdit = useCallback((newValue: string) => {
    setEditIdValue(newValue);
    if (nodeData.onIdEdit && newValue.trim()) {
      nodeData.onIdEdit(id, newValue.trim()); // Call immediately for every keystroke
    }
  }, [nodeData.onIdEdit, id]);

  const handleRealTimeMarkerEdit = useCallback((newValue: string) => {
    setEditMarkerValue(newValue);
    if (nodeData.onMarkerEdit) {
      nodeData.onMarkerEdit(id, newValue, editingStartMarker); // Call immediately for every keystroke
    }
  }, [nodeData.onMarkerEdit, id, editingStartMarker]);

  const handleSave = useCallback(() => {
    if (editValue.trim() && nodeData.onEdit) {
      nodeData.onEdit(id, editValue.trim());
    }
    setIsEditing(false);
  }, [editValue, nodeData.onEdit, id]);
  const handleIdSave = useCallback(() => {
    if (editIdValue.trim() && nodeData.onIdEdit) {
      nodeData.onIdEdit(id, editIdValue.trim());
    }
    setIsEditingId(false);
  }, [editIdValue, nodeData.onIdEdit, id]);

  const handleMarkerSave = useCallback(() => {
    if (editMarkerValue.trim() && nodeData.onMarkerEdit) {
      nodeData.onMarkerEdit(id, editMarkerValue.trim(), editingStartMarker);
    }
    setIsEditingMarker(false);
  }, [editMarkerValue, nodeData.onMarkerEdit, id, editingStartMarker]);

  const handleCancel = useCallback(() => {
    setEditValue(nodeData.label || '');
    setIsEditing(false);
  }, [nodeData.label]);
  const handleIdCancel = useCallback(() => {
    setEditIdValue(nodeData.nodeId || id);
    setIsEditingId(false);
  }, [nodeData.nodeId, id]);

  const handleMarkerCancel = useCallback(() => {
    setEditMarkerValue('');
    setIsEditingMarker(false);
  }, []);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  }, [handleSave, handleCancel]);

  const handleIdKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleIdSave();
    } else if (e.key === 'Escape') {
      handleIdCancel();
    }  }, [handleIdSave, handleIdCancel]);

  const handleMarkerKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleMarkerSave();
    } else if (e.key === 'Escape') {
      handleMarkerCancel();
    }
  }, [handleMarkerSave, handleMarkerCancel]);

  const handleDelete = useCallback(() => {
    if (nodeData.onDelete) {
      nodeData.onDelete(id);
    }
  }, [nodeData.onDelete, id]);
  const handleColorChange = useCallback((backgroundColor: string, borderColor: string) => {
    if (nodeData.onColorChange) {
      nodeData.onColorChange(id, backgroundColor, borderColor);
    }
  }, [nodeData.onColorChange, id]);

  const handleMarkerToggle = useCallback((markerType: 'start' | 'end') => {
    if (nodeData.onMarkerToggle) {
      const currentlyEnabled = markerType === 'start' ? nodeData.isStartNode : nodeData.isEndNode;
      nodeData.onMarkerToggle(id, markerType, !currentlyEnabled);
    }
  }, [nodeData.onMarkerToggle, nodeData.isStartNode, nodeData.isEndNode, id]);

  return (
    <Card 
      className="relative min-w-[200px] min-h-[60px] p-3"
      style={{
        backgroundColor: nodeData.backgroundColor || '#dbeafe',
        borderColor: nodeData.borderColor || '#3b82f6',
        borderWidth: '2px',
        borderStyle: 'solid'
      }}
    >
      <Handle 
        type="target" 
        position={Position.Top} 
        className="w-3 h-3 bg-gray-400 border-2 border-white"      />
      
      {/* Start/End Markers */}
      {nodeData.isStartNode && (
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
          {isEditingMarker && editingStartMarker ? (            <Input
              ref={markerInputRef}
              value={editMarkerValue}
              onChange={(e) => handleRealTimeMarkerEdit(e.target.value)}
              onBlur={handleMarkerSave}
              onKeyDown={handleMarkerKeyPress}
              className="text-lg h-auto p-1 border-none bg-transparent focus:bg-white focus:border-gray-300 text-center w-8"
              placeholder="▶"
            />
          ) : (
            <div 
              className="text-lg cursor-pointer hover:bg-black/5 rounded p-1 text-center"
              onClick={() => handleMarkerEdit(true)}
              title="Click to edit start marker"
            >
              {nodeData.startMarker || '▶'}
            </div>
          )}
        </div>
      )}
      
      {nodeData.isEndNode && (
        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
          {isEditingMarker && !editingStartMarker ? (            <Input
              ref={markerInputRef}
              value={editMarkerValue}
              onChange={(e) => handleRealTimeMarkerEdit(e.target.value)}
              onBlur={handleMarkerSave}
              onKeyDown={handleMarkerKeyPress}
              className="text-lg h-auto p-1 border-none bg-transparent focus:bg-white focus:border-gray-300 text-center w-8"
              placeholder="🏁"
            />
          ) : (
            <div 
              className="text-lg cursor-pointer hover:bg-black/5 rounded p-1 text-center"
              onClick={() => handleMarkerEdit(false)}
              title="Click to edit end marker"
            >
              {nodeData.endMarker || '🏁'}
            </div>
          )}
        </div>
      )}
        <div className="flex items-center justify-between gap-2">
        <div className="flex-1">
          {/* Node ID */}
          <div className="mb-1">
            {isEditingId ? (
              <Input
                ref={idInputRef}
                value={editIdValue}
                onChange={(e) => handleRealTimeIdEdit(e.target.value)}
                onBlur={handleIdSave}
                onKeyDown={handleIdKeyPress}
                className="text-xs h-auto p-1 border-none bg-transparent focus:bg-white focus:border-gray-300 font-mono"
                placeholder="Node ID"
              />
            ) : (
              <div 
                className="text-xs font-mono text-gray-600 cursor-pointer hover:bg-black/5 rounded p-1 text-center"
                onClick={handleIdEdit}
                title="Click to edit ID"
              >
                #{nodeData.nodeId || id}
              </div>
            )}
          </div>
          
          {/* Node Label */}
          <div className="min-h-[20px]">
            {isEditing ? (
              <Input                ref={inputRef}
                value={editValue}
                onChange={(e) => handleRealTimeEdit(e.target.value)}
                onBlur={handleSave}
                onKeyDown={handleKeyPress}
                className="text-sm h-auto p-1 border-none bg-transparent focus:bg-white focus:border-gray-300"
              />
            ) : (
              <div 
                className="text-sm font-medium text-center cursor-pointer hover:bg-black/5 rounded p-1"
                onClick={handleEdit}
              >
                {nodeData.label}
              </div>
            )}
          </div>
        </div>
        
        {selected && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <MoreVertical className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">              <DropdownMenuItem onClick={handleEdit}>
                <Edit className="h-3 w-3 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleMarkerToggle('start')}>
                <Edit className="h-3 w-3 mr-2" />
                {nodeData.isStartNode ? 'Remove Start Marker' : 'Add Start Marker'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleMarkerToggle('end')}>
                <Edit className="h-3 w-3 mr-2" />
                {nodeData.isEndNode ? 'Remove End Marker' : 'Add End Marker'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <DropdownMenuItem>
                    <Palette className="h-3 w-3 mr-2" />
                    Change Color
                  </DropdownMenuItem>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="left">
                  {colors.map((color) => (
                    <DropdownMenuItem
                      key={color.name}
                      onClick={() => handleColorChange(color.bg, color.border)}
                      className="flex items-center gap-2"
                    >
                      <div 
                        className="w-4 h-4 rounded border-2"
                        style={{ 
                          backgroundColor: color.bg, 
                          borderColor: color.border 
                        }}
                      />
                      {color.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                <Trash2 className="h-3 w-3 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      
      <Handle 
        type="source" 
        position={Position.Bottom} 
        className="w-3 h-3 bg-gray-400 border-2 border-white"
      />
    </Card>
  );
};