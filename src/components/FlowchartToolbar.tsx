import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, Save, FileImage, Download } from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';

interface FlowchartToolbarProps {
  onAddNode: () => void;
  onExportPNG: () => void;
  onExportPDF: () => void;
  onSaveProject: () => void;
}

export const FlowchartToolbar: React.FC<FlowchartToolbarProps> = ({
  onAddNode,
  onExportPNG,
  onExportPDF,
  onSaveProject
}) => {
  return (
    <Card className="absolute top-4 right-4 z-10 p-2">      <div className="flex gap-2">        <Button onClick={onAddNode} size="sm" variant="outline">
          <Plus className="w-4 h-4 mr-1" />
          Add Node
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="outline">
              <Download className="w-4 h-4 mr-1" />
              Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={onExportPNG}>
              <FileImage className="w-4 h-4 mr-2" />
              Export as PNG
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onExportPDF}>
              <FileImage className="w-4 h-4 mr-2" />
              Export as PDF
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <Button onClick={onSaveProject} size="sm" variant="outline">
          <Save className="w-4 h-4 mr-1" />
          Save
        </Button>
      </div>
    </Card>
  );
};