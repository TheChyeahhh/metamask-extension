import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import type { UR } from '@ngraveio/bc-ur';
import configureStore from '../../../../store/store';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import { tEn } from '../../../../../test/lib/i18n-helpers';
import mockState from '../../../../../test/data/mock-state.json';
import * as Actions from '../../../../store/actions';
import type { BaseReaderProps } from '../base-reader.types';
import type { QRHardwareWalletImporterProps } from './qr-hardware-wallet-importer.types';
import QRHardwareWalletImporter from './qr-hardware-wallet-importer';

let mockUr: UR | undefined;
let mockLastReaderError: Error | undefined;

jest.mock('../base-reader', () => {
  const MockBaseReader = (mockProps: BaseReaderProps) => (
    <div data-testid="mock-base-reader">
      <span data-testid="base-reader-is-reading-wallet">
        {String(mockProps.isReadingWallet)}
      </span>
      <button
        data-testid="base-reader-cancel"
        onClick={mockProps.handleCancel}
      />
      <button
        data-testid="base-reader-success"
        onClick={async () => {
          if (!mockUr) {
            return;
          }
          try {
            await mockProps.handleSuccess(mockUr);
          } catch (err) {
            mockLastReaderError = err as Error;
          }
        }}
      />
      <button
        data-testid="base-reader-set-error"
        onClick={() => mockProps.setErrorTitle('test-error')}
      />
    </div>
  );
  MockBaseReader.displayName = 'MockBaseReader';
  return MockBaseReader;
});

jest.mock('../../../../store/actions', () => ({
  ...jest.requireActual('../../../../store/actions'),
  completeQrCodeScan: jest.fn(() => () => Promise.resolve()),
}));

const mockCompleteQrCodeScan = jest.mocked(Actions.completeQrCodeScan);

function buildMockUr(type = 'crypto-hdkey', cborHex = 'aabbcc'): UR {
  const cborBuffer = Buffer.from(cborHex, 'hex');
  return { type, cbor: cborBuffer } as unknown as UR;
}

function buildStore() {
  return configureStore(mockState);
}

describe('QRHardwareWalletImporter', () => {
  const defaultProps: QRHardwareWalletImporterProps = {
    handleCancel: jest.fn(),
    setErrorTitle: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUr = undefined;
    mockLastReaderError = undefined;
  });

  it('renders BaseReader in wallet-reading mode (isReadingWallet=true)', () => {
    renderWithProvider(
      <QRHardwareWalletImporter {...defaultProps} />,
      buildStore(),
    );

    expect(
      screen.getByTestId('base-reader-is-reading-wallet'),
    ).toHaveTextContent('true');
  });

  describe('handleSuccess', () => {
    it('dispatches completeQrCodeScan with serialized UR data', async () => {
      mockUr = buildMockUr('crypto-hdkey', 'deadbeef');

      renderWithProvider(
        <QRHardwareWalletImporter {...defaultProps} />,
        buildStore(),
      );

      await screen.getByTestId('base-reader-success').click();

      await waitFor(() => {
        expect(mockCompleteQrCodeScan).toHaveBeenCalledWith({
          type: 'crypto-hdkey',
          cbor: 'deadbeef',
        });
      });
    });

    it('sets error title and rethrows when dispatch fails', async () => {
      const dispatchError = new Error('dispatch-failure');
      mockCompleteQrCodeScan.mockImplementation(
        () => () => Promise.reject(dispatchError),
      );
      mockUr = buildMockUr();

      renderWithProvider(
        <QRHardwareWalletImporter {...defaultProps} />,
        buildStore(),
      );

      await screen.getByTestId('base-reader-success').click();

      await waitFor(() => {
        expect(defaultProps.setErrorTitle).toHaveBeenCalledWith(
          tEn('QRHardwareUnknownQRCodeTitle'),
        );
      });

      expect(mockLastReaderError).toBe(dispatchError);
    });
  });

  describe('cancel flow', () => {
    it('invokes handleCancel when cancel is clicked', async () => {
      renderWithProvider(
        <QRHardwareWalletImporter {...defaultProps} />,
        buildStore(),
      );

      await screen.getByTestId('base-reader-cancel').click();

      expect(defaultProps.handleCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe('setErrorTitle propagation', () => {
    it('passes setErrorTitle through to BaseReader', async () => {
      renderWithProvider(
        <QRHardwareWalletImporter {...defaultProps} />,
        buildStore(),
      );

      await screen.getByTestId('base-reader-set-error').click();

      expect(defaultProps.setErrorTitle).toHaveBeenCalledWith('test-error');
    });
  });
});
