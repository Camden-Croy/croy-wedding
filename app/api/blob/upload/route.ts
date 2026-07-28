import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
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
