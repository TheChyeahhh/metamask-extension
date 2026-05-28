/** Props for the Player component. */
export type PlayerProps = {
  /** UR type identifier, e.g. "eth-sign-request". */
  type: string;
  /** Hex-encoded CBOR payload to embed in the QR code. */
  cbor: string;
  /** Called when the user cancels the QR signing request. */
  cancelQRHardwareSignRequest: () => void;
  /** Advances the flow to the camera scan phase. */
  toRead: () => void;
};

/** QR code configuration constants for the animated Player display. */
export const QR_CONFIG = {
  /** Maximum size in bytes of each UR fragment. */
  FRAGMENT_SIZE: 200,
  /** Interval in milliseconds between QR code frame rotations. */
  REFRESH_RATE: 200,
  /** Pixel size of the rendered QR code SVG. */
  CODE_SIZE: 225,
} as const;
