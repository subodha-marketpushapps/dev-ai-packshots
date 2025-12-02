# PhotoStudio System Documentation

This repository contains comprehensive documentation for building a modal-based image editing system like the AI Product Images PhotoStudio. The system is designed around advanced React patterns with sophisticated state management and enterprise-level architecture.

## 📁 Documentation Structure

- [`01-system-overview.md`](./01-system-overview.md) - High-level architecture and patterns
- [`02-state-management.md`](./02-state-management.md) - Recoil atoms, selectors, and state patterns
- [`03-provider-architecture.md`](./03-provider-architecture.md) - Context providers and hook patterns
- [`04-component-structure.md`](./04-component-structure.md) - Component hierarchy and organization
- [`05-interface-definitions.md`](./05-interface-definitions.md) - TypeScript interfaces and types
- [`06-implementation-guide.md`](./06-implementation-guide.md) - Step-by-step build instructions
- [`07-performance-patterns.md`](./07-performance-patterns.md) - Optimization techniques and patterns
- [`08-canvas-integration.md`](./08-canvas-integration.md) - Fabric.js canvas implementation
- [`09-api-integration.md`](./09-api-integration.md) - TanStack Query and API patterns
- [`10-examples/`](./10-examples/) - Code examples and templates

### 🔌 Integration Documentation
- [`WIX_BI_EVENT_INTEGRATION.md`](./WIX_BI_EVENT_INTEGRATION.md) - Wix BI Events analytics integration
- [`WIX_CATALOG_V1_V3_COMPREHENSIVE_GUIDE.md`](./WIX_CATALOG_V1_V3_COMPREHENSIVE_GUIDE.md) - Wix product catalog compatibility
- [`V3_FIELDSETS_GUIDE.md`](./V3_FIELDSETS_GUIDE.md) - Wix V3 API fieldsets optimization
- [`dashboard-modal-extensions-wix-cli.md`](./dashboard-modal-extensions-wix-cli.md) - Wix CLI dashboard extensions

## 🎯 Key Features Documented

### **Advanced Modal System**
- Full-screen modal with responsive design
- Complex loading states and error handling
- Modal lifecycle management with cleanup

### **Sophisticated State Management**
- Recoil-based global state with selectors
- Computed state patterns for performance
- Undo/redo functionality with history management
- Image state transitions and lifecycle

### **Enterprise Provider Pattern**
- Centralized context with 100+ properties
- Memoized context values for performance
- Consolidated loading and error states
- Background API operations

### **Canvas Integration**
- Fabric.js canvas with imperative API
- Drawing tools (shapes, freehand)
- Image manipulation and editing
- Export functionality

### **Image Management**
- Multi-image selection and processing
- Reference image system
- Live vs Draft image categorization
- Publishing workflow with optimistic updates

## 🚀 Quick Start

1. **Read the Overview**: Start with [`01-system-overview.md`](./01-system-overview.md)
2. **Follow Implementation Guide**: Use [`06-implementation-guide.md`](./06-implementation-guide.md)
3. **Reference Examples**: Check [`10-examples/`](./10-examples/) for code templates
4. **Customize**: Adapt patterns to your specific needs

## 📋 Prerequisites

- React 18+
- TypeScript 4.5+
- Recoil for state management
- TanStack Query for server state
- Fabric.js for canvas (optional)
- Wix Design System (or your preferred UI library)

## 🏗️ Architecture Highlights

### **State Architecture**
```
Recoil Atoms (Global State)
├── editorSettingsState (UI state)
├── editingImageState (Current canvas image)
└── imageHistoryState (Undo/redo)

Recoil Selectors (Computed State)
├── sortedFileExplorerImagesState
├── processingImagesState
├── selectedImagesState
└── referenceImageState
```

### **Component Hierarchy**
```
PhotoStudio (Modal Container)
├── StudioHeader (Controls & Navigation)
├── StudioImageExplorer (File Gallery)
└── StudioEditor (Main Editing Interface)
    ├── EditorCanvas (Fabric.js)
    ├── EditorPromptInput (AI Controls)
    ├── EditorMultiImages (Batch Processing)
    └── EditorPhotoActions (Image Actions)
```

### **Provider Context**
```
PhotoStudioProvider
├── Modal State Management
├── API Actions (CRUD operations)
├── Loading/Error State
├── Image Lifecycle Management
└── Subscription/Credit Management
```

## 🔧 Technology Stack

- **Frontend Framework**: React 18 with TypeScript
- **State Management**: Recoil (atoms + selectors)
- **Server State**: TanStack Query
- **UI Components**: Wix Design System
- **Canvas**: Fabric.js
- **Styling**: CSS-in-JS with design tokens
- **Build Tool**: Vite/Webpack

## 📊 Performance Features

- **Memoization**: Extensive use of useMemo and useCallback
- **Batch Updates**: Functional state updates
- **Selective Re-renders**: React.memo for expensive components
- **Background Processing**: Non-blocking API operations
- **Optimistic Updates**: Immediate UI feedback

## 🎨 UI/UX Patterns

- **Responsive Design**: Adaptive layouts for different screen sizes
- **Loading States**: Skeleton screens and progressive loading
- **Error Boundaries**: Graceful error handling
- **Accessibility**: ARIA labels and keyboard navigation
- **Animations**: Smooth transitions and micro-interactions

## 📚 Learning Path

1. **Beginner**: Start with basic modal and state management
2. **Intermediate**: Implement provider pattern and custom hooks
3. **Advanced**: Add canvas integration and complex workflows
4. **Expert**: Optimize performance and add advanced features

## 🤝 Contributing

This documentation is based on a real production system. When adapting for your project:

1. Follow the established patterns
2. Maintain the state management architecture
3. Keep the provider pattern centralized
4. Implement proper error handling
5. Add comprehensive TypeScript types

## 📄 License

This documentation is provided as-is for educational and development purposes.

---

**Generated from AI Product Images PhotoStudio System**  
*Last Updated: August 2025*
