import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, UpdateCommand, QueryCommand, GetCommand } from "@aws-sdk/lib-dynamodb";

const TABLE = process.env.DDB_TABLE;
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: process.env.AWS_REGION }), { marshallOptions: { removeUndefinedValues: true } });

export async function getConversationById(conversationId) {
  const pk = `CONV#${conversationId}`;
  const { Item } = await ddb.send(new GetCommand({ TableName: TABLE, Key: { pk, sk: "CONV" } }));
  return Item || null;
}

export async function upsertConversationForTelegram(chatId, userName) {
  // lookup via GSI3
  const gsi = await ddb.send(new QueryCommand({
    TableName: TABLE,
    IndexName: "gsi3",
    KeyConditionExpression: "gsi3pk = :g AND gsi3sk = :s",
    ExpressionAttributeValues: { ":g": `TG#${chatId}`, ":s": "CONV" },
    Limit: 1
  }));
  if (gsi.Items?.length) return gsi.Items[0];

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const item = {
    pk: `CONV#${id}`,
    sk: "CONV",
    type: "CONVERSATION",
    telegram_chat_id: String(chatId),
    user_name: userName || "",
    status: "AI",
    current_agent_id: null,
    started_at: now,
    last_active: now,
    gsi1pk: "STATUS#AI",
    gsi1sk: now,
    gsi3pk: `TG#${chatId}`,
    gsi3sk: "CONV",
  };
  await ddb.send(new PutCommand({ TableName: TABLE, Item: item }));
  return item;
}

export async function appendMessage(conversationId, msg) {
  const now = new Date().toISOString();
  const pk = `CONV#${conversationId}`;
  const item = {
    pk,
    sk: `MSG#${now}#${crypto.randomUUID()}`,
    type: "MESSAGE",
    sender_type: msg.sender_type,
    content: msg.content,
    telegram_message_id: msg.telegram_message_id,
    created_at: now,
  };
  await ddb.send(new PutCommand({ TableName: TABLE, Item: item }));
  // bump last_active
  await ddb.send(new UpdateCommand({
    TableName: TABLE,
    Key: { pk, sk: "CONV" },
    UpdateExpression: "SET last_active = :now, gsi1sk = :now",
    ExpressionAttributeValues: { ":now": now }
  }));
  return item;
}

export async function setStatus(conversationId, status, agentId = null) {
  const pk = `CONV#${conversationId}`;
  const now = new Date().toISOString();

  // Always update these
  const exprNames = { "#s": "status" };
  const exprValues = {
    ":status": status,
    ":gpk": `STATUS#${status}`,
    ":now": now
  };

  const setParts = ["#s = :status", "gsi1pk = :gpk", "gsi1sk = :now", "last_active = :now"];
  const removeParts = [];

  switch (status) {
    case "HUMAN":
      // assign agent
      setParts.push("current_agent_id = :agent");
      exprValues[":agent"] = agentId; // include only when used
      break;

    case "AI":
      // clear ownership when handing back to AI
      removeParts.push("current_agent_id");
      break;

    case "WAITING":
      // waiting queue should not have an active agent assigned
      removeParts.push("current_agent_id");
      break;

    case "CLOSED":
      // mark end time and clear any ownership
      setParts.push("ended_at = :now");
      removeParts.push("current_agent_id");
      break;

    default:
      // no-op – but still legal; do nothing extra
      break;
  }

  const updateExpression =
    `SET ${setParts.join(", ")}${removeParts.length ? " REMOVE " + removeParts.join(", ") : ""}`;

  await ddb.send(new UpdateCommand({
    TableName: TABLE,
    Key: { pk, sk: "CONV" },
    UpdateExpression: updateExpression,
    ExpressionAttributeNames: exprNames,
    ExpressionAttributeValues: exprValues,
  }));
}

export async function findConversationByTelegramChatId(chatId) {
  const q = await ddb.send(new QueryCommand({
    TableName: TABLE,
    IndexName: "gsi3",
    KeyConditionExpression: "gsi3pk = :g AND gsi3sk = :s",
    ExpressionAttributeValues: { ":g": `TG#${chatId}`, ":s": "CONV" },
    Limit: 1
  }));
  return q.Items?.[0] || null;
}

/** List conversations by status with pagination */
export async function listConversationsByStatus(status, limit = 20, nextKey) {
  const resp = await ddb.send(new QueryCommand({
    TableName: TABLE,
    IndexName: "gsi1",
    KeyConditionExpression: "gsi1pk = :pk",
    ExpressionAttributeValues: { ":pk": `STATUS#${status}` },
    Limit: limit,
    ScanIndexForward: false,
    ExclusiveStartKey: nextKey || undefined,
  }));
  return { items: resp.Items || [], nextKey: resp.LastEvaluatedKey || null };
}

/** Get messages for a conversation (timeline) */
export async function getConversationMessages(conversationId, limit = 50, nextKey) {
  const resp = await ddb.send(new QueryCommand({
    TableName: TABLE,
    KeyConditionExpression: "pk = :pk AND begins_with(sk, :msg)",
    ExpressionAttributeValues: { ":pk": `CONV#${conversationId}`, ":msg": "MSG#" },
    Limit: limit,
    ScanIndexForward: false,
    ExclusiveStartKey: nextKey || undefined,
  }));
  return { items: resp.Items || [], nextKey: resp.LastEvaluatedKey || null };
}

/** Get conversation header */
export async function getConversationHeader(conversationId) {
  const resp = await ddb.send(new QueryCommand({
    TableName: TABLE,
    KeyConditionExpression: "pk = :pk AND sk = :sk",
    ExpressionAttributeValues: { ":pk": `CONV#${conversationId}`, ":sk": "CONV" },
    Limit: 1
  }));
  return resp.Items?.[0] || null;
}
