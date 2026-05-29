import React, { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import type { UR } from '@ngraveio/bc-ur';
import { completeQrCodeScan } from '../../../../store/actions';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { QR_CONFIG } from '../qr-hardware-sign-request';
import BaseReader from '../base-reader';
import type { QRHardwareWalletImporterProps } from './qr-hardware-wallet-importer.types';

/**
 * Camera-scanner component for the QR wallet import (pairing) flow.
 *
 * Wraps BaseReader in wallet-reading mode and dispatches the scanned QR code
 * data for account import. If the dispatch fails, it surfaces the error to
 * the user through the popover heading.
 *
 * @param props - Component props.
 * @param props.handleCancel - Called when the user cancels the wallet import.
 * @param props.setErrorTitle - Sets the popover title to an error heading.
 */
const QRHardwareWalletImporter = ({
  handleCancel,
  setErrorTitle,
}: QRHardwareWalletImporterProps) => {
  const t = useI18nContext();
  const dispatch = useDispatch();

  const handleSuccess = useCallback(
    async (ur: UR) => {
      try {
        await dispatch(
          completeQrCodeScan({
            type: ur.type,
            cbor: ur.cbor.toString(QR_CONFIG.CBOR_ENCODING),
          }),
        );
      } catch (error) {
        setErrorTitle(t('QRHardwareUnknownQRCodeTitle'));
        throw error;
      }
    },
    [dispatch, setErrorTitle, t],
  );

  return (
    <BaseReader
      isReadingWallet
      handleCancel={handleCancel}
      handleSuccess={handleSuccess}
      setErrorTitle={setErrorTitle}
    />
  );
};

export default QRHardwareWalletImporter;
