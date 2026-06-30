export const formatJapaneseDate = (value: string) =>
  new Intl.DateTimeFormat("ja-JP", { year: "numeric", month: "long", day: "numeric" }).format(new Date(value));

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat("ja-JP", { style: "currency", currency: "JPY" }).format(value);

/**
 * Normalizes user-authored plain text before persistence or notification.
 * React and parameterized database calls already provide the primary XSS/SQLi
 * defences; this additionally removes controls and bidi overrides that can make
 * logs or operator notifications deceptive.
 */
export const sanitizePlainText = (value: string) => value
  .normalize("NFKC")
  .replace(/[<>\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u202A-\u202E\u2066-\u2069]/gu, "")
  .replace(/\r\n?/gu, "\n")
  .trim();

/** Prevents high-impact broadcast mentions without corrupting email addresses. */
export const neutralizeNotificationMentions = (value: string) => value.replace(/@(channel|everyone|here)\b/giu, "＠$1");
