# GEKKO COMMUNITY — MASTER ARCHITECTURE PLAN

## 1. Current Project State

The repository consists of two main parts:

**Frontend** (`team-gekko/` — Next.js 15 App Router):
- Phase 0 mock-first implementation with comprehensive static mock data
- 17 mock data files in `src/data/` covering members, events, games, gallery, posts, activity, brackets, squads, etc.
- 6 service modules in `src/services/` that wrap mock data with filtering/pagination
- 14 TypeScript type definitions spanning the domain
- 106+ generated static routes from `generateStaticParams()`
- Marketing surface with `(marketing)` folder containing 15 route folders
- Forms (contact, newsletter, support) display fake success states without persistence
- Navigation: Home, About, Games, Gallery, Events, Gekko Cup, Blog + YouTube external
- Footer sections: Platform, Community, Help, Legal
- Version tracking: `versionConfig.phase = "Phase 2 · Auth (UI + scaffold)"`, `mode = "mock"`
- Biome linting, Tailwind v4, Radix UI, React Hook Form, Zod, Framer Motion, GSAP, Lenis, React Query, Zustand

**Backend** (`gekko_server/` — NestJS):
- Foundation already complete: NestJS app, ConfigModule, Mongoose, MongoDB connection
- Global API prefix `/api/v1`, Swagger at `/api/docs`
- Response format `{ success, message, data }`, ValidationPipe, Helmet, CORS
- Health endpoint at `/api/v1/health`
- Database: `Team_Gekko` on MongoDB Atlas
- Status: Foundation complete, awaiting auth/authorization layer

## 2. Existing Frontend Feature Map

| Category | Files/Features | Status |
|----------|---------------|--------|
| Landing | hero, games-showcase, events-carousel, faq, feature-bento, live-pulse, members-spotlight, newsletter, CTA | Mock data powered |
| Marketing Pages | about, blog, changelog, contact, events, gallery, games, members, privacy, roadmap, support, terms, tournament | Static/mock |
| Dynamic Routes | `/blog/[slug]`, `/events/[slug]`, `/gallery/[id]`, `/games/[slug]`, `/members/[username]` | Powered by mock data |
| Components | 40+ UI components (cards, forms, badges, brackets, lightbox, etc.) | Mock-savvy |
| Services | member, event, game, gallery, post, user services | Mock data wrappers |
| Types | activity, api, bracket, changelog, event, gallery, game, match, member, post, roadmap, spotlight, user, squad | Fully defined |

## 3. Current Problems / Audit Findings

1. Forms (contact, newsletter, support) do not persist data — fake success states only
2. README describes backend/auth/database that doesn't exist in frontend
3. No real authentication exists
4. No database integration in frontend
5. No real API layer
6. No admin/dashboard implementation
7. No moderation system
8. Static member data creates future privacy concerns
9. Security headers exist but need hardening for production
10. Error handling needs production sanitization
11. Legal pages describe non-active integrations
12. No automated test coverage
13. Dependency vulnerabilities need handling

Product classified as: **Prototype / Phase 0 mock marketing site**

## 4. Target Architecture

```
Next.js Frontend
  ↓ (REST API calls)
REST API
  ↓ (NestJS)
NestJS Backend
  ↓ (Business Logic)
MongoDB Atlas (Team_Gekko database)
  ↓ (Persistence)
```

Frontend is NOT the source of truth. MongoDB + NestJS backend is the SINGLE SOURCE OF TRUTH.

## 5. Backend Architecture

NestJS monolith with modular structure under `gekko_server/src/`:
- `app.module.ts` — Root module importing feature modules
- `config/configuration.ts` — Environment config (MONGODB_URI, PORT, frontendUrl)
- `database/database.module.ts` — Mongoose connection with schema definitions
- `health/health.module.ts` — Health check endpoint
- Feature modules: `auth/`, `member/`, `event/`, `challenge/`, `story/`, `moment/`, `recognition/`, `hall-of-fame/`, `hall-of-shame/`, `notification/`, `report/`, `support/`, `newsletter/`, `admin/`, `moderator/`
- Global: `main.ts` — Sets `api/v1` prefix, CORS, Helmet, ValidationPipe, Swagger
- API responses: `{ success, message, data }` envelope format
- Validation: class-validator + class-transformer throughout
- Security: Helmet headers, CORS configured to frontend URL only

