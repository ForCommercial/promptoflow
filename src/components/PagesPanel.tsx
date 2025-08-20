import React, { useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Monitor, 
  Plus, 
  X, 
  Home, 
  Settings, 
  User, 
  ShoppingCart, 
  FileText, 
  LogIn,
  Search,
  Bell,
  MoreVertical,
  Edit,
  Workflow,
  Wand2
} from 'lucide-react';

export interface PageItem {
  id: string;
  name: string;
  type: 'screen' | 'page' | 'modal' | 'component';
  icon?: string;
  color?: string;
  prompt?: string;
  nodes?: Array<{id: string; type: string; position: {x: number; y: number}; data: Record<string, unknown>}>;
  edges?: Array<{id: string; source: string; target: string; type: string}>;
  lastModified?: string;
}

interface PagesPanelProps {
  isVisible: boolean;
  onToggle: () => void;
  isSoftwareProject?: boolean;
  onGeneratePageFlowchart?: (pageId: string, prompt: string) => void;
  onPageSwitch?: (pageId: string) => void;
}

const PAGE_TEMPLATES = [
  { name: 'Home Page', icon: 'Home', type: 'page' as const, color: '#3b82f6' },
  { name: 'Login Page', icon: 'LogIn', type: 'page' as const, color: '#10b981' },
  { name: 'Settings', icon: 'Settings', type: 'page' as const, color: '#6b7280' },
  { name: 'Profile Page', icon: 'User', type: 'page' as const, color: '#8b5cf6' },
  { name: 'Dashboard', icon: 'Monitor', type: 'page' as const, color: '#f59e0b' },
  { name: 'Search Page', icon: 'Search', type: 'page' as const, color: '#06b6d4' },
  { name: 'Shopping Cart', icon: 'ShoppingCart', type: 'page' as const, color: '#ef4444' },
  { name: 'Notifications', icon: 'Bell', type: 'page' as const, color: '#f97316' },
  { name: 'About Page', icon: 'FileText', type: 'page' as const, color: '#84cc16' },
  { name: 'Splash Screen', icon: 'Monitor', type: 'screen' as const, color: '#ec4899' },
];

const ICON_MAP = {
  Home,
  LogIn,
  Settings,
  User,
  Monitor,
  Search,
  ShoppingCart,
  Bell,
  FileText
};

