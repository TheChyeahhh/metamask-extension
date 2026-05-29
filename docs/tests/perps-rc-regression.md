# Perps RC Manual Regression Checklist

Run this checklist on every release candidate that includes the Perps experience.
It covers the in-extension Perps surfaces, trading lifecycle, funds flows, feature
gates, and known edge cases that are not fully protected by automated E2E tests.

This checklist does not replace change-specific exploratory testing. If an RC
contains a Perps-specific change, add targeted cases for that change before
sign-off.

## Priority Labels

- `[Critical]` means the case belongs in the primary `mm` smoke run. The
  critical set is designed to fit in roughly one hour when run with a seeded or
  mocked Perps-ready state and reused `mm` knowledge.
- `[Non-critical]` means the case remains part of full RC regression,
  targeted-risk testing, or feature-specific follow-up.
- In optional or environment-dependent sections, such as HIP-3, browser
  compatibility, confirmation-backed withdraw, and telemetry, treat `[Critical]`
  as conditional only when that surface is enabled or targeted by the RC.
- Standalone visibility checks are intentionally excluded. A case should verify
  user value, data correctness, state isolation, mutation, recovery, or a blocked
  unsafe action.

## Critical MM Smoke Run Order

Target runtime: 45-60 minutes on Chrome MV3 with `mm`.

Recommended setup:

- Build the RC/test extension, then launch the reusable smoke fixture:
  ```bash
  yarn build:test
  yarn tsx test/e2e/playwright/llm-workflow/scripts/launch-perps-smoke.ts --restart-daemon --force
  ```
- The `perpsSmoke` fixture enables Perps remote flags, starts with an eligible
  mainnet Perps account, skips the tutorial, seeds a $15,250 account balance,
  long and short positions, open limit orders, BTC/ETH/SOL and HIP-3 market
  data, and routes Hyperliquid REST calls through `mock-e2e` by default.
  Use `--no-mock-server` only when intentionally testing live provider data.
- Use a seeded/custom `mm` state with Perps enabled, one funded eligible account,
  one account with no Perps balance, one open long, one open short, one open
  limit order, one position with take-profit and stop-loss, and representative
  trade, order, funding, deposit, and withdrawal history.
- If possible, include one mocked or fixture-backed ineligible account so the
  geo-blocking smoke does not require a region change.
- Start with `mm knowledge-search "perps RC smoke"` and
  `mm knowledge-sessions`, then run `mm launch`, `mm describe-screen`, and reuse
  known navigation sequences.
- Capture at least one `mm screenshot` after Perps home, market details, order
  entry, position management, funds flow, and the final state.
- To extract the smoke list, run
  `rg -n "^- \\[ \\] \\[Critical\\] PERPS-RC-" docs/tests/perps-rc-regression.md`.
- End the run with `mm cleanup`.

Suggested order:

1. Route recovery, account switch, lock or unlock, and base navigation: 6-8
   minutes.
2. Market list and market details: 8-10 minutes.
3. Order entry, validation, one market order, and one limit order: 12-14
   minutes.
4. Position and order management: add exposure, close, margin, take-profit or
   stop-loss, and cancel order: 10-12 minutes.
5. Add funds, withdraw, and activity checks: 10-12 minutes.
6. Streaming refresh, geo-blocking, network switch, and layout sanity: 4-5
   minutes.

## Prerequisites

- Use an RC build that includes Perps, with `PERPS_ENABLED=true`.
- Confirm remote feature flags allow Perps for the app version under test.
- Keep Basic Functionality enabled except for the explicit Basic Functionality
  regression case.
- Use an eligible account with:
  - No Perps balance.
  - Perps balance.
  - At least one open long position.
  - At least one open short position.
  - At least one open limit order.
  - At least one position with take-profit and stop-loss configured.
  - Trade, order, funding, deposit, and withdrawal history.
- Use a blocked or mocked ineligible account or region for geo-blocking cases.
- Use markets that cover:
  - Major crypto markets such as BTC and ETH.
  - A market with very small tick sizes, if available.
  - A zero-decimal or low-decimal market, if available.
  - HIP-3 stock, commodity, forex, and new markets when the HIP-3 allowlist flag
    is enabled.
- Use accounts with Arbitrum USDC and enough gas for deposit and withdraw
  confirmation flows.
