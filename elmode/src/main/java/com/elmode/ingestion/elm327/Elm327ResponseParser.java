package com.elmode.ingestion.elm327;

import com.elmode.ingestion.model.TelemetryMetric;


public final class Elm327ResponseParser {

    private Elm327ResponseParser() {
    }

    public static Double parse(TelemetryMetric metric, String rawResponse) {
        if (rawResponse == null) {
            return null;
        }

        String cleaned = rawResponse.trim().toUpperCase().replace(" ", "");

        if (cleaned.isEmpty()
                || cleaned.contains(Elm327Commands.NO_DATA)
                || cleaned.contains(Elm327Commands.ERROR_TOKEN)
                || cleaned.contains("UNABLETOCONNECT")
                || cleaned.contains("STOPPED")
                || cleaned.contains("SEARCHING")) {
            return null;
        }

        String expectedPrefix = "41" + metric.pid().substring(2);
        int prefixIndex = cleaned.indexOf(expectedPrefix);
        if (prefixIndex < 0) {
            return null;
        }

        String dataBytes = cleaned.substring(prefixIndex + expectedPrefix.length());

        try {
            return switch (metric) {
                case ENGINE_RPM -> decodeRpm(dataBytes);
                case COOLANT_TEMP -> decodeCoolantTemp(dataBytes);
                case ENGINE_LOAD -> decodeEngineLoad(dataBytes);
                case OIL_PRESSURE, BATTERY_VOLTAGE ->
                    // Simulation-only metrics (see TelemetryMetric javadoc) — not
                    // real OBD-II Mode 01 PIDs, so there's no hardware frame to
                    // decode. ObdReaderService's hardware polling loop never
                    // requests these PIDs in the first place; this case only
                    // exists to keep the switch exhaustive and fail safe (null,
                    // not an exception) if it's ever reached.
                    null;
            };
        } catch (NumberFormatException | IndexOutOfBoundsException e) {
            return null;
        }
    }

    private static Double decodeRpm(String data) {
        if (data.length() < 4) return null;
        int a = Integer.parseInt(data.substring(0, 2), 16);
        int b = Integer.parseInt(data.substring(2, 4), 16);
        return ((a * 256.0) + b) / 4.0;
    }

    private static Double decodeCoolantTemp(String data) {
        if (data.length() < 2) return null;
        int a = Integer.parseInt(data.substring(0, 2), 16);
        return a - 40.0;
    }

    private static Double decodeEngineLoad(String data) {
        if (data.length() < 2) return null;
        int a = Integer.parseInt(data.substring(0, 2), 16);
        return (a * 100.0) / 255.0;
    }
}