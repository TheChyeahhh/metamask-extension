import React, { useCallback, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { providerErrors, serializeError } from '@metamask/rpc-errors';
import { QrScanRequestType } from '@metamask/eth-qr-keyring';
import { getActiveQrCodeScanRequest } from '../../../selectors';
import Popover from '../../ui/popover';
import {
  cancelTx,
  rejectPendingApproval,
  cancelQrCodeScan,
} from '../../../store/actions';
import { getEnvironmentType } from '../../../../shared/lib/environment-type';
import {
  ENVIRONMENT_TYPE_POPUP,
  ENVIRONMENT_TYPE_SIDEPANEL,
} from '../../../../shared/constants/app';
import type { ConfirmTransactionSlice } from './qr-hardware-popover.types';
import QRHardwareWalletImporter from './qr-hardware-wallet-importer';
import QRHardwareSignRequest from './qr-hardware-sign-request';

/**
 * Top-level popover that hosts QR-based hardware wallet flows.
 *
 * Renders one of two child components depending on the active scan request:
 * - PAIR: QRHardwareWalletImporter (camera scanner for wallet import)
 * - SIGN: QRHardwareSignRequest (animated QR display then camera scanner)
 *
 * In restricted environments (popup, side panel), PAIR requests are suppressed
 * because they are always handled in a fullscreen tab.
 */
const QRHardwarePopover = () => {
  const activeScanRequest = useSelector(getActiveQrCodeScanRequest);

  const environmentType = getEnvironmentType();
  const isRestrictedEnv =
    environmentType === ENVIRONMENT_TYPE_POPUP ||
    environmentType === ENVIRONMENT_TYPE_SIDEPANEL;
  const [errorTitle, setErrorTitle] = useState('');

  const { txData } = useSelector(
    (state: { confirmTransaction: ConfirmTransactionSlice }) => {
      return state.confirmTransaction;
    },
  );

  // The confirmTransaction lifecycle is not consistent with QR hardware wallet;
  // confirmTransaction changes after the previous tx is confirmed or cancelled.
  // Snapshot txData when requestId changes so the cancel callback always
  // references the correct transaction for the active signing flow.
  const txDataRef = useRef(txData);
  const prevRequestIdRef = useRef(activeScanRequest?.requestId);

  if (prevRequestIdRef.current !== activeScanRequest?.requestId) {
    prevRequestIdRef.current = activeScanRequest?.requestId;
    txDataRef.current = txData;
  }

  const dispatch = useDispatch();
  const walletImporterCancel = useCallback(
    () => dispatch(cancelQrCodeScan()),
    [dispatch],
  );

  const signRequestCancel = useCallback(() => {
    dispatch(
      rejectPendingApproval(
        txDataRef.current.id,
        serializeError(providerErrors.userRejectedRequest()),
      ),
    );
    dispatch(cancelTx(txDataRef.current));
    dispatch(cancelQrCodeScan());
  }, [dispatch]);

  // The popover shows no title by default. Child components set an
  // error-specific heading via setErrorTitle when something goes wrong.
  const title = errorTitle;

  // PAIR requests are always handled in a fullscreen tab opened by the
  // add-wallet-modal. Rendering in sidepanel/popup would cause BaseReader's
  // checkEnvironment() to open a duplicate fullscreen tab, stealing focus
  // from the tab that shows the "Select an account" list after scanning.
  if (isRestrictedEnv && activeScanRequest?.type === QrScanRequestType.PAIR) {
    return null;
  }

  return activeScanRequest ? (
    <Popover
      title={title}
      onClose={
        activeScanRequest.type === QrScanRequestType.PAIR
          ? walletImporterCancel
          : signRequestCancel
      }
    >
      {activeScanRequest.type === QrScanRequestType.PAIR && (
        <QRHardwareWalletImporter
          handleCancel={walletImporterCancel}
          setErrorTitle={setErrorTitle}
        />
      )}
      {activeScanRequest.type === QrScanRequestType.SIGN && (
        <QRHardwareSignRequest
          setErrorTitle={setErrorTitle}
          handleCancel={signRequestCancel}
          request={activeScanRequest.request}
        />
      )}
    </Popover>
  ) : null;
};

export default QRHardwarePopover;
