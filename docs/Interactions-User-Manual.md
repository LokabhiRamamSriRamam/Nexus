# Connect Nexus CRM — Representative's Manual: Managing Leads with Interactions

> **Who this is for:** Sales & partnership representatives.
> **What it covers:** How leads and partnerships move through the CRM, and how *Interactions* — the single most important action you take — drive that movement.
> **Live app:** https://connect-nexus.vercel.app/

---

## 1. The Big Idea — Interactions Run Everything

In this CRM, you don't manually drag leads between stages. Instead, **you log what actually happened** — a call, a demo, a payment — and the system moves the lead forward for you.

That logged event is called an **Interaction**.

> **One sentence to remember:** *Every time you touch a lead or partner, log an interaction. The interaction's **outcome** is what advances the deal.*

An interaction captures five things:

| Field | Meaning | Example |
|-------|---------|---------|
| **Method** | *How* you made contact | Call, WhatsApp, Google Meet, In-Person |
| **Outcome** | *What resulted* — this is the engine that moves stages | "Interested", "Demo Scheduled", "Paid" |
| **Notes** *(required)* | What was said, key points, next steps | "Owner wants pricing for 3 outlets, decision by Friday" |
| **Next Follow-up** | When to chase again — auto-creates a reminder | 12 Jun, 4:00 PM |
| **Logged by** | Your name | Riya |

---

## 2. The Two Pipelines

The CRM runs **two parallel pipelines** with identical mechanics. Both live in the left sidebar (or the bottom bar on mobile).

### A. Sales Leads — *your customers*
```
   PRE-SALES  ───►  SALES PIPELINE  ───►  POST-SALES
  (prospecting)     (active selling)     (closed / live customer)
```

### B. Partnerships — *your channel partners who bring you leads*
```
   PRE-SALES  ───►   NEGOTIATING   ───►   ACTIVE
  (prospecting)     (active selling)    (live partner)
```

> The two pipelines use the **same stage engine under the hood** — only the labels differ. A partnership in "Negotiating" is at the same step as a lead in "Sales Pipeline". Once a partner becomes **Active**, the customer leads they refer get attributed back to them for commission tracking.

A lead/partner can also land in **Lost** if it doesn't work out.

---

## 3. Where to Find Interactions

1. Open a pipeline page from the sidebar — **Pre-Sales**, **Sales Pipeline**, **Post-Sales**, or **Partnerships**.
2. Click any **lead card** (or partner card). A side **drawer** slides open.
3. The drawer has tabs:

   `Details` · **`Interactions`** · `Reminders` · `Deal` *(Deal appears only after closing)*

4. Open the **Interactions** tab. You'll see:
   - A **timeline** of everything logged so far (newest at top), each with its method icon, outcome badge, date, and notes.
   - A **"+ Log an interaction"** button at the top.

---

## 4. How to Log an Interaction (step-by-step)

1. Click **"+ Log an interaction"**.
2. **Pick a Method** — the available options depend on the stage:
   - **Pre-Sales:** Call · Email · WhatsApp
   - **Sales Pipeline / Negotiating:** Call · Google Meet · In-Person · Email · Other
   - **Post-Sales / Active:** Call · Google Meet · In-Person · Email · Other
3. **Pick an Outcome** — *the most important choice.* Options are stage-specific (see §5). This is what may advance the stage.
4. Set the **Date** (defaults to today) and **Time**.
5. Enter your name under **Logged by**.
6. Write your **Notes** — **this is mandatory.** No interaction saves without it.
7. *(Optional but recommended)* Set a **Next follow-up date & time**. This automatically creates a **reminder** so the lead never goes cold.
8. Click **Log Interaction**.

If your outcome triggers a stage move, you'll see a confirmation toast like *"Demo scheduled — lead moved to Sales Pipeline."*

---

## 5. Outcomes by Stage — and What They Do

Outcomes are tailored to where the lead is. Two of them are **magic outcomes** that automatically advance the stage. ⭐

### Pre-Sales outcomes
| Outcome | Effect |
|---------|--------|
| Call Made | Logs progress, stays in Pre-Sales |
| Not Picked | Logs a missed attempt, stays in Pre-Sales |
| Follow-up Scheduled | Logs intent to chase, stays in Pre-Sales |
| **Demo Scheduled** ⭐ | **Moves the lead forward to Sales Pipeline** (partners → Negotiating) |

