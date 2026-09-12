# Engagement API workflow

All routes use the /api/v1 prefix and Bearer authentication. IDs in request and meeting records reference profile documents; engagement businessId/bookkeeperId reference User documents, resolved by the server.

1. Business: POST /request/:bookkeeperProfileId creates pending. Pending/accepted duplicates for the same pair are prohibited by a partial unique index.
2. Assigned bookkeeper: PATCH /request/accept/:requestId or /request/reject/:requestId. Only pending requests transition.
3. Admin: POST /meeting-schedule/:requestId with date, time, meetingLink, optional meetingNote. Request must be accepted. Server sets scheduled.
4. Admin: PATCH /meeting-schedule/:id/status with { "status": "completed" }. Only scheduled meetings transition to completed/cancelled. Completed meetings cannot be edited/deleted/reopened.
5. Admin: POST /engagement with the following form. The two agreement flags record the admin's confirmation that both parties agreed after the meeting.

```json
{
  "meetingId": "MONGODB_MEETING_ID",
  "projectTitle": "Monthly bookkeeping",
  "projectDetails": "Scope, deliverables and timeline",
  "contractText": "The complete contract both parties will accept",
  "projectValue": 2500,
  "businessAgreed": true,
  "bookkeeperAgreed": true
}
```

The server sets contacted, stores projectValueCents=250000 and platformFeeCents=25000. Fee is 10%, rounded to the nearest cent. USD projects must be $5–$9,999,999 (minimum permits a $0.50 Stripe fee). Frontend fee/status/participant fields are ignored. Form and contract are immutable after creation; no generic update endpoint exists.

6. Bookkeeper first, then business: POST /engagement/:id/sign with { "signature": "Full Name", "accepted": true }. This records a typed signature and server timestamp against the stored contract. Status becomes bookkeeper_signed, then awaiting_payment. This is an application-level signature record, not an external e-sign provider integration.
7. Business: POST /engagement/:id/payment (no amount body). Use returned clientSecret in Stripe.js to confirm the card payment. Funds go to the platform Stripe account configured by the server secret key; this does not transfer the project value or create an admin payout.
8. Stripe: POST /webhook. Configure payment_intent.succeeded and the signing secret. Signature verification uses the raw request body. Only matching intent ID, payer, amount, currency and completed signing activate the engagement. Successful duplicate events do not reapply payment. Failed attempts keep contacts locked and can retry the same intent.
9. Participants: GET /engagement/:id to observe active, paymentStatus=paid, contactUnlocked=true. Redirects/client callbacks do not unlock anything.
10. Participants: GET /engagement/:id/contacts returns the other party's private contact fields after payment. General API responses redact other users' contact fields, including nested populations, even after payment; use this endpoint for unlocked contacts. Admins and authenticated owners retain their own permitted visibility. Password/OTP fields are always removed.
11. Participants: POST /engagement/:id/messages with { "text": "Hello" }; GET /engagement/:id/messages?before=MESSAGE_ID returns newest-first pages of 50. Both endpoints require active + paid + unlocked. This is persisted REST messaging; the frontend may poll. No WebSocket transport is included.

GET /engagement returns up to 100 recent engagements, scoped to the caller (admin can see all). Request list/detail and single meeting-detail endpoints are admin-only; participants use /request/my-requests and /meeting-schedule/my-schedules.

## Deployment checks

Before deploying, resolve existing duplicate pending/accepted request pairs, then ensure MongoDB creates the new request and engagement unique indexes. Do not delete old records automatically. Existing completed meetings without completedAt are intentionally not eligible; verify their completion before migrating them. No database migration or live Stripe transaction was performed by this change.

Configure the existing Stripe secretKey/webhookSecret settings and register the webhook URL. Test the full flow with Stripe test mode and a real MongoDB database, including webhook retries. Stripe reference: https://docs.stripe.com/webhooks
