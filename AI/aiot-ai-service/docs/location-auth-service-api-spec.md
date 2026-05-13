# Location Trigger Integration Spec

This document is for the BE owner of `BE/services/auth-service`.

## Goal

`aiot-ai-service` receives the user's current GPS coordinate from the mobile app, retrieves the user's registered target coordinate and paired Raspberry Pi device id from `auth-service`, compares both coordinates using its own configured radius, and sends a signal to the Raspberry Pi device when the user is inside that radius.

## Flow

1. Watch collects GPS.
2. Mobile app receives GPS from watch.
3. Mobile app calls `aiot-ai-service`.
4. `aiot-ai-service` calls `auth-service` to retrieve the user's target location.
5. `aiot-ai-service` compares current GPS with target latitude/longitude.
6. If matched, `aiot-ai-service` publishes an MQTT signal to the Raspberry Pi device id returned by `auth-service`.

## Auth-Service API Required

### GET `/api/v1/users/{userId}/target-location`

Returns the location that should trigger the Raspberry Pi signal.

### Path Parameters

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `userId` | string | yes | User id managed by auth-service |

### Response 200

```json
{
  "userId": "a6a0c353-bdb0-4a7e-a85f-d9e1d94eb111",
  "latitude": 37.501234,
  "longitude": 127.039456,
  "deviceId": "rpi-001"
}
```

### Field Rules

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `userId` | string | yes | Same user id requested |
| `latitude` | number | yes | Target latitude, range `-90` to `90` |
| `longitude` | number | yes | Target longitude, range `-180` to `180` |
| `deviceId` | string | yes | Paired Raspberry Pi device id, currently `devices.serial_number` |

### Error Responses

| Status | Meaning |
| --- | --- |
| `404` | User or target location not found |
| `409` | User exists but target location is not configured |
| `500` | Internal auth-service error |

## AIoT-Service API Draft

The new router file defines the following endpoint. It still needs to be registered in `app/main.py` when integration is allowed.

### POST `/api/v1/location/evaluate`

Request from mobile app:

```json
{
  "user_id": "a6a0c353-bdb0-4a7e-a85f-d9e1d94eb111",
  "latitude": 37.5012,
  "longitude": 127.0394,
  "measured_at": "2026-05-11T12:30:00+09:00"
}
```

Response when location is not matched:

```json
{
  "user_id": "a6a0c353-bdb0-4a7e-a85f-d9e1d94eb111",
  "device_id": "rpi-001",
  "matched": false,
  "distance_meters": 321.74,
  "threshold_meters": 100,
  "target_name": "home",
  "action": "none",
  "request_id": null,
  "topic": null
}
```

Response when location is matched:

```json
{
  "user_id": "a6a0c353-bdb0-4a7e-a85f-d9e1d94eb111",
  "device_id": "rpi-001",
  "matched": true,
  "distance_meters": 21.42,
  "threshold_meters": 100,
  "target_name": "home",
  "action": "rpi_signal_published",
  "request_id": "8d5817f6-9711-4097-98e4-b6fb68ab7d42",
  "topic": "devices/rpi-001/location/trigger"
}
```

## Environment Variables For AIoT-Service

These can be added later without changing the BE contract.

| Name | Default | Description |
| --- | --- | --- |
| `AUTH_SERVICE_BASE_URL` | `http://localhost:8080` | Base URL for auth-service |
| `AUTH_SERVICE_LOCATION_PATH` | `/api/v1/users/{user_id}/target-location` | Path template for target location lookup |
| `AUTH_SERVICE_TIMEOUT` | `3.0` | HTTP timeout in seconds |
| `LOCATION_TARGET_NAME` | `registered_location` | Target name used by aiot-ai-service responses/logs/MQTT payload |
| `LOCATION_RADIUS_METERS` | `100.0` | Match threshold in meters, owned by aiot-ai-service |
| `MQTT_TOPIC_LOCATION_SIGNAL` | `devices/{device_id}/location/trigger` | MQTT topic template for Raspberry Pi signal |

## MQTT Payload To Raspberry Pi

Topic:

```text
devices/{device_id}/location/trigger
```

Payload:

```json
{
  "type": "location_trigger",
  "device_id": "rpi-001",
  "user_id": "a6a0c353-bdb0-4a7e-a85f-d9e1d94eb111",
  "target_name": "home",
  "distance_meters": 21.42,
  "threshold_meters": 100,
  "request_id": "8d5817f6-9711-4097-98e4-b6fb68ab7d42",
  "created_at": "2026-05-11T12:30:01+09:00"
}
```
