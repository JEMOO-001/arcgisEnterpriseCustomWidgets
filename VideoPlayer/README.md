# Feature Video Player

Playback-only custom widget built against Experience Builder Developer Edition 1.15 / ArcGIS Maps SDK 4.30, for ArcGIS Enterprise 11.4. Upload and association editing belong to the external application.

After updating this version, save your app and restart the Developer Edition client server, then reload the builder. The manifest declares `jimu-arcgis` for both runtime and settings so the ArcGIS API loads before their imports. Manifest changes require a client restart. The popup action waits for the lazily created popup action collection before it is added.

## Configure

1. Add the widget directly to the same page as your Map widget and leave it mounted. It must run to install its popup action; placing it in a closed Widget Controller or unopened window prevents that until it is opened.
2. Select the Map widget in **Map and features**. Enable map popups.
3. Choose **Feature layer** from the connected map's dropdown. Published FeatureLayer entries are listed, including those inside groups. The widget saves the layer address automatically. Previously saved layer URLs remain supported. The active map must load and your portal session must have permission to read the layer.
4. Select an association type:
   - **1:1 — video field on feature:** read one filename from the selected feature. No relationship class is queried in this mode.
   - **1:M — related video table:** choose **Video table relationship** from the origin layer's published relationships. Publish the feature class, related table, and relationship together. An unpublished geodatabase relationship will not appear here.
5. Choose the filename field (usually `VideoFileName`) and optionally a title field from the text-field dropdowns. In related mode these are destination-table fields. Changing the map, layer, association type, or relationship clears the previous field selection. Store the exact `fileName` returned by upload, such as `gis/media/id.mp4`, in each record. The upload endpoint and temporary signed URL are not file references; web addresses in this field are rejected before a playback request.
6. For the current local test, leave **API base address** as `https://localhost:9052` and **Presigned-URL endpoint** as `/api/media/presigned-url`. Both are preset, including when older saved settings omit the base address. The settings display the resulting request address. Keep the local bridge described below running. For deployment, change the base to your HTTPS API host, or enter a full HTTPS endpoint to override the base. HTTPS on the returned MinIO URL does not make an HTTP API endpoint usable from an HTTPS experience. The API or reverse proxy must allow the experience's origin through CORS, including the Authorization header.
7. Choose `url`, `localUrl`, or `apnUrl` according to the API response and local-network routing. The default is `url`; the widget does not silently switch between fields.
8. Set the lifetime in hours (default 24). **Use HTTPS for returned video URLs** changes only an `http://` prefix and preserves the remainder of the signed URL exactly. The video host must actually support HTTPS.
9. Choose **Media API authentication**. **Each viewer enters a token** is the default and preserves older saved configurations. To remove the viewer prompt, choose **Shared token in app**, paste your token in **Shared bearer token**, leave the field to commit the value, then save and publish the app. You can paste either the token itself or `Bearer <token>`; the widget sends one Bearer prefix.

The shared token is stored in the app configuration and sent to the viewer's browser. Anyone able to load the app can inspect and reuse it; the masked settings field does not encrypt it. A server-side proxy that stores the credential and authorizes requests is needed if it must remain private. No actual credential is bundled into this widget's default configuration.

## View videos

Select a feature. The native popup **Play Video** action is hidden until a successful lookup finds at least one nonblank filename. Switching popup features or closing the popup cancels previous lookup/playback work.

Click **Play Video**. In per-viewer mode, enter your media API bearer token the first time and press **Play video**. These viewer-entered tokens are held only in memory, never in widget configuration, browser storage, or the geodatabase. They are cleared when the widget is unmounted or its API endpoint, base address, authentication mode, or shared token changes. ArcGIS portal authentication and the media API token are separate.

In shared-token mode, viewers see no token input. A feature with one video requests playback immediately when **Play Video** is clicked. With multiple videos, choose the video and press **Play video**. A missing shared token requires the app owner to configure it. A rejected or expired shared token asks the app owner to replace it in the settings; it does not fall back to prompting viewers. Generating a new video URL does not renew the bearer token.