- Run the full checklist on Chrome MV3 unless release QA defines another primary
  browser target. Run the browser compatibility section for Firefox MV2, Edge,
  or Opera according to the RC test matrix.
- Watch the extension console and network panel during testing. No case should
  leave an endless spinner, stuck pending state, uncaught exception, or stale
  account data.

## Feature Gates, Navigation, and Session State

- [ ] [Non-critical] PERPS-RC-001: With Perps disabled by build or remote flag,
      direct Perps routes return safely to the wallet home view and no Perps
      stream is started.
- [ ] [Critical] PERPS-RC-002: With Basic Functionality off, Perps blocks data
      loading, does not start streams, and routes the user to Privacy settings
      when they choose to fix the setting.
- [ ] [Critical] PERPS-RC-003: Lock and unlock the wallet from a Perps route. The extension
      returns without stale data, crashes, or broken navigation.
- [ ] [Critical] PERPS-RC-004: Switch between accounts with different Perps states. Balances,
      positions, orders, activity, and favorite markets refresh for the selected
      account only.
- [ ] [Non-critical] PERPS-RC-005: Close and reopen the popup within the Perps resume window.
      The last Perps route reopens with the expected state.
- [ ] [Non-critical] PERPS-RC-006: Leave Perps through an in-app navigation path, close the
      popup, and reopen it. The wallet does not incorrectly force-resume Perps.
- [ ] [Critical] PERPS-RC-007: Use browser back and in-app back from Perps home, market
      list, market details, order entry, activity, and withdraw. Each path lands
      on the expected prior route.
- [ ] [Non-critical] PERPS-RC-008: Open supported Perps deep links while unlocked:
      `/perps`, `/perps?screen=home`, `/perps?screen=tabs`,
      `/perps?screen=markets`, `/perps?screen=market-list&tab=all`,
      `/perps?screen=asset&symbol=BTC`, `/perps-asset?symbol=BTC`, and
      `/perps-markets`.
- [ ] [Non-critical] PERPS-RC-009: Open supported Perps deep links while locked. After unlock,
      the user lands on the intended Perps route or a safe fallback.
- [ ] [Non-critical] PERPS-RC-010: Open a Perps deep link with an unsupported screen, filter, or
      symbol. The extension falls back safely without a blank route.

## Perps Home

- [ ] [Critical] PERPS-RC-011: With seeded Perps data, the home view reconciles
      expected balance, positions, open orders, markets, and recent activity
      without stale skeletons or stale account data.
- [ ] [Non-critical] PERPS-RC-012: With no Perps balance and no positions, the
      user can reach Add funds and start-trading paths from the empty state
      without dead ends.
- [ ] [Critical] PERPS-RC-013: The balance dropdown opens and exposes Add funds and Withdraw
      actions.
- [ ] [Critical] PERPS-RC-014: Long and short open positions match the seeded
      symbol, direction, size, entry price, liquidation price, margin, leverage,
      and PnL state.
- [ ] [Critical] PERPS-RC-015: Open orders match the seeded order type, side,
      size, trigger or limit price, status, and market.
- [ ] [Critical] PERPS-RC-016: Selecting a position card opens the correct market details
      route.
- [ ] [Non-critical] PERPS-RC-017: Selecting an order card opens the correct market details
      route or order management entry point.
- [ ] [Critical] PERPS-RC-018: Watchlist markets load, update prices, and navigate to
      market details.
- [ ] [Non-critical] PERPS-RC-019: Add and remove a favorite market. The watchlist updates and
      persists after navigating away and back.
- [ ] [Non-critical] PERPS-RC-020: Explore markets opens market list or market
      detail routes correctly from a no-position or no-watchlist state.
- [ ] [Critical] PERPS-RC-021: Recent activity includes only the expected recent
      trade, deposit, and withdrawal activity and caps the list at the intended
      count.
- [ ] [Non-critical] PERPS-RC-022: "See all" from recent activity opens the full Perps activity
      page.
- [ ] [Non-critical] PERPS-RC-023: Support and feedback links open the expected external
      destinations.
- [ ] [Non-critical] PERPS-RC-024: Learn basics opens the Perps tutorial from the home view.

## Tutorial and Education

