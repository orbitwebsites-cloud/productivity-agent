# Product Hunt Assets

## Name
ScreenBuddy

## Tagline
The desktop companion that keeps you pointed at the work you chose.

## Topics
Productivity, AI Agents, Developer Tools, Focus, Windows

## Description
ScreenBuddy is a local-first desktop buddy named Pesto. It tracks active app/window metadata, sorts your time into Life Pursuits, and answers questions like "what was I working on yesterday?"

Its signature Jarvis Mode watches your active pursuit. If you drift into a distraction, Pesto gives a countdown, then safely minimizes the distraction and brings your last work window back. It never force-closes apps and never takes over your mouse.

## Maker Comment
I built ScreenBuddy because most focus tools are either too passive or too aggressive.

Passive trackers tell you at 6pm that you wasted the day. Hard blockers treat YouTube as bad 100% of the time, even when it is part of the work. Heavy computer-use agents feel risky because they can click around on your behalf.

Pesto is the middle path: a local desktop companion that knows what pursuit you chose, warns you when you drift, and takes only reversible OS-level actions like minimizing a distraction window.

I’m looking for feedback on one question: does Jarvis Mode feel helpful, or annoying?

## Gallery Shot List
1. Pesto floating widget with "Today by pursuit".
2. Jarvis Mode settings with active pursuit selected.
3. Warden countdown: "YouTube is outside Tech Job."
4. Context recovery answer with "Restore yesterday's workspace" button.
5. Privacy tiers screen: private by default.

## Launch Reply Templates

Thanks for checking it out. The core privacy choice is metadata-first: app + window title. Pesto does not need screenshots for the current Jarvis/Warden behavior.

Good question. The Warden action is reversible: it minimizes the foreground distraction window. It does not close tabs, kill processes, or click around in apps.

The first version is Windows-focused because the OS window APIs are easier to ship cleanly. Mac support is on the roadmap after the Windows beta feels solid.
