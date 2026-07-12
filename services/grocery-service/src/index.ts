import Fastify from "fastify";

const app = Fastify({ logger: true });

// Placeholder — Business-Logik für REQ-005 (Einkaufsliste), REQ-006
// (Kochtage-Vorschlag), REQ-009 (Mahlzeit-Swap) und REQ-010 (Export)
// folgt in einem späteren Schritt. Der spätere Aufruf des externen
// Nutrition-Tracker-Repos (github.com/jf-bht/nutrition-tracker) erfolgt
// ebenfalls per REST von hier aus.
app.get("/health", async () => {
  return { service: "grocery-service", status: "ok" };
});

const port = Number(process.env.PORT ?? 3002);

app
  .listen({ port, host: "0.0.0.0" })
  .catch((err) => {
    app.log.error(err);
    process.exit(1);
  });
