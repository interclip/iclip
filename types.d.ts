
type UploadActionType = "media" | "document" | "camera";

interface Clip {
  /**
   * A 5+ character long alpha-numeric code identifying the code. It is immutable and will not change, ever.
   */
  code: string;
  /**
   * Indicates the length of the `code` that should be presented to a user
   */
  hashLength: number;
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
  expiresAt: string;
  /**
   * An object which stores all info for the OEmbed preview to work
   */
  oembed?: any;
}

interface ErrorResponse {
  status: "error";
  /**
   * The error message to be displayed
   */
  result: string;
  code?: number;
}

interface SuccessResponse<T> {
  status: "success";
  result: T;
}

declare module 'simple-xml-to-json' {
  //@ts-ignore
  export const convertXML = (_value: string): any => any;
}

type ClipData = ErrorResponse | SuccessResponse<Clip>;