## 6. MongoDB Architecture — Core Collections/Models

| Collection | Key Fields | Notes |
|-----------|-----------|-------|
| `users` | `_id`, `email`, `passwordHash`, `username`, `displayName`, `role` (ADMIN/MODERATOR), `status`, `privacy`, `permissions[]`, `xp`, `level`, `createdAt`, `updatedAt`, `twoFaEnabled`, `emailVerified` | Single source of truth for identity |
| `refreshTokens` | `_id`, `token`, `userId`, `expiresAt`, `revokedAt`, `ipAddress`, `userAgent` | Rotating token blacklist |
| `auditLogs` | `_id`, `actorId`, `action`, `targetType`, `targetId`, `metadata`, `timestamp`, `ipAddress` | Immutable, no passwords/secrets |
| `memberProfiles` | `_id`, `userId`, `bio`, `pronouns`, `location`, `avatar`, `accent`, `badges[]`, `xp`, `level`, `joinedAt`, `lastActiveAt` | Linked to users by `userId` |
| `events` | `_id`, `title`, `slug`, `type`, `status`, `startAt`, `endAt`, `timezone`, `location`, `isOnline`, `capacity`, `registered`, `coverGradient`, `coverImage`, `glyph`, `accent`, `format`, `schedule`, `prizes`, `streamUrl`, `registerUrl`, `resultsUrl` | Game-agnostic event system |
| `eventParticipants` | `_id`, `eventId`, `userId`, `joinedAt`, `status` (registered/attended/completed) | Links users to events |
| `challenges` | `_id`, `title`, `description`, `type`, `startAt`, `endAt`, `participants[]`, `winners[]`, `accent` | Time-bound community challenges |
| `moments` | `_id`, `title`, `content`, `mediaId`, `uploaderId`, `tags`, `reactions[]`, `accent` | Community-shared moments/memories |
| `recognition` | `_id`, `type` (badge/award), `recipientId`, `granterId`, `reason`, `media`, `status` (pending/approved/revoked) | Hall of Fame / award system |
| `hallOfFame` | `_id`, `memberId`, `category`, `achievement`, `year`, `reason`, `media`, `votes`, `approvedBy`, `createdAt` | Prestigious recognition records |
| `hallOfShame` | `_id`, `memberId`, `incident`, `category`, `consent`, `moderatorId`, `createdAt`, `status` (active/archived) | Controlled, moderated feature |
| `notifications` | `_id`, `userId`, `type`, `title`, `message`, `link`, `read`, `createdAt` | Inbox-style notification system |
| `media` | `_id`, `uploaderId`, `key`, `type`, `width`, `height`, `size`, `url`, `uploadedAt` | Cloudinary/media asset storage |
| `reports` | `_id`, `reporterId`, `targetType`, `targetId`, `reason`, `status` (open/closed/resolved), `resolvedBy`, `resolvedAt` | Moderation reporting |
| `supportTickets` | `_id`, `userId`, `subject`, `status` (open/pending/closed), `messages[]`, `priority` | Support system with persistence |

## 7. Authentication Architecture

**Auth Flow:**
1. User initiates auth via Discord OAuth or email/password
2. NestJS `AuthService` handles OAuth callback or password verification
3. On success: creates/updates user in MongoDB, issues JWT + refresh token pair
4. Tokens stored HttpOnly cookies (JWT) + Redis/DB (refresh token)
5. Frontend receives minimal user profile; full profile fetched via API on auth state change

**JWT Strategy:**
- Short-lived access token (15min) in HttpOnly cookie
- Rotating refresh token (30d) stored in DB with revocation list
- Edge middleware (`/api/v1/*`) checks auth on each request
- Middleware attaches `req.user` with `role` and `permissions`

**Current User Context:**
```typescript
interface CurrentUser {
  id: string;
  username: string;
  displayName: string | null;
  role: 'ADMIN' | 'MODERATOR';
  permissions: string[]; // granted by role + admin assignments
}
```

