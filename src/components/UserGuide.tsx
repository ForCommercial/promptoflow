import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, 
  GitBranch, 
  MousePointer, 
  Palette, 
  Download, 
  Trash2,
  Plus,
  Move,
  Link,
  Keyboard
} from 'lucide-react';

export const UserGuide: React.FC = () => {
  return (
    <Card className="p-4 max-h-96 overflow-y-auto">
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Prompt Format Guide
          </h3>
          <div className="space-y-2 text-sm">
            <div>
              <Badge variant="outline" className="mb-1">Sequential Steps</Badge>
              <p className="text-muted-foreground">
                Use "Step 1:", "Step 2:", "Step 3:" etc. for linear flow
              </p>
            </div>
            <div>
              <Badge variant="outline" className="mb-1">Parallel Branches</Badge>
              <p className="text-muted-foreground">
                Use "Step 2a:", "Step 2b:" for parallel tasks that merge later
              </p>
            </div>
            <div>
              <Badge variant="outline" className="mb-1">Auto-continuation</Badge>
              <p className="text-muted-foreground">
                After parallel branches (2a, 2b), the next step automatically becomes Step 3
              </p>
            </div>
            <div>
              <Badge variant="outline" className="mb-1">Selective Continuation</Badge>
              <p className="text-muted-foreground">
                Continue from a specific branch using "from": e.g., "Step 3: from 2a: Next step" or "Step 3: (from 2a) Next step". Multiple: "from 2a,2c".
              </p>
            </div>
          </div>
        </div>

        <Separator />

        <div>
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <GitBranch className="w-5 h-5" />
            Sample Prompts
          </h3>
          <div className="space-y-3 text-sm">
            <div className="bg-muted p-2 rounded text-xs font-mono">
              <div>Step 1: User Registration</div>
              <div>Step 2a: Email Verification</div>
              <div>Step 2b: Phone Verification</div>
              <div>Step 3: from 2a: Profile Setup</div>
              <div>Step 4: Dashboard Access</div>
            </div>
            
            <div className="bg-muted p-2 rounded text-xs font-mono">
              <div>Step 1: Project Planning</div>
              <div>Step 2: Development Phase</div>
              <div>Step 3a: Frontend Development</div>
              <div>Step 3b: Backend Development</div>
              <div>Step 3c: Database Setup</div>
              <div>Step 4: Integration Testing</div>
              <div>Step 5: Deployment</div>
            </div>
          </div>
        </div>

        <Separator />

        <div>
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <MousePointer className="w-5 h-5" />
            Interactive Features
          </h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-start gap-2">
              <Move className="w-4 h-4 mt-0.5 text-blue-500" />
              <div>
                <p className="font-medium">Drag & Drop</p>
                <p className="text-xs text-muted-foreground">Move nodes anywhere</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <MousePointer className="w-4 h-4 mt-0.5 text-green-500" />
              <div>
                <p className="font-medium">Click to Edit</p>
                <p className="text-xs text-muted-foreground">Click node text to rename</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Palette className="w-4 h-4 mt-0.5 text-purple-500" />
              <div>
                <p className="font-medium">Color Themes</p>
                <p className="text-xs text-muted-foreground">8 color options available</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Link className="w-4 h-4 mt-0.5 text-orange-500" />
              <div>
                <p className="font-medium">Connect Nodes</p>
                <p className="text-xs text-muted-foreground">Drag from handle to handle</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Plus className="w-4 h-4 mt-0.5 text-cyan-500" />
              <div>
                <p className="font-medium">Add Nodes</p>
                <p className="text-xs text-muted-foreground">Use toolbar button</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Trash2 className="w-4 h-4 mt-0.5 text-red-500" />
              <div>
                <p className="font-medium">Delete</p>
                <p className="text-xs text-muted-foreground">Node menu or DEL key</p>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        <div>
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <Keyboard className="w-5 h-5" />
            Keyboard Shortcuts
          </h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex justify-between">
              <span>Delete selected</span>
              <Badge variant="secondary" className="text-xs">Del</Badge>
            </div>
            <div className="flex justify-between">
              <span>Edit node</span>
              <Badge variant="secondary" className="text-xs">Enter</Badge>
            </div>
            <div className="flex justify-between">
              <span>Cancel edit</span>
              <Badge variant="secondary" className="text-xs">Esc</Badge>
            </div>
            <div className="flex justify-between">
              <span>Save edit</span>
              <Badge variant="secondary" className="text-xs">Enter</Badge>
            </div>
          </div>
        </div>

        <Separator />

        <div>
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <Download className="w-5 h-5" />
            Export & Save
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Badge variant="outline">PNG Export</Badge>
              <span className="text-muted-foreground">High-quality image with transparent background</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">PDF Export</Badge>
              <span className="text-muted-foreground">Multi-page support for large diagrams</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">Local Save</Badge>
              <span className="text-muted-foreground">Saves to browser storage with timestamp</span>
            </div>
          </div>
        </div>

        <Separator />

        <div className="bg-blue-50 p-3 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-1">Pro Tips</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Use descriptive step names for better clarity</li>
            <li>• Group related parallel tasks with same number (2a, 2b, 2c)</li>
            <li>• Select edges and press Delete to remove connections</li>
            <li>• Zoom out before exporting for better composition</li>
            <li>• Use different colors to categorize step types</li>
          </ul>
        </div>
      </div>
    </Card>
  );
};