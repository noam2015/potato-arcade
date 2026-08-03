import { getStore } from "@netlify/blobs";

export const handler = async (event, context) => {
  // הגדרת כותרות לתמיכה בבקשות מכל מקור (CORS)
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Content-Type": "application/json"
  };

  // טיפול בבקשות OPTIONS (בדיקה מקדימה של הדפדפן)
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  try {
    // התחברות לאחסון הנתונים המובטח של נטליפיי
    const store = getStore("potato_arcade_leaderboard");

    // קריאת תוצאות (GET)
    if (event.httpMethod === "GET") {
      const gameId = event.queryStringParameters.gameId;
      const difficulty = event.queryStringParameters.difficulty || "medium";

      if (!gameId) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing gameId" }) };
      }

      const key = `scores_${gameId}_${difficulty}`;
      const data = await store.get(key, { type: "json" }) || [];
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(data)
      };
    }

    // כתיבת תוצאה חדשה (POST)
    if (event.httpMethod === "POST") {
      const { gameId, score, username, difficulty } = JSON.parse(event.body || "{}");
      const diff = difficulty || "medium";

      if (!gameId || score === undefined || !username) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing parameters" }) };
      }

      const key = `scores_${gameId}_${diff}`;
      const currentScores = await store.get(key, { type: "json" }) || [];

      // עדכון התוצאה של המשתמש אם היא טובה יותר
      const existingUserIdx = currentScores.findIndex(s => s.userId === username);
      if (existingUserIdx !== -1) {
        if (currentScores[existingUserIdx].score >= score) {
          // התוצאה הקיימת טובה או שווה, אין צורך לעדכן
          return { statusCode: 200, headers, body: JSON.stringify(currentScores) };
        }
        currentScores.splice(existingUserIdx, 1);
      }

      currentScores.push({ userId: username, score, timestamp: Date.now() });
      currentScores.sort((a, b) => b.score - a.score);
      
      // שמירה של 10 השיאים הגבוהים בלבד
      const topScores = currentScores.slice(0, 10);
      await store.set(key, JSON.stringify(topScores));

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(topScores)
      };
    }

    return { statusCode: 405, headers, body: "Method Not Allowed" };
  } catch (error) {
    console.error("Error in leaderboard function:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
