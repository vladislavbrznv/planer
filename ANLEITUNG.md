# Büsra's Planer: auf GitHub Pages bringen

## 1. Hochladen (einmalig)
1. Auf github.com ein neues **öffentliches** Repository anlegen, z. B. `planer`.
2. „uploading an existing file“ anklicken und **alle Dateien aus diesem Ordner** hineinziehen
   (`index.html`, `sw.js`, `manifest.webmanifest`, `icon.svg`, `icon-180.png`, `icon-192.png`, `icon-512.png`). Diese Anleitung kann weg.
3. **Settings → Pages → Branch: `main`, Ordner `/ (root)` → Save.**
4. Nach ca. 1 Minute läuft die App unter `https://DEINNAME.github.io/planer/`.

## 2. Auf Büsras Handy
Link per WhatsApp schicken, dann:
- **iPhone:** Link in **Safari** öffnen → Teilen-Button → „Zum Home-Bildschirm“.
- **Android:** Link in **Chrome** öffnen → ⋮ → „App installieren“ bzw. „Zum Startbildschirm hinzufügen“.

Danach startet sie die App über das lila Icon. Sie läuft auch offline.

## Gut zu wissen
- Alle Einträge liegen **nur auf ihrem Handy**. Nichts davon landet bei GitHub.
- App vom Homescreen löschen = Daten weg. Deshalb im Tab „Haut“ ab und zu **Backup sichern**.
- Erinnerungen laufen über Google Kalender (Button „Erinnerung“ / „In Google Kalender“). Dafür braucht sie beim Eintragen kurz Internet.

## Updates einspielen
1. Geänderte Dateien im Repo ersetzen.
2. In `sw.js` die Zeile `const VERSION = "planer-v1";` hochzählen (`planer-v2` usw.).
   Sonst zeigt ihr Handy weiter die alte Version.
3. Büsra öffnet die App zweimal (beim ersten Mal lädt sie im Hintergrund das Update).