**Auth Endpoints** (`/api/v1/auth`):
- `POST /login` — email/password
- `POST /register` — new account
- `POST /discord/login` — OAuth start
- `GET /discord/callback` — OAuth finish
- `POST /refresh` — refresh access token
- `POST /logout` — revoke tokens
- `POST /forgot-password` — trigger reset
- `POST /reset-password` — complete reset with token

## 8. Admin / Moderator RBAC Architecture

**Exactly Two Application Roles:**

### ADMIN
- Represents: President of Gekko + General Secretary
- Full administrative authority
- Supports both President and General Secretary accounts
- Authority: member management, moderator management, permission management, content management, event management, community management, recognition, Hall of Fame, Hall of Shame, settings, analytics, moderation, audit logs, critical system operations

### MODERATOR
- Granted access by an ADMIN
- Does NOT automatically receive full admin access
- Permissions are granular and assigned by Admin
- Example permission sets:
  - MODERATOR A: `MEMBER_VIEW`, `MEMBER_UPDATE`
  - MODERATOR B: `CONTENT_MODERATE`, `STORY_MODERATE`
  - MODERATOR C: `EVENT_MANAGE`

**Permission System:**
- Roles are logical groupings; permissions are granular grants
- Admin assigns specific permissions to each moderator
- Backend enforces all permissions — frontend checks are ONLY for UI visibility
- Never trust frontend role/permissions for security

**Permission Matrix (example):**
| Permission | ADMIN | MODERATOR (assigned by Admin) |
|------------|-------|-------------------------------|
| `member:view` | ✅ | ✅ (if assigned) |
| `member:update` | ✅ | ✅ (if assigned) |
| `content:moderate` | ✅ | ✅ (if assigned) |
| `event:manage` | ✅ | ✅ (if assigned) |
| `hall:fame:manage` | ✅ | ❌ |
| `hall:shame:manage` | ✅ | ❌ |
| `admin:manage` | ✅ | ❌ |
| `user:manage` | ✅ | ❌ |
| `permission:manage` | ✅ | ❌ |

## 9. Permission System

**Backend-Enforced:**
1. Every API endpoint checks `req.user.role` and `req.user.permissions`
2. Permission check middleware: `if (!hasPermission(req.user, requiredPerm)) → 403`
3. Role-based defaults + admin-assigned overrides
4. No frontend-only authorization — all routes validate server-side

**Permission Groups:**
- `member:*` — member directory operations
- `event:*` — event creation, management, participation
- `content:*` — gallery, posts, media moderation
- `hall:*` — Hall of Fame/Shame management
- `admin:*` — user/role/permission management
- `system:*` — critical operations, analytics, settings
- `notification:*` — notifications management

**Frontend Role Checks (UI only):**
- Conditional rendering of buttons/links
- Tab visibility in dashboards
- Page access hints
- NOT security — can be bypassed via direct API calls

## 10. Member System

**User Lifecycle:**
1. **Unregistered** → visits site, reads content
2. **OAuth/Email Signup** → creates account, gets `MEMBER` role (not an app role — just authenticated)
3. **Email Verification** → activates account
4. **Onboarding** → sets bio, pronouns, location, selects main games, uploads avatar
5. **Status Promotion** → based on activity, becomes `verified_member` or retains `member`
6. **Admin Promotion** → ADMIN grants MODERATOR role + permissions

**Member Profile Model** (in MongoDB):
- `userId` → links to `users` collection
- `accent` — color chip style (`gekko`/`violet`/`cyan`/`pink`/`amber`)
- `badges` — earned achievements
- `mainGames` — preferred games with ranks
- `xp` / `level` — gamified engagement metrics
- `lastActiveAt` — for activity sorting
- `privacy` — public/members/private

**Frontend Member Pages:**
- `/members/[username]` — profile hero, badges, main games, recent activity
- `/members` — directory with filters (role, game, search)
- Member cards in gallery, events, activities

## 11. Core Community Features

### Events
- CRUD operations via NestJS `EventsService`
- Status flow: `draft` → `open` → `live` → `completed`/`cancelled`
- Participant registration with capacity limits
- Bracket generation (single-elim, double-elim)
- Schedule management with timezone support
- Stream integration (Twitch/YouTube URLs)
- Registration URLs (external or default Discord CTA)

