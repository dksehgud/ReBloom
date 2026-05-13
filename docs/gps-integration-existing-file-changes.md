# GPS Integration Existing File Changes

This document lists existing files that had to be modified for GPS integration. New files are not listed here unless they explain why an existing file references them.

## AI/aiot-ai-service/app/main.py

Registered `location.router`.

Reason: `app/routers/location.py` defines `POST /api/v1/location/evaluate`, but FastAPI does not expose a router until it is included in `main.py`.

## AI/aiot-ai-service/app/core/config.py

Added:

- `AUTH_SERVICE_BASE_URL`
- `AUTH_SERVICE_LOCATION_PATH`
- `AUTH_SERVICE_TIMEOUT`
- `LOCATION_RADIUS_METERS`
- `LOCATION_DEVICE_ID`
- `MQTT_TOPIC_LOCATION_SIGNAL`

Reason: GPS judgement needs to call `auth-service` for the target coordinate, own the radius and device decision in Python, and use a configurable MQTT topic for the Raspberry Pi trigger.

## AI/aiot-ai-service/.env.example

Added example environment variables for auth-service lookup and location MQTT topic.

Reason: local, Docker, and deployed environments need explicit values without changing Python code.

## AI/aiot-ai-service/app/schemas/location.py

Removed `device_id` from `LocationEvaluateRequest`.

Reason: `device_id` should come from `aiot-ai-service` configuration, not from the mobile client.

## AI/aiot-ai-service/app/routers/location.py

Changed location evaluation to use latitude/longitude returned by `auth-service`, while `LOCATION_RADIUS_METERS` and `LOCATION_DEVICE_ID` come from `aiot-ai-service` settings.

Reason: one watch-app-AIoT pairing is handled by the Python service configuration, and clients should not be able to trigger arbitrary device ids or radius values.

## AI/aiot-ai-service/app/services/auth_location_client.py

Changed to use `settings` and unwrap `BaseResponse.data` responses.

Reason: `auth-service` returns the child's target latitude/longitude through the common `BaseResponse` wrapper, and runtime URLs should be configured through `.env`.

## AI/aiot-ai-service/app/services/rpi_location_signal_client.py

Changed MQTT location topic lookup to use `settings.MQTT_TOPIC_LOCATION_SIGNAL`.

Reason: topic format must be configurable per environment.

## BE/services/auth-service

No existing auth-service file is modified by this integration branch.

Reason: develop already provides `GET /api/v1/internal/children/{childId}/target-location`, returning the child's registered latitude/longitude. `aiot-ai-service` now consumes that API and owns radius/device configuration locally.

## BE/services/gateway-service/src/main/resources/application.yaml

Added `/aiot/**` route to `AIOT_AI_SERVICE_URI`.

Reason: mobile app calls the shared gateway; `StripPrefix=1` forwards `/aiot/api/v1/location/evaluate` to `aiot-ai-service` as `/api/v1/location/evaluate`.

## FE/mobile-app/app/src/main/AndroidManifest.xml

Added Wear DataLayer listener path prefix `/location`.

Reason: the phone app must receive GPS DataItems from the watch.

## FE/mobile-app/app/src/main/java/com/rebloom/mobile/network/ApiService.kt

Added location evaluate request/response DTOs and `evaluateLocation`.

Reason: phone app needs to forward watch GPS data to `aiot-ai-service` through the gateway.

## FE/mobile-app/app/src/main/java/com/rebloom/mobile/wear/WearDataListenerService.kt

Added `/location/` DataLayer handling.

Reason: GPS data from watch is converted to a `LocationEvaluateRequest` and sent to `/aiot/api/v1/location/evaluate`.

## FE/mobile-app/watch-core/src/main/AndroidManifest.xml

Added location permissions and `foregroundServiceType="health|location"`.

Reason: Wear OS requires runtime and foreground-service declarations for background location collection.

## FE/mobile-app/watch-core/src/main/java/com/rebloom/watch/MainActivity.kt

Added location permissions to the existing permission request list.

Reason: the location sensor cannot start until the user grants location access.

## FE/mobile-app/watch-core/src/main/java/com/rebloom/watch/service/BiometricService.kt

Attached `LocationSensor` lifecycle and published `/location/{timestamp}` DataItems.

Reason: the existing foreground service already manages continuous watch-side sensor collection, so GPS collection belongs in the same lifecycle.
