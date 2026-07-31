# Testing Strategy

## Overview

AI Social OS uses a multi-layered testing approach to ensure reliability, correctness, and confidence in deployments. Testing is integrated into the development workflow via CI/CD and pre-commit hooks.

---

## Testing Pyramid

```
            ┌──────────┐
           │   E2E     │  Few, critical user journeys
          │  (Playwright) │
         ├──────────────────┤
        │   Integration     │  Service interactions, API endpoints
       │   (Vitest + MSW)    │
      ├────────────────────────┤
     │        Unit Tests        │  Business logic, utilities
    │      (Vitest)              │
   └──────────────────────────────┘
```

**Distribution target**:
- Unit tests: 70% of all tests
- Integration tests: 20% of all tests
- E2E tests: 10% of all tests

---

## Testing Tools

| Tool | Usage |
|------|-------|
| Vitest | Unit and integration test runner |
| Playwright | End-to-end browser testing |
| MSW (Mock Service Worker) | API mocking for frontend tests |
| Prisma (test environment) | Real database for integration tests |
| supertest | HTTP testing for Express routes |
| @testing-library/react | React component testing |
| faker.js | Test data generation |

---

## Unit Testing

### What to Unit Test
- Service business logic
- Utility functions
- Validators and schemas
- Data transformations
- Error handling logic
- Algorithm logic (priority scoring, optimal timing)

### Unit Test Structure

```typescript
// tests follow AAA pattern: Arrange, Act, Assert
describe('PostsService', () => {
  let service: PostsService;
  let mockPostsRepo: jest.Mocked<PostsRepository>;
  let mockPublishQueue: jest.Mocked<Queue>;
  
  beforeEach(() => {
    mockPostsRepo = createMockPostsRepo();
    mockPublishQueue = createMockQueue();
    service = new PostsService(mockPostsRepo, mockPublishQueue);
  });
  
  describe('schedulePost', () => {
    it('should schedule a draft post successfully', async () => {
      // Arrange
      const userId = 'user-123';
      const postId = 'post-456';
      const scheduledAt = new Date(Date.now() + 86400000); // tomorrow
      const mockPost = createMockPost({ id: postId, status: 'draft', userId });
      mockPostsRepo.findByIdForUser.mockResolvedValue(mockPost);
      mockPostsRepo.update.mockResolvedValue({ ...mockPost, status: 'scheduled', scheduledAt });
      
      // Act
      const result = await service.schedulePost(userId, postId, scheduledAt);
      
      // Assert
      expect(result.status).toBe('scheduled');
      expect(mockPostsRepo.update).toHaveBeenCalledWith(postId, {
        status: 'scheduled',
        scheduledAt
      });
      expect(mockPublishQueue.add).toHaveBeenCalledWith(
        'publish-post',
        { postId, userId: userId, socialAccountId: mockPost.socialAccountId, platform: mockPost.platform },
        expect.objectContaining({ delay: expect.any(Number) })
      );
    });
    
    it('should throw NotFoundError when post does not exist', async () => {
      mockPostsRepo.findByIdForUser.mockResolvedValue(null);
      
      await expect(
        service.schedulePost('user-123', 'nonexistent', new Date())
      ).rejects.toThrow(NotFoundError);
    });
    
    it('should throw ConflictError when post is already published', async () => {
      const mockPost = createMockPost({ status: 'published' });
      mockPostsRepo.findByIdForUser.mockResolvedValue(mockPost);
      
      await expect(
        service.schedulePost('user-123', mockPost.id, new Date(Date.now() + 86400000))
      ).rejects.toThrow(ConflictError);
    });
    
    it('should throw ValidationError when scheduled time is in the past', async () => {
      const mockPost = createMockPost({ status: 'draft' });
      mockPostsRepo.findByIdForUser.mockResolvedValue(mockPost);
      const pastDate = new Date(Date.now() - 86400000);
      
      await expect(
        service.schedulePost('user-123', mockPost.id, pastDate)
      ).rejects.toThrow(ValidationError);
    });
  });
});
```

### Test Utilities

```typescript
// factories/post.factory.ts
function createMockPost(overrides?: Partial<Post>): Post {
  return {
    id: faker.string.uuid(),
    userId: faker.string.uuid(),
    socialAccountId: faker.string.uuid(),
    content: faker.lorem.paragraph(),
    platform: 'linkedin',
    status: 'draft',
    scheduledAt: null,
    publishedAt: null,
    platformPostId: null,
    platformPostUrl: null,
    mediaUrls: [],
    hashtags: [],
    aiGenerated: false,
    aiModel: null,
    aiPrompt: null,
    generationFeedback: null,
    retryCount: 0,
    errorMessage: null,
    metadata: {},
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  };
}
```

---

## Integration Testing

### What to Integration Test
- API endpoint request/response cycles
- Service + repository interactions (with real database)
- Authentication middleware behavior
- Validation middleware behavior
- Worker job processing (with mock external APIs)

### API Integration Tests