- [ ] [Non-critical] PERPS-RC-025: A first-time Perps user triggers the tutorial
      once, and completion state prevents it from opening automatically again.
- [ ] [Non-critical] PERPS-RC-026: The tutorial progresses through all steps: what Perps are,
      long and short, leverage, liquidation, closing a position, and completion.
- [ ] [Non-critical] PERPS-RC-027: Continue, Skip, and final completion actions close the modal
      and return to the correct Perps view.
- [ ] [Non-critical] PERPS-RC-028: After completing or skipping the tutorial, the
      completion state persists for the same account and environment.
- [ ] [Non-critical] PERPS-RC-029: Manually opening Learn basics shows the tutorial even after
      the first-time prompt has been dismissed.

## Market List

- [ ] [Critical] PERPS-RC-030: Market list data matches the provider response for
      symbol, name, price, 24-hour change, volume, open interest, funding, and
      favorite state.
- [ ] [Critical] PERPS-RC-031: Search finds markets by symbol and name across all market
      categories.
- [ ] [Non-critical] PERPS-RC-032: Clearing search restores the previous filter and sort state.
- [ ] [Non-critical] PERPS-RC-033: A search with no results stays recoverable and
      returns to the prior market list after clearing the query.
- [ ] [Critical] PERPS-RC-034: The All, Crypto, Stocks, Commodities, Forex, and
      New filters return the expected market sets.
- [ ] [Non-critical] PERPS-RC-035: HIP-3 allowlisting controls market
      availability and encoded HIP-3 symbols route correctly.
- [ ] [Non-critical] PERPS-RC-036: Each sort option in the market list sort menu reorders the
      list correctly and keeps rows navigable.
- [ ] [Non-critical] PERPS-RC-037: Favoriting and unfavoriting from the market list persists on
      home and market details.
- [ ] [Critical] PERPS-RC-038: Opening a market from the list lands on the matching market
      details page.
- [ ] [Non-critical] PERPS-RC-039: Returning from market details preserves the market list
      filter, search, and sort state when expected.

## Market Details

- [ ] [Critical] PERPS-RC-040: Market details match the selected market and carry
      the correct symbol, price, direction, and order-entry context into Long and
      Short flows.
- [ ] [Critical] PERPS-RC-041: The candlestick chart renders with live data, handles loading
      states, and does not remain blank.
- [ ] [Non-critical] PERPS-RC-042: Switching candle periods updates the chart and persists the
      selected period when navigating away and back.
- [ ] [Critical] PERPS-RC-043: Market stats match the provider values for
      24-hour volume, open interest, funding rate, funding countdown, and oracle
      price.
- [ ] [Non-critical] PERPS-RC-044: Funding and open interest tooltips or information affordances
      display readable copy and close correctly.
- [ ] [Critical] PERPS-RC-045: With no position, Long and Short buttons open order entry for
      the selected symbol and side.
- [ ] [Critical] PERPS-RC-046: With an open position, position actions use the
      correct seeded position data for size, margin, take-profit, stop-loss, and
      close or modify flows.
- [ ] [Non-critical] PERPS-RC-047: The size display toggles between fiat and token units without
      changing the underlying position.
- [ ] [Critical] PERPS-RC-048: Market-specific open orders match the seeded data
      and can be opened for cancellation.
- [ ] [Non-critical] PERPS-RC-049: Market-specific recent activity matches the
      seeded data and links to the full activity view when available.
- [ ] [Non-critical] PERPS-RC-050: A direct route to an unknown or unsupported market shows a
      safe not-found or fallback state.

## Order Entry

- [ ] [Critical] PERPS-RC-051: Start a new long market order from market details. Symbol,
      side, order type, amount, leverage, and summary initialize correctly.
- [ ] [Non-critical] PERPS-RC-052: Start a new short market order from market details. Symbol,
      side, order type, amount, leverage, and summary initialize correctly.
- [ ] [Critical] PERPS-RC-053: Switch Long and Short tabs in new-order mode. The validation,
      liquidation estimate, and take-profit or stop-loss direction rules update.
- [ ] [Critical] PERPS-RC-054: Enter amount in USD. Token amount, percentage, margin, fees,
      and liquidation estimate update.
