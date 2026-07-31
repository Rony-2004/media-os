# Coding Standards

## Overview

Consistent code standards enable fast development, easy onboarding, and maintainable codebase. These standards apply to all packages and applications in the monorepo.

---

## Architecture Patterns

### Repository Pattern

All database access goes through repository classes:

```typescript
// ✅ Good — Service uses repository
class PostsService {
  constructor(private postsRepo: PostsRepository) {}
  
  async getPost(userId: string, postId: string) {
    return this.postsRepo.findByIdForUser(userId, postId);
  }
}

// ❌ Bad — Service calls Prisma directly
class PostsService {
  async getPost(userId: string, postId: string) {
    return prisma.post.findFirst({ where: { id: postId, userId } });
  }
}
```

**Repository rules**:
- One repository per database entity
- Repositories only contain data access logic
- Repositories always filter by userId (data isolation)
- Repositories return typed data, not Prisma-specific types

### Service Layer

Business logic lives in services:

```typescript
// ✅ Good — Service contains business logic
class PostsService {
  async schedulePost(userId: string, postId: string, scheduledAt: Date) {
    const post = await this.postsRepo.findByIdForUser(userId, postId);
    if (!post) throw new NotFoundError('Post not found');
    if (post.status !== 'draft') throw new ConflictError('Only drafts can be scheduled');
    if (scheduledAt < new Date()) throw new ValidationError('Cannot schedule in the past');
    
    await this.postsRepo.update(postId, { status: 'scheduled', scheduledAt });
    await this.publishQueue.add('publish-post', { postId }, { delay: scheduledAt - Date.now() });
    
    return this.postsRepo.findByIdForUser(userId, postId);
  }
}
```

**Service rules**:
- Services orchestrate repositories and external calls
- Services contain all business validation
- Services are framework-agnostic (no Express, no HTTP)
- Services can call other services (but avoid circular deps)

### Controller Layer

Controllers handle HTTP only:

```typescript
// ✅ Good — Controller is thin
class PostsController {
  async schedulePost(req: Request, res: Response) {
    const { scheduledAt } = req.validated.body;
    const post = await this.postsService.schedulePost(
      req.userId,
      req.params.id,
      new Date(scheduledAt)
    );
    res.json({ data: post });
  }
}
```

**Controller rules**:
- Extract request data (params, query, body)
- Call service method
- Format response
- No business logic in controllers
- Error handling delegated to global error middleware

---

## Naming Conventions

### Files

| Type | Convention | Example |
|------|-----------|---------|
| Feature files | `feature.layer.ts` | `posts.service.ts` |
| Components | `kebab-case.tsx` | `post-card.tsx` |
| Hooks | `use-name.ts` | `use-posts.ts` |
| Types | `name.types.ts` | `post.types.ts` |
| Schemas | `name.schema.ts` | `post.schema.ts` |
| Utils | `name.ts` | `date.ts` |
| Tests | `name.test.ts` | `posts.service.test.ts` |
| Constants | `name.ts` or `constants.ts` | `platforms.ts` |

### Variables & Functions

```typescript
// Variables: camelCase
const postCount = 10;
const isPublished = true;
const userName = 'John';

// Functions: camelCase, verb-first
function createPost() {}
function getUserById() {}
function validateContent() {}
async function fetchAnalytics() {}

// Boolean variables/functions: is/has/should prefix
const isActive = true;
const hasPermission = false;
function isValidEmail(email: string): boolean {}
function shouldRetry(error: Error): boolean {}
```

### Classes & Interfaces

```typescript
// Classes: PascalCase
class PostsService {}
class LinkedInProvider {}

// Interfaces: PascalCase (no "I" prefix)
interface PostCreateInput {}
interface AIProvider {}
interface SocialAccountToken {}

// Types: PascalCase
type PostStatus = 'draft' | 'scheduled' | 'published' | 'failed';
type Platform = 'linkedin' | 'twitter' | 'instagram';

// Enums: PascalCase with PascalCase members
enum NotificationType {
  PostPublished = 'post_published',
  PostFailed = 'post_failed',
  CommentReceived = 'comment_received'
}
```

