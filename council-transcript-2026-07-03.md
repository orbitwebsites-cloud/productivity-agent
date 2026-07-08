# LLM Council Transcript — ScreenBuddy MVP
**Date:** 2026-07-03

## Original Question
Debate the ScreenBuddy MVP plan and pressure-test it. A cute desktop character (Mac + Windows) that sits in your corner as a tough-love accountability buddy ("stop being a bitch and do your shit"), secondarily a productivity tracker. Logs everything honestly (games/video/NSFW). Brain on Hermes Agent (self-improving) hosted on a cheap VPS; pluggable model provider (Ollama or cloud). Per-item local-vs-VPS privacy choice. Cute buddy + Cluely glass UI, voice later.

### Open questions
1. Accountability-buddy vs productivity-tracker — stronger MVP wedge?
2. How should local-vs-VPS storage split work for sensitive screen data?
3. Is building on Hermes Agent right, or over-engineering for an MVP?
4. Smallest first slice that validates the core idea?

---

## Advisor Responses

### The Contrarian (peer-review letter B)
The core loop is a lie you're telling yourself. An accountability buddy only works if you respect its judgment — but you're building the judge, and day one it'll be wrong constantly: flag research as slacking, miss that the YouTube video was a tutorial, nag mid-flow. Accountability tools die from one false accusation. (1) Neither is a wedge — "tough love" is a retention feature, not acquisition; nobody installs a screen-watcher that insults them cold. Lead with the tracker. (2) Per-item local-vs-VPS is a trap — nobody hand-classifies their own surveillance. Go 100% local. A VPS holding NSFW/gaming logs is a breach headline. (3) Hermes is over-engineering, full stop. (4) Smallest slice: local category logger → one honest weekly number. No character, no cloud, no agent. Prove the mirror is accurate before you make it talk back.

### The First Principles Thinker (peer-review letter D)
What are you actually validating? Not "can I track screens" — commodity (RescueTime, Rize). You're validating ONE thing: will a person tolerate and come back to a character that insults them using their own honestly-logged data? Only defensible hypothesis. The bet is emotional, not analytical. (1) Wedge = accountability; the call-out IS the product. (2) Storage split premature — ship 100% local; a VPS liability invented before you have a user. (3) Hermes over-engineering badly — self-improvement matters at month 6, not week 1. (4) Smallest slice: local sampling → category → one scheduled personality-loaded call-out per day via the character. Watch whether YOU keep it running two weeks without muting. Build the risky 5% first.

### The Expansionist (peer-review letter A)
Building on Hermes isn't over-engineering — it's the moat everyone skips. A self-improving buddy that learns YOUR patterns becomes non-replaceable; by month three it knows you slack Tuesdays at 3pm and pre-empts it. Near-zero churn. Accountability is the wedge — a roasting character is a personality product that goes viral; the recording of it calling you a bitch IS the marketing. Duolingo-owl energy. The honest log of games/video/NSFW is a goldmine — the most complete self-knowledge dataset a person will own. Sell weekly reality reports; later opt-in cohort benchmarking. Smallest slice: skip the dashboard, ship screen-watch → one daily roast + one number. Make privacy the brand: "your shame stays on your machine." Character franchise, not app.

### The Outsider (peer-review letter E)
The accountability angle is the only thing I'd remember — I can picture telling a friend. "Productivity tracker" already exists in ten forms. Lead with the buddy. But the swearing would make me not install it on a work laptop where a coworker might hear — let me pick the tone. What stops me cold: it watches my screen, logs "NSFW included," and the brain runs on a "cheap cloud VPS." Cheap and my nudes do not belong in the same sentence. "Per-item choice" doesn't help — I have to trust you got that switch right forever. Default everything local; make cloud a rare obvious opt-in. Say plainly "your screen never leaves your computer unless you flip this." "Hermes, self-improving, pluggable providers" means nothing to me — over-engineering. Smallest test: skip cloud, skip brain — a local character that watches one hour then says one honest funny callout.

### The Executor (peer-review letter C)
Accountability is the wedge. "How productive this week" is a crowded graveyard — RescueTime, Toggl, ActivityWatch. A character that roasts you for opening YouTube is the thing people screenshot and share. But you can't build the roast without the tracker underneath — the accountability layer is a thin, loud UI on top of the same data pipeline. Build the pipe, bolt on attitude. Kill Hermes for the MVP — a research toy you'll debug three weeks instead of shipping. This week: (1) background script screenshots every 30–60s, (2) each frame to one cheap vision call → category JSON, (3) write {timestamp,category,app} to local SQLite — nothing leaves the machine, dodge privacy for v0, (4) sum 7 days, print "You were productive 22h. You spent 9h on YouTube." If that sentence makes you flinch, the product works. Storage split and Electron next sprint.

---

## Peer Reviews (anonymized A–E; mapping: A=Expansionist, B=Contrarian, C=Executor, D=First Principles, E=Outsider)

**Review 1:** Strongest = D (names the actual hypothesis, orders build around the risk). Biggest blind spot = A (treats NSFW log as a monetizable "goldmine," contradicting its own privacy promise; most hype-driven). All missed: the accuracy-vs-personality dependency loop — a tough-love character is MORE fragile to misclassification than a neutral dashboard; "lead with accountability" and "tracker must be accurate first" are the same requirement. Also consent/legality on shared/work machines and who the buyer is.

**Review 2:** Strongest = B (attacks the core loop's fatal flaw; "accountability tools die from one false accusation"). Biggest blind spot = A (a self-improving agent that learns from wrong categorizations compounds error; sells NSFW logs one breath after "your shame stays on your machine"). All missed: whether screen-content classification is even accurate enough to accuse someone — the whole product rides on an unsized classification-accuracy problem.

**Review 3:** Strongest = B (attacks the load-bearing assumption that the judge is accurate day one). Biggest blind spot = A (self-improving *wrong* judge compounds errors; virality of an app logging your porn is a lawsuit, not a growth loop). All missed: consent/legality of watching a shared/employer-owned screen; whether accuracy is even achievable; nobody defined what "productive" means (no ground truth).

**Review 4:** Strongest = B (attacks the core technical risk everyone assumes away; "prove the mirror is accurate before it talks back"). Biggest blind spot = A (bets the whole moat on an unvalidated loop). All missed: the market/legal reality of always-on screen surveillance — consent for on-screen third parties, employer/work-laptop policy, platform ToS, app-store rejection for a screen-scraping tool. Continuous capture itself may be the disqualifier, regardless of where bytes land.

**Review 5:** Strongest = B (the judge must be accurate before it can be mean; its smallest slice de-risks exactly that). Biggest blind spot = A (romanticizes the roast as marketing, NSFW as goldmine, ignores being wrong). All missed: classification accuracy as the core technical risk; consent/legality of screen capture; retention economics (does anyone keep a device that insults them past week 2?); per-sample vision API cost at always-on cadence.

---

## Chairman's Verdict
See council-report-2026-07-03.html for the full synthesis.