- [ ] [Non-critical] PERPS-RC-055: Enter amount in token units. USD amount, percentage, margin,
      fees, and liquidation estimate update.
- [ ] [Critical] PERPS-RC-056: Use the percent slider and percent input. Amount and summary
      update consistently at low, middle, and max values.
- [ ] [Non-critical] PERPS-RC-057: With no Perps balance, the primary action becomes Add Funds
      and opens the deposit flow.
- [ ] [Critical] PERPS-RC-058: Amounts below the market order minimum are blocked with a
      clear validation state.
- [ ] [Non-critical] PERPS-RC-059: Invalid, empty, negative, non-numeric, and over-balance
      amounts are blocked without submitting.
- [ ] [Critical] PERPS-RC-060: Adjust leverage with the slider, direct input, and keyboard
      arrow keys. Min, max, and saved leverage behavior are correct.
- [ ] [Critical] PERPS-RC-061: Place a valid long market order. Submitted and filled states
      appear, the position shows on home and market details, and no duplicate
      order is created.
- [ ] [Non-critical] PERPS-RC-062: Place a valid short market order. Submitted and filled states
      appear, the position shows on home and market details, and no duplicate
      order is created.
- [ ] [Critical] PERPS-RC-063: Switching to limit order changes price validation,
      Mid behavior, summary calculations, and submit eligibility.
- [ ] [Non-critical] PERPS-RC-064: Use Mid for a limit order. The limit price is populated from
      the current mid price and remains editable.
- [ ] [Non-critical] PERPS-RC-065: A long limit price above current price shows the unfavorable
      limit warning and blocks submission.
- [ ] [Non-critical] PERPS-RC-066: A short limit price below current price shows the unfavorable
      limit warning and blocks submission.
- [ ] [Non-critical] PERPS-RC-067: A limit price near liquidation shows the liquidation warning
      and blocks submission.
- [ ] [Critical] PERPS-RC-068: Place a valid limit order. The order appears in open orders
      and activity with correct side, size, price, and status.
- [ ] [Critical] PERPS-RC-069: Enabling auto-close links take-profit and
      stop-loss price fields, percent fields, clear actions, and estimated PnL
      to the order validation state.
- [ ] [Non-critical] PERPS-RC-070: Enter valid take-profit and stop-loss values for a long
      order. The order submits with attached risk management values.
- [ ] [Non-critical] PERPS-RC-071: Enter valid take-profit and stop-loss values for a short
      order. The order submits with attached risk management values.
- [ ] [Critical] PERPS-RC-072: Invalid take-profit and stop-loss values are blocked when
      they are on the wrong side of entry or unsafe relative to liquidation.
- [ ] [Non-critical] PERPS-RC-073: Clearing take-profit or stop-loss removes only that value and
      keeps the rest of the order entry state intact.
- [ ] [Non-critical] PERPS-RC-074: Backend, network, slippage, rate limit, and rejected-order
      failures show actionable errors and leave the user able to retry.
- [ ] [Critical] PERPS-RC-075: Rapidly pressing the submit button does not create duplicate
      orders and leaves the button in the correct loading or disabled state.
- [ ] [Non-critical] PERPS-RC-076: Navigating away from order entry and returning does not leave
      stale pending state, incorrect direction, or incorrect market data.

## Position Management

- [ ] [Critical] PERPS-RC-077: Open Modify from a position. Add exposure loads order entry
      in modify mode for the correct symbol and side.
- [ ] [Critical] PERPS-RC-078: Add exposure to an isolated-margin position. The position
      size updates, leverage validation is correct, and activity is recorded.
- [ ] [Non-critical] PERPS-RC-079: Attempt to add exposure to a cross-margin position. The
      action is blocked with the expected toast or message.
- [ ] [Critical] PERPS-RC-080: Open Reduce exposure from a position. The close-position flow
      opens with correct symbol, direction, size, and available amount.
- [ ] [Critical] PERPS-RC-081: Partially close a position with the slider. Summary, minimum
      notional warning, fees, receive amount, and remaining position are correct.
- [ ] [Non-critical] PERPS-RC-082: Partially close a position with a typed amount. Summary,
      validation, and remaining position are correct.
- [ ] [Critical] PERPS-RC-083: Fully close a position. The position is removed from open
      positions, activity records the close, and balances update.
