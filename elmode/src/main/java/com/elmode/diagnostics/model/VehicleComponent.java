package com.elmode.diagnostics.model;

/** Vehicle systems the diagnostic engine evaluates independently. */
public enum VehicleComponent {
    ENGINE("Engine"),
    COOLING_SYSTEM("Cooling System"),
    LUBRICATION_SYSTEM("Lubrication System"),
    BATTERY_CHARGING_SYSTEM("Battery / Charging System");

    private final String displayName;

    VehicleComponent(String displayName) {
        this.displayName = displayName;
    }

    public String displayName() {
        return displayName;
    }
}
