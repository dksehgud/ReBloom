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
- `LOCATION_TARGET_NAME`
- `LOCATION_RADIUS_METERS`
- `MQTT_TOPIC_LOCATION_SIGNAL`

Reason: GPS judgement needs to call `auth-service` for the target coordinate, own the target label/radius decision in Python, and use a configurable MQTT topic for the Raspberry Pi trigger.

## AI/aiot-ai-service/.env.example

Added example environment variables for auth-service lookup and location MQTT topic.

Reason: local, Docker, and deployed environments need explicit values without changing Python code.

## AI/aiot-ai-service/app/schemas/location.py

Removed `device_id` from `LocationEvaluateRequest`.

Reason: `device_id` should come from `auth-service` through the paired device record, not from the mobile client.

## AI/aiot-ai-service/app/routers/location.py

Changed location evaluation to use `deviceId` returned by `auth-service`, while `targetName` and `radiusMeters` come from `aiot-ai-service` settings.

Reason: this keeps device ownership and pairing logic in BE, keeps location judgement policy in Python, and prevents clients from triggering arbitrary device ids.

## AI/aiot-ai-service/app/services/auth_location_client.py

Changed to use `settings` and unwrap `BaseResponse.data` responses.

Reason: `auth-service` returns data through the common `BaseResponse` wrapper, and runtime URLs should be configured through `.env`.

## AI/aiot-ai-service/app/services/rpi_location_signal_client.py

Changed MQTT location topic lookup to use `settings.MQTT_TOPIC_LOCATION_SIGNAL`.

Reason: topic format must be configurable per environment.

## BE/services/auth-service/src/main/java/com/ssafy/rebloom/auth_service/user/controller/UserController.java

Added `GET /api/v1/users/{userId}/target-location`.

Reason: `aiot-ai-service` needs a simple internal API to retrieve the child's registered latitude/longitude and paired Raspberry Pi device id.

## BE/services/auth-service/src/main/java/com/ssafy/rebloom/auth_service/user/service/UserService.java

Added `getTargetLocation(UUID childrenId)`.

Reason: exposes the target-location use case from the service layer.

## BE/services/auth-service/src/main/java/com/ssafy/rebloom/auth_service/user/service/impl/UserServiceImpl.java

Added target-location lookup logic.

Reason: validates that the child has registered coordinates, finds the active parent relation, then resolves the latest paired device serial number as `deviceId`. It intentionally does not decide `targetName` or `radiusMeters`; those belong to `aiot-ai-service`.

## BE/services/auth-service/src/main/java/com/ssafy/rebloom/auth_service/user/repository/DeviceRepository.java

Added `findLatestPairedDeviceByParentId`.

Reason: GPS triggers need the Raspberry Pi device id paired to the connected parent.

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
