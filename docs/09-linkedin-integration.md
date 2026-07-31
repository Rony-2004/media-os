# LinkedIn Integration Specification

> **Document:** `docs/09-linkedin-integration.md`

---

# Overview

This document describes the LinkedIn integration used by ConnectUs.

The purpose of this integration is to allow users to securely connect their LinkedIn account, publish content, upload media, and manage LinkedIn posts directly from ConnectUs.

The integration uses the official LinkedIn APIs with OAuth 2.0 (3-Legged OAuth) and OpenID Connect.

---

# Objectives

Our LinkedIn integration should allow users to:

- Login with LinkedIn
- Connect LinkedIn account
- Fetch profile information
- Store LinkedIn account information
- Publish text posts
- Publish image posts
- Publish video posts (future)
- Publish document/PDF posts (future)
- Disconnect LinkedIn account
- Support scheduled publishing
- Provide a scalable architecture for future LinkedIn features

---

# Authentication

Authentication uses:

- OAuth 2.0 Authorization Code Flow
- OpenID Connect

Users never enter their LinkedIn password inside ConnectUs.
Authentication is handled entirely by LinkedIn.

---

# OAuth Flow

```
User clicks Connect LinkedIn
         ↓
Redirect user to LinkedIn Authorization URL
         ↓
User logs into LinkedIn
         ↓
User grants permissions
         ↓
LinkedIn redirects back to ConnectUs
         ↓
Backend exchanges Authorization Code
         ↓
Receive Access Token
         ↓
Store encrypted Access Token
         ↓
Fetch user profile
         ↓
Create Social Account
         ↓
LinkedIn Connected
```

---

# Required Scopes

## openid

**Purpose**
- Authenticate user
- OpenID Connect

---

## profile

**Purpose**
- User profile
- Name
- Avatar

---

## email

**Purpose**
- User email

---

## w_member_social

**Purpose**

Allows ConnectUs to:
- Create posts
- Upload media
- Publish content

---

# Endpoints Used

## 1. GET /v2/userinfo

**Purpose**

Retrieve authenticated user's profile.

Used after successful OAuth login.

**Returns**
- LinkedIn Member ID
- Name
- Email
- Profile Picture

This endpoint is required.

---

## 2. POST /rest/posts

**Purpose**

Publish LinkedIn posts.

**Supports**
- Text posts
- Image posts
- Video posts
- Document posts

This is the primary publishing endpoint.

Required for MVP.

### Request Headers

```
Authorization: Bearer {ACCESS_TOKEN}
X-Restli-Protocol-Version: 2.0.0
LinkedIn-Version: 202401
Content-Type: application/json
```

### Request Body — Text Post

```json
{
  "author": "urn:li:person:{PERSON_ID}",
  "commentary": "Your post content here with #hashtags and emojis 🚀",
  "visibility": "PUBLIC",
  "distribution": {
    "feedDistribution": "MAIN_FEED",
    "targetEntities": [],
    "thirdPartyDistributionChannels": []
  },
  "lifecycleState": "PUBLISHED",
  "isReshareDisabledByAuthor": false
}
```

### Request Body — Image Post

```json
{
  "author": "urn:li:person:{PERSON_ID}",
  "commentary": "Check out this image!",
  "visibility": "PUBLIC",
  "distribution": {
    "feedDistribution": "MAIN_FEED",
    "targetEntities": [],
    "thirdPartyDistributionChannels": []
  },
  "content": {
    "media": {
      "title": "Image title",
      "id": "urn:li:image:{IMAGE_URN}"
    }
  },
  "lifecycleState": "PUBLISHED",
  "isReshareDisabledByAuthor": false
}
```

### Request Body — Video Post

```json
{
  "author": "urn:li:person:{PERSON_ID}",
  "commentary": "Watch this video!",
  "visibility": "PUBLIC",
  "distribution": {
    "feedDistribution": "MAIN_FEED",
    "targetEntities": [],
    "thirdPartyDistributionChannels": []
  },
  "content": {
    "media": {
      "title": "Video title",
      "id": "urn:li:video:{VIDEO_URN}"
    }
  },
  "lifecycleState": "PUBLISHED",
  "isReshareDisabledByAuthor": false
}
```

### Request Body — Document Post

