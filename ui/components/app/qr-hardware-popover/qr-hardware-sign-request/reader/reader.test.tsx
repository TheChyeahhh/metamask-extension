import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { ETHSignature } from '@keystonehq/bc-ur-registry-eth';
import * as uuid from 'uuid';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers-navigate';
import { tEn } from '../../../../../../test/lib/i18n-helpers';
import type { BaseReaderProps } from '../../base-reader.types';
import type { ReaderProps } from './reader.types';
import Reader from './reader';

let mockUr: ReturnType<typeof buildMockUr> | undefined;
let mockLastReaderError: Error | undefined;

jest.mock('../../base-reader', () => {
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

jest.mock('@keystonehq/bc-ur-registry-eth', () => ({
  ETHSignature: {
    fromCBOR: jest.fn(),
  },
}));

jest.mock('uuid', () => ({
  ...jest.requireActual('uuid'),
  stringify: jest.fn(),
}));

const mockFromCBOR = jest.mocked(ETHSignature.fromCBOR);
const mockStringify = jest.mocked(uuid.stringify);

/**
 * Creates a mock UR object matching the shape produced by `URDecoder.resultUR()`.
 * @param type
 * @param cborHex
 */
function buildMockUr(type = 'eth-signature', cborHex = 'aabbcc') {
  const cborBuffer = Buffer.from(cborHex, 'hex');
  return { type, cbor: cborBuffer };
}

describe('Reader', () => {
  const defaultProps: ReaderProps = {
    submitQRHardwareSignature: jest.fn().mockResolvedValue(undefined),
    cancelQRHardwareSignRequest: jest.fn(),
    requestId: 'matching-request-id',
    setErrorTitle: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUr = undefined;
    mockLastReaderError = undefined;
  });

  it('renders BaseReader in signing mode (isReadingWallet=false)', () => {
    renderWithProvider(<Reader {...defaultProps} />);

    expect(
      screen.getByTestId('base-reader-is-reading-wallet'),
    ).toHaveTextContent('false');
  });

  describe('handleSuccess', () => {
    it('submits the serialized signature when requestId matches', async () => {
      mockUr = buildMockUr('eth-signature', 'deadbeef');

      const mockRequestIdBuffer = Buffer.from('0123456789abcdef', 'hex');
      mockFromCBOR.mockReturnValue({
        getRequestId: () => mockRequestIdBuffer,
      } as unknown as ETHSignature);
      mockStringify.mockReturnValue('matching-request-id');

      renderWithProvider(<Reader {...defaultProps} />);

      await screen.getByTestId('base-reader-success').click();

      await waitFor(() => {
        expect(mockFromCBOR).toHaveBeenCalledWith(mockUr?.cbor);
        expect(mockStringify).toHaveBeenCalledWith(mockRequestIdBuffer);
        expect(defaultProps.submitQRHardwareSignature).toHaveBeenCalledWith({
          type: 'eth-signature',
          cbor: 'deadbeef',
        });
      });
    });

    it('throws and sets error title when requestId does not match', async () => {
      mockUr = buildMockUr();

      mockFromCBOR.mockReturnValue({
        getRequestId: () => Buffer.from('wrong', 'hex'),
      } as unknown as ETHSignature);
      mockStringify.mockReturnValue('non-matching-request-id');

      renderWithProvider(<Reader {...defaultProps} />);

      await screen.getByTestId('base-reader-success').click();

      await waitFor(() => {
        expect(defaultProps.setErrorTitle).toHaveBeenCalledWith(
          tEn('QRHardwareInvalidTransactionTitle'),
        );
        expect(defaultProps.submitQRHardwareSignature).not.toHaveBeenCalled();
      });

      expect(mockLastReaderError).toBeDefined();
      expect(mockLastReaderError?.message).toBe(
        tEn('QRHardwareMismatchedSignId'),
      );
    });
  });

  describe('cancel flow', () => {
    it('invokes cancelQRHardwareSignRequest when cancel is clicked', async () => {
      renderWithProvider(<Reader {...defaultProps} />);

      await screen.getByTestId('base-reader-cancel').click();

      expect(defaultProps.cancelQRHardwareSignRequest).toHaveBeenCalledTimes(1);
    });
  });

  describe('setErrorTitle propagation', () => {
    it('passes setErrorTitle through to BaseReader', async () => {
      renderWithProvider(<Reader {...defaultProps} />);

      await screen.getByTestId('base-reader-set-error').click();

      expect(defaultProps.setErrorTitle).toHaveBeenCalledWith('test-error');
    });
  });
});
