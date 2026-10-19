# TradePulse

A responsive multi-market dashboard for phone and desktop, created by Aaron Cornites. A short animated glass intro plays when the page opens, with a loading animation and owner credit. Choose from selected indices, forex pairs, commodities, stocks, and crypto; view an interactive TradingView chart and its technical-analysis summary. TradingView widgets may show delayed data depending on the instrument and exchange. This is a charting workspace, not a price predictor or broker.

## Publish the website from your phone

GitHub Pages can host this static charting website.

1. In Termux, make the files available to Android's file picker:

   ```sh
   termux-setup-storage
   cp -r ~/tradepulse ~/storage/shared/Download/
   ```

2. In your browser, create a **public** repository on GitHub named `tradepulse`. On the new repository page, choose **Add file → Upload files** and select the files inside `Download/tradepulse` (not the enclosing folder). Commit the upload to `main`.
3. In the repository, open **Settings → Pages**. For **Build and deployment**, choose **Deploy from a branch**, select `main` and `/(root)`, then save.
4. Wait for Pages to finish. The app address will look like `https://YOUR-USERNAME.github.io/tradepulse/`. Open it on your phone or Windows PC to confirm the site loads. GitHub Pages sites are public.

## Create and install an Android APK

1. On the phone, open [PWABuilder](https://www.pwabuilder.com/) and enter the published HTTPS address. Choose its Android package option.
2. Set the app name and a unique package ID such as `com.aaroncornites.tradepulse`. For a test APK, choose a new signing key if the packaging options offer that choice; save the generated keystore and passwords somewhere private and safe.
3. Generate and download the ZIP. Extract it in Downloads. PWABuilder's current Android package includes an APK for installing/testing and an AAB intended for Google Play; install the `.apk` file, not the `.aab`.
4. Android may ask permission for the file app/browser to install unknown apps. Allow it for that source, tap the APK again, and install. Open TradePulse from its new home-screen/app-drawer icon. Opening the Pages URL directly will still open it in the browser.
5. If the installed app shows a browser address bar, publish the `assetlinks.json` from the PWABuilder ZIP to `https://YOUR-SITE-HOST/.well-known/assetlinks.json`. The exact URL must return that JSON without redirects. With a GitHub Pages project URL (`USERNAME.github.io/tradepulse`), the host is `USERNAME.github.io`, so the file must be available at `https://USERNAME.github.io/.well-known/assetlinks.json` (for example, from a separate `USERNAME.github.io` Pages repository). Then uninstall/reinstall the APK and reopen it. Missing or incorrect Digital Asset Links are the common reason a TWA shows browser UI.

The installed APK has its own app icon and opens as a standalone Trusted Web Activity when the website ownership check succeeds. It still renders the hosted web app through the Android browser runtime, but without browser controls. The TradingView chart and technical snapshot need internet; this design cannot be fully offline. PWABuilder's Android package is for testing/sideloading; publishing through Google Play is a separate process.



## Security notes

- `backend-config.js` contains only the Supabase publishable key. Never place a Supabase secret/service-role key or an owner password in frontend files or a public repository.
- After updating `supabase-setup.sql`, run the full updated file in the Supabase SQL Editor. Row-level security then limits visitor analytics to the configured owner, and only anonymous sessions can publish visitor presence.
- Use a unique owner password and enable multi-factor authentication on the Supabase account. Rotate any password that was pasted into a chat, screenshot, or public repository. Keep Supabase sign-in rate limits and CAPTCHA protections enabled where available; anonymous sign-in is needed for visitor counting.
- GitHub Pages serves public website files to every visitor. Static frontend code can always be viewed or copied; keep sensitive data and privileged operations in a secured backend.
