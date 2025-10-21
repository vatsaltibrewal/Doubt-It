import {
  listConversationsByStatus,
  getConversationMessages,
  getConversationHeader
} from "../lib/dbHelper.js";

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: process.env.AWS_REGION }));
const TABLE = process.env.DDB_TABLE;

export async function getConversations(req, res) {
  try {
    const { status = "WAITING", limit = "20" } = req.query;
    const nextKey = req.query.nextKey ? JSON.parse(req.query.nextKey) : undefined;
    const out = await listConversationsByStatus(status, Number(limit), nextKey);
    res.status(200).send(out);
  } catch (e) {
    console.error("getConversations error:", e);
    res.status(500).send({ message: "Failed to list conversations" });
  }
}

export async function getConversationDetail(req, res) {
  try {
    const { id } = req.params;
    const limit = Number(req.query.limit || "50");
    const nextKey = req.query.nextKey ? JSON.parse(req.query.nextKey) : undefined;

    const [header, msgs] = await Promise.all([
      getConversationHeader(id),
      getConversationMessages(id, limit, nextKey),
    ]);
    if (!header) return res.status(404).send({ message: "Not found" });

    res.status(200).send({ header, messages: msgs.items, nextKey: msgs.nextKey });
  } catch (e) {
    console.error("getConversationDetail error:", e);
    res.status(500).send({ message: "Failed to load conversation" });
  }
}

export async function getDashboardStats(req, res) {
  try {
    const now = new Date();
    const since24h = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

    const countByStatus = async (status) => {
      const resp = await ddb.send(new QueryCommand({
        TableName: TABLE,
        IndexName: "gsi1",
        KeyConditionExpression: "gsi1pk = :pk",
        ExpressionAttributeValues: { ":pk": `STATUS#${status}` },
        Select: "COUNT",
      }));
      return resp.Count || 0;
    };

    const countByStatusSince = async (status, sinceIso) => {
      const resp = await ddb.send(new QueryCommand({
        TableName: TABLE,
        IndexName: "gsi1",
        KeyConditionExpression: "gsi1pk = :pk AND gsi1sk >= :since",
        ExpressionAttributeValues: { ":pk": `STATUS#${status}`, ":since": sinceIso },
        Select: "COUNT",
      }));
      return resp.Count || 0;
    };

    const [waitingNow, openNow, aiNow, closed24h] = await Promise.all([
      countByStatus("WAITING"),
      countByStatus("HUMAN"),
      countByStatus("AI"),
      countByStatusSince("CLOSED", since24h),
    ]);

    // Top agents with open (HUMAN) conversations — limit read to 200 items for speed
    const openSlice = await ddb.send(new QueryCommand({
      TableName: TABLE,
      IndexName: "gsi1",
      KeyConditionExpression: "gsi1pk = :pk",
      ExpressionAttributeValues: { ":pk": "STATUS#HUMAN" },
      ProjectionExpression: "current_agent_id, pk, last_active",
      ScanIndexForward: false,
      Limit: 200,
    }));
    const byAgent = {};
    (openSlice.Items || []).forEach((i) => {
      const a = i.current_agent_id;
      if (a) byAgent[a] = (byAgent[a] || 0) + 1;
    });
    const topAgents = Object.entries(byAgent)
      .map(([agent, count]) => ({ agent, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Recent WAITING (to show in a list)
    const recentWaitingQ = await ddb.send(new QueryCommand({
      TableName: TABLE,
      IndexName: "gsi1",
      KeyConditionExpression: "gsi1pk = :pk",
      ExpressionAttributeValues: { ":pk": "STATUS#WAITING" },
      ScanIndexForward: false,
      Limit: 10,
      ProjectionExpression: "pk, user_name, last_active",
    }));
    const recentWaiting = (recentWaitingQ.Items || []).map((i) => ({
      id: i.pk.split("#")[1],
      user_name: i.user_name || "",
      last_active: i.last_active,
    }));

    res.status(200).send({
      waitingNow,
      openNow,
      aiNow,
      closed24h,
      topAgents,
      recentWaiting,
      generatedAt: now.toISOString(),
    });
  } catch (e) {
    console.error("getDashboardStats error:", e);
    res.status(500).send({ message: "Failed to compute stats" });
  }
}