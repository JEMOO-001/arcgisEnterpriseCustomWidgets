# Per-view allowed users: DEV testing

Source snapshots are tracked in `edit01/` and `permission-controller/` on DEV.
The working copies used by Experience Builder are under
`client/your-extensions/widgets/`. Keep both widgets installed as siblings;
the controller imports Edit's shared permission helper. These sources use
Experience Builder Developer Edition 1.15 and its built-in controller sources.
For future enhancements, edit the tracked root-level source, copy the changed
files into the matching installed widget folder, then rebuild. Switching Git
branches does not replace the ignored installation working copies automatically.

Versions for this DEV change: Edit 01 `1.15.6`, Permission Controller `2.0.2`.

## Configure the two-page scenario

1. Use a separate Edit 01 widget instance on each page, inside Permission Controller.
2. Choose Attribute only and enable view-based permissions.
3. In Page 1's view, select the shared editors group, choose Allowed users >
   Specific members, select Editor 1, and select fields 1, 2, and 3.
4. In Page 2's view, select the same group, choose Specific members, select
   Editor 2, and select fields 4 and 5.
5. Test the running Experience with each actual Portal account. Builder editing
   intentionally shows all child widgets for configuration.

Expected results:

| Account | Page 1 | Page 2 |
|---|---|---|
| Editor 1 | Edit button; fields 1, 2, 3 | No Edit button |
| Editor 2 | No Edit button | Edit button; fields 4, 5 |
| Unselected group member | No Edit button | No Edit button |
| Viewer, even if selected | No Edit button | No Edit button |

All members of selected groups preserves existing views. Specific members with
zero users selected grants nobody access. Matching views combine their fields
only when both group membership and the user rule match. Removing group
membership blocks access even if the username remains selected. Selecting a user
never grants Portal editing privileges or overrides service permissions.

The picker lists owners, managers, and members of selected groups using Portal's
paginated `/community/groups/{groupId}/userList` resource. The Builder account
must have permission to read the group's membership. A load error leaves the
configured user list intact and offers Retry. Usernames and optional display
names are stored; Portal authentication data is not stored in the view.

## Local checks

Run from `C:\ArcGIS_ExB\ArcGISExperienceBuilder\client`:

```powershell
npm.cmd test -- --runTestsByPath your-extensions/widgets/edit01/tests/views.test.ts your-extensions/widgets/edit01/tests/group-members.test.ts your-extensions/widgets/edit01/tests/view-member-picker.test.tsx your-extensions/widgets/edit01/tests/version-manager.test.ts your-extensions/widgets/permission-controller/tests/access.test.ts --runInBand
npx.cmd --no-install tsc -p your-extensions/widgets/edit01/tsconfig.json --pretty false
npm.cmd run build:prod
```

Build output is under `client/dist-prod/widgets/edit01/` and
`client/dist-prod/widgets/permission-controller/`. Both packages must be updated
together when released because each bundles the shared permission helper.

This change is for DEV testing. It does not update main, the production Portal
registration, or GitHub Pages deployment. Promote reviewed release packages
after the real-account tests are accepted.
