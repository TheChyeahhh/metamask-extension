import React, { useCallback } from 'react';
import { ETHSignature } from '@keystonehq/bc-ur-registry-eth';
import * as uuid from 'uuid';
import type { UR } from '@ngraveio/bc-ur';
import BaseReader from '../../base-reader';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { QR_CONFIG } from '../player/player.types';
import type { ReaderProps } from './reader.types';

/**
 * Camera-scanner component for the QR signing flow.
 *
 * Wraps BaseReader in signing mode and validates the scanned QR code by
 * decoding the ETH signature, verifying the request ID matches the pending
 * transaction, and dispatching the serialized response on success.
 *
 * @param props - Component props.
 * @param props.submitQRHardwareSignature - Callback for the serialized signature.
 * @param props.cancelQRHardwareSignRequest - Cancel callback.
 * @param props.requestId - Expected signing request ID.
 * @param props.setErrorTitle - Sets the popover error heading.
 */
const Reader = ({
  submitQRHardwareSignature,
  cancelQRHardwareSignRequest,
  requestId,
  setErrorTitle,
}: ReaderProps) => {
  const t = useI18nContext();

  const handleSuccess = useCallback(
    async (ur: UR) => {
      const ethSignature = ETHSignature.fromCBOR(ur.cbor);
      const buffer = ethSignature.getRequestId();
      const signId = uuid.stringify(buffer as Uint8Array);

      if (signId !== requestId) {
        setErrorTitle(t('QRHardwareInvalidTransactionTitle'));
        throw new Error(t('QRHardwareMismatchedSignId'));
      }

      return await submitQRHardwareSignature({
        type: ur.type,
        cbor: ur.cbor.toString(QR_CONFIG.CBOR_ENCODING),
      });
    },
    [submitQRHardwareSignature, requestId, setErrorTitle, t],
  );

  return (
    <BaseReader
      isReadingWallet={false}
      handleCancel={cancelQRHardwareSignRequest}
      handleSuccess={handleSuccess}
      setErrorTitle={setErrorTitle}
    />
  );
};

export default Reader;
