import { api } from "./client.ts";
import type { Message, MessageCreatePayload } from "./types.ts";

export const messagesApi = {
  lister: (equipeId?: number) =>
    api.get<Message[]>(equipeId ? `/messages/?equipe_id=${equipeId}` : "/messages/"),
  creer: (payload: MessageCreatePayload) => api.post<Message>("/messages/", payload),
};