### Stories
- User-generated content posts with structured block bodies
- Categories: `announcement`, `guide`, `community`, `tutorial`, `updates`, `changelog`
- Authored by authenticated users
- Comments/reactions system
- Tagging and categorization

### Moments
- Shareable community highlights
- Media attachments (images, short videos)
- Reaction system (likes, comments)
- Tagging with game/squad context
- Activity feed integration

### Community Decisions
- Polls/votes on community topics
- Proposal system with supporting/discouraging
- Time-bound voting periods
- Results published after closure

### Recognition
- Structured award system
- Admin-approved nominations
- Visible on profiles and Hall of Fame
- Consent-aware where appropriate

## 12. Hall of Fame

**Data Architecture:**
```typescript
interface HallOfFameEntry {
  _id: ObjectId;
  memberId: ObjectId; // links to users collection
  category: 'achievement' | 'leadership' | 'contribution' | 'community_impact';
  achievement: string; // e.g., "3 cups organized this season"
  year: number; // or season label
  reason: string; // why this member was honored
  media?: ObjectId; // optional media reference
  votes?: number; // community votes (optional)
  approvedBy: ObjectId; // admin who approved
  createdAt: Date;
  status: 'active' | 'archived';
}
```

**Design Principles:**
- Prestigious visual treatment — not another CRUD table
- Admin approval ensures quality and prevents abuse
- Historical record — entries remain permanently
- Categories reflect community values: achievement, leadership, contribution, community impact
- Each entry has a reason narrative, not just a badge

## 13. Hall of Shame

**Data Architecture:**
```typescript
interface HallOfShameEntry {
  _id: ObjectId;
  memberId: ObjectId; // links to users collection
  incident: string; // factual description, not insult
  category: 'funny_mistake' | 'legendary_fail' | 'harmless_incident' | 'inside_joke';
  consent: boolean; // whether member consented to inclusion
  moderatorId: ObjectId; // moderator who submitted
  createdAt: Date;
  status: 'active' | 'archived';
  archivedAt?: Date;
}
```

**Moderation Principles:**
- Must NOT become harassment, bullying, or humiliation
- Controlled, moderated submission process
- Consent-aware — member can request removal
- Playful rather than abusive
- Factual descriptions only, no personal attacks
- Moderator oversight required for every entry
- Ability to archive entries if community sentiment changes

## 14. Entertainment / Engagement System

**Gamification (selective, not pervasive):**
- `xp` and `level` — accumulated through activity (events attended, posts made, matches won)
- `badges` — earned for specific accomplishments (organizer, streamer, cup winner, etc.)
- `milestones` — 30-day streaks, 100-member club, etc.
- `activity feed` — recent member activity visible across the platform

**Non-gamified Engagement:**
- Community moments — shared highlights, clips, screenshots
- Reactions — like/comment on posts, galleries, moments
- Activity feed — live pulse of community activity
- Challenges — time-bound community goals
- Seasonal rankings — optional, not mandatory
- Decisions — community voting on topics

**Gamification Rules:**
- Use only where it improves community experience
- Never turn everything into points/gamification
- XP/badge systems are opt-in visible, not competitive pressure
- Rankings where appropriate but not mandatory

## 15. Admin Dashboard Roadmap

**Future (Phase 8+):**
Premium admin surface — manage:
- Members (paginated table, role/status updates, search)
- Moderators (permission assignment, removal)
- Content (blog posts, gallery items, announcements via Tiptap CMS)
- Events (creation, bracket builder, schedule, prizes)
- Challenges (create, manage participants, winners)
- Recognition (Hall of Fame entries, approval workflow)
- Hall of Shame (moderation queue, consent management)
- Announcements (site-wide notifications)
- Reports (support tickets, moderation reports)
- Community settings (site preferences, feature flags)
- Analytics (member growth, activity metrics)
- Audit logs (searchable, filterable history)

**NOT to be built yet** — first establish backend architecture, then auth, then member management.

## 16. Frontend Migration Strategy

**Gradual replacement pattern:**

