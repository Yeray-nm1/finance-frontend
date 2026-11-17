import { request } from "./client";

export const me = {
  deleteData: () => request<void>("/me/data", { method: "DELETE" }),
  deleteAccount: (password: string) =>
    request<void>("/me", {
      method: "DELETE",
      body: JSON.stringify({ password }),
    }),
};
