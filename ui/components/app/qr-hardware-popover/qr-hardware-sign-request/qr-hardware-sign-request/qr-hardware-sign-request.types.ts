import type { QrSignatureRequest } from '@metamask/eth-qr-keyring';

/** Props for the QRHardwareSignRequest component. */
export type QRHardwareSignRequestProps = {
  /** The pending QR signing request with the UR payload and request ID. */
  request: QrSignatureRequest;
  /** Called when the user cancels the signing flow. */
  handleCancel: () => void;
  /** Sets the popover title to an error-specific heading. */
  setErrorTitle: (title: string) => void;
};