| Current | Future |
|---------|--------|
| `members.mock.ts` → `GET /api/v1/members` → NestJS → MongoDB | |
| `events.mock.ts` → `GET /api/v1/events` → NestJS → MongoDB | |
| `gallery.mock.ts` → `GET /api/v1/gallery` → NestJS → MongoDB | |
| `posts.mock.ts` → `GET /api/v1/posts` → NestJS → MongoDB | |
| `games.mock.ts` → `GET /api/v1/games` → NestJS → MongoDB | |
| `activity.mock.ts` → `GET /api/v1/activity` → NestJS → MongoDB | |
| `users.mock.ts` → `GET /api/v1/users` → NestJS → MongoDB | |

**Migration Steps:**
1. Phase 1: Add NestJS API routes that return static mock data initially
2. Phase 2: Update service modules to call real API instead of importing mocks
3. Phase 3: Replace mock data with MongoDB queries in backend
4. Phase 4: Frontend continues working without changes (API shape preserved)
5. Phase 5: Remove all `src/data/*.mock.ts` imports from services

**Key Principle:** Frontend API layer is abstracted — services call `service.list()`, `service.get()`, etc. Swap mock import for API call without changing component code.

## 17. API Roadmap

| Phase | Modules | Key APIs |
|-------|---------|----------|
| Phase 2 | Auth + Sessions | `POST /api/v1/auth/login`, `POST /api/v1/auth/register`, `GET /api/v1/auth/me`, `POST /api/v1/auth/refresh` |
| Phase 3 | Member Management | `GET /api/v1/members`, `GET /api/v1/members/[username]`, `PATCH /api/v1/members/[username]/profile` |
| Phase 4 | Events | `GET /api/v1/events`, `GET /api/v1/events/[slug]`, `POST /api/v1/events`, `PUT /api/v1/events/[slug]`, `GET /api/v1/events/[slug]/participants`, `GET /api/v1/events/[slug]/bracket` |
| Phase 5 | Stories + Moments | `GET /api/v1/stories`, `POST /api/v1/stories`, `GET /api/v1/moments`, `POST /api/v1/moments` |
| Phase 6 | Challenges + Decisions | `GET /api/v1/challenges`, `POST /api/v1/challenges`, `GET /api/v1/decisions`, `POST /api/v1/decisions/:id/vote` |
| Phase 7 | Recognition + Hall of Fame/Shame | `GET /api/v1/recognition`, `POST /api/v1/recognition`, `GET /api/v1/hall-of-fame`, `GET /api/v1/hall-of-shame` |
| Phase 8+ | Notifications + Analytics | `GET /api/v1/notifications`, `POST /api/v1/notifications/read`, `GET /api/v1/analytics` |

## 18. Security Architecture

**Never Trust Frontend:**
- Frontend role checks → UI visibility only, NOT security
- Client-provided userId → rejected server-side
- Client-provided role → validated against user's actual role
- Client-provided permission → checked against granted permissions

**Backend Security Layers:**
1. **Helmet** — HTTP headers (XSS, frame, content-type, referrer policy, permissions policy)
2. **CORS** — configured to frontend URL only, no wildcard
3. **Validation** — class-validator on all inbound DTOs; Zod schemas for forms
4. **Rate Limiting** — per-IP, per-endpoint limits (express-rate-limit or nestjs/throttler)
5. **Input Sanitization** — all strings escaped, no SQL injection (MongoDB ODM), XSS prevention
6. **Security Headers** — already in next.config.ts, harden for production
7. **Password Security** — bcrypt/argon2 hashing, never stored in plain text
8. **Query Sanitization** — MongoDB projection limits, no raw operator injection
9. **Audit Logging** — all admin/moderation actions logged immutable
10. **Data Validation** — Zod schemas for create/update operations

**Production Hardening Checklist:**
- [ ] Rate limiting enabled
- [ ] CORS restricted to verified domains
- [ ] Passwords hashed (bcrypt/argon2)
- [ ] No secrets in env.example or client code
- [ ] Input sanitization on all endpoints
- [ ] Security headers hardened (CSP, HSTS, etc.)
- [ ] Error sanitization — no stack traces to clients
- [ ] Database connection strings in secure env vars
- [ ] Session/token rotation implemented
- [ ] CSRF protection where needed

## 19. Audit Logging

