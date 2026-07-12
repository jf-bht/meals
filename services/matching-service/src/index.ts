import Fastify from "fastify";
import { ZodError } from "zod";
import { calculateMacros, MacroInput } from "./macros.js";

const app = Fastify({ logger: true });

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

// Placeholder — Business-Logik für REQ-003 (Rezept-Matching) folgt in
// einem späteren Schritt.

const port = Number(process.env.PORT ?? 3001);

app
  .listen({ port, host: "0.0.0.0" })
  .catch((err) => {
    app.log.error(err);
    process.exit(1);
  });
