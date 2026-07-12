import Fastify from "fastify";
import cors from "@fastify/cors";
import { ZodError } from "zod";
import { calculateMacros, MacroInput } from "./macros.js";
import { matchRecipe, MatchInput } from "./matching.js";
import { RECIPE_POOL } from "./recipes.js";

const app = Fastify({ logger: true });
// Expo Web läuft im Browser und unterliegt daher CORS — native Clients
// (iOS/Android) sind davon nicht betroffen. Für den Prototyp reicht ein
// offener Origin, da es sich um lokale Entwicklungsservices ohne
// Auth/sensible Daten handelt.
await app.register(cors, { origin: true });

app.get("/health", async () => {
  return { service: "matching-service", status: "ok" };
});

// REQ-002: Makro-Berechnung
app.post("/v1/macros", async (request, reply) => {
  try {
    const input = MacroInput.parse(request.body);
    return calculateMacros(input);
  } catch (err) {
    if (err instanceof ZodError) {
      reply.code(400);
      return { error: "invalid_input", issues: err.issues };
    }
    throw err;
  }
});

// REQ-003: Rezept-Matching
app.post("/v1/recipes/match", async (request, reply) => {
  try {
    const input = MatchInput.parse(request.body);
    return matchRecipe(input);
  } catch (err) {
    if (err instanceof ZodError) {
      reply.code(400);
      return { error: "invalid_input", issues: err.issues };
    }
    if (err instanceof Error && err.message === "no_candidates") {
      reply.code(404);
      return { error: "no_candidates" };
    }
    throw err;
  }
});

// Listing des kompletten Rezept-Pools — z. B. für den Home-Tab der
// Mobile-App (Übersicht aller Rezepte). Bewusst als eigener Collection-
// Endpoint statt den Client 1..N IDs gegen GET /v1/recipes/:id raten zu
// lassen: das ID-Schema (aktuell "r-01".."r-15") ist ein internes
// Implementierungsdetail dieses Services und soll es auch bleiben.
app.get("/v1/recipes", async () => {
  return RECIPE_POOL;
});

// Wird von anderen Services (z. B. grocery-service für REQ-005) per REST
// abgerufen, um Zutaten für die Einkaufsliste zu ermitteln — kein Import,
// keine geteilte DB, nur dieser Endpoint.
app.get("/v1/recipes/:id", async (request, reply) => {
  const { id } = request.params as { id: string };
  const recipe = RECIPE_POOL.find((r) => r.id === id);
  if (!recipe) {
    reply.code(404);
    return { error: "recipe_not_found" };
  }
  return recipe;
});

const port = Number(process.env.PORT ?? 3001);

app
  .listen({ port, host: "0.0.0.0" })
  .catch((err) => {
    app.log.error(err);
    process.exit(1);
  });
