import { Suite } from 'mocha';
import { Mockttp } from 'mockttp';
import { DEFAULT_BTC_BALANCE } from '../../constants';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { withFixtures } from '../../helpers';
import { login } from '../../page-objects/flows/login.flow';
import { switchToNetworkFromNetworkSelect } from '../../page-objects/flows/network.flow';
import AssetListPage from '../../page-objects/pages/home/asset-list';
import BitcoinAssetDetailsPage from '../../page-objects/pages/asset/bitcoin-asset-details';
import BitcoinHomepage from '../../page-objects/pages/home/bitcoin-homepage';
import {
  mockBtcSpotPrices,
  mockCurrencyExchangeRates,
  mockEmptyInitialFullScan,
  mockExchangeRates,
  mockFiatExchangeRates,
  mockInitialFullScan,
  mockSolanaSpotPrices,
  mockSupportedVsCurrencies,
  mockTokensV2SupportedNetworks,
  mockTokensV3Assets,
} from './mocks';
import { mockPriceMulti, mockPriceMultiBtcAndSol } from './mocks/min-api';

async function buildBtcAssetsBaseMocks(mockServer: Mockttp) {
  return [
    await mockExchangeRates(mockServer),
    await mockCurrencyExchangeRates(mockServer),
    await mockFiatExchangeRates(mockServer),
    await mockSolanaSpotPrices(mockServer),
    await mockSupportedVsCurrencies(mockServer),
    await mockPriceMulti(mockServer),
    await mockPriceMultiBtcAndSol(mockServer),
    await mockTokensV2SupportedNetworks(mockServer),
    await mockTokensV3Assets(mockServer),
    await mockBtcSpotPrices(mockServer),
  ];
}

async function mockBtcAssetsFunded(mockServer: Mockttp) {
  return [
    await mockInitialFullScan(mockServer),
    ...(await buildBtcAssetsBaseMocks(mockServer)),
  ];
}

async function mockBtcAssetsEmpty(mockServer: Mockttp) {
  return [
    await mockEmptyInitialFullScan(mockServer),
    ...(await buildBtcAssetsBaseMocks(mockServer)),
  ];
}

describe('BTC Account - Assets', function (this: Suite) {
  this.timeout(180_000);

  it('BTC is the only asset and shows a 0 balance for an empty account', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockBtcAssetsEmpty,
      },
      async ({ driver }) => {
        await login(driver);
        const homePage = new BitcoinHomepage(driver);
        await switchToNetworkFromNetworkSelect(driver, 'Popular', 'Bitcoin');
        await homePage.checkPageIsLoaded();
        await homePage.checkIsExpectedBitcoinBalanceDisplayed(0);

        const assetList = new AssetListPage(driver);
        await assetList.checkOnlyAssetsArePresent(['Bitcoin']);
        await assetList.checkTokenExistsInList('Bitcoin', '0 BTC');
        await assetList.checkTokenFiatAmountIsDisplayed('$');
        await assetList.checkConversionRateDisplayed();
      },
    );
  });

  it('BTC is displayed with name, symbol, amount, fiat for a funded account', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockBtcAssetsFunded,
      },
      async ({ driver }) => {
        await login(driver);
        const homePage = new BitcoinHomepage(driver);
        await switchToNetworkFromNetworkSelect(driver, 'Popular', 'Bitcoin');
        await homePage.checkPageIsLoaded();
        await homePage.checkIsExpectedBitcoinBalanceDisplayed(
          DEFAULT_BTC_BALANCE,
        );

        const assetList = new AssetListPage(driver);
        await assetList.checkTokenExistsInList(
          'Bitcoin',
          `${DEFAULT_BTC_BALANCE} BTC`,
        );
        await assetList.checkTokenFiatAmountIsDisplayed('$');
        await assetList.checkConversionRateDisplayed();
      },
    );
  });

  it('BTC asset details: header, chart, action buttons, sections', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockBtcAssetsFunded,
      },
      async ({ driver }) => {
        await login(driver);
        const homePage = new BitcoinHomepage(driver);
        await switchToNetworkFromNetworkSelect(driver, 'Popular', 'Bitcoin');
        await homePage.checkPageIsLoaded();
        await homePage.checkIsExpectedBitcoinBalanceDisplayed(
          DEFAULT_BTC_BALANCE,
        );

        const assetList = new AssetListPage(driver);
        await assetList.clickOnAsset('Bitcoin');

        const details = new BitcoinAssetDetailsPage(driver);
        await details.checkPageIsLoaded();
        await details.checkCurrentPriceHeader();
        await details.checkPriceChart();
        await details.checkActionButtons({
          swap: true,
          send: true,
          receive: true,
        });
        await details.checkAllStandardSections();
        await details.checkStakedBalanceIsAbsent();
      },
    );
  });
});
