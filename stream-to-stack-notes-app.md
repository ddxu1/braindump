# Stream-to-Stack Notes App Specification

## Overview
A web-based notes application optimized for brain dumping thoughts and processing them into actionable items. The app helps users move from chaotic note-taking to organized task management through a two-pane interface.

## Core Workflow
1. User rapidly dumps thoughts/tasks into a "Stream" (left pane)
2. User processes notes line-by-line, dealing with duplicates and typos
3. Important items move to "Stack" (right pane) as curated action items
4. Goal: Clear the Stream, maintain a clean Stack of actionable items

## User Interface Layout

### Two-Pane Layout
```
+----------------------------------+----------------------------------+
|          STREAM (Left)           |         STACK (Right)            |
|         Brain Dump Zone          |      Organized Actions           |
+----------------------------------+----------------------------------+
```

### Left Pane: "Stream"
**Purpose:** Fast input and processing of raw thoughts

**Components:**
1. **Input Area (Top)**
   - Large, always-visible textarea
   - Placeholder: "Brain dump here... each line becomes an item"
   - Auto-focus on page load
   - Auto-saves on every keystroke (debounced)

2. **Items List**
   - Each line from input becomes a separate item automatically
   - Display format per item:
     ```
     [✓] [→] [×] [⋮] "Item text here..."
     ```
   - Action buttons:
     - `✓` Check/complete (item fades and strikes through)
     - `→` Move to Stack
     - `×` Delete
     - `⋮` More options (merge, add context)

3. **Smart Features Per Item**
   - **Duplicate Detection:** Yellow highlight on similar items with "Merge?" button
   - **Typo Detection:** Subtle red underline with correction suggestions
   - **Context Reminder:** Small "?" icon appears if item is older than 24 hours
     - Click to add quick context note (inline edit)

4. **Processing Mode Button**
   - "Process Stream" button at top
   - Walks through unprocessed items one by one
   - Prompts: "Keep, Move to Stack, or Delete?"
   - Groups duplicates together during processing

### Right Pane: "Stack"
**Purpose:** Clean, organized action items

**Components:**
1. **Category Groups** (optional, collapsible)
   - Auto-suggested categories based on content
   - User can create custom categories
   - Drag items between categories

2. **Item Display**
   - Clean list format
   - Each item shows:
     - Checkbox for completion
     - Item text
     - Optional: due date, priority indicator
     - Context notes (if added)
   - Drag to reorder

3. **Completion Behavior**
   - Checked items move to archive (not deleted)
   - Can view archive separately

## Technical Requirements

### Technology Stack
- **Frontend Framework:** React or Vue.js (your preference)
- **Styling:** Tailwind CSS for responsive design
- **Storage:** LocalStorage (with optional future backend sync)
- **State Management:** Context API or Zustand

### Key Features to Implement

#### 1. Auto-save
- Debounced auto-save (500ms after typing stops)
- Save to localStorage
- Visual indicator: "Saved" checkmark

#### 2. Line-to-Item Conversion
- Parse textarea content by newlines
- Each non-empty line = one item
- Maintain sync between textarea and items list

#### 3. Duplicate Detection
- Compare items using string similarity algorithm (e.g., Levenshtein distance)
- Threshold: 80% similarity = potential duplicate
- Highlight duplicates and offer merge functionality

#### 4. Typo Detection
- Integrate basic spell-check
- Show corrections inline
- Learn user's custom terminology

#### 5. Context System
- Track item creation timestamp
- Show age of item
- Allow adding short context notes (modal or inline)

#### 6. Processing Mode
- Sequential UI for going through items
- Keyboard shortcuts for quick actions (K=keep, M=move, D=delete)
- Progress indicator

#### 7. Archive System
- Completed items stored separately
- Searchable archive
- Option to restore archived items

### Data Structure

```javascript
// Stream Item
{
  id: string,
  text: string,
  createdAt: timestamp,
  processed: boolean,
  completed: boolean,
  context: string | null,
  duplicateOf: string | null  // id of similar item
}

// Stack Item
{
  id: string,
  text: string,
  context: string | null,
  category: string | null,
  priority: 'low' | 'medium' | 'high' | null,
  dueDate: timestamp | null,
  completed: boolean,
  order: number
}
```

### Keyboard Shortcuts
- `Ctrl/Cmd + Enter` - Quick add from input
- `Ctrl/Cmd + P` - Enter processing mode
- In processing mode:
  - `K` - Keep in stream
  - `M` - Move to stack
  - `D` - Delete
  - `Esc` - Exit processing mode

### UI/UX Details

#### Visual Design
- **Stream (Left):** Slightly textured background, casual feel
- **Stack (Right):** Clean white background, professional feel
- **Colors:**
  - Duplicates: Yellow (#FEF3C7)
  - Typos: Red underline (#EF4444)
  - Context needed: Orange icon (#F59E0B)
  - Completed: Gray strikethrough (#9CA3AF)

#### Responsive Behavior
- Desktop: Full two-pane view
- Tablet: Stacked vertically or tabs
- Mobile: Single view with toggle between Stream/Stack

#### Animation
- Smooth transitions when moving items between panes
- Fade animation for completed items
- Highlight pulse for duplicates

### Optional Future Features
- Search across all notes
- Tags in addition to categories
- Recurring tasks
- Export to other formats (markdown, plain text)
- Cloud sync (if backend added later)
- Dark mode

## Implementation Priority

### Phase 1 (MVP)
1. Basic two-pane layout
2. Textarea input with line-to-item conversion
3. Basic CRUD operations (create, check, delete)
4. Move items between Stream and Stack
5. LocalStorage persistence

### Phase 2
1. Duplicate detection
2. Processing mode
3. Context system
4. Archive functionality

### Phase 3
1. Typo detection
2. Categories/organization
3. Due dates and priorities
4. Keyboard shortcuts

### Phase 4
1. Search
2. Polish animations
3. Export functionality
4. Additional quality-of-life features

## Success Criteria
- User can dump thoughts quickly without friction
- Processing reduces overwhelm (manageable chunks)
- Duplicates are caught and merged easily
- Context is preserved for older items
- End state: clear Stream, actionable Stack
