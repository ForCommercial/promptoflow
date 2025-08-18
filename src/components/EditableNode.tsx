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
  backgroundColor?: string;
  borderColor?: string;
  onEdit?: (id: string, newLabel: string) => void;
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
}) => {
  const nodeData = data as unknown as EditableNodeData;
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(nodeData.label || '');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleEdit = useCallback(() => {
    setIsEditing(true);
  }, []);

  const handleSave = useCallback(() => {
    if (editValue.trim() && nodeData.onEdit) {
      nodeData.onEdit(id, editValue.trim());
    }
    setIsEditing(false);
  }, [editValue, nodeData.onEdit, id]);

  const handleCancel = useCallback(() => {
    setEditValue(nodeData.label || '');
    setIsEditing(false);
  }, [nodeData.label]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  }, [handleSave, handleCancel]);

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
        className="w-3 h-3 bg-gray-400 border-2 border-white"
      />
      
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1 min-h-[20px]">
          {isEditing ? (
            <Input
              ref={inputRef}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleSave}
              onKeyDown={handleKeyPress}
              className="text-sm h-auto p-1 border-none bg-transparent focus:bg-white focus:border-gray-300"
              style={{ fontSize: '12px' }}
            />
          ) : (
            <div 
              className="text-sm font-medium text-center cursor-pointer hover:bg-black/5 rounded p-1"
              onClick={handleEdit}
              style={{ fontSize: '12px' }}
            >
              {nodeData.label}
            </div>
          )}
        </div>
        
        {selected && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <MoreVertical className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleEdit}>
                <Edit className="h-3 w-3 mr-2" />
                Edit
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