```json
{
  "author": "urn:li:person:{PERSON_ID}",
  "commentary": "Here's a useful PDF document",
  "visibility": "PUBLIC",
  "distribution": {
    "feedDistribution": "MAIN_FEED",
    "targetEntities": [],
    "thirdPartyDistributionChannels": []
  },
  "content": {
    "media": {
      "title": "Document title",
      "id": "urn:li:document:{DOCUMENT_URN}"
    }
  },
  "lifecycleState": "PUBLISHED",
  "isReshareDisabledByAuthor": false
}
```

### Success Response

```
HTTP 201 Created

Headers:
  x-restli-id: urn:li:share:{POST_ID}
  x-linkedin-id: {POST_ID}
```

### Error Responses

| Status | Meaning | Action |
|--------|---------|--------|
| 400 | Bad request / invalid content | Check request body format |
| 401 | Token expired or invalid | Refresh token and retry |
| 403 | Insufficient permissions | Re-authorize with required scopes |
| 422 | Content policy violation | Notify user to modify content |
| 429 | Rate limit exceeded | Retry with exponential backoff |
| 500 | LinkedIn server error | Retry with backoff |

---

## 3. POST /rest/images?action=initializeUpload

**Purpose**

Initialize image upload.

**Workflow**

```
Initialize Upload
      ↓
Receive Upload URL
      ↓
Upload Image
      ↓
Receive Image URN
      ↓
Create LinkedIn Post
```

Required for image posting.

### Request Headers

```
Authorization: Bearer {ACCESS_TOKEN}
X-Restli-Protocol-Version: 2.0.0
LinkedIn-Version: 202401
Content-Type: application/json
```

### Request Body

```json
{
  "initializeUploadRequest": {
    "owner": "urn:li:person:{PERSON_ID}"
  }
}
```

### Success Response

```json
{
  "value": {
    "uploadUrlExpiresAt": 1735689600000,
    "uploadUrl": "https://www.linkedin.com/dms-uploads/...",
    "image": "urn:li:image:C4D10AQH..."
  }
}
```

### Upload the Image Binary

After receiving the upload URL:

```
PUT {uploadUrl}
Authorization: Bearer {ACCESS_TOKEN}
Content-Type: image/jpeg (or image/png, image/gif)

{binary image data}
```

### Supported Image Formats

| Format | MIME Type | Max Size |
|--------|----------|----------|
| JPEG | image/jpeg | 8 MB |
| PNG | image/png | 8 MB |
| GIF | image/gif | 8 MB |

### Error Responses

| Status | Meaning | Action |
|--------|---------|--------|
| 400 | Invalid owner URN | Verify person ID |
| 401 | Token expired | Refresh token |
| 403 | Missing w_member_social scope | Re-authorize |
| 413 | File too large | Compress or reject |
| 429 | Rate limited | Retry with backoff |

---

## 4. POST /rest/videos?action=initializeUpload

**Purpose**

Upload LinkedIn videos.

**Workflow**

```
Initialize Upload
      ↓
Receive Upload URL
      ↓
Upload Video
      ↓
Receive Video URN
      ↓
Create LinkedIn Post
```

Future Feature.

### Request Headers

```
Authorization: Bearer {ACCESS_TOKEN}
X-Restli-Protocol-Version: 2.0.0
LinkedIn-Version: 202401
Content-Type: application/json
```

### Request Body

```json
{
  "initializeUploadRequest": {
    "owner": "urn:li:person:{PERSON_ID}",
    "fileSizeBytes": 52428800,
    "uploadCaptions": false,
    "uploadThumbnail": false
  }
}
```

### Success Response

```json
{
  "value": {
    "uploadUrlExpiresAt": 1735689600000,
    "video": "urn:li:video:C4E10AQH...",
    "uploadInstructions": [
      {
        "uploadUrl": "https://www.linkedin.com/dms-uploads/...",
        "firstByte": 0,
        "lastByte": 4194303
      },
      {
        "uploadUrl": "https://www.linkedin.com/dms-uploads/...",
        "firstByte": 4194304,
        "lastByte": 8388607
      }
    ]
  }
}
```

### Upload the Video Binary (Chunked)

Videos are uploaded in chunks. For each `uploadInstruction`:

```
PUT {uploadUrl}
Authorization: Bearer {ACCESS_TOKEN}
Content-Type: application/octet-stream

{binary video chunk data}
```