**Tracked Actions:**
- Actor (userId who performed action)
- Action (created, updated, deleted, granted_permission, revoked_permission, etc.)
- Target Type (user, event, member, eventparticipant, halloffameentry, hallofshameentry, etc.)
- Target ID (specific record ID)
- Timestamp (ISO)
- Metadata (additional context: old value, new value, IP, user-agent)
- Request ID (correlate with request logs)

**What NOT to Store:**
- Passwords or password hashes
- PII beyond what's necessary (email may be logged with redaction)
- Secrets, API keys, tokens

**Log Format Example:**
```json
{
  "actorId": "user_003",
  "action": "member_role_promoted",
  "targetType": "user",
  "targetId": "user_042",
  "metadata": {
    "newRole": "moderator",
    "permissions granted": ["member:view", "member:update", "content:moderate"],
    "grantedBy": "admin_u_003"
  },
  "timestamp": "2026-05-19T22:15:30Z",
  "ipAddress": "203.0.113.45",
  "requestId": "req_abc123def456"
}
```

**Audit Endpoints** (`/api/v1/audit`):
- `GET /api/v1/audit` — search/filter logs (admin only)
- `GET /api/v1/audit/:targetType/:targetId` — logs for specific target
- Pagination, date filtering, action type filtering

## 20. Testing Strategy

**Test Types:**
1. **Unit Tests** — service logic, validation schemas, utility functions
2. **Integration Tests** — API endpoint responses, auth flows, DB operations
3. **E2E Tests** — full user flows (login → profile → event creation → audit log)
4. **Cypress Tests** — frontend UI interactions, form validations, role-based UI visibility

**Test Organization:**
- `gekko_server/test/unit/` — unit tests per module
- `gekko_server/test/e2e/` — e2e test suites
- `team-gekko/test/` — frontend unit/tests via vitest/jest

**Key Test Scenarios:**
- Auth: login with valid/invalid credentials, OAuth flow, token refresh, password reset
- RBAC: admin can promote/demote, moderator permissions are enforced, frontend UI reflects permissions correctly
- Member: CRUD operations, profile updates, role filtering, search
- Events: creation with all fields, participant registration, bracket generation, status transitions
- Forms: validation errors, success persistence, error sanitization
- Audit: logs created for admin actions, searchable, no sensitive data exposed

## 21. Deployment Architecture

**Frontend:** Vercel (default deployment target)
- `next.config.ts` optimized for Vercel
- Edge middleware for auth checks, i18n, feature flags
- Image optimization with configured remotePatterns
- Custom domain support

**Backend:** NestJS on any Node.js hosting
- Docker container recommended
- MongoDB Atlas (fully managed)
- Environment variables via `.env` file
- Health checks at `/api/v1/health`

**CI/CD:**
- Frontend: Vercel Git integration (auto-deploy on push to main)
- Backend: GitHub Actions or similar for NestJS build + test
- Database migrations managed via Mongoose schema versioning

**Environment Parity:**
- `NODE_ENV=development` — mock data enabled, verbose errors
- `NODE_ENV=production` — real API calls, sanitized errors, security headers
- `NEXT_PUBLIC_USE_MOCK` — feature flag to force mock mode (temporary)

## 22. Production Readiness Checklist

**Critical (must have before launch):**
- [ ] Authentication flows working (OAuth + email/password)
- [ ] Authorization enforced server-side (RBAC)
- [ ] MongoDB connection stable with Atlas
- [ ] API layer responding with real data (not mock)
- [ ] Forms persist data (contact, newsletter, support)
- [ ] Error handling sanitized (no stack traces to clients)
- [ ] Security headers production-ready
- [ ] No dependency vulnerabilities unaddressed
- [ ] Environment variables properly configured
- [ ] Database schema stable, no migrations breaking changes

**Important (should have):**
- [ ] Admin dashboard foundation (member/moderator management)
- [ ] Audit logging operational
- [ ] Notification system basic
- [ ] Support ticket persistence
- [ ] Newsletter subscriber storage
- [ ] SEO metadata up to date for all routes

**Nice to Have (post-launch):**
- [ ] Real-time presence (WebSockets/Pusher)
- [ ] AI Community Pulse features
- [ ] White-label/customization options
- [ ] Mobile PWA shell
- [ ] Voice rooms integration
- [ ] Advanced analytics dashboard

