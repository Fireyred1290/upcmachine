export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Home page / basic test
    if (url.pathname === "/") {
      return new Response(
        "UPC Machine API is working. Use /search?prefix=030768"
      );
    }

    // UPC prefix search
    if (url.pathname === "/search") {
      const prefix = url.searchParams.get("prefix") || "";

      if (!/^\d{4,}$/.test(prefix)) {
        return new Response(
          JSON.stringify({
            error: "Enter at least 4 digits."
          }),
          {
            status: 400,
            headers: {
              "content-type": "application/json"
            }
          }
        );
      }

      const page = Math.max(
        1,
        Number(url.searchParams.get("page") || 1)
      );

      const limit = 100;
      const offset = (page - 1) * limit;
      const pattern = prefix + "%";

      const countResult = await env.UPCMACHINE
        .prepare(
          "SELECT COUNT(*) AS total FROM products WHERE upc LIKE ?"
        )
        .bind(pattern)
        .first();

      const results = await env.UPCMACHINE
        .prepare(
          `SELECT upc, name
           FROM products
           WHERE upc LIKE ?
           ORDER BY upc
           LIMIT ? OFFSET ?`
        )
        .bind(pattern, limit, offset)
        .all();

      return new Response(
        JSON.stringify({
          prefix,
          total: countResult?.total || 0,
          page,
          per_page: limit,
          results: results.results || []
        }),
        {
          headers: {
            "content-type": "application/json",
            "access-control-allow-origin": "*"
          }
        }
      );
    }

    return new Response("Not found", { status: 404 });
  }
};