- [ ] [Non-critical] PERPS-RC-084: A close-position failure shows an error and does not remove
      the position locally.
- [ ] [Critical] PERPS-RC-085: Open Add margin. Available balance, input, percent controls,
      liquidation estimate, and save state are correct.
- [ ] [Critical] PERPS-RC-086: Add margin successfully. Margin and liquidation price update
      on the position.
- [ ] [Non-critical] PERPS-RC-087: Open Remove margin. Removable amount, input, percent controls,
      liquidation estimate, and risk warning are correct.
- [ ] [Non-critical] PERPS-RC-088: Remove margin successfully. Margin and liquidation price
      update on the position.
- [ ] [Non-critical] PERPS-RC-089: Invalid or unsafe margin edits are blocked and do not submit.
- [ ] [Non-critical] PERPS-RC-090: Margin edit failure shows an error and preserves the previous
      position state.
- [ ] [Critical] PERPS-RC-091: Open take-profit and stop-loss management from a position.
      Existing values are prefilled correctly.
- [ ] [Non-critical] PERPS-RC-092: Take-profit presets, stop-loss presets, price fields, percent
      fields, clear actions, and estimated PnL update consistently.
- [ ] [Critical] PERPS-RC-093: Update take-profit and stop-loss successfully. The position
      row updates optimistically and remains correct after refresh.
- [ ] [Non-critical] PERPS-RC-094: Clear take-profit, stop-loss, or both. Cleared values are
      removed from the position after refresh.
- [ ] [Non-critical] PERPS-RC-095: Invalid take-profit or stop-loss updates are blocked with
      clear validation.
- [ ] [Non-critical] PERPS-RC-096: Take-profit or stop-loss update failure shows an error and
      restores or preserves the previous values.
- [ ] [Critical] PERPS-RC-097: Open an order cancellation modal. Date, side, price, size,
      original size, value, reduce-only state, and status are correct.
- [ ] [Critical] PERPS-RC-098: Cancel an open order successfully. It disappears from open
      orders and appears in activity with the expected status.
- [ ] [Non-critical] PERPS-RC-099: Order cancellation failure shows an error and preserves the
      open order.

## Deposit Flow

- [ ] [Critical] PERPS-RC-100: Starting Add funds from the Perps balance dropdown
      creates the expected deposit confirmation context and returns to Perps
      correctly when dismissed.
- [ ] [Non-critical] PERPS-RC-101: Start Add funds from the order entry amount area. The deposit
      confirmation opens and returns to the expected order entry route when
      dismissed.
- [ ] [Critical] PERPS-RC-102: The deposit flow uses USD amount entry, supports Max when
      available, hides unnecessary token amount fields, and uses Arbitrum USDC.
- [ ] [Non-critical] PERPS-RC-103: Deposit amount validation blocks empty, zero, invalid,
      below-minimum, over-balance, and insufficient-gas cases.
- [ ] [Non-critical] PERPS-RC-104: Reject or cancel a deposit confirmation. The user returns to
      Perps without stuck pending state.
- [ ] [Critical] PERPS-RC-105: Confirm a deposit successfully. Pending and success states
      display, Perps balance updates, and activity records the deposit.
- [ ] [Non-critical] PERPS-RC-106: A failed deposit shows an error and leaves balances and
      pending state correct.
- [ ] [Non-critical] PERPS-RC-107: Start a trade while a deposit-related state is still loading
      or pending. The order entry UI remains consistent and does not show stale
      duplicate toasts.

## Withdraw Flow

- [ ] [Critical] PERPS-RC-108: Starting Withdraw from the Perps balance dropdown
      opens the standalone withdraw flow and computes available balance,
      receive token, fee, estimated time, and final receive amount.
- [ ] [Critical] PERPS-RC-109: Amount validation blocks empty, zero, invalid, below-minimum,
      and over-balance withdrawals.
- [ ] [Critical] PERPS-RC-110: 25%, 50%, 75%, and Max controls populate the expected
      withdrawal amount.
- [ ] [Non-critical] PERPS-RC-111: Manual amount entry supports normal decimal input and handles
      comma or malformed input safely.
- [ ] [Critical] PERPS-RC-112: Successful withdrawal returns to Perps home, updates balance,
      and records withdrawal activity.
