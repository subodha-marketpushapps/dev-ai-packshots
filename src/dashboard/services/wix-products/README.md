# Wix Products Service

Modular service for fetching Wix store products with universal V1/V3 compatibility.

## Structure

```
wix-products/
├── index.ts              # Main exports
├── config.ts             # V3 fieldsets & field mapping  
├── types.ts              # Type definitions
├── query-builder.ts      # Query construction & version detection
├── v1-service.ts         # V1 API operations (offset pagination)
├── v3-service.ts         # V3 API operations (cursor pagination) 
└── product-service.ts    # High-level unified API
```

## Usage

```typescript
import { 
  fetchWixStoreProductsPaginated,
  fetchWixStoreProducts,
  fetchWixStoreProduct 
} from "./services/wix-products";

// Paginated products with search & sorting
const result = await fetchWixStoreProductsPaginated(
  0,     // offset
  10,    // limit
  null,  // productIdList (optional)
  "shirt", // searchTerm (optional)
  { fieldName: "name", order: "asc" } // sortOptions (optional)
);

// All products
const allProducts = await fetchWixStoreProducts();

// Single product
const product = await fetchWixStoreProduct("product-id");
```

## Features

- **Universal Compatibility**: Automatically detects and supports both V1 and V3 catalogs
- **Optimized V3 Fieldsets**: Only fetches necessary fields for AI Product Images workflow
- **Smart Pagination**: Cursor-based for V3, offset-based for V1
- **Advanced Search**: Full-text search via searchProducts() for V3, query filters for V1
- **Performance Optimized**: Caching, smart batching, and minimal API calls
- **Comprehensive Logging**: Detailed performance metrics and error tracking

## Architecture Benefits

- **Modular**: Each file has a single responsibility
- **Maintainable**: Easy to modify V1 or V3 logic independently  
- **Testable**: Focused modules enable targeted testing
- **Type-Safe**: Full TypeScript coverage with normalized product interface
- **Future-Proof**: Easy to extend with new Wix API features
- Clean type boundaries for better TypeScript support

### **query-builder.ts** - Query Construction
- Automatic V1/V3 version detection with caching
- Query modifier application (filters, search, sorting)
- Centralized query building logic
- Version-aware field mapping

### **v1-service.ts** - V1 API Operations
- Offset-based pagination using `skip()` 
- V1-specific query filters and search
- Bulk product fetching with traditional pagination
- V1 product normalization

### **v3-service.ts** - V3 API Operations  
- Cursor-based pagination using `hasNext()` and `next()`
- `searchProducts()` API for text search (instead of query filters)
- V3 fieldset integration with optimized media handling
- V3 product normalization with media conversion

### **product-service.ts** - Unified High-Level API
- Main public functions: `fetchWixStoreProducts`, `fetchWixStoreProductsPaginated`, `fetchWixStoreProduct`
- Orchestrates V1/V3 services based on catalog version
- Consistent return types regardless of underlying API version
- Error handling and logging

### **index.ts** - Clean Exports
- Public API surface with backward compatibility
- Re-exports from `catalogNormalizer` for convenience
- Clear module boundaries

## ✅ Benefits of Modular Architecture

### **Maintainability**
- **Single Responsibility**: Each module has one clear purpose
- **Focused Changes**: Modifications are localized to relevant modules
- **Easier Debugging**: Issues can be traced to specific modules

### **Testability** 
- **Isolated Testing**: Each module can be unit tested independently
- **Mock Dependencies**: Clean interfaces make mocking easier
- **Targeted Tests**: Test specific functionality without side effects

### **Readability**
- **Clear Structure**: Easy to understand what each module does
- **Logical Organization**: Related functionality grouped together
- **Self-Documenting**: Module names indicate their purpose

### **Extensibility**
- **Easy Feature Addition**: Add new modules without affecting existing ones
- **Plugin Architecture**: New features can be added as separate modules
- **API Evolution**: Easier to add V4 support in the future

### **TypeScript Benefits**
- **Better Intellisense**: Clearer type boundaries improve IDE support
- **Compile-Time Safety**: Isolated modules catch type errors earlier
- **Dependency Tracking**: Clear import/export relationships

## 🔄 Migration Guide

The refactoring maintains 100% backward compatibility. All existing imports will continue to work:

```typescript
// ✅ Still works - backward compatibility maintained
import { fetchWixStoreProducts } from "../../services/api/wix-store-products";

// ✅ Recommended - direct import from new module
import { fetchWixStoreProducts } from "../../services/wix-products";
```

## 🚀 Usage Examples

### Basic Product Fetching
```typescript
import { fetchWixStoreProducts } from "./wix-products";

// Fetch all products with V1/V3 compatibility
const products = await fetchWixStoreProducts();

// Fetch specific products
const specificProducts = await fetchWixStoreProducts(['id1', 'id2']);
```

### Paginated Fetching
```typescript
import { fetchWixStoreProductsPaginated } from "./wix-products";

// V1: Uses offset-based pagination
// V3: Uses cursor-based pagination (automatically handled)
const result = await fetchWixStoreProductsPaginated({
  offset: 0,
  limit: 10,
  searchTerm: "shirt",
  sortOptions: { fieldName: "name", order: "asc" }
});
```

### Single Product
```typescript
import { fetchWixStoreProduct } from "./wix-products";

const product = await fetchWixStoreProduct("product-id-123");
```

## 🔧 Development Notes

### Adding New Features
1. **Identify the appropriate module** based on functionality
2. **Add types first** in `types.ts` if needed
3. **Implement functionality** in the relevant service module
4. **Update exports** in `index.ts`
5. **Add tests** for the new functionality

### V4 Future Support
When Wix releases V4 APIs:
1. Create `v4-service.ts` following the same pattern
2. Update `query-builder.ts` for V4 detection
3. Add V4 fieldsets to `config.ts`
4. Update `product-service.ts` orchestration logic

### Performance Considerations
- **Field Selection**: V3 fieldsets are optimized for AI Product Images workflow
- **Pagination**: Proper cursor vs offset pagination per API version
- **Caching**: Version detection is cached to avoid repeated calls
- **Batch Processing**: Large datasets handled efficiently

## 📊 Metrics

**Before Refactoring**: 1 file, ~450 lines
**After Refactoring**: 7 focused modules, ~100 lines average per module

**Benefits Achieved**:
- 🎯 **Clarity**: Each module has a single, clear responsibility  
- 🧪 **Testability**: Isolated modules are easier to unit test
- 🔧 **Maintainability**: Changes are localized and predictable
- 📈 **Extensibility**: New features can be added without disruption
- 🚀 **Performance**: No impact - same underlying functionality with better structure
