import { getStore } from "@netlify/blobs";

export default async (req, context) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json"
  };

  if (req.method === "OPTIONS") {
    return new Response("", { status: 200, headers });
  }

  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405, headers });
  }

  try {
    const { action, username, password } = await req.json();
    const cleanUsername = (username || "").trim();
    const cleanPassword = (password || "").trim();

    if (!cleanUsername || !cleanPassword) {
      return new Response(JSON.stringify({ error: "נא למלא את כל השדות" }), {
        status: 400,
        headers
      });
    }

    const store = getStore("potato_arcade_users");
    const key = cleanUsername.toLowerCase();

    if (action === "register") {
      if (cleanUsername.length < 3) {
        return new Response(JSON.stringify({ error: "שם המשתמש חייב להיות לפחות 3 תווים" }), {
          status: 400,
          headers
        });
      }

      let existingUser = null;
      try {
        existingUser = await store.get(key, { type: "json" });
      } catch (e) {
        console.warn("Corrupt user data found during check, ignoring and letting overwrite:", e);
      }

      if (existingUser) {
        return new Response(JSON.stringify({ error: "שם המשתמש כבר תפוס" }), {
          status: 400,
          headers
        });
      }

      const newUser = {
        username: cleanUsername,
        password: cleanPassword,
        registeredAt: Date.now()
      };

      await store.set(key, JSON.stringify(newUser));

      return new Response(JSON.stringify({ username: cleanUsername, role: "player" }), {
        status: 200,
        headers
      });
    } else if (action === "login") {
      let user = null;
      try {
        user = await store.get(key, { type: "json" });
      } catch (e) {
        console.warn("Corrupt user data found during login, treating as non-existent:", e);
      }

      if (!user) {
        return new Response(JSON.stringify({ error: "שם המשתמש אינו קיים" }), {
          status: 400,
          headers
        });
      }
      if (user.password !== cleanPassword) {
        return new Response(JSON.stringify({ error: "סיסמה שגויה" }), {
          status: 400,
          headers
        });
      }

      return new Response(JSON.stringify({ username: user.username, role: "player" }), {
        status: 200,
        headers
      });
    }

    return new Response(JSON.stringify({ error: "פעולה לא תקינה" }), {
      status: 400,
      headers
    });
  } catch (error) {
    console.error("Error in auth function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers
    });
  }
};
