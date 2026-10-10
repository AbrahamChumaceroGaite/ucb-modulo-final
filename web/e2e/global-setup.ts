/** Stops the run with a clear message when the API is not up, instead of 12 timeouts. */
export default async function globalSetup(): Promise<void> {
  const url = `${process.env.API_URL ?? 'http://localhost:8082'}/api/v1/health`;
  try {
    const response = await fetch(url);
    if (response.ok) return;
  } catch {
    // Reported below.
  }
  throw new Error(`La API no responde en ${url}. Levántela desde la rama api_kaffe (docker compose up -d y npm start en api/).`);
}