Each play or **Request fresh URL** click sends a new POST with `{ "fileName": "<stored reference>", "expiryHours": 24 }` (using the configured lifetime). A successful response must contain `success: true` and the configured URL field. Closing the player stops it. Expired or rejected tokens produce a message for the viewer or app owner, according to the authentication mode.

The player is an iframe controlled by this widget, not the separate stock Embed widget. Popup action placement is managed by ArcGIS 4.30; a dedicated top-title-bar button is not implemented. The widget preserves existing popup actions.

Lookup errors appear in the widget with a retry control. Incomplete related-record responses produce an error instead of displaying an incomplete video list. This version handles FeatureLayer-backed popup features from one configured service layer per widget instance.

## Local checks and build

From this widget directory:

```powershell
node work/check-types.cjs
node ../../../node_modules/jest/bin/jest.js --config jest.widget.cjs --runInBand
node ../../../node_modules/eslint/bin/eslint.js src tests --ext .ts,.tsx --no-cache
node ../../../node_modules/webpack/bin/webpack.js --config webpack.widget.cjs
```

The isolated production build uses the installed SDK's loaders and SystemJS externals and writes only to `build/VideoPlayer`. Host that folder over HTTPS and register its `manifest.json` as an Experience Builder widget in the portal. Do not use an incompatible newer Developer Edition to rebuild it for Enterprise 11.4.

The supplied SDK currently lacks the `arcgis-charts-components` declaration imported by its own feature-layer data-source interface. The full type-check command reports that upstream error; the widget does not use chart components. Build and local tests are checked separately.

Local tests mock network boundaries. They do not upload videos or call your live media API. Investigation scripts, caches, credentials, and generated bundles are excluded from development source control. The three documented local check/bridge helpers in `work` are included.

## Repository workflow

The GitHub repository is `JEMOO-001/arcgisEnterpriseCustomWidgets`. Its development branch is named **DEV**, with uppercase letters. It stores this widget's source in the repository-root `VideoPlayer/` folder, beside `AdvancedChart/`. Copy that source folder into `client/your-extensions/widgets/VideoPlayer` in a compatible Experience Builder Developer Edition installation before editing or running the local checks above. Sync the reviewed source back to the repository-root folder before committing on DEV. Keep actual passwords and access/refresh tokens out of both branches; the default shared-token value must stay empty.

Once a release is approved, run `npm run build:prod` from the installation's `client` folder. Copy only its `dist-prod/widgets/VideoPlayer/` production bundle into `exp_widgets/VideoPlayer/` on **main**, preserving the other deployed widgets. Commit and push that release on main for the existing GitHub Pages deployment. Do not merge development source directly into the deployment branch. The installed full production command builds the other extensions too; the isolated `webpack.widget.cjs` command above is available for checking only this widget.

The current implementation has per-viewer and shared-token authentication. Automatic login/refresh through a shared server-side proxy is not implemented in this source snapshot.

## Local HTTP API test bridge

`node work/local-media-proxy.cjs` starts a separate HTTPS service at `https://localhost:9052/api/media/presigned-url`, bound only to IPv4 loopback. This is the destination of the widget's preset API base and endpoint path. Keep the process running while testing; Ctrl+C stops it.

It reuses the local Developer Edition server certificate, forwards only this POST route to the approved `http://172.20.70.34:9051/api/media/presigned-url` target, and accepts browser requests only from `https://localhost:3001`. It stores no bearer tokens or signed URLs. It is a local test helper, not a production gateway or a video proxy. Your browser must trust the local certificate through your normal local setup; the helper does not disable certificate checks. It does not fix the separate certificate hostname mismatch at the returned MinIO video host.

`node work/check-local-media-proxy.cjs` checks preflight/origin handling with the known local certificate explicitly trusted for that request. A playback check also runs when `MEDIA_TEST_TOKEN` is supplied only in the process environment. Test scripts in `work` can make live requests; the Jest suite described above does not.
