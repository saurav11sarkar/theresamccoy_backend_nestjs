const privateFields = new Set([
  'email',
  'phone',
  'phoneNumber',
  'businessEmail',
  'businessPhoneNumber',
  'address',
  'businessLocation',
  'website',
  'linkedInProfile',
  'uploadResume',
  'uploadAssessment',
]);
const secretFields = new Set([
  'password',
  'otp',
  'otpExpiry',
  'verifiedForget',
  'stripeAccountId',
]);
/** Sanitize serialized output, including nested profile and user populations. */
export function redactContacts(
  value: unknown,
  actor?: { id: string; role: string },
  unlocked = false,
): unknown {
  if (Array.isArray(value))
    return value.map((item) => redactContacts(item, actor, unlocked));
  if (!value || typeof value !== 'object') return value;
  const record = value as Record<string, unknown>;
  const ownerId =
    typeof record.userId === 'object' && record.userId
      ? (record.userId as Record<string, unknown>)._id
      : record.userId;
  const own = !!actor && (record._id === actor.id || ownerId === actor.id);
  return Object.fromEntries(
    Object.entries(record)
      .filter(
        ([key]) =>
          !secretFields.has(key) &&
          (!privateFields.has(key) ||
            actor?.role === 'admin' ||
            own ||
            unlocked),
      )
      .map(([key, item]) => [key, redactContacts(item, actor, unlocked)]),
  );
}
