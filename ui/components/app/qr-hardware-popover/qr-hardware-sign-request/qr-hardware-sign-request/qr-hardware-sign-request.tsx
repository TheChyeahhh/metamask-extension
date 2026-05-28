import React, { useCallback, useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import type { SerializedUR } from '@metamask/eth-qr-keyring';
import { completeQrCodeScan } from '../../../../../store/actions';
import Player from '../player';
import Reader from '../reader';
import type { QRHardwareSignRequestProps } from './qr-hardware-sign-request.types';

/**
 * Flow status for the QR hardware signing request.
 *
 * - "play" - the animated QR code is shown for the hardware wallet to scan.
 * - "read" - the camera scanner is active, reading the signed response.
 */
type FlowStatus = 'play' | 'read';

/**
 * Orchestrates the two-phase QR signing flow.
 *
 * In the "play" phase, an animated QR code is displayed via the Player so the
 * user can scan the unsigned transaction with their hardware wallet. In the
 * "read" phase, the camera scanner (Reader) lets the user scan the signed
 * response back. Resets to "play" when the request ID changes.
 *
 * @param props - Component props.
 * @param props.request - The pending QR signing request.
 * @param props.handleCancel - Called when the user cancels.
 * @param props.setErrorTitle - Sets the popover error heading.
 */
const QRHardwareSignRequest = ({
  request,
  handleCancel,
  setErrorTitle,
}: QRHardwareSignRequestProps) => {
  const dispatch = useDispatch();
  const [status, setStatus] = useState<FlowStatus>('play');

  useEffect(() => {
    setStatus('play');
  }, [request.requestId]);

  const toRead = useCallback(() => setStatus('read'), []);

  const handleSuccess = useCallback(
    (response: SerializedUR) => {
      return dispatch(completeQrCodeScan(response));
    },
    [dispatch],
  );

  if (status === 'play') {
    return (
      <Player
        type={request.payload.type}
        cbor={request.payload.cbor}
        cancelQRHardwareSignRequest={handleCancel}
        toRead={toRead}
      />
    );
  }

  return (
    <Reader
      cancelQRHardwareSignRequest={handleCancel}
      submitQRHardwareSignature={handleSuccess}
      requestId={request.requestId}
      setErrorTitle={setErrorTitle}
    />
  );
};

export default QRHardwareSignRequest;
