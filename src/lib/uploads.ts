// lib/uploads.ts
import api from "@/lib/api";

type CreateResp = { bucket: string; key: string; upload_id: string; part_size: number };
type SignResp = { url: string };

export async function createMultipart(sourceId: string, file: File): Promise<CreateResp> {
  const { data } = await api.post("/uploads/multipart/create", {
    source_id: sourceId,
    filename: file.name,
    content_type: file.type || "application/octet-stream",
    size_bytes: file.size,
  });
  return data;
}

async function signPart(key: string, uploadId: string, partNumber: number): Promise<string> {
  const { data } = await api.post<SignResp>("/uploads/multipart/sign-part", {
    key,
    upload_id: uploadId,
    part_number: partNumber,
  });
  return data.url;
}

async function completeMultipart(
  key: string,
  uploadId: string,
  parts: { ETag: string; PartNumber: number }[]
) {
  await api.post("/uploads/multipart/complete", { key, upload_id: uploadId, parts });
}

function putWithProgress(
  url: string,
  blob: Blob,
  onProgress: (loaded: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    // NU seta Content-Type — URL-ul semnat nu-l așteaptă.
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(e.loaded);
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const etag = xhr.getResponseHeader("ETag");
        if (!etag) return reject(new Error("Missing ETag header"));
        resolve(etag.replaceAll('"', ""));
      } else {
        reject(new Error(`S3 part upload failed (${xhr.status})`));
      }
    };
    xhr.onerror = () => reject(new Error("Network error uploading part"));
    xhr.send(blob);
  });
}

export async function uploadFileMultipart(
  sourceId: string,
  file: File,
  opts?: { onProgress?: (sent: number, total: number) => void; concurrency?: number }
): Promise<{ key: string }> {
  const { key, upload_id, part_size } = await createMultipart(sourceId, file);

  const total = file.size;
  const partSize = part_size;
  const partCount = Math.ceil(total / partSize);
  const concurrency = Math.min(opts?.concurrency ?? 4, partCount);

  const partsMeta = Array.from({ length: partCount }, (_, i) => {
    const partNumber = i + 1;
    const start = i * partSize;
    const end = Math.min(start + partSize, total);
    return { partNumber, start, end };
  });

  const partLoaded = new Array<number>(partCount).fill(0);
  const report = () => {
    if (!opts?.onProgress) return;
    const sent = partLoaded.reduce((a, b) => a + b, 0);
    opts.onProgress(sent, total);
  };

  let nextIndex = 0;
  const results: { ETag: string; PartNumber: number }[] = [];

  async function worker() {
    while (true) {
      const idx = nextIndex++;
      if (idx >= partsMeta.length) break;

      const { partNumber, start, end } = partsMeta[idx];
      const blob = file.slice(start, end);

      const url = await signPart(key, upload_id, partNumber);
      const etag = await putWithProgress(url, blob, (loaded) => {
        partLoaded[partNumber - 1] = Math.min(loaded, blob.size);
        report();
      });

      results.push({ ETag: etag, PartNumber: partNumber });
      partLoaded[partNumber - 1] = blob.size;
      report();
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  results.sort((a, b) => a.PartNumber - b.PartNumber);

  await completeMultipart(key, upload_id, results);
  return { key };
}

export async function enqueueIngest(
  sourceId: string,
  key: string,
  contentType: string,
  originalName: string
) {
  await api.post("/uploads/ingest", {
    source_id: sourceId,
    s3_key: key,
    content_type: contentType,
    original_name: originalName,
  });
}

export type UploadStatus = {
  phase: "queued" | "processing" | "done" | "error";
  processed_pages: number;
  total_pages: number | null;
  preview_url?: string | null;
  last_error?: string | null;
};

export async function getUploadStatus(sourceId: string): Promise<UploadStatus> {
  const { data } = await api.get(`/uploads/status/${sourceId}`);
  return data;
}
