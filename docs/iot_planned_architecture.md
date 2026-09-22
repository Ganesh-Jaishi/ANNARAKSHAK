# IoT — Planned Integration Architecture

> **Status: PLANNED** — This architecture is designed for future integration. No IoT hardware is currently implemented or connected.

## Overview

ANNARAKSHAK plans to integrate IoT sensors for real-time food condition monitoring at institutional storage and transit points.

## Planned Architecture

```
┌─────────────────────────┐
│   SENSOR NODES          │
│                         │
│  ┌─────────────────┐    │
│  │ DHT22 / BME280  │    │ Temperature + Humidity
│  │ Sensor          │    │
│  └────────┬────────┘    │
│           │             │
│  ┌────────▼────────┐    │
│  │   ESP32          │    │ Microcontroller
│  │   + WiFi/BLE    │    │
│  └────────┬────────┘    │
│           │             │
└───────────┼─────────────┘
            │ MQTT Protocol
            │ (TLS encrypted)
            │
┌───────────▼─────────────┐
│   MQTT BROKER           │
│   (Mosquitto / AWS IoT) │
└───────────┬─────────────┘
            │
┌───────────▼─────────────┐
│   ANNARAKSHAK BACKEND   │
│                         │
│  ┌─────────────────┐    │
│  │ MQTT Subscriber  │    │
│  │ Service          │    │
│  └────────┬────────┘    │
│           │             │
│  ┌────────▼────────┐    │
│  │ Food Condition   │    │
│  │ Engine           │    │ Combines sensor data
│  │                  │    │ with AI assessment
│  └────────┬────────┘    │
│           │             │
│  ┌────────▼────────┐    │
│  │ Safe-Time        │    │ Adjusts Rescue Clock
│  │ Matching         │    │ based on actual conditions
│  └─────────────────┘    │
│                         │
└─────────────────────────┘
```

## Sensor Specifications

| Component | Model | Purpose | Range |
|-----------|-------|---------|-------|
| Temperature | DHT22 / BME280 | Storage/transit temp | -40°C to 80°C |
| Humidity | DHT22 / BME280 | Storage humidity | 0-100% RH |
| Microcontroller | ESP32 | WiFi connectivity, data transmission | — |
| Gas Sensor | MQ135 (optional) | Detect ethylene/ammonia (spoilage indicators) | — |

## Data Flow

1. **Sensor reads** every 30 seconds
2. **ESP32 publishes** to MQTT topic: `annarakshak/{institution_id}/{storage_zone}/telemetry`
3. **Payload format**:
   ```json
   {
     "device_id": "ESP32-INST001-Z1",
     "timestamp": "2024-01-15T14:30:00Z",
     "temperature_c": 4.2,
     "humidity_pct": 65.3,
     "gas_ppm": 12.5
   }
   ```
4. **Backend subscriber** receives and processes
5. **Food Condition Engine** combines with visual AI assessment
6. **Safe-Time Matching** adjusts Rescue Clock:
   - If temperature exceeds food-specific threshold → reduce safe hours
   - If humidity is abnormal → flag deterioration risk
   - If gas levels indicate spoilage → trigger immediate alert

## Safe-Time Rules (Examples)

| Food Type | Max Safe Temp | Alert Threshold | Time Reduction |
|-----------|---------------|-----------------|----------------|
| Dairy | 4°C | >6°C | -50% safe hours |
| Cooked meal | 65°C (hot) / 4°C (cold) | Break danger zone (4-65°C) | -30% safe hours |
| Raw vegetables | 10°C | >15°C | -25% safe hours |
| Bread/bakery | 25°C (ambient) | >30°C + high humidity | -20% safe hours |

## Integration Points

When implemented, IoT data will enhance:
- **AI Assessment**: Sensor data + visual assessment = higher confidence scores
- **Rescue Clock**: Real-time adjustment based on actual storage conditions
- **Waste Intelligence**: Storage condition trends in Waste Fingerprint
- **Admin Dashboard**: Live storage condition monitoring

## Bill of Materials (per node)

| Item | Est. Cost (INR) |
|------|-----------------|
| ESP32 DevKit | ₹350 |
| DHT22 Sensor | ₹150 |
| BME280 (upgrade) | ₹300 |
| MQ135 Gas Sensor | ₹200 |
| Breadboard + Wiring | ₹100 |
| USB Power Supply | ₹150 |
| **Total per node** | **₹950 - ₹1,250** |