### Supported Video Formats

| Format | MIME Type | Max Size | Max Duration |
|--------|----------|----------|-------------|
| MP4 | video/mp4 | 200 MB | 10 minutes |
| MOV | video/quicktime | 200 MB | 10 minutes |

### Error Responses

| Status | Meaning | Action |
|--------|---------|--------|
| 400 | Invalid request | Check file size and owner |
| 401 | Token expired | Refresh token |
| 403 | Missing permissions | Re-authorize |
| 413 | File too large | Reject, notify user |
| 429 | Rate limited | Retry with backoff |

---

## 5. POST /rest/documents?action=initializeUpload

**Purpose**

Upload PDFs or documents.

**Workflow**

```
Initialize Upload
      ↓
Receive Upload URL
      ↓
Upload Document
      ↓
Receive Document URN
      ↓
Create LinkedIn Post
```

Future Feature.

### Request Headers

```
Authorization: Bearer {ACCESS_TOKEN}
X-Restli-Protocol-Version: 2.0.0
LinkedIn-Version: 202401
Content-Type: application/json
```

### Request Body

```json
{
  "initializeUploadRequest": {
    "owner": "urn:li:person:{PERSON_ID}"
  }
}
```

### Success Response

```json
{
  "value": {
    "uploadUrlExpiresAt": 1735689600000,
    "uploadUrl": "https://www.linkedin.com/dms-uploads/...",
    "document": "urn:li:document:C4D10AQH..."
  }
}
```

### Upload the Document Binary

```
PUT {uploadUrl}
Authorization: Bearer {ACCESS_TOKEN}
Content-Type: application/pdf

{binary PDF data}
```

### Supported Document Formats

| Format | MIME Type | Max Size | Max Pages |
|--------|----------|----------|-----------|
| PDF | application/pdf | 100 MB | 300 pages |
| PPT | application/vnd.ms-powerpoint | 100 MB | 300 slides |
| PPTX | application/vnd.openxmlformats-officedocument.presentationml.presentation | 100 MB | 300 slides |
| DOC | application/msword | 100 MB | — |
| DOCX | application/vnd.openxmlformats-officedocument.wordprocessingml.document | 100 MB | — |

### Error Responses

| Status | Meaning | Action |
|--------|---------|--------|
| 400 | Invalid request | Check owner URN |
| 401 | Token expired | Refresh token |
| 403 | Missing permissions | Re-authorize |
| 413 | File too large | Reject, notify user |
| 415 | Unsupported format | Reject, show supported formats |
| 429 | Rate limited | Retry with backoff |

---

## Optional Endpoints

### DELETE /rest/posts/{postUrn}

**Purpose**: Delete published posts.

**Request Headers**
```
Authorization: Bearer {ACCESS_TOKEN}
X-Restli-Protocol-Version: 2.0.0
LinkedIn-Version: 202401
```

**Request**
```
DELETE /rest/posts/urn:li:share:{POST_ID}
```

**Success Response**
```
HTTP 204 No Content
```

**Error Responses**

| Status | Meaning | Action |
|--------|---------|--------|
| 401 | Token expired | Refresh token |
| 403 | Not the post author | Cannot delete |
| 404 | Post not found | Already deleted or invalid URN |

Future feature.

---

### PATCH /rest/posts/{postUrn}

**Purpose**: Update LinkedIn posts.

**Request Headers**
```
Authorization: Bearer {ACCESS_TOKEN}
X-Restli-Protocol-Version: 2.0.0
LinkedIn-Version: 202401
Content-Type: application/json
```

**Request Body**
```json
{
  "patch": {
    "$set": {
      "commentary": "Updated post content"
    }
  }
}
```

**Success Response**
```
HTTP 204 No Content
```

**Error Responses**

| Status | Meaning | Action |
|--------|---------|--------|
| 401 | Token expired | Refresh token |
| 403 | Not the post author | Cannot update |
| 404 | Post not found | Invalid URN |
| 422 | Content policy violation | Modify content |

Future feature.

---

### GET /rest/images/{imageId}

**Purpose**: Retrieve uploaded image metadata.

**Request**
```
GET /rest/images/urn:li:image:{IMAGE_ID}
Authorization: Bearer {ACCESS_TOKEN}
X-Restli-Protocol-Version: 2.0.0
LinkedIn-Version: 202401
```

