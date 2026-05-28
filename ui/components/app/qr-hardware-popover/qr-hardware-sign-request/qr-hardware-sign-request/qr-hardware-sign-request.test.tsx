import React from 'react';
import { screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import type { QrSignatureRequest } from '@metamask/eth-qr-keyring';
import configureStore from '../../../../../store/store';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers-navigate';
import mockState from '../../../../../../test/data/mock-state.json';
import * as Actions from '../../../../../store/actions';
import type { PlayerProps } from '../player/player.types';
import type { ReaderProps } from '../reader/reader.types';
import type { QRHardwareSignRequestProps } from './qr-hardware-sign-request.types';
import QRHardwareSignRequest from './qr-hardware-sign-request';

jest.mock('../../../../../store/actions', () => ({
  ...jest.requireActual('../../../../../store/actions'),
  completeQrCodeScan: jest.fn(() => () => Promise.resolve()),
}));

jest.mock('../reader', () => {
  const MockReader = (props: ReaderProps) => (
    <div data-testid="mock-reader">
      <span data-testid="reader-request-id">{props.requestId}</span>
      <button
        data-testid="reader-cancel"
        onClick={props.cancelQRHardwareSignRequest}
      />
      <button
        data-testid="reader-submit"
        onClick={() =>
          props.submitQRHardwareSignature({ type: 'eth-signature', cbor: 'aa' })
        }
      />
      <button
        data-testid="reader-set-error"
        onClick={() => props.setErrorTitle('test-error')}
      />
    </div>
  );
  MockReader.displayName = 'MockReader';
  return MockReader;
});

jest.mock('../player', () => {
  const MockPlayer = (props: PlayerProps) => (
    <div data-testid="mock-player">
      <span data-testid="player-type">{props.type}</span>
      <span data-testid="player-cbor">{props.cbor}</span>
      <button
        data-testid="player-cancel"
        onClick={props.cancelQRHardwareSignRequest}
      />
      <button data-testid="player-to-read" onClick={props.toRead} />
    </div>
  );
  MockPlayer.displayName = 'MockPlayer';
  return MockPlayer;
});

const mockCompleteQrCodeScan = jest.mocked(Actions.completeQrCodeScan);

function buildRequest(
  overrides?: Partial<QrSignatureRequest>,
): QrSignatureRequest {
  return {
    requestId: 'test-request-id-1',
    payload: {
      type: 'eth-sign-request',
      cbor: 'a501d825509b1deb4d3b7d4bad9bdd2b0d7b3dcb68',
    },
    ...overrides,
  };
}

function buildStore() {
  return configureStore(mockState);
}

describe('QRHardwareSignRequest', () => {
  const defaultProps: QRHardwareSignRequestProps = {
    request: buildRequest(),
    handleCancel: jest.fn(),
    setErrorTitle: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initial rendering', () => {
    it('renders the Player component in play phase', () => {
      renderWithProvider(
        <QRHardwareSignRequest {...defaultProps} />,
        buildStore(),
      );

      expect(screen.getByTestId('mock-player')).toBeInTheDocument();
      expect(screen.queryByTestId('mock-reader')).not.toBeInTheDocument();
    });

    it('passes payload type and cbor to the Player', () => {
      renderWithProvider(
        <QRHardwareSignRequest {...defaultProps} />,
        buildStore(),
      );

      expect(screen.getByTestId('player-type')).toHaveTextContent(
        'eth-sign-request',
      );
      expect(screen.getByTestId('player-cbor')).toHaveTextContent(
        'a501d825509b1deb4d3b7d4bad9bdd2b0d7b3dcb68',
      );
    });
  });

  describe('play → read transition', () => {
    it('switches to Reader when toRead is invoked', async () => {
      renderWithProvider(
        <QRHardwareSignRequest {...defaultProps} />,
        buildStore(),
      );

      await userEvent.click(screen.getByTestId('player-to-read'));

      expect(screen.getByTestId('mock-reader')).toBeInTheDocument();
      expect(screen.queryByTestId('mock-player')).not.toBeInTheDocument();
    });

    it('passes the correct requestId to Reader', async () => {
      renderWithProvider(
        <QRHardwareSignRequest {...defaultProps} />,
        buildStore(),
      );

      await userEvent.click(screen.getByTestId('player-to-read'));

      expect(screen.getByTestId('reader-request-id')).toHaveTextContent(
        'test-request-id-1',
      );
    });
  });

  describe('request ID change resets to play phase', () => {
    it('resets to Player when request.requestId changes', async () => {
      const { rerender } = renderWithProvider(
        <QRHardwareSignRequest {...defaultProps} />,
        buildStore(),
      );

      await userEvent.click(screen.getByTestId('player-to-read'));
      expect(screen.getByTestId('mock-reader')).toBeInTheDocument();

      rerender(
        <QRHardwareSignRequest
          {...defaultProps}
          request={buildRequest({ requestId: 'new-request-id-2' })}
        />,
      );

      expect(screen.getByTestId('mock-player')).toBeInTheDocument();
      expect(screen.queryByTestId('mock-reader')).not.toBeInTheDocument();
    });

    it('does not reset when the same requestId is provided', async () => {
      const { rerender } = renderWithProvider(
        <QRHardwareSignRequest {...defaultProps} />,
        buildStore(),
      );

      await userEvent.click(screen.getByTestId('player-to-read'));
      expect(screen.getByTestId('mock-reader')).toBeInTheDocument();

      rerender(<QRHardwareSignRequest {...defaultProps} />);

      expect(screen.getByTestId('mock-reader')).toBeInTheDocument();
    });
  });

  describe('cancel flow', () => {
    it('invokes handleCancel when cancel is clicked in Player', async () => {
      renderWithProvider(
        <QRHardwareSignRequest {...defaultProps} />,
        buildStore(),
      );

      await userEvent.click(screen.getByTestId('player-cancel'));

      expect(defaultProps.handleCancel).toHaveBeenCalledTimes(1);
    });

    it('invokes handleCancel when cancel is clicked in Reader', async () => {
      renderWithProvider(
        <QRHardwareSignRequest {...defaultProps} />,
        buildStore(),
      );

      await userEvent.click(screen.getByTestId('player-to-read'));
      await userEvent.click(screen.getByTestId('reader-cancel'));

      expect(defaultProps.handleCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe('signature submission', () => {
    it('dispatches completeQrCodeScan when Reader submits', async () => {
      renderWithProvider(
        <QRHardwareSignRequest {...defaultProps} />,
        buildStore(),
      );

      await userEvent.click(screen.getByTestId('player-to-read'));
      await userEvent.click(screen.getByTestId('reader-submit'));

      expect(mockCompleteQrCodeScan).toHaveBeenCalledWith({
        type: 'eth-signature',
        cbor: 'aa',
      });
    });
  });

  describe('setErrorTitle propagation', () => {
    it('passes setErrorTitle through to Reader', async () => {
      renderWithProvider(
        <QRHardwareSignRequest {...defaultProps} />,
        buildStore(),
      );

      await userEvent.click(screen.getByTestId('player-to-read'));
      await userEvent.click(screen.getByTestId('reader-set-error'));

      expect(defaultProps.setErrorTitle).toHaveBeenCalledWith('test-error');
    });
  });
});
