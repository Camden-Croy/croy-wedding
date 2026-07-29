import {
  handleUpload,
  type HandleUploadBody,
  generateClientTokenFromReadWriteToken,
  put as clientPut,
} from "@vercel/blob/client";
import { put } from "@vercel/blob";
import { getAdminSession } from "@/lib/admin";

/**
 * Client-upload token endpoint for admin story-photo uploads.
 *
 * The browser calls `upload()` (@vercel/blob/client) which POSTs here to get a
 * short-lived client token, then uploads the file straight to Vercel Blob. This
 * bypasses the Server Action 1MB body cap and the 4.5MB serverless request
 * limit, so full-resolution photos upload fine.
 *
 * Authorization is enforced in `onBeforeGenerateToken`: only admins on the
 * ADMIN_EMAILS allowlist can mint an upload token. Requires BLOB_READ_WRITE_TOKEN
 * in the environment.
 */
/**
 * TEMPORARY DIAGNOSTIC. Visit /api/blob/upload in the browser (while signed in
 * as an admin) to server-side upload a tiny test blob using the SAME
 * BLOB_READ_WRITE_TOKEN. Because this runs on the server there is no CORS
 * masking, so the JSON response shows the *real* error if the token/store is
 * misconfigured. Remove once uploads work.
 */
/** Extract the `store_xxx` id embedded in a vercel blob token. */
function parseStoreId(token: string, prefix: string): string | null {
  if (!token.startsWith(prefix)) return null;
  const parts = token.slice(prefix.length).split("_");
  // Store ids look like `store_AbC123`, so the id is the first two segments.
  if (parts[0] === "store" && parts[1]) return `${parts[0]}_${parts[1]}`;
  return parts[0] ?? null;
}

const msg = (e: unknown) => (e instanceof Error ? e.message : String(e));

export async function GET(): Promise<Response> {
  const admin = await getAdminSession();
  if (!admin.isAdmin) {
    return Response.json({ ok: false, error: "Not authorized." }, { status: 401 });
  }

  const rwToken = process.env.BLOB_READ_WRITE_TOKEN ?? "";
  const oidcStoreId = process.env.BLOB_STORE_ID ?? null;
  const rwStoreId = parseStoreId(rwToken, "vercel_blob_rw_");

  const result: Record<string, unknown> = {
    env: {
      rwTokenPresent: Boolean(rwToken),
      rwTokenPrefix: rwToken.slice(0, 24) || null,
      rwStoreId,
      oidcStoreId,
      oidcTokenPresent: Boolean(process.env.VERCEL_OIDC_TOKEN),
      // If these differ, server writes go to one store via OIDC while the
      // browser's client token is signed for another store and gets rejected.
      storeIdsMatch: oidcStoreId ? oidcStoreId === rwStoreId : "no BLOB_STORE_ID/OIDC set",
    },
  };

  // Step 1 — server-side put using default auth (OIDC token if present, else
  // the R/W token). This is what the old diagnostic tested.
  try {
    const blob = await put(`diagnostic/server-${Date.now()}.txt`, "server put test", {
      access: "public",
      addRandomSuffix: true,
      contentType: "text/plain",
    });
    result.serverPut = { ok: true, url: blob.url };
  } catch (error) {
    result.serverPut = { ok: false, error: msg(error) };
  }

  // Step 2 — replicate the BROWSER upload path server-side (no CORS masking):
  // mint a client token from the R/W token exactly like handleUpload does, then
  // PUT to the Blob API with it. If this fails, the message is the *real* error
  // the browser can't show because the error response carries no CORS header.
  try {
    const clientToken = await generateClientTokenFromReadWriteToken({
      token: rwToken,
      pathname: "diagnostic/client-token-test.txt",
      addRandomSuffix: true,
      allowedContentTypes: ["image/*", "text/plain"],
      maximumSizeInBytes: 50 * 1024 * 1024,
    });
    result.clientTokenStoreId = parseStoreId(clientToken, "vercel_blob_client_");
    try {
      const blob = await clientPut("diagnostic/client-token-test.txt", "client token test", {
        access: "public",
        token: clientToken,
        contentType: "text/plain",
      });
      result.clientTokenPut = { ok: true, url: blob.url };
    } catch (error) {
      result.clientTokenPut = { ok: false, error: msg(error) };
    }
  } catch (error) {
    result.clientTokenGeneration = { ok: false, error: msg(error) };
  }

  return Response.json(result);
}

export async function POST(request: Request): Promise<Response> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      request,
      body,
      onBeforeGenerateToken: async () => {
        const admin = await getAdminSession();
        if (!admin.isAdmin) {
          throw new Error("Not authorized to upload.");
        }
        return {
          // Wildcard so any image subtype is accepted (phone photos report a
          // range of MIME types: image/jpeg, image/heic, image/heif, etc.). A
          // stricter allowlist rejects the upload at the Blob API, and that
          // error response carries no CORS header — so it surfaces in the
          // browser as a misleading CORS error instead of "type not allowed".
          allowedContentTypes: ["image/*"],
          addRandomSuffix: true,
          maximumSizeInBytes: 50 * 1024 * 1024, // 50MB per photo
        };
      },
      // No post-upload bookkeeping needed: the DB row is written by the
      // create/update Server Action once the client has the blob URL.
      onUploadCompleted: async () => {},
    });

    return Response.json(jsonResponse);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Upload failed." },
      { status: 400 },
    );
  }
}
