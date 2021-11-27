import fetch from "node-fetch";

interface APIResponse {
  status: "error" | "success";
  result: any;
}

interface Clip {
  /**
   * A unique identifier for the clip in the database
   */
  id: number;
  /**
   * A random 5 character long alpha-numeric code identifying the code
   */
  code: string;
  /**
   * The URL value of the clip
   */
  url: string;
  /**
   * A stringified DateTime object of the moment the clip was created
   */
  createdAt: string;
  /**
   * A stringified DateTime object of the moment the clip will expire
   */
  expiresAt: string | null;
  /**
   * An optional ID of the user who first created a clip from this `url`
   */
  ownerID: string | null;
}

interface ClipResponse extends APIResponse {
  result: Clip;
}

export class APIError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "APIError";
  }
}

/**
 * Calls the set API to create a new clip from a link
 * @param url the URL to create the clip from
 */
export const requestClip = async (
  url: string
): Promise<ClipResponse | void> => {
  const clipResponse = await fetch(`/api/clip/set?url=${url}`);
  if (!clipResponse.ok) throw new APIError(await clipResponse.text());
  const clip: ClipResponse = await clipResponse.json();

  return clip;
};

/**
 * Calls the get API to get a clip by its corresponding code
 * @param code the code of the clip
 */
export const getClip = async (
  code: string
): Promise<ClipResponse | void | null> => {
  const clipResponse = await fetch(`/api/clip/get?code=${code}`);
  if (clipResponse.status === 404) return null;
  if (!clipResponse.ok) throw new APIError(await clipResponse.text());
  const clip: ClipResponse = await clipResponse.json();
  return clip;
};
