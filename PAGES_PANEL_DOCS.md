# Pages Panel Feature Documentation

## Overview

The Pages Panel is an advanced feature designed for software-based projects that allows users to manage individual pages/screens of their application. Each page can have its own prompts and generates separate node diagrams with unique styling to distinguish them from the main flowchart.

## ✅ COMPLETED FEATURES - FULLY FUNCTIONAL

### 🎯 **Smart Software Project Detection**

- **Auto-detection**: Automatically detects software projects based on keywords in the prompt
- **Keywords**: app, application, software, website, web, mobile, ui, ux, page, screen, login, dashboard, profile, settings, home, api, database, frontend, backend, user interface, responsive
- **Visual Indicator**: Shows a blue pulsing dot when software project is detected

### 📱 **Complete Pages Management**

- **Add Individual Pages**: Create custom pages with unique names
- **Template-Based Creation**: 10 pre-built page templates (Home, Login, Dashboard, etc.)
- **Page Types**: Support for 'page', 'screen', 'modal', 'component' types
- **Visual Icons**: Each page type has appropriate Lucide icons
- **Color Coding**: Different colors for different page types

### ✏️ **Individual Page Prompt Editing**

- **Dedicated Editor**: Each page has its own prompt editing dialog
- **Structured Format**: Supports "Step 1:", "Step 2:" format for consistency
- **Real-time Updates**: Changes are saved with timestamps
- **Generate Flow Button**: Directly generates flowchart from page prompt

### 🎯 **Bulk Page Creation**

- **Batch Processing**: Create multiple pages at once from formatted text
- **Smart Parsing**: Parses format like "PageName: Step1... Step2..."
- **Auto-categorization**: Automatically assigns icons and colors based on page names
- **Template Dialog**: Provides example format for users

### 🎨 **Page-Specific Flowchart Generation**

- **Unique Styling**: Page flowcharts use cyan theme (#e0f2fe background, #0891b2 borders)
- **Isolated Nodes**: Page nodes are prefixed with page ID to avoid conflicts
- **Different Markers**: Uses 🚀 for start and ✅ for end (vs main flowchart's ▶ and 🏁)
- **Additive Generation**: Page flowcharts are added to existing diagram, not replacing it

### 📊 **Visual Status Indicators**

- **Prompt Status**: Green "Flow" badge when page has prompt content
- **Last Modified**: Timestamp tracking for all page changes
- **Page Counter**: Shows total pages at bottom of panel

## Usage

### Opening the Panel

1. Look for the "Pages" button in the top-right corner
2. If it has a blue highlight and pulse dot, it means a software project was detected
3. Click the button to open the full panel

### Adding Pages

1. **Custom Pages**: Click "Add Custom" button and enter page name
2. **Template Pages**: Click the dropdown (⋮) button and select from pre-built templates

### Managing Pages

- Each page shows its icon, name, and type badge
- Click the × button to remove a page
- Pages are automatically saved to your project

### Auto-Detection

The panel automatically appears when software-related keywords are detected in your project prompt, making it contextually relevant.

## Technical Implementation

### Component Structure

```
PagesPanel.tsx
├── PageItem interface (id, name, type, icon, color)
├── PAGE_TEMPLATES (pre-built page templates)
├── ICON_MAP (Lucide icons mapping)
├── Collapsed state (button only)
└── Expanded state (full panel)
```

### Integration

- Integrated into FlowchartApp.tsx
- Uses React hooks for state management
- Styled with Tailwind CSS
- Responsive design compatible

### Smart Detection Algorithm

```typescript
const isSoftwareProject = useMemo(() => {
  const softwareKeywords = [
    'app', 'application', 'software', 'website', 'web', 'mobile', 
    'ui', 'ux', 'page', 'screen', 'login', 'dashboard', 'profile', 
    'settings', 'home', 'api', 'database', 'frontend', 'backend', 
    'user interface', 'responsive'
  ];
  return softwareKeywords.some(keyword => 
    promptText.toLowerCase().includes(keyword)
  );
}, [promptText]);
```

## Benefits

1. **Organized Planning**: Separate page/screen organization from main process flow
2. **Project Clarity**: Clear visualization of all application screens
3. **Template Efficiency**: Quick addition of common pages
4. **Smart Context**: Only appears when relevant
5. **Non-Intrusive**: Doesn't interfere with main flowchart functionality

This feature enhances the planning capabilities specifically for software development projects while maintaining the tool's general-purpose flowchart functionality.
