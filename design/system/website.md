# Website

How to build the Block Concepts public website from this system. The site is a static, mobile-first positioning site on the main domain. It explains the market position Block Concepts fills in specialty automation and proves it with real, anonymized solutions across five industries. It is not a portal.

## Positioning

- Every page follows one chain: **specialty automation** (category), **one accountable source** (promise), **Engineering, Sourcing, Services** (how), **Solutions by industry** (proof).
- Block Concepts is a hybrid of consulting and integration. Consultants advise but hand off execution; integrators build but often fit the problem to the product they sell. Block Concepts carries one engineering line from the first conversation to a running system.
- Audience: manufacturing engineers, plant and operations managers and maintenance leads at small-to-mid manufacturers without in-house automation engineering; secondarily OEMs and integrators needing engineering or build support.
- State no service area anywhere. Do not reference Concepts Hub until it releases; its contact routing and CMS are built in but disabled.

## Shell

- One header, one navigation and one footer on every page. Section order is the same on phones and desktop; navigation, pillar layout and spacing adapt below 820px.
- Header: `NavBar` with the wordmark top left. Desktop shows "| Specialty Automation" after the logo and inline links at top right, no hamburger. Below 820px a hamburger opens a full-screen menu. Links in order: Engineering, Sourcing, Services, Solutions, About, Contact. The first three scroll to and open their pillar panel on the homepage.
- Footer: `Footer` with LinkedIn and YouTube, the primary link row (the six links above), the legal row (Privacy, Terms, Cookie settings), the logo and "©2026 Block Concepts LLC · Specialty Automation". Rows stack on phones; the logo sits right on desktop.
- Show `CookieBanner` on first visit. Google Analytics is the only tracker and the privacy policy discloses it.

## Homepage

Sections in order: Header, service pillars, position statement, solutions, credibility band, secondary call to action, footer. There is no hero carousel, sourcing tiers, progress bar or network statement on the homepage.

1. **Service pillars.** `PillarPanels` opens the page on three full-height panels. Each panel opens to a scope list. On phones they become a swipeable row with indicator bars.

   | Pillar | Label | Scope |
   | --- | --- | --- |
   | Engineering | Design | Problem definition, feasibility, concept, cycle-time and ROI analysis, specifications, mechanical and controls design |
   | Sourcing | Distribution | Vendor-neutral selection, quoting, procurement, lead-time management |
   | Services | Integration | Mechanical and electrical install, commissioning, startup, training, handoff, support |

   The open Sourcing panel ends with a "See sourcing tiers →" link to the Sourcing page.
2. **Position statement.** `Statement` with the eyebrow "Specialty automation", the headline "Small fixes and full production lines. One accountable source.", one paragraph and the caption "One accountable source across engineering, sourcing, and services."
3. **Solutions.** A `bc-tiles` grid of `SolutionTile`, with "More solutions →" linking to the index. Small and large projects sit side by side.
4. **Credibility band.** `CredibilityBand` with a short company background paragraph and a "Get to know us" link to About.
5. **Secondary call to action.** `CtaBand`: "Bring us your problem. One accountable source from start to finish." with one Contact button.

## Other pages

- **Solutions index.** A grid of `SolutionTile` filterable by industry and pillar. Industries appear only as tags.
- **Solution detail.** A real project, anonymized: problem, approach, pillars used, sourcing tier and outcome, with a render. No customer names, logos, locations, proprietary dimensions or drawings.
- **Sourcing.** Lead line: "From one component to the complete machine, Block Concepts is one accountable source." Stack six `TierRow` components, each linking to a matching solution where one exists.

  | % | Tier | What is sourced |
  | --- | --- | --- |
  | 15% | Components | Motors, sensors, pneumatics, bearings, fasteners |
  | 30% | Subsystems | Drives and motion, vision packages, feeders, grippers |
  | 50% | Modules | Conveyor sections, frames, guarding, enclosures |
  | 70% | Controls | Panels, PLC/HMI, wiring, safety |
  | 85% | Integrated cells | Robot, tooling, controls and safety built and tested together |
  | 100% | Complete machine | Turnkey build, tested, delivered |
- **About.** One screen on phones: photo, "Grant Block, Founder and Lead Engineer", two to three sentences, one "View on LinkedIn" button. No resume, credential lists or timelines.
- **Contact.** Phone 913-327-9271 and email shown publicly. The Give this form route is built in and disabled.
- **Legal.** Privacy, Terms and Cookie settings, with Google Analytics disclosed.

## Launch solutions

| Industry | Solution | Pillars | Tier |
| --- | --- | --- | --- |
| Packaging and dispensing | Servo-based cap torque measurement | Engineering | 85% |
| Laboratory and diagnostics | Placeholder | none | none |
| Medical device | Offline 3D dimensional inspection | Engineering, Sourcing | 30% |
| Additive manufacturing | SLS print farm automation | Engineering, Sourcing | 100% |
| Material handling | VFD control enclosure for conveyor | Sourcing, Services | 70% |

## Building rules

- Use `NavBar` and `Footer` unchanged on every page; keep copy in sentence case except where a style is uppercase.
- Tags use `bc-tag--solid` for the industry and `bc-tag--line` for each pillar. Progress bars are `bc-steel-blue` filled to the tier percentage on a `bc-hairline` track.
- Content not yet supplied ships as a placeholder that says what is missing ("Company background paragraph, to be supplied."), never invented copy.
