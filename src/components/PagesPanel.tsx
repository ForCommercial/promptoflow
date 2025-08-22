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
  }  return (
    <Card className="fixed top-4 right-4 w-full sm:w-80 max-h-[90vh] z-20 bg-white shadow-xl border-2 border-blue-100 overflow-hidden">
      <div className="flex flex-col h-full max-h-[90vh]">
        {/* Header Section */}
        <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Monitor className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-base text-gray-800">Pages Manager</h3>
              {isSoftwareProject && (
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" title="Software project detected" />
                  <Badge variant="secondary" className="text-xs px-2 py-0.5 bg-green-100 text-green-700 border-green-200">
                    Software Project
                  </Badge>
                </div>
              )}
            </div>
            <Button
              onClick={onToggle}
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 hover:bg-red-100 rounded-full"
            >
              <X className="h-4 w-4 text-red-500" />
            </Button>
          </div>
          
          {isSoftwareProject && (
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-xs text-blue-700 leading-relaxed">
                🎯 <strong>Software project detected!</strong> Organize your app structure by adding pages and screens.
              </p>
            </div>
          )}
        </div>        
        {/* Add Page Section */}
        <div className="p-4 border-b border-gray-100">
          <div className="mb-3">
            <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add New Page
            </h4>
          </div>
          
          {!isAddingPage ? (
            <div className="space-y-3">
              <div className="flex gap-2">
                <Button
                  onClick={() => setIsAddingPage(true)}
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs border-dashed border-2 hover:border-blue-300 hover:bg-blue-50"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Custom Page
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="text-xs px-3 hover:bg-purple-50 hover:border-purple-300">
                      <Wand2 className="w-3 h-3 mr-1" />
                      Templates
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="p-2 text-xs font-medium text-gray-500 border-b">Quick Templates</div>
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
                {/* Bulk Creation Dialog */}
              <Dialog open={isBulkDialogOpen} onOpenChange={setIsBulkDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full text-xs hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 hover:border-purple-300">
                    <Wand2 className="w-3 h-3 mr-1" />
                    Bulk Create Pages
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-xl flex items-center gap-2">
                      <Wand2 className="w-5 h-5 text-purple-600" />
                      Bulk Create Pages
                    </DialogTitle>
                    <DialogDescription className="text-sm text-gray-600">
                      Create multiple pages at once with detailed step-by-step flows
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                      <p className="text-sm font-medium text-purple-800 mb-2">📝 Format Guide:</p>
                      <div className="text-xs bg-white p-3 rounded border font-mono text-gray-700 leading-relaxed">
                        <div className="text-purple-600 font-bold">Homepage:</div>
                        <div>Step 1: User lands on homepage</div>
                        <div>Step 2: Show hero section and navigation</div>
                        <div>Step 3: Display featured content</div>
                        <div className="mt-2 text-purple-600 font-bold">Login Page:</div>
                        <div>Step 1: Show login form</div>
                        <div>Step 2: Validate user credentials</div>
                        <div>Step 3: Redirect to dashboard on success</div>
                      </div>
                    </div>
                    
                    <Textarea
                      value={bulkPrompt}
                      onChange={(e) => setBulkPrompt(e.target.value)}
                      placeholder="Enter pages in the format shown above...\n\nExample:\nHomepage:\nStep 1: User lands on homepage\nStep 2: Show hero section\nStep 3: Display navigation menu\n\nDashboard:\nStep 1: Verify user authentication\nStep 2: Load user data\nStep 3: Display dashboard widgets"
                      className="h-40 text-sm resize-none"
                    />
                    
                    <div className="flex gap-3">
                      <Button 
                        onClick={processBulkPrompt} 
                        disabled={!bulkPrompt.trim()}
                        className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Create All Pages
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setIsBulkDialogOpen(false)}
                        className="px-6"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>          ) : (
            <div className="space-y-3">
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <Plus className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Create Custom Page</span>
                </div>
                <div className="flex gap-2">
                  <Input
                    value={newPageName}
                    onChange={(e) => setNewPageName(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Enter page name..."
                    className="text-sm h-9 flex-1"
                    autoFocus
                  />
                  <Button
                    onClick={() => addPage()}
                    disabled={!newPageName.trim()}
                    size="sm"
                    className="h-9 px-4 bg-blue-600 hover:bg-blue-700"
                  >
                    Add Page
                  </Button>
                </div>
                <Button
                  onClick={() => {
                    setIsAddingPage(false);
                    setNewPageName('');
                  }}
                  variant="ghost"
                  size="sm"
                  className="mt-2 text-xs text-gray-500 h-6"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}</div>        
        {/* Pages List Section */}
        <div className="flex-1 min-h-0">
          <div className="p-4 border-b border-gray-100">
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Pages ({pages.length})
            </h4>
          </div>
          
          <div className="px-4 pb-4">
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
              {pages.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-8 h-8 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm mb-2">No pages added yet</p>
                  <p className="text-xs text-gray-400">Add pages using templates or create custom ones</p>
                </div>
              ) : (
                pages.map((page) => {
                  const IconComponent = ICON_MAP[page.icon as keyof typeof ICON_MAP] || FileText;
                  const hasPrompt = page.prompt && page.prompt.trim().length > 0;
                  const isActive = activePage === page.id;
                  
                  return (
                    <div
                      key={page.id}
                      className={`group flex items-center justify-between p-3 rounded-lg transition-all duration-200 cursor-pointer border ${
                        isActive 
                          ? 'bg-gradient-to-r from-blue-50 to-blue-100 border-blue-300 shadow-md transform scale-[1.02]' 
                          : 'bg-white hover:bg-gray-50 border-gray-200 hover:border-gray-300 hover:shadow-sm'
                      }`}
                      onClick={() => switchToPage(page.id)}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={`p-1.5 rounded-lg ${isActive ? 'bg-white' : 'bg-gray-100 group-hover:bg-gray-200'}`}>
                          <IconComponent 
                            className="w-4 h-4" 
                            style={{ color: page.color }} 
                          />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-sm font-medium truncate ${
                              isActive ? 'text-blue-900' : 'text-gray-700'
                            }`}>{page.name}</span>
                            <Badge 
                              variant="secondary" 
                              className={`text-[10px] h-5 px-2 ${
                                isActive ? 'bg-blue-200 text-blue-800' : ''
                              }`}
                            >
                              {page.type}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            {isActive && (
                              <Badge 
                                variant="outline"
                                className="text-[10px] h-4 px-1.5 bg-green-50 border-green-300 text-green-700"
                              >
                                ● Active
                              </Badge>
                            )}
                            {hasPrompt && (
                              <Badge 
                                variant="outline" 
                                className="text-[10px] h-4 px-1.5 bg-purple-50 border-purple-200 text-purple-700"
                              >
                                <Workflow className="w-2 h-2 mr-0.5" />
                                Flow Ready
                              </Badge>
                            )}
                            {page.lastModified && (
                              <span className="text-[10px] text-gray-400">
                                {new Date(page.lastModified).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            openPageEditor(page);
                          }}
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 hover:bg-blue-100 rounded-full"
                          title="Edit page prompt"
                        >
                          <Edit className="h-3 w-3 text-blue-500" />
                        </Button>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            removePage(page.id);
                          }}
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 hover:bg-red-100 rounded-full"
                          title="Remove page"
                        >
                          <X className="h-3 w-3 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>        {/* Footer Section */}
        {pages.length > 0 && (
          <div className="mt-auto p-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-2">
                <span className="font-medium">{pages.length} page{pages.length !== 1 ? 's' : ''}</span>
                {isSoftwareProject && (
                  <Badge variant="outline" className="text-[10px] h-4 px-1.5 bg-green-50 border-green-200 text-green-600">
                    Software Project ✓
                  </Badge>
                )}
              </div>
              {activePage && (
                <div className="flex items-center gap-1">
                  <span className="text-gray-400">Active:</span>
                  <span className="font-medium text-blue-600">
                    {pages.find(p => p.id === activePage)?.name || 'None'}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
        {/* Page Editor Dialog */}
      <Dialog open={isPageDialogOpen} onOpenChange={setIsPageDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <Edit className="w-5 h-5 text-blue-600" />
              Edit Page: {selectedPage?.name}
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-600">
              Create a detailed prompt to generate a comprehensive flowchart for this page
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-600 text-sm font-bold">💡</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-800 mb-1">Pro Tips for Better Flowcharts:</p>
                  <ul className="text-xs text-blue-700 space-y-1">
                    <li>• Use step format: "Step 1: User action", "Step 2: System response"</li>
                    <li>• Include decision points: "If user is logged in", "Else show login"</li>
                    <li>• Add error handling: "On error, show error message"</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <Textarea
              value={pagePrompt}
              onChange={(e) => setPagePrompt(e.target.value)}
              placeholder={`Enter detailed steps for ${selectedPage?.name}...\n\nExample:\nStep 1: User lands on ${selectedPage?.name || 'page'}\nStep 2: Load and display page content\nStep 3: Handle user interactions\nStep 4: Process user actions\nStep 5: Update page state\n\nDecision Points:\nIf user is authenticated -> Show full content\nElse -> Redirect to login\n\nError Handling:\nOn load error -> Show error message\nOn timeout -> Show retry option`}
              className="h-48 text-sm resize-none"
            />
            
            <div className="flex gap-3">
              <Button 
                onClick={savePagePrompt} 
                disabled={!pagePrompt.trim()}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <Workflow className="w-4 h-4 mr-2" />
                Save & Generate Flowchart
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setIsPageDialogOpen(false)}
                className="px-6"
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
