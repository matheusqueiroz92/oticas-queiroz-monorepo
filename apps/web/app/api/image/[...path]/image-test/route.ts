export async function GET() {
    return new Response("Endpoint funcionando!", {
      headers: {
        "Content-Type": "text/plain",
      },
    });
  }