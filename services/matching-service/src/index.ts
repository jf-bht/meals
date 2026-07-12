import Fastify from "fastify";

const app = Fastify({ logger: true });

// Placeholder — Business-Logik für REQ-002 (Makro-Berechnung) und
// REQ-003 (Rezept-Matching) folgt in einem späteren Schritt.
app.get("/health", async () => {
  return { service: "matching-service", status: "ok" };
});

const port = Number(process.env.PORT ?? 3001);

app
  .listen({ port, host: "0.0.0.0" })
  .catch((err) => {
    app.log.error(err);
    process.exit(1);
  });
