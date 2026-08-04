const STORE_URL = "https://kvstore.dev/api/potato_arcade_users_v1";

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

    // 1. קריאת המשתמשים הקיימים מהענן
    let users = {};
    try {
      const getRes = await fetch(`${STORE_URL}?t=${Date.now()}`);
      if (getRes.ok) {
        users = await getRes.json();
      }
    } catch (e) {
      console.warn("Database is empty or newly created.");
    }

    const key = cleanUsername.toLowerCase();

    // 2. ביצוע הפעולה המבוקשת (הרשמה או התחברות)
    if (action === "register") {
      if (cleanUsername.length < 3) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: "שם המשתמש חייב להיות לפחות 3 תווים" }) };
      }
      if (users[key]) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: "שם המשתמש כבר תפוס" }) };
      }

      // הוספת משתמש חדש
      users[key] = {
        username: cleanUsername, // שמירה על אותיות גדולות/קטנות מקוריות
        password: cleanPassword,
        registeredAt: Date.now()
      };

      // שמירה חזרה לענן
      await fetch(STORE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(users)
      });

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ username: cleanUsername, role: "player" })
      };
    } else if (action === "login") {
      if (!users[key]) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: "שם המשתמש אינו קיים" }) };
      }
      if (users[key].password !== cleanPassword) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: "סיסמה שגויה" }) };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ username: users[key].username, role: "player" })
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
