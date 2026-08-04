
// מפתח ציבורי ייחודי עבור הפרויקט שלך לשמירת הנתונים
const STORE_URL = "https://kvstore.dev/api/potato_arcade_leaderboard_v1";

export const handler = async (event, context) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Content-Type": "application/json"
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  try {
    // 1. קבלת כל הנתונים השמורים
    let allData = {};
    try {
      const getRes = await fetch(STORE_URL);
      if (getRes.ok) {
        allData = await getRes.json();
      }
    } catch (e) {
      console.warn("Database is empty or newly created.");
    }

    // קריאת תוצאות (GET)
    if (event.httpMethod === "GET") {
      const gameId = event.queryStringParameters.gameId;
      const difficulty = event.queryStringParameters.difficulty || "medium";

      if (!gameId) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing gameId" }) };
      }

      const key = `scores_${gameId}_${difficulty}`;
      const data = allData[key] || [];
      
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
      const currentScores = allData[key] || [];

      // עדכון התוצאה של המשתמש אם היא טובה יותר
      const existingUserIdx = currentScores.findIndex(s => s.userId === username);
      if (existingUserIdx !== -1) {
        if (currentScores[existingUserIdx].score >= score) {
          return { statusCode: 200, headers, body: JSON.stringify(currentScores) };
        }
        currentScores.splice(existingUserIdx, 1);
      }

      currentScores.push({ userId: username, score, timestamp: Date.now() });
      currentScores.sort((a, b) => b.score - a.score);
      
      // שמירה של 10 השיאים הגבוהים בלבד
      allData[key] = currentScores.slice(0, 10);

      // שמירה חזרה למסד הנתונים
      await fetch(STORE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(allData)
      });

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(allData[key])
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