- [ ] [Non-critical] PERPS-RC-113: Withdrawal validation failure from the provider shows the
      correct error and keeps the user on the withdraw page.
- [ ] [Non-critical] PERPS-RC-114: Withdrawal submission failure shows the correct error, clears
      loading state, and allows retry.
- [ ] [Non-critical] PERPS-RC-115: Back navigation from withdraw returns to the expected Perps
      route without losing home state.
- [ ] [Non-critical] PERPS-RC-116: If confirmation-backed Perps withdraw is enabled for the RC,
      the custom amount confirmation uses the preferred token, falls back to
      Arbitrum USDC when needed, and blocks amounts above tradeable balance.

## Activity and History

- [ ] [Critical] PERPS-RC-117: Full activity matches seeded trades, orders,
      funding, deposits, and withdrawals.
- [ ] [Non-critical] PERPS-RC-118: Activity groups entries by Today, Yesterday, and older date
      buckets correctly.
- [ ] [Critical] PERPS-RC-119: The Trades filter shows only trade-related entries.
- [ ] [Critical] PERPS-RC-120: The Orders filter shows only order-related entries.
- [ ] [Critical] PERPS-RC-121: The Funding filter shows only funding entries.
- [ ] [Critical] PERPS-RC-122: The Deposits filter shows deposit and withdrawal entries.
- [ ] [Non-critical] PERPS-RC-123: Empty, loading, and error activity states
      recover when data becomes available again.
- [ ] [Non-critical] PERPS-RC-124: Selecting an order activity entry opens the matching market
      details route.
- [ ] [Non-critical] PERPS-RC-125: Non-order activity entries are not incorrectly treated as
      navigable order links.
- [ ] [Critical] PERPS-RC-126: Recent activity on home and full activity agree after a new
      trade, deposit, withdrawal, order cancellation, and position close.

## Streaming, Refresh, and Resilience

- [ ] [Critical] PERPS-RC-127: Initial account, market, position, order, and activity
      streams populate without permanent skeletons.
- [ ] [Non-critical] PERPS-RC-128: Navigate between home, market list, market details, and order
      entry. Cached data displays quickly while fresh data streams in.
- [ ] [Critical] PERPS-RC-129: Market prices update live on home, market list, market
      details, and order entry.
- [ ] [Non-critical] PERPS-RC-130: Position PnL, liquidation, margin, and size update after
      market movement and after user actions.
- [ ] [Critical] PERPS-RC-131: Open orders update after creation, fill, cancellation, and
      provider status changes.
- [ ] [Non-critical] PERPS-RC-132: Order book or mid-price dependent controls update and remain
      usable on the order entry page.
- [ ] [Non-critical] PERPS-RC-133: Put the extension in the background for at least 30 seconds
      and return. Perps performs a health check or refresh and remains usable.
- [ ] [Non-critical] PERPS-RC-134: Simulate temporary offline or provider failure. Perps shows
      recoverable error states and refreshes when connectivity returns.
- [ ] [Non-critical] PERPS-RC-135: Lock the wallet while Perps streams are active. Streams stop
      or become inaccessible, and unlocking resumes cleanly.
- [ ] [Critical] PERPS-RC-136: Close the popup while streams are active and reopen it. Perps
      does not leak stale listeners or duplicate updates.
- [ ] [Non-critical] PERPS-RC-137: Open Perps in multiple extension windows or popups if
      supported by the test environment. Streamed data remains consistent.

## Geo-Blocking and Compliance Gating

- [ ] [Non-critical] PERPS-RC-138: An ineligible user's Add funds attempt is
      blocked before creating a deposit confirmation.
- [ ] [Critical] PERPS-RC-139: An ineligible user's new trade attempt is blocked
      before creating or submitting an order.
- [ ] [Non-critical] PERPS-RC-140: An ineligible user's modify or reduce attempt
      is blocked without changing the position.
- [ ] [Non-critical] PERPS-RC-141: An ineligible user's close attempt is blocked
      without changing the position.
- [ ] [Non-critical] PERPS-RC-142: An ineligible user's margin edit attempt is
      blocked without changing margin or liquidation price.
- [ ] [Non-critical] PERPS-RC-143: An ineligible user's take-profit or stop-loss
      update attempt is blocked without changing risk settings.