**Success Response**
```json
{
  "owner": "urn:li:person:{PERSON_ID}",
  "id": "urn:li:image:{IMAGE_ID}",
  "status": "AVAILABLE",
  "downloadUrl": "https://media.licdn.com/..."
}
```

Not required for MVP.

---

### GET /rest/documents/{documentId}

**Purpose**: Retrieve uploaded document metadata.

**Request**
```
GET /rest/documents/urn:li:document:{DOCUMENT_ID}
Authorization: Bearer {ACCESS_TOKEN}
X-Restli-Protocol-Version: 2.0.0
LinkedIn-Version: 202401
```

**Success Response**
```json
{
  "owner": "urn:li:person:{PERSON_ID}",
  "id": "urn:li:document:{DOCUMENT_ID}",
  "status": "AVAILABLE",
  "title": "Document Title",
  "pageCount": 12
}
```

Not required for MVP.

---

### Reactions Endpoints

Reaction APIs are currently out of scope.
Will be considered in future versions.

---

# Publishing Flow

```
Generate AI Content
        ↓
User Reviews Content
        ↓
Upload Image (Optional)
        ↓
Schedule or Publish
        ↓
Worker Executes
        ↓
POST /rest/posts
        ↓
Success Response
        ↓
Store LinkedIn Post URN
        ↓
Show Success
```

---

# Database

## SocialAccount

**Fields**
- id
- userId
- provider
- providerUserId
- accessToken (Encrypted)
- refreshToken (If Available)
- expiresAt
- connectedAt
- metadata

---

## Post

**Fields**
- id
- userId
- socialAccountId
- content
- media
- status
- linkedinPostUrn
- scheduledAt
- publishedAt
- createdAt

---

# Security

- Never store LinkedIn passwords.
- Only store OAuth Access Tokens.
- Encrypt Access Tokens before saving.
- Validate every OAuth callback.
- Use HTTPS in production.
- Never expose tokens to the frontend.

---

# Error Handling

Handle:
- Expired Tokens
- Revoked Permissions
- Rate Limits
- Upload Failures
- Invalid Media
- Network Errors
- OAuth Failures

Retry failed publish jobs using BullMQ.

---

# Rate Limits

| Resource | Limit | Window |
|----------|-------|--------|
| Member posts (create) | 100 posts | Per day |
| API calls (general) | Varies by endpoint | Per day |
| Image uploads | No published limit | — |
| Video uploads | No published limit | — |
| Document uploads | No published limit | — |

### Rate Limit Headers from LinkedIn

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1690000000
```

### Handling Strategy

1. Track remaining quota per user in Redis
2. Before each API call: check remaining quota
3. If quota < 10%: queue request for later
4. On 429 response: respect Retry-After header
5. Exponential backoff: 1min, 5min, 15min, 1hr

---

# Future Enhancements

- Company Page publishing
- Analytics
- Comment management
- AI comment replies
- LinkedIn messaging (if APIs become available)
- Organization support
- Multi-account support
- Rich analytics dashboard

---

# MVP Checklist

- [ ] Login with LinkedIn
- [ ] Connect LinkedIn account
- [ ] Store encrypted Access Token
- [ ] Fetch user profile
- [ ] Display connected account
- [ ] Create text posts
- [ ] Upload images
- [ ] Publish posts
- [ ] Schedule posts
- [ ] Store LinkedIn Post URN
- [ ] View publishing history

---

# APIs Used in MVP

| Endpoint | Required | Purpose |
|----------|----------|---------|
| GET /v2/userinfo | ✅ | Fetch authenticated user profile |
| POST /rest/posts | ✅ | Publish LinkedIn posts |
| POST /rest/images?action=initializeUpload | ✅ | Upload images |
| POST /rest/videos?action=initializeUpload | 🟡 | Video publishing (future MVP extension) |
| POST /rest/documents?action=initializeUpload | 🟡 | PDF/document publishing (future MVP extension) |

---

# Integration Status

| Feature | Status |
|---------|--------|
| OAuth Login | Planned |
| User Profile | Planned |
| Text Posting | Planned |
| Image Posting | Planned |
| Video Posting | Future |
| Document Posting | Future |
| Analytics | Future |
| Comment Management | Future |
| Company Pages | Future |
