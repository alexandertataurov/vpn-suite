export const storyText = {
  shortLabel: "Status",
  mediumLabel: "Active connections",
  longLabel:
    "Long label to validate wrapping and overflow behavior in narrow containers",
  veryLong:
    "Very long string for overflow testing: core-edge-primary-02-us-east-1-maintenance-window-2025-01-01",
};

export const storyNumbers = {
  zero: 0,
  small: 3,
  medium: 42,
  large: 987654,
  huge: 1234567890,
};

export const storyDates = {
  nowIso: "2025-01-01T12:00:00.000Z",
  oneMinuteAgo: "2025-01-01T11:59:00.000Z",
  oneHourAgo: "2025-01-01T11:00:00.000Z",
  oneDayAgo: "2024-12-31T12:00:00.000Z",
};

export const storyLists = {
  empty: [] as string[],
  short: ["Alpha", "Beta", "Gamma"],
  long: [
    "core-edge-primary-01",
    "core-edge-primary-02",
    "core-edge-primary-03",
    "core-edge-primary-04",
  ],
};
