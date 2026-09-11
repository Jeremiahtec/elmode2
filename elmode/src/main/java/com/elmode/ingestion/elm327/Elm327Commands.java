package com.elmode.ingestion.elm327;

public final class Elm327Commands {

    private Elm327Commands() {
    }

    public static final String RESET = "AT Z";

    public static final String ECHO_OFF = "AT E0";

    public static final String LINEFEEDS_OFF = "AT L0";

    public static final String SPACES_OFF = "AT S0";

    public static final String PROTOCOL_AUTO = "AT SP 0";

    public static final String READ_VERSION = "AT I";

    public static final String[] INIT_SEQUENCE = {
            RESET, ECHO_OFF, LINEFEEDS_OFF, SPACES_OFF, PROTOCOL_AUTO
    };

    public static final char TERMINATOR = '\r';

    public static final String NO_DATA = "NODATA";

    public static final String ERROR_TOKEN = "ERROR";
}