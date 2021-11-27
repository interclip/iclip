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

interface APIResponse {
  status: "error" | "success";
  result: any;
}

interface SetGetResponse extends APIResponse {
  result: string;
}

export { SetGetResponse, Clip };
