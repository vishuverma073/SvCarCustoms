import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";

/** Browser Service Worker — intercepts client-component fetches in dev. */
export const worker = setupWorker(...handlers);