## 23. Phase-by-Phase Implementation Roadmap

### PHASE 0 — Existing Frontend Prototype Stabilization
- **Objective:** Stabilize current mock prototype, fix forms to persist, document known issues
- **Modules:** None — stabilization only
- **Database:** None
- **Frontend:** Fix contact/ newsletter/ support form persistence (mock → API stub)
- **Backend:** None yet
- **Security:** Add production security headers hardening
- **Completion:** Forms have real persistence (even if API-stubbed), audit findings documented

### PHASE 1 — Backend Foundation + MongoDB (Already Done)
- **Objective:** NestJS + MongoDB connection complete
- **Modules:** ConfigModule, DatabaseModule, HealthModule
- **Database Models:** Initial user schema, auditLog schema
- **Frontend:** Update versionConfig mode to "live"
- **Backend:** Global prefix `/api/v1`, Swagger docs, CORS, Helmet
- **Completion:** Backend accepts API requests, MongoDB connected

### PHASE 2 — Authentication + Authorization
- **Objective:** Auth.js wiring + real accounts (from roadmap)
- **Modules:** `auth/` module — OAuth, local login/register, JWT strategy
- **Database Models:** `users` collection, `refreshTokens` collection
- **Frontend:** Login page, protected routes, user session management
- **Backend:** `POST /api/v1/auth/login/register/oauth/callback/refresh`, JWT middleware
- **Security:** Password hashing (bcrypt), token storage in HttpOnly cookies
- **Completion:** Users can authenticate, sessions work, `req.user` available in middleware

### PHASE 3 — Member Management
- **Objective:** Member directory with real persistence
- **Modules:** `member/` module — list, get, profile update
- **Database Models:** `memberProfiles`, extended `users` fields
- **Frontend:** Member directory pages, profile pages, filter components
- **Backend:** `GET /api/v1/members`, `GET /api/v1/members/[username]`, `PATCH /api/v1/members/[username]/profile`
- **Completion:** Member data from MongoDB, frontend consumes real API

### PHASE 4 — Events + Event Participation
- **Objective:** Full event management system
- **Modules:** `event/` module — CRUD, participants, brackets
- **Database Models:** `events`, `eventParticipants`
- **Frontend:** Events listing, event detail pages, participant registration, bracket views
- **Backend:** `GET /api/v1/events`, `GET /api/v1/events/[slug]`, `POST /api/v1/events`, `POST /api/v1/events/[slug]/participants`, `GET /api/v1/events/[slug]/bracket`
- **Completion:** Events fully data-driven, brackets functional

### PHASE 5 — Stories + Moments + Community Content
- **Objective:** User-generated content system
- **Modules:** `story/` + `moment/` modules
- **Database Models:** `posts` (stories), `moments`, media references
- **Frontend:** Blog gallery, post detail, moment cards, reaction components
- **Backend:** `GET /api/v1/stories`, `POST /api/v1/stories`, `GET /api/v1/moments`, `POST /api/v1/moments`
- **Completion:** Community content fully persistent, reactions working

### PHASE 6 — Challenges + Community Decisions
- **Objective:** Time-bound community goals + voting
- **Modules:** `challenge/` + `decision/` modules
- **Database Models:** `challenges`, `decisions`, `votes`
- **Frontend:** Challenge participation, decision voting UI, results display
- **Backend:** `GET /api/v1/challenges`, `POST /api/v1/challenges`, `GET /api/v1/decisions`, `POST /api/v1/decisions/:id/vote`
- **Completion:** Challenges and decisions drive community engagement

### PHASE 7 — Recognition + Hall of Fame + Hall of Shame
- **Objective:** Community recognition system
- **Modules:** `recognition/` + `hall-of-fame/` + `hall-of-shame/` modules
- **Database Models:** `recognition`, `hallOfFame`, `hallOfShame`
- **Frontend:** Hall of Fame display, Hall of Shame view, nomination forms
- **Backend:** `GET /api/v1/recognition`, `POST /api/v1/recognition`, `GET /api/v1/hall-of-fame`, `GET /api/v1/hall-of-shame`
- **Completion:** Prestigious recognition system, moderated Hall of Shame

