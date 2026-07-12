/**
 * @svcar/contracts — shared schema + type surface for the SV Car Customs frontend.
 *
 * This barrel is the ONLY public entry point. App code, the MSW mocks, the
 * `backend` client, and react-hook-form resolvers all import from
 * `@svcar/contracts` (path-aliased to this file in tsconfig.json).
 *
 * When the backend publishes the real `@svcar/contracts` npm package:
 *   1. `npm i @svcar/contracts`
 *   2. delete the alias in tsconfig.json (+ this src/contracts folder)
 * Node module resolution then falls through to node_modules — no import-site edits.
 */
export * from "./common";
export * from "./category";
export * from "./product";
export * from "./vehicle";
export * from "./home";
export * from "./settings";
export * from "./auth";
export * from "./cart";
export * from "./address";
export * from "./order";
export * from "./lead";
export * from "./subscriber";
export * from "./analytics";
