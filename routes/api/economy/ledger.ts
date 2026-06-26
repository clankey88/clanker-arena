import { Handlers } from "$fresh/server.ts";
import {
  createLedgerEntry,
  getPendingLedgerEntries,
  getLedgerEntriesForUser,
  approveLedgerEntry,
  rejectLedgerEntry,
} from "../../../lib/economy/ledger.ts";

export const handler: Handlers = {
  async GET(req) {
    const userId = new URL(req.url).searchParams.get("userId");
    const pending = new URL(req.url).searchParams.get("pending") === "true";
    if (userId) {
      const entries = await getLedgerEntriesForUser(userId);
      return Response.json({ entries });
    }
    if (pending) {
      const entries = await getPendingLedgerEntries();
      return Response.json({ entries });
    }
    return Response.json({ entries: [] });
  },

  async POST(req) {
    const body = await req.json();
    const { action, userId, tournamentId, amount, ledgerId, adminNote } = body;

    if (action === "create") {
      if (!userId || !tournamentId || !amount) {
        return Response.json({ ok: false, error: "Missing required fields" }, { status: 400 });
      }
      const entry = await createLedgerEntry(userId, tournamentId, amount);
      return Response.json({ ok: true, entry }, { status: 201 });
    }

    if (action === "approve") {
      if (!ledgerId) return Response.json({ ok: false, error: "Missing ledgerId" }, { status: 400 });
      const ok = await approveLedgerEntry(ledgerId, adminNote);
      return Response.json({ ok });
    }

    if (action === "reject") {
      if (!ledgerId) return Response.json({ ok: false, error: "Missing ledgerId" }, { status: 400 });
      const ok = await rejectLedgerEntry(ledgerId, adminNote);
      return Response.json({ ok });
    }

    return Response.json({ ok: false, error: "Invalid action" }, { status: 400 });
  },
};
