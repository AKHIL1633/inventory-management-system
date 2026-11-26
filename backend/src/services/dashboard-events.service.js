
const clients = new Set();

export const addDashboardClient = (res) => {
  clients.add(res);

  console.log(
    `Dashboard SSE client connected. Active clients: ${clients.size}`
  );

  res.on("close", () => {
    clients.delete(res);

    console.log(
      `Dashboard SSE client disconnected. Active clients: ${clients.size}`
    );
  });
};

export const broadcastDashboardUpdate = (event) => {
  const payload = `data: ${JSON.stringify(event)}\n\n`;

  for (const client of clients) {
    if (client.writableEnded || client.destroyed) {
      clients.delete(client);
      continue;
    }

    client.write(payload);
  }
};
