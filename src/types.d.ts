interface APIResponse {
  status: "error" | "success";
  result: string;
}

/* Todo(ft): add after Interclip v5.0 release
interface ClipResponse extends APIResponse {
  result: Clip;
}

interface Clip {
  id: number;
  code: string;
  url: string;
  createdAt: Date;
  expiresAt: Date | null;
  ownerID: string | null;
}
*/