### Constants

```typescript
// Constants: UPPER_SNAKE_CASE for true constants
const MAX_POST_LENGTH = 3000;
const TOKEN_EXPIRY_BUFFER = 5 * 60 * 1000; // 5 minutes
const LINKEDIN_API_BASE = 'https://api.linkedin.com/v2';

// Config objects: camelCase
const rateLimitConfig = {
  windowMs: 60000,
  max: 100
};
```

---

## Folder Conventions

### Feature Module Structure

Every feature follows the same structure:

```
features/posts/
  posts.controller.ts    # HTTP handlers
  posts.service.ts       # Business logic
  posts.repository.ts    # Database access
  posts.routes.ts        # Express router definition
  posts.schema.ts        # Zod validation schemas
  posts.types.ts         # Feature-specific types
  posts.test.ts          # Tests
```

### Import Order

```typescript
// 1. Node built-ins
import { randomBytes } from 'crypto';
import path from 'path';

// 2. External packages
import express from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';

// 3. Internal packages (monorepo)
import { logger } from '@ai-social-os/logger';
import { PostStatus } from '@ai-social-os/types';

// 4. Relative imports (parent directories first)
import { authMiddleware } from '../../middleware/auth.middleware';
import { NotFoundError } from '../../lib/errors';

// 5. Same directory
import { PostsService } from './posts.service';
import { createPostSchema } from './posts.schema';
```

---

## Commit Convention

### Format (Conventional Commits)

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

### Types

| Type | Usage |
|------|-------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Formatting (no logic change) |
| `refactor` | Code restructure (no feature/fix) |
| `perf` | Performance improvement |
| `test` | Adding/fixing tests |
| `chore` | Build, deps, config changes |
| `ci` | CI/CD changes |

### Scopes

```
api, web, worker, database, ui, types, config, logger, utils, shared
```

### Examples

```
feat(api): add LinkedIn OAuth connection flow
fix(worker): handle token refresh failure in publish worker
docs: update API endpoint documentation
refactor(api): extract social account providers into separate classes
test(api): add integration tests for post scheduling
chore: update dependencies to latest patch versions
```

---

## Branch Strategy

### Branch Types

```
main              — Production-ready code, always deployable
develop           — Integration branch for features (optional, if needed)
feature/XYZ       — Feature branches
fix/XYZ           — Bug fix branches
hotfix/XYZ        — Production emergency fixes
```

### Branch Naming

```
feature/linkedin-oauth
feature/ai-content-generation
feature/post-scheduler
fix/token-refresh-loop
fix/analytics-date-range
hotfix/publish-worker-crash
```

### Workflow

```
1. Create branch from main: feature/my-feature
2. Develop and commit (small, focused commits)
3. Push branch, create PR
4. PR review (at least 1 approval)
5. CI passes (lint, type-check, tests)
6. Merge to main (squash merge preferred)
7. Auto-deploy to staging
8. Manual promote to production
```

---

## TypeScript Rules

### Strict Mode

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "exactOptionalPropertyTypes": false,
    "noPropertyAccessFromIndexSignature": true
  }
}
```

### Type Guidelines

```typescript
// ✅ Prefer interfaces for object shapes
interface PostCreateInput {
  content: string;
  platform: Platform;
  scheduledAt?: Date;
}

// ✅ Use type for unions and simple aliases
type PostStatus = 'draft' | 'scheduled' | 'published' | 'failed';
type Platform = 'linkedin' | 'twitter';

// ❌ Avoid 'any'
function processData(data: any) {} // Bad

// ✅ Use 'unknown' for truly unknown types
function processData(data: unknown) {} // Good

// ✅ Use explicit return types on public functions
function createPost(input: PostCreateInput): Promise<Post> {}