```typescript
// Using supertest + test database
describe('POST /api/posts', () => {
  let app: Express;
  let authCookie: string;
  let testUser: User;
  
  beforeAll(async () => {
    app = createTestApp();
    testUser = await createTestUser();
    authCookie = await loginTestUser(testUser);
  });
  
  afterAll(async () => {
    await cleanupTestData();
  });
  
  it('should create a post and return 201', async () => {
    const response = await request(app)
      .post('/api/posts')
      .set('Cookie', authCookie)
      .send({
        content: 'Test post content for integration test',
        platform: 'linkedin'
      });
    
    expect(response.status).toBe(201);
    expect(response.body.data).toMatchObject({
      content: 'Test post content for integration test',
      platform: 'linkedin',
      status: 'draft',
      userId: testUser.id
    });
    expect(response.body.data.id).toBeDefined();
  });
  
  it('should return 400 for empty content', async () => {
    const response = await request(app)
      .post('/api/posts')
      .set('Cookie', authCookie)
      .send({ content: '', platform: 'linkedin' });
    
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });
  
  it('should return 401 without authentication', async () => {
    const response = await request(app)
      .post('/api/posts')
      .send({ content: 'test', platform: 'linkedin' });
    
    expect(response.status).toBe(401);
  });
});
```

### Database Integration Tests

```typescript
describe('PostsRepository', () => {
  let repo: PostsRepository;
  let testUserId: string;
  
  beforeAll(async () => {
    // Use test database (separate from development)
    testUserId = await seedTestUser();
    repo = new PostsRepository(testPrisma);
  });
  
  afterEach(async () => {
    await testPrisma.post.deleteMany({ where: { userId: testUserId } });
  });
  
  it('should create and retrieve a post', async () => {
    const created = await repo.create({
      userId: testUserId,
      content: 'Test content',
      platform: 'linkedin'
    });
    
    const found = await repo.findByIdForUser(testUserId, created.id);
    expect(found).toMatchObject({ content: 'Test content', platform: 'linkedin' });
  });
  
  it('should not return posts belonging to other users', async () => {
    const otherUserId = await seedTestUser();
    const post = await repo.create({
      userId: otherUserId,
      content: 'Other user post',
      platform: 'linkedin'
    });
    
    const found = await repo.findByIdForUser(testUserId, post.id);
    expect(found).toBeNull(); // Data isolation
  });
});
```

---

## End-to-End Testing

### What to E2E Test
- Complete user journeys (registration → onboarding → first post)
- Critical paths (login, create post, schedule, publish flow)
- OAuth flows (mock OAuth providers)
- Payment flows (Stripe test mode)

### E2E Test Examples

```typescript
// tests/e2e/post-creation.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Post Creation Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login with test user
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'TestPassword123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });
  
  test('user can create a post draft', async ({ page }) => {
    await page.click('[data-testid="create-post-button"]');
    await page.waitForURL('/posts/new');
    
    await page.fill('[data-testid="post-editor"]', 'My test post content for E2E testing');
    await page.selectOption('[data-testid="platform-select"]', 'linkedin');
    
    await page.click('[data-testid="save-draft-button"]');
    
    await expect(page.locator('[data-testid="toast-success"]')).toBeVisible();
    await page.waitForURL(/\/posts\/.+/);
  });
  
  test('user can generate AI content', async ({ page }) => {
    await page.goto('/ai-writer');
    
    await page.fill('[data-testid="topic-input"]', 'remote work productivity');
    await page.selectOption('[data-testid="platform-select"]', 'linkedin');
    await page.click('[data-testid="generate-button"]');
    
    // Wait for generation (may take a few seconds)
    await expect(page.locator('[data-testid="variant-card"]')).toHaveCount(3, { timeout: 15000 });
    
    // Each variant should have content
    const firstVariant = page.locator('[data-testid="variant-card"]').first();
    await expect(firstVariant).toContainText(/\w+/);
  });
});
```

---

## Test Environment

### Test Database
- Separate PostgreSQL database: `aisocialos_test`
- Migrations applied before test suite
- Database cleaned between test files (not between tests in same file)
- Seed data available via utility functions

### Test Configuration

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      exclude: ['node_modules', 'tests', '*.config.*']
    }
  }
});
```

---

## Coverage Targets

| Area | Target | Rationale |
|------|--------|-----------|
| Services | > 80% | Business logic must be well-tested |
| Repositories | > 60% | Key queries tested via integration |
| Controllers | > 70% | Request handling and validation |
| Utils | > 90% | Pure functions, easy to test |
| Frontend hooks | > 60% | Complex logic in hooks |
| Frontend components | > 40% | Focus on interactive components |
| Workers | > 70% | Job processing logic |
| Overall | > 65% | Balanced coverage |

---

## CI Testing Pipeline

```yaml
# .github/workflows/test.yml
jobs:
  test:
    steps:
      - Checkout code
      - Install dependencies (pnpm install)
      - Lint (turbo lint)
      - Type check (turbo typecheck)
      - Unit tests (turbo test:unit)
      - Integration tests (turbo test:integration)
        - Start test database (PostgreSQL service)
        - Start test Redis (Redis service)
        - Run migrations
        - Execute tests
      - Coverage report (upload to Codecov)
      
  e2e:
    steps:
      - Build application
      - Start services (API, worker, database, Redis)
      - Run Playwright tests
      - Upload test artifacts (screenshots, videos on failure)
```

---

## Testing Conventions

1. **Test files** live adjacent to source: `posts.service.ts` → `posts.service.test.ts`
2. **Test names** describe behavior: "should [expected] when [condition]"
3. **One assertion per test** when possible (clear failure messages)
4. **No test interdependence** (tests run in any order)
5. **Mock external services** (AI APIs, social platform APIs, email)
6. **Use factories** for test data (not hardcoded objects)
7. **Clean up after tests** (don't leave test data in database)
8. **Tests must be deterministic** (no flaky tests, mock time if needed)