export const PagesPanel: React.FC<PagesPanelProps> = ({ 
  isVisible, 
  onToggle, 
  isSoftwareProject = false,
  onGeneratePageFlowchart,
  onPageSwitch
}) => {
  const [pages, setPages] = useState<PageItem[]>([]);
  const [activePage, setActivePage] = useState<string | null>(null);
  const [newPageName, setNewPageName] = useState('');
  const [isAddingPage, setIsAddingPage] = useState(false);
  const [selectedPage, setSelectedPage] = useState<PageItem | null>(null);
  const [isPageDialogOpen, setIsPageDialogOpen] = useState(false);
  const [pagePrompt, setPagePrompt] = useState('');
  const [bulkPrompt, setBulkPrompt] = useState('');
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);  const addPage = useCallback((template?: typeof PAGE_TEMPLATES[0]) => {
    if (template) {
      const newPage: PageItem = {
        id: `page-${Date.now()}`,
        name: template.name,
        type: template.type,
        icon: template.icon,
        color: template.color,
        prompt: '',
        nodes: [],
        edges: [],
        lastModified: new Date().toISOString()
      };
      setPages(prev => [...prev, newPage]);
      // Set as active page if it's the first page
      setActivePage(prev => prev === null ? newPage.id : prev);
    } else if (newPageName.trim()) {
      const newPage: PageItem = {
        id: `page-${Date.now()}`,
        name: newPageName.trim(),
        type: 'page',
        icon: 'FileText',
        color: '#6b7280',
        prompt: '',
        nodes: [],
        edges: [],
        lastModified: new Date().toISOString()
      };
      setPages(prev => [...prev, newPage]);
      // Set as active page if it's the first page
      setActivePage(prev => prev === null ? newPage.id : prev);
      setNewPageName('');
      setIsAddingPage(false);
    }
  }, [newPageName]);

  const removePage = useCallback((pageId: string) => {
    setPages(prev => prev.filter(page => page.id !== pageId));
    // Clear active page if it was the removed page
    setActivePage(prev => prev === pageId ? null : prev);
  }, []);
  const switchToPage = useCallback((pageId: string) => {
    setActivePage(pageId);
    // Notify parent component about page switch
    if (onPageSwitch) {
      onPageSwitch(pageId);
    }
  }, [onPageSwitch]);

  const openPageEditor = useCallback((page: PageItem) => {
    setSelectedPage(page);
    setPagePrompt(page.prompt || '');
    setIsPageDialogOpen(true);
  }, []);

  const savePagePrompt = useCallback(() => {
    if (selectedPage) {
      setPages(prev => prev.map(page => 
        page.id === selectedPage.id 
          ? { 
              ...page, 
              prompt: pagePrompt,
              lastModified: new Date().toISOString()
            }
          : page
      ));
      
      // Generate flowchart for this page if callback provided
      if (onGeneratePageFlowchart && pagePrompt.trim()) {
        onGeneratePageFlowchart(selectedPage.id, pagePrompt);
      }
      
      setIsPageDialogOpen(false);
      setSelectedPage(null);
      setPagePrompt('');
    }
  }, [selectedPage, pagePrompt, onGeneratePageFlowchart]);

  const processBulkPrompt = useCallback(() => {
    if (!bulkPrompt.trim()) return;

    // Parse bulk prompt format: "PageName: Step1:... Step2:..."
    const pageBlocks = bulkPrompt.split(/\n(?=[A-Za-z\s]+:)/);
    const newPages: PageItem[] = [];

    pageBlocks.forEach((block, index) => {
      const lines = block.trim().split('\n');
      const firstLine = lines[0];
      const match = firstLine.match(/^([^:]+):\s*(.*)$/);
      
      if (match) {
        const [, pageName, firstStep] = match;
        const pagePrompt = firstStep + '\n' + lines.slice(1).join('\n');
        
        // Determine page type and icon based on name
        let icon = 'FileText';
        let color = '#6b7280';
        const lowerName = pageName.toLowerCase();
        
        if (lowerName.includes('home')) { icon = 'Home'; color = '#3b82f6'; }
        else if (lowerName.includes('login')) { icon = 'LogIn'; color = '#10b981'; }
        else if (lowerName.includes('dashboard')) { icon = 'Monitor'; color = '#f59e0b'; }
        else if (lowerName.includes('profile')) { icon = 'User'; color = '#8b5cf6'; }
        else if (lowerName.includes('settings')) { icon = 'Settings'; color = '#6b7280'; }
        else if (lowerName.includes('search')) { icon = 'Search'; color = '#06b6d4'; }
        
        newPages.push({
          id: `page-bulk-${Date.now()}-${index}`,
          name: pageName.trim(),
          type: 'page',
          icon,
          color,
          prompt: pagePrompt.trim(),
          nodes: [],
          edges: [],
          lastModified: new Date().toISOString()
        });
      }
    });    if (newPages.length > 0) {
      setPages(prev => [...prev, ...newPages]);
      // Set first new page as active if no active page
      setActivePage(prev => prev === null ? newPages[0].id : prev);
      setBulkPrompt('');
      setIsBulkDialogOpen(false);
    }
  }, [bulkPrompt]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addPage();
    } else if (e.key === 'Escape') {
      setIsAddingPage(false);
      setNewPageName('');
    }
  }, [addPage]);
  if (!isVisible) {
    return (
      <Button
        onClick={onToggle}
        variant="outline"
        size="sm"
        className={`fixed top-20 right-4 z-20 bg-white shadow-lg ${
          isSoftwareProject ? 'border-blue-500 bg-blue-50' : ''
        }`}
      >
        <Monitor className={`w-4 h-4 mr-2 ${isSoftwareProject ? 'text-blue-600' : ''}`} />
        Pages
        {isSoftwareProject && (
          <div className="w-2 h-2 bg-blue-500 rounded-full ml-1 animate-pulse" />
        )}
      </Button>
    );
  }

  return (
    <Card className="fixed top-4 right-80 w-72 max-h-96 z-20 bg-white shadow-lg">
      <div className="p-4">        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Monitor className="w-4 h-4 text-blue-600" />
            <h3 className="font-semibold text-sm">Software Pages</h3>
            {isSoftwareProject && (
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" title="Software project detected" />
            )}
          </div>
          <Button
            onClick={onToggle}
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>

        {isSoftwareProject && (
          <div className="mb-3 p-2 bg-blue-50 rounded-md border border-blue-200">
            <p className="text-xs text-blue-700">
              🎯 Software project detected! Add pages/screens to organize your app structure.
            </p>
          </div>
        )}        {/* Add Page Section */}
        <div className="mb-3">
          {!isAddingPage ? (
            <div className="space-y-2">
              <div className="flex gap-1">
                <Button
                  onClick={() => setIsAddingPage(true)}
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Add Custom
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="text-xs">
                      <MoreVertical className="w-3 h-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    {PAGE_TEMPLATES.map((template, index) => {
                      const IconComponent = ICON_MAP[template.icon as keyof typeof ICON_MAP];
                      return (
                        <DropdownMenuItem
                          key={index}
                          onClick={() => addPage(template)}
                          className="flex items-center gap-2"
                        >
                          <IconComponent className="w-4 h-4" style={{ color: template.color }} />
                          <span className="text-xs">{template.name}</span>
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              {/* Bulk Creation Button */}
              <Dialog open={isBulkDialogOpen} onOpenChange={setIsBulkDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full text-xs">
                    <Wand2 className="w-3 h-3 mr-1" />
                    Bulk Create Pages
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-lg">Bulk Create Pages</DialogTitle>
                    <DialogDescription className="text-sm">
                      Create multiple pages at once using this format:
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3">
                    <div className="text-xs bg-gray-100 p-2 rounded font-mono">
                      Homepage:<br/>
                      Step 1: User lands on homepage<br/>
                      Step 2: Show hero section<br/><br/>
                      Login Page:<br/>
                      Step 1: Show login form<br/>
                      Step 2: Validate credentials
                    </div>
                    <Textarea
                      value={bulkPrompt}
                      onChange={(e) => setBulkPrompt(e.target.value)}
                      placeholder="Enter pages in format above..."
                      className="h-32 text-sm"
                    />
                    <div className="flex gap-2">
                      <Button 
                        onClick={processBulkPrompt} 
                        disabled={!bulkPrompt.trim()}
                        className="flex-1"
                      >
                        Create Pages
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setIsBulkDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          ) : (
            <div className="flex gap-1">
              <Input
                value={newPageName}
                onChange={(e) => setNewPageName(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Page name..."
                className="text-xs h-8"
                autoFocus
              />
              <Button
                onClick={() => addPage()}
                disabled={!newPageName.trim()}
                size="sm"
                className="h-8 text-xs"
              >
                Add
              </Button>
            </div>
          )}
        </div>        {/* Pages List */}
        <div className="space-y-1 max-h-60 overflow-y-auto">
          {pages.length === 0 ? (
            <div className="text-center py-4 text-gray-500 text-xs">
              No pages added yet. Add pages using templates or create custom ones.
            </div>
          ) : (            pages.map((page) => {
              const IconComponent = ICON_MAP[page.icon as keyof typeof ICON_MAP] || FileText;
              const hasPrompt = page.prompt && page.prompt.trim().length > 0;
              const isActive = activePage === page.id;
              
              return (
                <div
                  key={page.id}
                  className={`flex items-center justify-between p-2 rounded-md transition-colors cursor-pointer ${
                    isActive 
                      ? 'bg-blue-100 border border-blue-300 shadow-sm' 
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                  onClick={() => switchToPage(page.id)}
                >
                  <div className="flex items-center gap-2 flex-1">
                    <IconComponent 
                      className="w-3 h-3" 
                      style={{ color: page.color }} 
                    />
                    <span className={`text-xs font-medium truncate ${
                      isActive ? 'text-blue-800' : ''
                    }`}>{page.name}</span>
                    <Badge 
                      variant="secondary" 
                      className="text-[10px] h-4 px-1"
                    >
                      {page.type}
                    </Badge>
                    {isActive && (
                      <Badge 
                        variant="outline"
                        className="text-[10px] h-4 px-1 bg-blue-50 border-blue-300 text-blue-700"
                      >
                        Active
                      </Badge>
                    )}
                    {hasPrompt && (
                      <Badge 
                        variant="outline" 
                        className="text-[10px] h-4 px-1 bg-green-50 border-green-200 text-green-700"
                      >
                        <Workflow className="w-2 h-2 mr-1" />
                        Flow
                      </Badge>
                    )}
                  </div>                  <div className="flex gap-1">
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        openPageEditor(page);
                      }}
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 hover:bg-blue-100"
                      title="Edit page prompt"
                    >
                      <Edit className="h-2 w-2 text-blue-500" />
                    </Button>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        removePage(page.id);
                      }}
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 hover:bg-red-100"
                    >
                      <X className="h-2 w-2 text-red-500" />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>        {pages.length > 0 && (
          <div className="mt-3 pt-2 border-t border-gray-200">
            <div className="text-[10px] text-gray-500 text-center">
              {pages.length} page{pages.length !== 1 ? 's' : ''} • {activePage ? 'Active: ' + (pages.find(p => p.id === activePage)?.name || 'None') : 'No active page'} • {isSoftwareProject ? 'Software Project ✓' : 'Project'}
            </div>
          </div>
        )}
      </div>
      
      {/* Page Editor Dialog */}
      <Dialog open={isPageDialogOpen} onOpenChange={setIsPageDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg">
              Edit Page: {selectedPage?.name}
            </DialogTitle>
            <DialogDescription className="text-sm">
              Add a prompt to generate a flowchart for this page
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="text-xs bg-blue-50 p-2 rounded border border-blue-200">
              💡 <strong>Tip:</strong> Use format like "Step 1: User action", "Step 2: System response"
            </div>
            <Textarea
              value={pagePrompt}
              onChange={(e) => setPagePrompt(e.target.value)}
              placeholder={`Enter steps for ${selectedPage?.name}...\n\nExample:\nStep 1: User lands on page\nStep 2: Load page content\nStep 3: Display to user`}
              className="h-40 text-sm"
            />
            <div className="flex gap-2">
              <Button 
                onClick={savePagePrompt} 
                disabled={!pagePrompt.trim()}
                className="flex-1"
              >
                <Workflow className="w-4 h-4 mr-2" />
                Save & Generate Flow
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setIsPageDialogOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
