# Analytics Setup Guide

## Tools Installed

| Tool | Purpose |
|---|---|
| Google Tag Manager (GTM) | Central container for all scripts |
| Google Analytics 4 (GA4) | Page views, traffic sources, behavior |
| Microsoft Clarity | Session recordings, heatmaps |
| LinkedIn Insight Tag | Campaign attribution, audience retargeting |

---

## Step 1 — Replace Placeholder IDs

Open `.env.local` and replace each placeholder with your real ID:

```env
NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX           # → your real GTM container ID
NEXT_PUBLIC_CLARITY_PROJECT_ID=XXXXXXXXXX # → your real Clarity project ID
NEXT_PUBLIC_LINKEDIN_PARTNER_ID=XXXXXXX   # → your real LinkedIn partner ID
```

**Where to get each ID:**

- **GTM** → [tagmanager.google.com](https://tagmanager.google.com) → create a container → copy `GTM-XXXXXXX`
- **Clarity** → [clarity.microsoft.com](https://clarity.microsoft.com) → create a project → copy the 10-character project ID
- **LinkedIn Insight** → [LinkedIn Campaign Manager](https://www.linkedin.com/campaignmanager) → Account Assets → Insight Tag → copy the partner ID

---

## Step 2 — Set Up GA4 Inside Google Tag Manager (recommended)

GA4 is configured inside GTM, not as a separate script. This is the best practice.

1. Go to [tagmanager.google.com](https://tagmanager.google.com)
2. Open your container
3. **Tags → New → Google Analytics: GA4 Configuration**
4. Paste your GA4 Measurement ID (e.g. `G-XXXXXXXXXX`)
5. Trigger: All Pages
6. Save and **Publish** the container

---

## Step 3 — Custom Events Tracked

The following events are automatically pushed to `window.dataLayer` (GTM picks these up):

| Event Name | Fired When |
|---|---|
| `portfolio_cta_click` | "View Portfolio" button clicked (Hero) |
| `contact_click` | "Get in Touch" email button clicked (Footer) |
| `email_click` | Email link clicked (Contact section) |
| `linkedin_click` | LinkedIn social link clicked (Footer or Contact) |

To capture these in GA4:
1. In GTM → **Triggers → New → Custom Event**
2. Set Event Name to e.g. `linkedin_click`
3. Create a GA4 Event Tag pointing to that trigger
4. Publish the container

---

## Step 4 — UTM Links for LinkedIn

Use these URLs whenever you share your portfolio on LinkedIn so GA4 can attribute the traffic correctly.

**LinkedIn profile link:**
```
https://www.turkialmalki.com/?utm_source=linkedin&utm_medium=social&utm_campaign=profile
```

**LinkedIn posts:**
```
https://www.turkialmalki.com/?utm_source=linkedin&utm_medium=social&utm_campaign=post
```

**LinkedIn direct messages:**
```
https://www.turkialmalki.com/?utm_source=linkedin&utm_medium=dm&utm_campaign=portfolio
```

**LinkedIn featured section:**
```
https://www.turkialmalki.com/?utm_source=linkedin&utm_medium=featured&utm_campaign=portfolio
```

> In GA4: Reports → Acquisition → Traffic Acquisition → filter by `Session source = linkedin`

---

## Step 5 — Deploy

```bash
npm run build
# deploy to GitHub Pages / Vercel / your host
```

On Vercel or Netlify, add the env variables in the dashboard under **Environment Variables** (not just in `.env.local`).

---

## Verification Checklist

- [ ] Real IDs are in `.env.local` (and in the hosting dashboard for production)
- [ ] Site is deployed
- [ ] Open Chrome → install [Google Tag Assistant](https://tagassistant.google.com/)
- [ ] Tag Assistant shows GTM container firing on page load
- [ ] GA4 Realtime report → your visit appears within 30 seconds
- [ ] Clarity dashboard → a session appears within 2 minutes of your visit
- [ ] LinkedIn Campaign Manager → Insight Tag status shows "Active" (can take up to 24 hours)
- [ ] Visit `https://www.turkialmalki.com/?utm_source=linkedin&utm_medium=social&utm_campaign=test` → confirm GA4 Realtime shows `linkedin / social` as source

---

## Important Limitation: Visitor Identity

Analytics tools can show **visits, pages viewed, traffic source, country, device type, and behavior**. They **cannot** show the specific person's name from LinkedIn.

To identify a visitor, they must intentionally submit their information through a contact form, booking form, newsletter signup, or CRM integration. The analytics data tells you *how many* people came from LinkedIn — not *who* they are.

---

## Files Changed

| File | What Changed |
|---|---|
| `src/app/layout.tsx` | Added GTM noscript, LinkedIn noscript pixel, `<Analytics />` |
| `src/components/Analytics.tsx` | New — injects GTM, Clarity, LinkedIn scripts |
| `src/lib/analytics.ts` | New — `trackEvent()` helper |
| `src/components/sections/Footer.tsx` | `contact_click`, `linkedin_click`, `email_click` on buttons |
| `src/components/sections/Contact.tsx` | `email_click`, `linkedin_click` on links |
| `src/components/sections/Hero.tsx` | `portfolio_cta_click` on "View Portfolio" button |
| `.env.local` | Placeholder IDs for local development |
| `.env.example` | Template committed to the repo |
