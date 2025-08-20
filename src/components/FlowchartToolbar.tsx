import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, Save, FileImage, Download, Upload, FileText } from 'lucide-react';
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
  onSavePromptFile: () => void;
  onImportPromptFile: () => void;
}

export const FlowchartToolbar: React.FC<FlowchartToolbarProps> = ({
  onAddNode,
  onExportPNG,
  onExportPDF,
  onSaveProject,
  onSavePromptFile,
  onImportPromptFile
}) => {  return (
    <Card className="absolute top-4 right-4 z-10 p-2 sm:right-4 sm:top-4">      <div className="flex gap-1 sm:gap-2">        <Button onClick={onAddNode} size="sm" variant="outline" className="text-xs sm:text-sm">
          <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-0 sm:mr-1" />
          <span className="hidden sm:inline">Add Node</span>
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="outline" className="text-xs sm:text-sm">
              <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-0 sm:mr-1" />
              <span className="hidden sm:inline">Export</span>
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
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="outline" className="text-xs sm:text-sm">
              <Save className="w-3 h-3 sm:w-4 sm:h-4 mr-0 sm:mr-1" />
              <span className="hidden sm:inline">Save</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={onSaveProject}>
              <Save className="w-4 h-4 mr-2" />
              Save Project
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onSavePromptFile}>
              <FileText className="w-4 h-4 mr-2" />
              Save Prompt File
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <Button onClick={onImportPromptFile} size="sm" variant="outline" className="text-xs sm:text-sm">
          <Upload className="w-3 h-3 sm:w-4 sm:h-4 mr-0 sm:mr-1" />
          <span className="hidden sm:inline">Import</span>
        </Button>
      </div>
    </Card>
  );
};