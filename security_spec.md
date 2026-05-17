# Security Specification - Catatan Hutang

## Data Invariants
- A debt record must belong to a valid authenticated user (`userId == request.auth.uid`).
- Users can only read, update, and delete their own debt records.
- Total amount must be non-negative.
- `type` and `status` must be from the allowed enum.

## The Dirty Dozen Payloads
1. Create debt for another user (`userId = "other_user"`).
2. Read all debts without being owner.
3. Update `amount` to a negative value.
4. Update `userId` to transfer ownership.
5. Update `createdAt` (immutable).
6. Create record with massive string in `notes` (1MB+).
7. Create record with invalid `type` (e.g., "stolen").
8. Update `status` of a deleted record (orphaned write).
9. Update `contactName` of someone else's record.
10. Delete a record belonging to another user.
11. Search debts belonging to other users.
12. Create a record with a future `createdAt` timestamp.

## Implementation Guide
- Use `isValidDebt` helper.
- Enforce `userId` matches `request.auth.uid`.
- Use `affectedKeys().hasOnly()` for updates.
- Check `request.time` for timestamps.
