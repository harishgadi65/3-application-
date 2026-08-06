/**
 * Publishes a JSON-serializable body to a STOMP destination.
 *
 * @param {import('@stomp/stompjs').Client} client
 * @param {string} destination
 * @param {any} body
 */
export function publish(client, destination, body) {
  if (!client) return;
  client.publish({
    destination,
    body: JSON.stringify(body),
  });
}

export default publish;
