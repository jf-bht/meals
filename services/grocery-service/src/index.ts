import Fastify from "fastify";
import cors from "@fastify/cors";
import { z, ZodError } from "zod";
import { buildGroceryList, createMatchingServiceClient } from "./matchingClient.js";

const app = Fastify({ logger: true });
// Siehe matching-service/src/index.ts: nur für Expo Web relevant.
await app.register(cors, { origin: true });

const MATCHING_SERVICE_BASE_URL = process.env.MATCHING_SERVICE_BASE_URL ?? "http://localhost:3001";
const { fetchRecipe } = createMatchingServiceClient(MATCHING_SERVICE_BASE_URL);

app.get("/health", async () => {
  return { service: "grocery-service", status: "ok" };
});

const GroceryListInput = z.object({
  weekPlan: z
    .array(
      z.object({
        recipeId: z.string(),
        portions: z.number().int().positive(),
        // Optional: tatsächlich verwendete (ggf. skalierte) Zutatenmengen
        // für diese Mahlzeit — siehe matchingClient.ts.
        ingredientsPerPortion: z
          .array(
            z.object({
              name: z.string(),
              quantity: z.number(),
              unit: z.string(),
            }),
          )
          .optional(),
      }),
    )
    .min(1),
});

// REQ-005: Einkaufsliste generieren — holt Rezepte per REST vom
// matching-service (kein Import, keine geteilte DB) und aggregiert deren
// Zutaten zu einer nach Kategorie gruppierten Einkaufsliste.
app.post("/v1/grocery-list", async (request, reply) => {
  try {
    const input = GroceryListInput.parse(request.body);
    const groups = await buildGroceryList(input.weekPlan, fetchRecipe);
    return { groups };
  } catch (err) {
    if (err instanceof ZodError) {
      reply.code(400);
      return { error: "invalid_input", issues: err.issues };
    }
    if (err instanceof Error && err.message.startsWith("recipe_not_found:")) {
      reply.code(404);
      return { error: "recipe_not_found", recipeId: err.message.split(":")[1] };
    }
    if (err instanceof Error && err.message.startsWith("matching_service_error:")) {
      reply.code(502);
      return { error: "matching_service_unavailable" };
    }
    throw err;
  }
});

// Placeholder — Business-Logik für REQ-006 (Kochtage-Vorschlag), REQ-009
// (Mahlzeit-Swap) und REQ-010 (Export) ist laut Scope-Entscheidung
// (README.md) nur als Roadmap-Punkt vorgesehen, nicht Teil dieser Abgabe.
// Der spätere Aufruf des externen Nutrition-Tracker-Repos
// (github.com/jf-bht/nutrition-tracker) erfolgt ebenfalls per REST von hier
// aus.

const port = Number(process.env.PORT ?? 3002);

app
  .listen({ port, host: "0.0.0.0" })
  .catch((err) => {
    app.log.error(err);
    process.exit(1);
  });
