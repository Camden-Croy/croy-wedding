<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Dev server

The developer runs the dev server themselves on **http://localhost:3000**. It is long-running and owned by the human.

- DO NOT start, restart, or launch the dev server (`npm run dev` / `next dev`). Never start it on another port (3001, etc.).
- DO NOT kill or fight the process on port 3000.
- If you need something confirmed in the running app (rendered output, a live request, whether a change took effect), ASK the developer to check on localhost:3000 and report back. Do not spin up your own server to verify.
- After changing anything that requires a server reload to take effect (e.g. regenerating the Prisma client, changing env vars, schema/config changes), tell the developer to restart their dev server rather than doing it yourself.
- `npm run build` and `npm run lint` for verification are fine.
