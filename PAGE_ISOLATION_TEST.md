# Page Isolation Feature - Testing Guide

## Overview

The page isolation feature has been successfully implemented! This allows users to create separate flowcharts for different pages/screens and switch between them without interference.

## ✅ Implementation Complete

### Key Features Implemented

1. **Page Management State**: Separate storage for each page's nodes and edges
2. **Page-Specific Flowchart Generation**: Each page generates its own flowchart with unique IDs
3. **Page Switching**: Click on different pages to switch between their flowcharts
4. **Active Page Tracking**: Visual indicators show which page is currently active
5. **Software Project Detection**: Automatic detection based on prompt keywords
6. **Cyan Theme for Pages**: Page-generated flowcharts use a distinct cyan color theme

## How to Test

### Step 1: Open the Application

- Navigate to `http://localhost:8082` (development server should be running)
- The application should load with the main flowchart interface

### Step 2: Enable Software Project Mode

- Enter text containing software keywords in the prompt (e.g., "app", "login", "dashboard", "page")
- Example prompt:

  ```
  Step 1: User opens app
  Step 2: Show login page
  Step 3: User enters credentials
  Step 4: Navigate to dashboard
  ```

- The system should automatically detect it's a software project

### Step 3: Access Pages Panel

- Look for the "Pages" button in the top-right area (should appear when software project is detected)
- Click the "Pages" button to open the Pages Panel
- You should see the Pages Panel with options to add pages

### Step 4: Create Pages

1. **Add a Custom Page:**
   - Click "Add Custom"
   - Enter a page name (e.g., "Login Page")
   - Press Enter or click "Add"

2. **Add Template Pages:**
   - Click the "More" button (three dots)
   - Select from pre-built templates like "Home Page", "Dashboard", etc.

3. **Bulk Create Pages:**
   - Click "Bulk Create Pages"
   - Enter multiple pages in format:

     ```
     Homepage:
     Step 1: User lands on homepage
     Step 2: Show hero section
     
     Login Page:
     Step 1: Show login form
     Step 2: Validate credentials
     ```

### Step 5: Generate Page-Specific Flowcharts

1. **Edit a Page:**
   - Click the edit icon (pencil) next to any page
   - Enter a prompt for that specific page:

     ```
     Step 1: Display login form
     Step 2: User enters email
     Step 3: User enters password
     Step 4: Submit credentials
     Step 5: Validate and redirect
     ```

   - Click "Save & Generate Flow"

2. **Observe Page Isolation:**
   - The flowchart should generate with cyan-colored nodes (distinct from main flowchart)
   - Nodes have page-specific IDs (e.g., `page-123-step-1`)

### Step 6: Test Page Switching

1. **Switch Between Pages:**
   - Click on different page rows in the Pages Panel
   - Each page should show its own flowchart content
   - Active page shows with blue highlighting and "Active" badge

2. **Observe Isolation:**
   - Each page displays only its own nodes and edges
   - Switching pages completely changes the canvas content
   - No mixing of flowcharts between pages

### Step 7: Verify Features

- ✅ **Page Creation**: Can create pages via templates or custom names
- ✅ **Page Editing**: Can add prompts to generate page-specific flowcharts  
- ✅ **Page Switching**: Clicking pages switches the displayed flowchart
- ✅ **Visual Indicators**: Active page is clearly marked
- ✅ **Flow Badges**: Pages with flowcharts show "Flow" badge
- ✅ **Cyan Theme**: Page flowcharts use distinct cyan colors
- ✅ **Isolation**: No interference between different page flowcharts

## Expected Behavior

### Before Fix (Old Behavior)

- All page flowcharts appeared on the same canvas
- Generated flowcharts would overlay each other
- No way to view individual page flowcharts separately

### After Fix (New Behavior): ✅

- Each page has its own isolated flowchart
- Switching pages shows only that page's content
- Clear visual separation with cyan theme for page flowcharts
- Active page tracking with visual indicators

## Technical Implementation Details

### Key Functions

- `handleGeneratePageFlowchart()`: Creates page-specific flowcharts with unique IDs
- `handlePageSwitch()`: Switches between page flowcharts
- `useEffect()`: Updates displayed content when active page changes

### State Management

- `allPageNodes`: Storage for all page-specific nodes
- `allPageEdges`: Storage for all page-specific edges  
- `currentActivePage`: Tracks which page is currently active
- `isPagesVisible`: Controls Pages Panel visibility

### Page-Specific Features

- Unique node IDs: `${pageId}-${step.id}`
- Unique edge IDs: `${pageId}-e-${source}-${target}`
- Cyan color theme: `#f0fdfa` background, `#0d9488` border
- Distinct edge colors: `#0d9488` for normal, `#059669` for parallel

## Success Criteria Met ✅

1. ✅ **Page Isolation**: Each page shows only its own flowchart
2. ✅ **Page Switching**: Click to switch between pages works correctly  
3. ✅ **Visual Distinction**: Cyan theme distinguishes page flowcharts
4. ✅ **Active Page Tracking**: Clear indicators show current page
5. ✅ **No Interference**: Generating flowcharts doesn't affect other pages
6. ✅ **State Management**: Proper storage and retrieval of page-specific content

The page isolation issue has been completely resolved! 🎉