- [ ] [Non-critical] PERPS-RC-144: An ineligible user's cancel-order attempt is
      blocked without changing order status.
- [ ] [Non-critical] PERPS-RC-145: Dismissing the geo-blocking modal returns the user to the
      previous safe Perps view.
- [ ] [Non-critical] PERPS-RC-146: Confirm product expectations for withdrawals while
      ineligible. Execute the expected behavior and record the result.

## Account, Network, and Environment Boundaries

- [ ] [Critical] PERPS-RC-147: Switching the wallet's selected EVM network does not corrupt
      Perps provider state, balances, positions, or order entry.
- [ ] [Non-critical] PERPS-RC-148: Switching accounts while on order entry updates or blocks the
      order form safely for the newly selected account.
- [ ] [Non-critical] PERPS-RC-149: Switching accounts while on market details updates position
      and open order sections for the newly selected account.
- [ ] [Non-critical] PERPS-RC-150: If testnet and mainnet Perps environments are exposed in the
      RC, switching environments keeps account state, favorites, and trade config
      scoped to the selected environment.
- [ ] [Non-critical] PERPS-RC-151: Perps routes still behave correctly when the selected account
      has no connected sites.

## Browser, Theme, Accessibility, and Presentation

- [ ] [Non-critical] PERPS-RC-152: Keyboard navigation reaches tabs, filters, dropdowns, inputs,
      sliders, modals, and primary actions in a logical order.
- [ ] [Non-critical] PERPS-RC-153: Escape, close buttons, and backdrop behavior close modals
      without losing unrelated form state.
- [ ] [Non-critical] PERPS-RC-154: Form inputs show focus states, validation states, and disabled
      states clearly.
- [ ] [Critical] PERPS-RC-155: Popup-width responsive layout has no clipped labels,
      overlapping controls, or horizontal scrolling on the Perps surfaces.
- [ ] [Non-critical] PERPS-RC-156: Long symbols, encoded HIP-3 symbols, large balances, negative
      PnL, and very small prices format correctly.
- [ ] [Non-critical] PERPS-RC-157: Screen reader labels or accessible names exist for icon-only
      actions such as favorite, close, clear, back, filter, and dropdown controls.

## Analytics and Telemetry

Run these cases when QA has access to event capture or a local analytics
inspection tool.

- [ ] [Non-critical] PERPS-RC-158: Perps screen view events fire for home, market list, market
      details, order entry, withdraw, and activity.
- [ ] [Non-critical] PERPS-RC-159: User interaction events fire for market selection, favorite
      toggle, filter changes, sort changes, support, feedback, and tutorial
      actions.
- [ ] [Non-critical] PERPS-RC-160: Trade submitted, trade filled, limit order placed, position
      closed, order canceled, margin edited, and take-profit or stop-loss updated
      events contain expected non-sensitive properties.
- [ ] [Non-critical] PERPS-RC-161: Deposit and withdrawal events fire on start, success, cancel,
      and failure paths.
- [ ] [Non-critical] PERPS-RC-162: Error events fire for provider, validation, geo-block, and
      failed transaction paths without exposing private keys, seed phrases, or
      sensitive account data.

## Known Automation Gap

Perps has automated route and unit coverage, but the Perps home and WebSocket
E2E suites are currently skipped while the real stream-manager integration is
not fully test-wired. Treat this RC checklist as the primary end-to-end safety
net for the full Perps user journey until those suites are enabled.

## Open Questions for QA and Product

- Should every RC include full Firefox MV2 Perps regression, or should Firefox
  remain a Perps smoke pass unless the RC includes browser-specific changes?
- Should Edge and Opera be included in every Perps RC pass, or only in the
  release-wide browser matrix?
- Which environment and account fixtures should be the source of truth for:
  geo-blocked users, funded users, open positions, open orders, funding history,
  deposit history, and withdrawal history?
- Should confirmation-backed Perps withdraw be part of every RC now, or only
  when the Pay post-quote feature flag is enabled?
- Should external Hyperliquid referral-consent flows be owned by the Perps RC
  checklist or by the broader DeFi referral regression suite?
- Reverse position and batch Close All or Cancel All are intentionally hidden in
  the current UI. Add full pass cases only when product re-enables them.
