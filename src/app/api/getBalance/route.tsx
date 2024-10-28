import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const publicKey = body.publicKey;

  const response = await fetch(
    "https://solana-mainnet.g.alchemy.com/v2/srAJSD01EpqiiXJ1T3B6o_d-XizZMvrd",
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getBalance",
        params: [publicKey],
      }),
    }
  );

  const data = await response.json();
  const balance = data.result?.value;
  console.log("request", data);

  return new Response(JSON.stringify({ balance }));
}