### PHASE 8 — Notifications + Analytics + Activity System
- **Objective:** Engagement + monitoring
- **Modules:** `notification/` + `analytics/` modules
- **Database Models:** `notifications`, analytics event tracking
- **Frontend:** Notification inbox, activity feed, analytics lite views
- **Backend:** `GET /api/v1/notifications`, `POST /api/v1/notifications/read`, analytics endpoints
- **Completion:** Members stay informed, admins have visibility

### PHASE 9 — AI Community Pulse / AI Assistant
- **Objective:** AI-enhanced community insights
- **Modules:** AI integration layer (optional, external provider)
- **Frontend:** AI chat assistant, community pulse summaries
- **Backend:** AI prompt endpoints, response processing
- **Completion:** AI features add value without compromising core experience

### PHASE 10 — Premium Platformization + White-Label
- **Objective:** Scalable, licenseable platform
- **Modules:** Theme/customization system, multi-tenant ready
- **Frontend:** Theme switcher, branding overrides
- **Backend:** Configurable settings, white-label scaffolding
- **Completion:** Platform can be rebranded for other communities

## 24. Dependency Graph

```
NestJS Core
  ├── ConfigModule → environment config
  ├── Mongoose → MongoDB Atlas
  ├── @nestjs/mongoose → ODM
  ├── @nestjs/jwt → JWT strategy
  ├── class-validator → DTO validation
  ├── @nestjs/throttler → rate limiting
  └── helmet → security headers

MongoDB (Team_Gekko)
  ├── users collection → identity
  ├── refreshTokens → session management
  ├── auditLogs → immutable audit trail
  ├── memberProfiles → extended profiles
  ├── events → event system
  ├── eventParticipants → participation
  ├── challenges → community challenges
  ├── moments → shared moments
  ├── recognition → awards/badges
  ├── hallOfFame → prestigious recognition
  ├── hallOfShame → moderated fun
  ├── notifications → inbox system
  ├── media → asset storage
  ├── reports → moderation reports
  └── supportTickets → support system

NestJS Feature Modules
  ├── auth/ ← depends on Core + MongoDB
  ├── member/ ← depends on Core + MongoDB
  ├── event/ ← depends on Core + MongoDB
  ├── story/ ← depends on Core + MongoDB
  ├── moment/ ← depends on Core + MongoDB
  ├── challenge/ ← depends on Core + MongoDB
  ├── decision/ ← depends on Core + MongoDB
  ├── recognition/ ← depends on Core + MongoDB
  ├── hall-of-fame/ ← depends on Core + MongoDB
  ├── hall-of-shame/ ← depends on Core + MongoDB
  ├── notification/ ← depends on Core + MongoDB
  ├── report/ ← depends on Core + MongoDB
  ├── support/ ← depends on Core + MongoDB
  ├── newsletter/ ← depends on Core + MongoDB
  ├── admin/ ← depends on auth + member + event
  └── moderator/ ← depends on auth + member + event

Frontend (Next.js)
  ├── services/ ← calls /api/v1/* endpoints
  ├── components/ ← renders data from API
  ├── config/ ← site settings, roles, permissions, nav
  └── lib/ ← utils, formatters, validators
```

## 25. Recommended First Implementation Task

**Start with PHASE 2: Authentication + Authorization**

Rationale:
1. Identity foundation must be stable before any data-driven features
2. Backend foundation (NestJS + MongoDB) already complete
3. Auth enables all subsequent features (only authenticated users can create events, submit moments, etc.)
4. Addresses audit finding: "No real authentication exists"
5. Provides basis for RBAC (ADMIN/MODERATOR roles)
6. Frontend can then conditionally render based on auth state

**First concrete task:** Create NestJS `AuthModule` with:
- `LocalStrategy` (email/password)
- `JwtStrategy` (token validation)
- `AuthService` (login, register, logout, token refresh)
- `AuthController` (HTTP endpoints)
- `JwtModule` configuration (sign/verify, cookie strategy)
- Mongoose user schema extension
- Password hashing with bcrypt

Then: Implement frontend auth context, protected routes, and session management.

This creates the single source of truth enablement for all subsequent phases.