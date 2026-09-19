# Digital Love Letters — Full Stack Launch Checklist

## Bucket 1: Database & Schema
- [ ] Fix duplicate `love_diaries` table definition in `database/schema.sql` (lines 364-403 and 422-462)
- [ ] Add `storage` bucket RLS policies for Supabase Storage
- [ ] Add database triggers for `view_count` increment on public entry reads
- [ ] Add `unlock_condition` enum type or validation function in DB
- [ ] Add `partner_interactions` unique constraint to prevent duplicate views/clicks
- [ ] Add `relationship_settings` unique constraint on `(partner_one_id, partner_two_id)`
- [ ] Add `profiles.username` unique field for public profile URLs
- [ ] Add `entries.is_deleted` soft-delete flag + cleanup job
- [ ] Add `media.alt_text` for accessibility
- [ ] Add `entries.description` / `entries.excerpt` for SEO sharing
- [ ] Add database function `increment_entry_view_count(entry_id UUID)`
- [ ] Add `entries.last_viewed_at` timestamp

## Bucket 2: Authentication & Authorization
- [ ] Verify email flow works end-to-end with real Supabase
- [ ] Add password reset email template in Supabase Dashboard
- [ ] Add magic link email template
- [ ] Add OAuth provider email templates (Google, GitHub, Apple)
- [ ] Implement session refresh logic in middleware
- [ ] Add rate limiting on auth endpoints
- [ ] Add account lockout after N failed attempts
- [ ] Add "Remember me" / extended session option
- [ ] Add profile edit page (`/admin/profile`)
- [ ] Add avatar upload endpoint
- [ ] Add account deletion / GDPR export endpoint
- [ ] Add partner linking flow (invite by email)

## Bucket 3: Core API Routes
- [ ] `GET /api/public/entries/[slug]` — view count increment
- [ ] `POST /api/entries/[id]/publish` — publish/unpublish toggle
- [ ] `POST /api/entries/[id]/duplicate` — clone entry
- [ ] `POST /api/entries/[id]/reorder` — reorder child items (flowers, polaroids, etc.)
- [ ] `GET /api/entries/search` — public search by title/slug
- [ ] `GET /api/entries/feed` — public chronological feed of published entries
- [ ] `POST /api/entries/[id]/interactions` — record partner interactions
- [ ] `GET /api/entries/[id]/interactions` — view interaction analytics
- [ ] `GET /api/diaries/[id]` — get single diary
- [ ] `PUT /api/diaries/[id]` — update diary
- [ ] `DELETE /api/diaries/[id]` — delete diary
- [ ] `POST /api/diaries/[id]/entries` — add entry to diary
- [ ] `DELETE /api/diaries/[id]/entries` — remove entry from diary
- [ ] `GET /api/settings/relationship` — get relationship settings
- [ ] `PUT /api/settings/relationship` — update relationship settings
- [ ] `GET /api/settings/notifications` — get notification preferences
- [ ] `PUT /api/settings/notifications` — update notification preferences
- [ ] `GET /api/admin/users` — list all users (admin only)
- [ ] `GET /api/admin/entries` — all entries across users (admin only)
- [ ] `POST /api/admin/entries/[id]/feature` — feature/unfeature entry

## Bucket 4: Frontend Pages
- [ ] `/admin/profile` — edit profile, avatar, timezone, location
- [ ] `/admin/settings` — notification preferences, privacy settings
- [ ] `/admin/entries/[id]/edit` — full CRUD editor for each entry type
- [ ] `/daily/[slug]` — public entry view page with unlock logic
- [ ] `/u/[username]` — public profile page
- [ ] `/explore` — public gallery of published entries
- [ ] `/diaries/[id]` — view a love diary
- [ ] `/diaries/[id]/edit` — edit diary contents
- [ ] `/notifications` — notification center
- [ ] `/404` — styled not-found page
- [ ] `/500` — styled error page
- [ ] `/maintenance` — maintenance mode page

## Bucket 5: Entry Type Editors
- [ ] Love Letter editor with rich text / formatting
- [ ] Digital Bouquet editor with flower picker + positioning
- [ ] Polaroid editor with image upload, stickers, tilt controls
- [ ] Scratch Card editor with cover customization
- [ ] Open When editor with condition builder
- [ ] Coffee Date editor with drink picker + timer
- [ ] Voice Note recorder with waveform preview
- [ ] Entry preview before publishing
- [ ] Draft autosave to localStorage
- [ ] Entry scheduling / queue system

## Bucket 6: Storage & Media
- [ ] Configure Supabase Storage buckets: `media`, `avatars`, `diaries`
- [ ] Add image compression before upload
- [ ] Add video transcoding pipeline (optional, FFmpeg)
- [ ] Add audio waveform generation server-side
- [ ] Add file size validation (max 50MB video, 10MB audio, 5MB image)
- [ ] Add MIME type validation
- [ ] Add virus scanning (optional)
- [ ] Add CDN cache invalidation on media delete
- [ ] Add progressive image loading / blur placeholder
- [ ] Add WebP/AVIF conversion

## Bucket 7: Email & Notifications
- [ ] Set up Resend / SendGrid / Supabase Email
- [ ] Email verification template
- [ ] Password reset template
- [ ] Magic link template
- [ ] "New entry published" notification email
- [ ] "Open when" unlock notification email
- [ ] Partner invite email
- [ ] Weekly digest email
- [ ] In-app notification system (database table)
- [ ] Push notifications (optional, web push)

## Bucket 8: Testing & QA
- [ ] Unit tests for API routes (Jest/Vitest)
- [ ] Integration tests for auth flow
- [ ] E2E tests for entry creation → viewing
- [ ] E2E tests for signup → login → create → publish
- [ ] Database seed script for local dev
- [ ] Demo data cleanup script
- [ ] Cross-browser testing (Chrome, Safari, Firefox, mobile)
- [ ] Accessibility audit (WCAG 2.1 AA)
- [ ] Performance audit (Lighthouse > 90)
- [ ] SEO audit (meta tags, OG, structured data)

## Bucket 9: DevOps & Deployment
- [ ] Set up Vercel / Netlify / Railway deployment
- [ ] Configure production Supabase project
- [ ] Set up environment variables
- [ ] Add database migration workflow (Supabase CLI)
- [ ] Add CI/CD pipeline
- [ ] Add preview deployments for PRs
- [ ] Add error tracking (Sentry)
- [ ] Add analytics (PostHog / Plausible)
- [ ] Add uptime monitoring
- [ ] Add backup strategy
- [ ] Add staging environment

## Bucket 10: Security
- [ ] Add rate limiting to all API routes
- [ ] Add CSRF protection
- [ ] Add XSS protection (sanitize HTML in entries)
- [ ] Add SQL injection prevention (use parameterized queries)
- [ ] Add content security policy headers
- [ ] Add HSTS headers
- [ ] Add CORS configuration
- [ ] Add API key rotation for service role
- [ ] Add audit logging for sensitive actions
- [ ] Add GDPR compliance features (data export, delete)
- [ ] Add terms of service + privacy policy pages

## Bucket 11: Features & Polish
- [ ] Add offline mode / PWA support
- [ ] Add share to social media (OG cards)
- [ ] Add print-friendly entry view
- [ ] Add entry export (PDF, JSON)
- [ ] Add bulk entry import
- [ ] Add entry templates
- [ ] Add collaborative editing (real-time)
- [ ] Add comments / reactions on entries
- [ ] Add mood/weather API integration for coffee dates
- [ ] Add distance calculation display for long-distance couples
- [ ] Add anniversary countdown widget
- [ ] Add love meter / relationship stats
- [ ] Add achievement system
