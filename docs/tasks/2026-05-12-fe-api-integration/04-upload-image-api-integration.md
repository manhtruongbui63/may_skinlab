---
task_id: "04"
title: "Upload Image API Integration"
description: "Create API hooks and upload utilities for image upload functionality with progress tracking"
type: IMPLEMENTATION
phase: 3
status: pending
estimated_effort: S
complexity: low
risk: low
depends_on: ["01"]
rule_refs: []
date: "2026-05-12"
changelog:
  - version: 1.0
    date: "2026-05-12"
    summary: Initial task specification.
---

# Context
- **Requirement**: Integration of Upload Image API into Frontend
- **Parent Task**: [2026-05-12-fe-api-integration-implementation-tasks.md](../2026-05-12-fe-api-integration-implementation-tasks.md)
- **Applicable Workflows**: (None)
- **Applicable Skills**: `fe-implementation`

---

# Task 04: Upload Image API Integration

## Description
Implement frontend integration for the image upload API, including hooks for file upload with progress tracking, validation, and error handling. This enables avatar upload and other image upload features.

## Out of Scope
- Image cropping/editing UI
- Multiple file upload (batch)
- Image gallery management

---

## Current State (Already Exists)
- **Backend API**: `POST /api/upload-image` exists
- **Feature Directory**: Create `features/upload/` or use existing
- **Depends On**: Task 01 (Auth API) for authentication

---

## Requirements

### 1. API Types (`features/upload/types/upload.ts`)

**Action: NEW**

Create TypeScript interfaces for upload:

| Interface | Fields |
|-----------|--------|
| `UploadImageRequest` | image: File, type: 'avatar' \| 'general' |
| `UploadImageResponse` | url: string, filename: string, size: number |
| `UploadProgress` | loaded: number, total: number, percentage: number |

### 2. API Hooks (`features/upload/hooks/`)

**Action: NEW**

Create upload hooks:

| Hook | Purpose |
|------|---------|
| `useUploadImageMutation` | Upload single image with progress |
| `useUploadProgress` | Track upload progress state |

**Hook Signatures:**
```typescript
export function useUploadImageMutation(): UseMutationResult<
  UploadImageResponse,
  Error,
  UploadImageRequest,
  { progress: UploadProgress }
>

export function useUploadProgress(): {
  progress: UploadProgress | null;
  isUploading: boolean;
}
```

### 3. Upload Utilities (`features/upload/utils/upload-utils.ts`)

**Action: NEW**

Create utility functions:

| Function | Purpose |
|----------|---------|
| `validateImageFile` | Check file type and size |
| `createImagePreview` | Generate preview URL for selected file |
| `formatFileSize` | Format bytes to human-readable size |
| `buildFormData` | Create FormData with image and metadata |

**Validation Rules:**
- Allowed types: image/jpeg, image/png, image/webp, image/gif
- Max file size: 5MB (5 * 1024 * 1024 bytes)
- Max dimensions: 2048x2048 (optional, backend may enforce)

### 4. Upload Store (`features/upload/stores/upload-store.ts`)

**Action: NEW**

Create store for upload state:

**Store Interface:**
```typescript
interface UploadState {
  // Current upload
  isUploading: boolean;
  progress: UploadProgress | null;
  error: string | null;
  
  // Upload history
  recentUploads: UploadImageResponse[];
  
  // Actions
  startUpload: () => void;
  updateProgress: (progress: UploadProgress) => void;
  completeUpload: (result: UploadImageResponse) => void;
  failUpload: (error: string) => void;
  clearError: () => void;
  addToHistory: (upload: UploadImageResponse) => void;
}
```

### 5. API Constants (`features/upload/constants/api-endpoints.ts`)

**Action: NEW**

```typescript
export const UPLOAD_ENDPOINTS = {
  uploadImage: '/api/upload-image',
} as const;

export const UPLOAD_CONFIG = {
  maxFileSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  maxWidth: 2048,
  maxHeight: 2048,
} as const;
```

### 6. i18n Keys

**Action: NEW**

Add translation keys:

| Key | English | Vietnamese |
|-----|---------|------------|
| `upload.selectFile` | "Select image" | "Chọn ảnh" |
| `upload.dragDrop` | "or drag and drop" | "hoặc kéo thả" |
| `upload.uploading` | "Uploading..." | "Đang tải lên..." |
| `upload.success` | "Upload successful" | "Tải lên thành công" |
| `upload.error.fileSize` | "File too large (max 5MB)" | "File quá lớn (tối đa 5MB)" |
| `upload.error.fileType` | "Invalid file type" | "Định dạng file không hợp lệ" |
| `upload.error.generic` | "Upload failed" | "Tải lên thất bại" |

---

## API Endpoints Summary

| Method | URI | Description | Input Parameters | Output Response | Auth |
|--------|-----|-------------|------------------|-----------------|------|
| POST | `/api/upload-image` | Upload image file | `image` (File, required), `type` (string: 'avatar' \| 'general') | `{ url: "...", filename: "...", size: 12345 }` | Yes |

**Request Format:**
```
Content-Type: multipart/form-data

FormData:
- image: [Binary file data]
- type: "avatar" | "general"
```

---

## Testing Hints

**Frontend Requirements:**
- **MSW Handlers**: Mock upload endpoint with delay
- **Key test scenarios**:
  - Valid file upload → success response
  - Oversized file → validation error before upload
  - Invalid file type → validation error
  - Upload progress → percentage updates correctly
  - Network error → error state displayed

---

## Status
- [ ] Create TypeScript types in `features/upload/types/upload.ts`
- [ ] Create utility functions in `features/upload/utils/upload-utils.ts`
- [ ] Create upload hook in `features/upload/hooks/use-upload-image-mutation.ts`
- [ ] Create progress hook in `features/upload/hooks/use-upload-progress.ts`
- [ ] Create Zustand store in `features/upload/stores/upload-store.ts`
- [ ] Add API constants
- [ ] Add i18n strings
- [ ] Run `pnpm lint`
- [ ] Run `pnpm test:unit`

---

## Acceptance Criteria
1. Upload hook accepts File object and type parameter
2. Progress tracking updates during upload
3. File validation runs before upload (type, size)
4. Upload store tracks state and history
5. Error handling for failed uploads
6. MSW handler mocks upload with realistic delay
7. Image preview generates correctly for selected files

---

## Error Scenarios
- File too large → Validation error, show max size message
- Invalid file type → Validation error, show allowed types
- Upload failed → 500 error, retry option
- Network timeout → Timeout error, suggest retry
- Unauthorized → 401, redirect to login

---

## Dependencies
- Task 01 (Auth API Integration) — Required for authenticated requests
