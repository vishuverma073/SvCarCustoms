import { categoriesHandlers } from "./categories";
import { storefrontHandlers } from "./storefront";
import { accountHandlers } from "./account";
import { checkoutHandlers } from "./checkout";
import { adminHandlers } from "./admin";

/** Central handler list. Each feature file contributes its own array. */
export const handlers = [
  ...adminHandlers,
  ...categoriesHandlers,
  ...storefrontHandlers,
  ...accountHandlers,
  ...checkoutHandlers,
];
