# Re:Bloom Mobile WebView Smoke APK

This module wraps the FE web app in a minimal Android WebView so we can verify that the app runs as an APK before API integration and local persistence are added.

## Scope

- Start route: landing page `/`
- Flow to verify: landing -> login -> child entry button / parent entry button
- Goal: render, routing, input, scroll, modal, and basic navigation smoke test

## 1. Start the FE web app

From `FE/web`:

```bash
npm run dev -- --host 0.0.0.0
```

The default local address is:

```text
http://localhost:5173
```

## 2. Point the WebView at the FE app

Endpoint values are intentionally not committed to `gradle.properties`.
Pass them with `-P...` when building, or keep them in your user-level
`~/.gradle/gradle.properties`.

For the Android emulator, use the host loopback alias:

```properties
WEB_APP_BASE_URL=http://10.0.2.2:5173
```

For a physical device, either use `adb reverse tcp:5173 tcp:5173` with:

```properties
WEB_APP_BASE_URL=http://127.0.0.1:5173
```

or expose the FE app through HTTPS.

Use a tunnel because the Android WebView smoke APK expects an HTTPS origin.

### Preferred: cloudflared

```bash
cloudflared tunnel --url http://localhost:5173
```

Example output:

```text
https://your-tunnel.trycloudflare.com
```

### Fallback: ngrok

```bash
ngrok http 5173
```

## 3. Update the WebView base URL for a tunnel

Use the tunnel URL as `WEB_APP_BASE_URL` when building:

```bash
sh gradlew :app:installDebug \
  -PWEB_APP_BASE_URL=https://your-tunnel.trycloudflare.com \
  -PAPI_BASE_URL=https://your-gateway.example.com/
```

The app loads:

```text
${WEB_APP_BASE_URL}/
```

## 4. Run the Android app

From `FE/mobile-app`:

```bash
sh gradlew :app:installDebug \
  -PWEB_APP_BASE_URL=https://your-web-app.example.com \
  -PAPI_BASE_URL=https://your-gateway.example.com/ \
  -PDIARY_ANALYSIS_API_URL=https://your-gateway.example.com/report/api/v1/analyses/diaries
```

You can also run the `app` module directly from Android Studio.

## 5. Smoke QA checklist

- App launches to the landing page
- Start button moves to `/login`
- Child entry button moves to `/child/diary`
- Parent entry button moves to `/parent/home`
- Child settings page opens
- Address modal opens
- Password modal opens
- Keyboard does not block input too severely
- Scroll and modal interactions work without major breakage

## Notes

- This is a smoke APK only. It does not include API integration.
- Child diary persistence is not included in this module yet.
- The tunnel URL can be changed later to a proper domain, local HTTPS, or a bundled asset strategy.
