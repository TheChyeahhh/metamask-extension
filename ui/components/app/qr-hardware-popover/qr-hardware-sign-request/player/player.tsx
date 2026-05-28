import React, { useEffect, useMemo, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { UR, UREncoder } from '@ngraveio/bc-ur';
import {
  AlignItems,
  Display,
  FlexDirection,
  TextAlign,
} from '../../../../../helpers/constants/design-system';
import { PageContainerFooter } from '../../../../ui/page-container';
import { Text, Box } from '../../../../component-library';
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
        new UR(Buffer.from(cbor, 'hex'), type),
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
        <Text align={TextAlign.Center}>
          {t('QRHardwareSignRequestSubtitle')}
        </Text>
      </Box>
      <Box
        paddingTop={4}
        paddingBottom={4}
        display={Display.Flex}
        alignItems={AlignItems.center}
        flexDirection={FlexDirection.Column}
      >
        <div
          style={{
            padding: 20,
            backgroundColor: 'var(--qr-code-white-background)',
          }}
        >
          <QRCodeSVG
            value={currentQRCode.toUpperCase()}
            size={QR_CONFIG.CODE_SIZE}
          />
        </div>
      </Box>
      <Box paddingBottom={4} paddingLeft={4} paddingRight={4}>
        <Text align={TextAlign.Center}>
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