### Sales Pipeline / Negotiating outcomes
| Outcome | Effect |
|---------|--------|
| Follow-up Needed | Stays in pipeline |
| Interested | Stays in pipeline |
| Not Interested | Stays in pipeline (consider marking Lost) |
| Negotiation | Stays in pipeline |
| Demo Scheduled | Stays in pipeline |
| Deal Sent | Stays in pipeline |
| **Paid** ⭐ | **Moves the lead to Post-Sales** (partners → Active) |

### Post-Sales / Active outcomes
| Outcome | Effect |
|---------|--------|
| Renewal Discussion | Tracks an ongoing customer |
| Renewal Confirmed | Customer renewed |
| Churned | Customer left |

> **Key rule:** Stage only advances *forward, one step,* and only from the right starting stage.
> - **Demo Scheduled** advances a lead **only if it's currently in Pre-Sales.**
> - **Paid** advances a lead **only if it's currently in Sales Pipeline.**
> Selecting these outcomes later (e.g. logging another "Paid" on a customer already in Post-Sales) simply records the note without moving anything.

---

## 6. What Each Interaction Updates Automatically

When you save an interaction, the system silently keeps the lead/partner record in sync:

- ✅ The lead's **current outcome** is updated to your latest one (so the card always shows its newest status).
- ✅ If you set a **next follow-up**, the lead's follow-up date is updated **and a reminder is created/refreshed** for that date.
- ✅ If you chose a **magic outcome**, the **stage advances** and you get a confirmation toast.

This means the **Dashboard**, the **Reminders** page, and each pipeline's lists all stay current without any extra clicks from you.

---

## 7. Follow-ups & Reminders — Never Let a Lead Go Cold

The **Next follow-up** field is your safety net:

- Setting it on an interaction schedules a reminder for that date and time.
- Reminders surface on the **Dashboard** and the **Reminders** page.
- For partners, the existing pending reminder is updated rather than duplicated — so each partner carries one clean "next action" date.

**Best practice:** *Never close the interaction form without setting a next follow-up* — unless the deal is Paid or genuinely dead.

---

## 8. A Realistic Walkthrough

**Lead: "Sunrise Bakery" — sourced from a cold call.**

1. **Day 1 (Pre-Sales):** You call. Owner is busy.
   → Method: *Call*, Outcome: *Not Picked*, Notes: *"Rang twice, no answer."*, Next follow-up: *tomorrow 11 AM.*
2. **Day 2 (Pre-Sales):** You reconnect, they want a demo.
   → Method: *Call*, Outcome: **Demo Scheduled** ⭐, Notes: *"Demo booked for Thu. Interested in POS + CRM."*
   → ✨ Lead auto-moves to **Sales Pipeline.**
3. **Day 4 (Sales Pipeline):** Demo goes well.
   → Method: *Google Meet*, Outcome: *Interested*, Notes: *"Loved dashboards. Wants pricing for 2 outlets."*, Next follow-up: *Mon.*
4. **Day 7 (Sales Pipeline):** They sign and pay.
   → Method: *In-Person*, Outcome: **Paid** ⭐, Notes: *"Annual plan, 2 outlets. Payment received."*
   → ✨ Lead auto-moves to **Post-Sales** — now a live customer.
5. **Day 300 (Post-Sales):** Renewal season.
   → Method: *Call*, Outcome: *Renewal Discussion*, Notes: *"Discussing 2nd-year renewal + 1 new outlet."*

Every step is one logged interaction. You never manually moved the lead — the **outcomes** did.

---

## 9. Quick Reference Card

| I want to… | Do this |
|------------|---------|
| Record a call/meeting | Open lead → **Interactions** tab → **+ Log an interaction** |
| Move a prospect into active selling | Log outcome **Demo Scheduled** (from Pre-Sales) |
| Mark a deal won | Log outcome **Paid** (from Sales Pipeline) |
| Schedule my next touch | Set **Next follow-up** before saving |
| See my upcoming tasks | **Dashboard** or **Reminders** page |
| Track a channel partner | **Partnerships** page — same flow, labels are *Negotiating / Active* |
| See a lead's full history | **Interactions** tab timeline |

---

## 10. Golden Rules

1. **Log every touch.** An unlogged call never happened.
2. **The Outcome is the steering wheel** — it's what advances the deal.
3. **Notes are mandatory** — your future self (and teammates) rely on them.
4. **Always set the next follow-up** unless the deal is Paid or dead.
5. **Demo Scheduled** and **Paid** are the two outcomes that move stages — use them deliberately.

---

*Connect Nexus CRM — built for fast, clean pipeline management. Questions or gaps in this guide? Flag them to your CRM admin.*
