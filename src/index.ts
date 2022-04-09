import fetch from "node-fetch";

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
  url: string, endpoint: string
): Promise<ClipData> => {
  const clipResponse = await fetch(`${endpoint}/api/clip/set?url=${url}`);
  if (!clipResponse.ok) throw new APIError(await clipResponse.text());
  const clip: ClipData = await clipResponse.json();

  return clip;
};

/**
 * Calls the get API to get a clip by its corresponding code
 * @param code the code of the clip
 */
export const getClip = async (
  code: string,
  endpoint: string
): Promise<ClipData | null> => {
  const clipResponse = await fetch(`${endpoint}/api/clip/get?code=${code}`);
  if (clipResponse.status === 404) return null;
  if (!clipResponse.ok) throw new APIError(await clipResponse.text());
  const clip: ClipData = await clipResponse.json();
  return clip;
};
