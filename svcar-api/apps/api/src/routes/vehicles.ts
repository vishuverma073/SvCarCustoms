import { Hono } from "hono";
import { asc } from "drizzle-orm";
import {
  VehicleMakesResponseSchema,
  type VehicleMakeWithModels,
} from "@svcar/contracts";
import type { DbClient } from "../db/client.js";
import { vehicleMakes, vehicleModels } from "../db/schema.js";
import type { AppEnv } from "../lib/types.js";
import { cached } from "../lib/cache.js";

const VEHICLE_TTL = 3600; // 1 hr — reference data, rarely changes.

export function makeVehiclesRouter(db: DbClient) {
  const router = new Hono<AppEnv>();

  // GET /vehicles/makes — every make with its models nested, sorted for the
  // Make → Model → Year picker on the storefront.
  router.get("/makes", async (c) => {
    const { value, hit } = await cached("vehicles:makes", VEHICLE_TTL, async () => {
      const makeRows = await db
        .select()
        .from(vehicleMakes)
        .orderBy(asc(vehicleMakes.sortOrder), asc(vehicleMakes.name));
      const modelRows = await db
        .select()
        .from(vehicleModels)
        .orderBy(asc(vehicleModels.sortOrder), asc(vehicleModels.name));

      const modelsByMake = new Map<number, typeof modelRows>();
      for (const m of modelRows) {
        const list = modelsByMake.get(m.makeId) ?? [];
        list.push(m);
        modelsByMake.set(m.makeId, list);
      }

      const makes: VehicleMakeWithModels[] = makeRows.map((make) => ({
        id: make.id,
        name: make.name,
        slug: make.slug,
        sortOrder: make.sortOrder,
        models: (modelsByMake.get(make.id) ?? []).map((m) => ({
          id: m.id,
          makeId: m.makeId,
          name: m.name,
          slug: m.slug,
          yearStart: m.yearStart ?? undefined,
          yearEnd: m.yearEnd ?? undefined,
          sortOrder: m.sortOrder,
        })),
      }));

      return VehicleMakesResponseSchema.parse({ makes });
    });

    c.header("x-cache", hit ? "HIT" : "MISS");
    return c.json(value);
  });

  return router;
}
