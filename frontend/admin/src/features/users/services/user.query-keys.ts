export const userKeys = {
  all: ["users"] as const,
  lists: () => [...userKeys.all, "list"] as const,
  list: (path: string) => [...userKeys.lists(), path] as const,
  detail: (userId: number) => [...userKeys.all, "detail", userId] as const,
  devices: (userId: number) => [...userKeys.all, "devices", userId] as const,
};

