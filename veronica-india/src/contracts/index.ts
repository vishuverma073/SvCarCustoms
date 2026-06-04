/**
 * @veronica/contracts — shared schema + type surface for the Veronica frontend.
 *
 * This barrel is the ONLY public entry point. App code, the MSW mocks, the
 * `backend` client, and react-hook-form resolvers all import from
 * `@veronica/contracts` (path-aliased to this file in tsconfig.json).
 *
 * When the backend publishes the real `@veronica/contracts` npm package:
 *   1. `npm i @veronica/contracts`
 *   2. delete the alias in tsconfig.json (+ this src/contracts folder)
 * Node module resolution then falls through to node_modules — no import-site edits.
 */
export * from "./common";
export * from "./category";
export * from "./product";
export * from "./home";
export * from "./settings";
export * from "./auth";
export * from "./cart";
export * from "./address";
export * from "./order";
