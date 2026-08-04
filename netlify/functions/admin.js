import { getStore } from "@netlify/blobs";

export default async (req, context) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, x-admin-token",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Content-Type": "application/json"
  };

  if (req.method === "OPTIONS") {
    return new Response("", { status: 200, headers });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action");
    const requestToken = req.headers.get("x-admin-token") || url.searchParams.get("token");
    const adminToken = process.env.ADMIN_TOKEN || "potato_arcade_admin_secret_token_2026";

    if (requestToken !== adminToken) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers
      });
    }

    // --- GET ACTIONS ---

    if (req.method === "GET") {
      if (action === "users") {
        const store = getStore({ name: "potato_arcade_users", consistency: "strong" });
        const list = await store.list();
        const users = {};
        for (const blob of list.blobs) {
          const user = await store.get(blob.key, { type: "json" });
          if (user) {
            users[blob.key] = user;
          }
        }
        return new Response(JSON.stringify(users), { status: 200, headers });
      }
      
      if (action === "scores") {
        const store = getStore({ name: "potato_arcade_leaderboard", consistency: "strong" });
        const list = await store.list();
        const scores = {};
        for (const blob of list.blobs) {
          const data = await store.get(blob.key, { type: "json" });
          if (data) {
            const clientKey = blob.key.replace(/^scores_/, "");
            scores[clientKey] = data;
          }
        }
        return new Response(JSON.stringify(scores), { status: 200, headers });
      }

      return new Response(JSON.stringify({ error: "Invalid GET action" }), { status: 400, headers });
    }

    // --- POST ACTIONS ---

    if (req.method === "POST") {
      if (action === "users_add") {
        const { username, password } = await req.json();
        const cleanUsername = (username || "").trim();
        const cleanPassword = (password || "").trim();

        if (!cleanUsername || !cleanPassword) {
          return new Response(JSON.stringify({ error: "missing_fields" }), { status: 400, headers });
        }
        if (cleanUsername.length < 3) {
          return new Response(JSON.stringify({ error: "username_too_short" }), { status: 400, headers });
        }

        const store = getStore({ name: "potato_arcade_users", consistency: "strong" });
        const key = cleanUsername.toLowerCase();
        const existing = await store.get(key, { type: "json" });
        if (existing) {
          return new Response(JSON.stringify({ error: "username_taken" }), { status: 400, headers });
        }

        const newUser = {
          username: cleanUsername,
          password: cleanPassword,
          registeredAt: Date.now()
        };
        await store.set(key, JSON.stringify(newUser));

        return new Response(JSON.stringify({ username: cleanUsername, role: "player" }), { status: 200, headers });
      }

      if (action === "users_delete") {
        const { username } = await req.json();
        if (!username) {
          return new Response(JSON.stringify({ error: "missing_username" }), { status: 400, headers });
        }

        const store = getStore({ name: "potato_arcade_users", consistency: "strong" });
        const key = username.toLowerCase();
        await store.delete(key);

        return new Response(JSON.stringify({ success: true }), { status: 200, headers });
      }

      if (action === "users_update_password") {
        const { username, password } = await req.json();
        const cleanPassword = (password || "").trim();

        if (!username || !cleanPassword) {
          return new Response(JSON.stringify({ error: "missing_fields" }), { status: 400, headers });
        }

        const store = getStore({ name: "potato_arcade_users", consistency: "strong" });
        const key = username.toLowerCase();
        const user = await store.get(key, { type: "json" });
        if (!user) {
          return new Response(JSON.stringify({ error: "user_not_found" }), { status: 404, headers });
        }

        user.password = cleanPassword;
        await store.set(key, JSON.stringify(user));

        return new Response(JSON.stringify({ success: true }), { status: 200, headers });
      }

      if (action === "scores_delete") {
        const { gameId, difficulty, userId, timestamp } = await req.json();
        if (!gameId || !difficulty || !userId || !timestamp) {
          return new Response(JSON.stringify({ error: "missing_delete_data" }), { status: 400, headers });
        }

        const store = getStore({ name: "potato_arcade_leaderboard", consistency: "strong" });
        const key = `scores_${gameId}_${difficulty}`;
        let list = await store.get(key, { type: "json" }) || [];
        list = list.filter(s => !(s.userId === userId && s.timestamp === timestamp));
        await store.set(key, JSON.stringify(list));

        return new Response(JSON.stringify({ success: true, scores: list }), { status: 200, headers });
      }

      if (action === "scores_clear") {
        const { gameId, difficulty } = await req.json();
        if (!gameId || !difficulty) {
          return new Response(JSON.stringify({ error: "missing_fields" }), { status: 400, headers });
        }

        const store = getStore({ name: "potato_arcade_leaderboard", consistency: "strong" });
        const key = `scores_${gameId}_${difficulty}`;
        await store.set(key, JSON.stringify([]));

        return new Response(JSON.stringify({ success: true }), { status: 200, headers });
      }

      if (action === "database_import") {
        const { users, scores } = await req.json();
        if (!users || !scores) {
          return new Response(JSON.stringify({ error: "invalid_import_data" }), { status: 400, headers });
        }

        // Import users
        const usersStore = getStore({ name: "potato_arcade_users", consistency: "strong" });
        for (const [key, value] of Object.entries(users)) {
          await usersStore.set(key, JSON.stringify(value));
        }

        // Import scores
        const scoresStore = getStore({ name: "potato_arcade_leaderboard", consistency: "strong" });
        for (const [key, value] of Object.entries(scores)) {
          const serverKey = `scores_${key}`;
          await scoresStore.set(serverKey, JSON.stringify(value));
        }

        return new Response(JSON.stringify({ success: true }), { status: 200, headers });
      }

      if (action === "database_reset") {
        // Clear users
        const usersStore = getStore({ name: "potato_arcade_users", consistency: "strong" });
        const usersList = await usersStore.list();
        for (const blob of usersList.blobs) {
          await usersStore.delete(blob.key);
        }

        // Clear scores
        const scoresStore = getStore({ name: "potato_arcade_leaderboard", consistency: "strong" });
        const scoresList = await scoresStore.list();
        for (const blob of scoresList.blobs) {
          await scoresStore.delete(blob.key);
        }

        return new Response(JSON.stringify({ success: true }), { status: 200, headers });
      }

      return new Response(JSON.stringify({ error: "Invalid POST action" }), { status: 400, headers });
    }

    return new Response("Method Not Allowed", { status: 405, headers });
  } catch (error) {
    console.error("Error in admin function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers
    });
  }
};
