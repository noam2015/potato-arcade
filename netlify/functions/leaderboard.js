import { getStore } from "@netlify/blobs";

export default async (req, context) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Content-Type": "application/json"
  };

  if (req.method === "OPTIONS") {
    return new Response("", { status: 200, headers });
  }

  try {
    const store = getStore("potato_arcade_leaderboard");

    // קריאת תוצאות (GET)
    if (req.method === "GET") {
      const url = new URL(req.url);
      const gameId = url.searchParams.get("gameId");
      const difficulty = url.searchParams.get("difficulty") || "medium";

      if (!gameId) {
        return new Response(JSON.stringify({ error: "Missing gameId" }), {
          status: 400,
          headers
        });
      }

      const key = `scores_${gameId}_${difficulty}`;
      const data = await store.get(key, { type: "json" }) || [];
      
      return new Response(JSON.stringify(data), {
        status: 200,
        headers
      });
    }

    // כתיבת תוצאה חדשה (POST)
    if (req.method === "POST") {
      const { gameId, score, username, difficulty } = await req.json();
      const diff = difficulty || "medium";

      if (!gameId || score === undefined || !username) {
        return new Response(JSON.stringify({ error: "Missing parameters" }), {
          status: 400,
          headers
        });
      }

      const key = `scores_${gameId}_${diff}`;
      const currentScores = await store.get(key, { type: "json" }) || [];

      // עדכון התוצאה של המשתמש אם היא טובה יותר
      const existingUserIdx = currentScores.findIndex(s => s.userId === username);
      if (existingUserIdx !== -1) {
        if (currentScores[existingUserIdx].score >= score) {
          return new Response(JSON.stringify(currentScores), {
            status: 200,
            headers
          });
        }
        currentScores.splice(existingUserIdx, 1);
      }

      currentScores.push({ userId: username, score, timestamp: Date.now() });
      currentScores.sort((a, b) => b.score - a.score);
      
      // שמירה של 10 השיאים הגבוהים בלבד
      const topScores = currentScores.slice(0, 10);
      await store.set(key, JSON.stringify(topScores));

      return new Response(JSON.stringify(topScores), {
        status: 200,
        headers
      });
    }

    return new Response("Method Not Allowed", { status: 405, headers });
  } catch (error) {
    console.error("Error in leaderboard function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers
    });
  }
};
