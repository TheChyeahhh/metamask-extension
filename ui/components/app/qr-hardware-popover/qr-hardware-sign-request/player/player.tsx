import React, { useEffect, useMemo, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { UR, UREncoder } from '@ngraveio/bc-ur';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  Text,
  TextAlign,
  TextVariant,
} from '@metamask/design-system-react';
import PageContainerFooter from '../../../../ui/page-container/page-container-footer/page-container-footer.component';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { QR_CONFIG, type PlayerProps } from './player.types';

/**
 * Renders an animated QR code that cycles through UR-encoded fragments.
 *
 * The user holds their QR-based hardware wallet up to the screen to scan
 * the transaction. Once the device acknowledges it, the user taps
 * "Get Signature" to advance to the camera scan phase.
 *
 * @param props - Component props.
 * @param props.type - UR type identifier, e.g. "eth-sign-request".
 * @param props.cbor - Hex-encoded CBOR payload.
 * @param props.cancelQRHardwareSignRequest - Cancel callback.
 * @param props.toRead - Advances to the camera scan phase.
 */
const Player = ({
  type,
  cbor,
  cancelQRHardwareSignRequest,
  toRead,
}: PlayerProps) => {
  const t = useI18nContext();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const urEncoder = useMemo(
    () =>
      new UREncoder(
        new UR(Buffer.from(cbor, QR_CONFIG.CBOR_ENCODING), type),
        QR_CONFIG.FRAGMENT_SIZE,
      ),
    [cbor, type],
  );

  const [currentQRCode, setCurrentQRCode] = useState(urEncoder.nextPart());

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setCurrentQRCode(urEncoder.nextPart());
    }, QR_CONFIG.REFRESH_RATE);

    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [urEncoder]);

  return (
    <>
      <Box>
        <Text variant={TextVariant.BodyMd} textAlign={TextAlign.Center}>
          {t('QRHardwareSignRequestSubtitle')}
        </Text>
      </Box>
      <Box
        paddingTop={4}
        paddingBottom={4}
        alignItems={BoxAlignItems.Center}
        flexDirection={BoxFlexDirection.Column}
      >
        <div className="p-5 bg-[var(--qr-code-white-background)]">
          <QRCodeSVG
            value={currentQRCode.toUpperCase()}
            size={QR_CONFIG.CODE_SIZE}
          />
        </div>
      </Box>
      <Box paddingBottom={4} paddingLeft={4} paddingRight={4}>
        <Text variant={TextVariant.BodyMd} textAlign={TextAlign.Center}>
          {t('QRHardwareSignRequestDescription')}
        </Text>
      </Box>
      <PageContainerFooter
        onCancel={cancelQRHardwareSignRequest}
        onSubmit={toRead}
        cancelText={t('QRHardwareSignRequestCancel')}
        submitText={t('QRHardwareSignRequestGetSignature')}
        submitButtonType="confirm"
      />
    </>
  );
};

export default Player;
