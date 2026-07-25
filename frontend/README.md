# liketin Flutter client

This directory contains the runnable core of the Flutter client:

- `lib/core/theme/app_theme.dart` — light/dark Material 3 theme, brand palette
- `lib/core/constants/api_constants.dart` — REST + Socket.io endpoints (env-overridable)
- `lib/core/utils/api_client.dart` — REST client with Bearer auth + 401 refresh
- `lib/services/storage_service.dart` — secure token storage
- `lib/main.dart` — app entry + themed placeholder home

## Building

```bash
cd frontend
flutter pub get
flutter run \
  --dart-define=API_BASE_URL=http://localhost:3000 \
  --dart-define=SOCKET_URL=ws://localhost:3000
```

## Screens to implement (BLoC pattern)

The following screens are part of the product spec and wire onto the core above.
Each is a `flutter_bloc` feature (event → bloc → state → page):

| Screen | Data source |
|--------|-------------|
| Splash | `AuthBloc.AppStarted` → token validation |
| Login / Register | `POST /auth/login`, `/auth/register`, social via Firebase |
| Profile setup | `PUT /profile/me`, `POST /profile/photos` |
| Home (swipe) | `GET /swipe/recommendations`, `POST /swipe` |
| Matches | `GET /match` |
| Chat list / Chat | Socket.io `join_match` / `send_message` / `typing` |
| Profile / Settings | `GET/PUT /profile/me`, `/profile/settings` |
| Premium | `GET /premium/plans`, `POST /premium/subscribe` |
| Report / Block | `POST /report`, `/report/block` |

Firebase (`firebase_core`, `firebase_auth`, `firebase_messaging`) must be
configured with `flutterfire configure` before social login / push work.