// ✅ Use generics for reusable patterns
function paginate<T>(items: T[], page: number, limit: number): PaginatedResult<T> {}
```

### Error Handling

```typescript
// ✅ Custom error classes
class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

class NotFoundError extends AppError {
  constructor(resource: string) {
    super(404, 'NOT_FOUND', `${resource} not found`);
  }
}

class ValidationError extends AppError {
  constructor(message: string, public details?: any[]) {
    super(400, 'VALIDATION_ERROR', message);
  }
}

// ✅ Services throw typed errors
async function getPost(userId: string, postId: string) {
  const post = await postsRepo.findByIdForUser(userId, postId);
  if (!post) throw new NotFoundError('Post');
  return post;
}

// ✅ Global error handler catches and formats
function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: { code: err.code, message: err.message, details: err.details }
    });
  }
  logger.error({ err, requestId: req.id }, 'Unhandled error');
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
}
```

---

## Linting & Formatting

### ESLint Configuration

Key rules:
- `@typescript-eslint/no-explicit-any`: error
- `@typescript-eslint/no-unused-vars`: error (ignoring `_` prefix)
- `no-console`: warn (use logger instead)
- `prefer-const`: error
- `no-var`: error
- Import order enforcement

### Prettier Configuration

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "bracketSpacing": true,
  "arrowParens": "always"
}
```

### Pre-Commit Hooks (Husky + lint-staged)

```json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md,yml}": ["prettier --write"]
  }
}
```

---

## Logging Standards

```typescript
// ✅ Structured logging with context
logger.info({ userId, postId, platform }, 'Post scheduled for publishing');

// ✅ Error logging with error object
logger.error({ err, userId, postId }, 'Failed to publish post');

// ✅ Request logging (automatic via middleware)
// Logs: method, url, status, duration, requestId

// ❌ Don't log sensitive data
logger.info({ token: accessToken }); // BAD
logger.info({ tokenLastFour: '...xyz' }); // OK if needed

// ❌ Don't use console.log
console.log('something happened'); // BAD — use logger
```

---

## Testing Standards

### Test Structure

```typescript
describe('PostsService', () => {
  describe('schedulePost', () => {
    it('should schedule a draft post for the given time', async () => {
      // Arrange
      const post = createMockPost({ status: 'draft' });
      mockPostsRepo.findByIdForUser.mockResolvedValue(post);
      
      // Act
      const result = await service.schedulePost(userId, postId, futureDate);
      
      // Assert
      expect(result.status).toBe('scheduled');
      expect(mockPublishQueue.add).toHaveBeenCalledWith(
        'publish-post',
        expect.objectContaining({ postId }),
        expect.any(Object)
      );
    });

    it('should throw NotFoundError if post does not exist', async () => {
      mockPostsRepo.findByIdForUser.mockResolvedValue(null);
      
      await expect(service.schedulePost(userId, postId, futureDate))
        .rejects.toThrow(NotFoundError);
    });

    it('should throw ValidationError if scheduled time is in the past', async () => {
      const post = createMockPost({ status: 'draft' });
      mockPostsRepo.findByIdForUser.mockResolvedValue(post);
      
      await expect(service.schedulePost(userId, postId, pastDate))
        .rejects.toThrow(ValidationError);
    });
  });
});
```

### Test Naming

```
it('should [expected behavior] when [condition]')
it('should return 404 when post does not exist')
it('should schedule post when all validations pass')
it('should throw ValidationError when content exceeds limit')
```

---

## Code Review Checklist

- [ ] Types are explicit (no `any`)
- [ ] Business logic is in service layer (not controller)
- [ ] Database access goes through repository
- [ ] Input is validated with Zod schema
- [ ] Errors are properly classified and thrown
- [ ] Sensitive data is not logged
- [ ] Tests cover happy path and error cases
- [ ] No hardcoded values (use constants or config)
- [ ] Follows naming conventions
- [ ] Import order is correct
- [ ] No unused imports or variables
