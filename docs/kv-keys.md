# Deno KV Key Patterns for Clanker Arena

This document defines the key prefixes and patterns used in our Deno KV database.

## Users
- `["users", "<user_id>"]` -> User object
- `["users_by_username", "<username>"]` -> User ID (for unique username checks)

## Bots
- `["bots", "<bot_id>"]` -> Bot object
- `["bots_by_provider", "<provider_id>", "<bot_id>"]` -> Bot object (index)
- `["bot_pool", "<bot_id>"]` -> Bot object (active pool)

## AI Templates
- `["ai_templates", "<template_id>"]` -> AI_Template object

## Matches
- `["matches", "<match_id>"]` -> Match object
- `["active_matches", "<match_id>"]` -> Match object (index for currently active matches)

## Decks and Cards
- `["decks", "<user_id>", "<deck_id>"]` -> Deck object
- `["cards", "<card_id>"]` -> Card object

## Economy
- `["economy:balance", "<user_id>"]` -> number (user's current balance)
- `["economy:transactions", "<user_id>", "<tx_id>"]` -> Transaction object
- `["economy:daily", "<user_id>"]` -> DailyRewardRecord object

## Tournaments
- `["tournaments", "<tournament_id>"]` -> Tournament object
- `["tournaments:active", "<tournament_id>"]` -> Tournament object (index for active tournaments)
- `["tournaments:teams", "<tournament_id>", "<team_id>"]` -> Team object
- `["tournaments:teams:by_team", "<team_id>"]` -> { tournamentId, teamId }

## Real Money Payouts
- `["real-money:ledger", "<ledger_id>"]` -> RealMoneyLedger object
- `["real-money:pending", "<ledger_id>"]` -> RealMoneyLedger object (pending payouts)
- `["real-money:user", "<user_id>", "<ledger_id>"]` -> RealMoneyLedger object (user index)

## Backings
- `["backings", "<match_id>", "<user_id>"]` -> Backing object (August — Betting & Backing)

## Payouts
- `["payouts", "<payout_id>"]` -> Payout object (August — Betting & Backing)
- `["payouts_by_match", "<match_id>", "<payout_id>"]` -> Payout object (index by match)
- `["payouts_by_user", "<user_id>", "<payout_id>"]` -> Payout object (index by user)
