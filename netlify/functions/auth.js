import { getStore } from "@netlify/blobs";

export const handler = async (event, context) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json"
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers, body: "Method Not Allowed" };
  }

  try {
    const { action, username, password } = JSON.parse(event.body || "{}");
    const cleanUsername = (username || "").trim();
    const cleanPassword = (password || "").trim();

    if (!cleanUsername || !cleanPassword) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "נא למלא את כל השדות" }) };
    }

    const store = getStore("potato_arcade_users");
    const key = cleanUsername.toLowerCase();

    if (action === "register") {
      if (cleanUsername.length < 3) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: "שם המשתמש חייב להיות לפחות 3 תווים" }) };
      }
      
      const existingUser = await store.get(key, { type: "json" });
      if (existingUser) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: "שם המשתמש כבר תפוס" }) };
      }

      const newUser = {
        username: cleanUsername,
        password: cleanPassword,
        registeredAt: Date.now()
      };

      await store.set(key, JSON.stringify(newUser));

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ username: cleanUsername, role: "player" })
      };
    } else if (action === "login") {
      const user = await store.get(key, { type: "json" });
      if (!user) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: "שם המשתמש אינו קיים" }) };
      }
      if (user.password !== cleanPassword) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: "סיסמה שגויה" }) };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ username: user.username, role: "player" })
      };
    }

    return { statusCode: 400, headers, body: JSON.stringify({ error: "פעולה לא תקינה" }) };
  } catch (error) {
    console.error("Error in auth function:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
