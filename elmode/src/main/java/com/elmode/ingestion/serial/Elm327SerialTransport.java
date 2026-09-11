package com.elmode.ingestion.serial;

import com.fazecast.jSerialComm.SerialPort;
import com.elmode.ingestion.elm327.Elm327Commands;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

public class Elm327SerialTransport implements AutoCloseable {

    private static final Logger log = LoggerFactory.getLogger(Elm327SerialTransport.class);

    private final String portName;
    private final int baudRate;
    private final int dataBits;
    private final int stopBits;
    private final int parity;
    private final int readTimeoutMs;
    private final int writeTimeoutMs;

    private SerialPort port;

    public Elm327SerialTransport(String portName, int baudRate, int dataBits,
                                 int stopBits, int parity, int readTimeoutMs, int writeTimeoutMs) {
        this.portName = portName;
        this.baudRate = baudRate;
        this.dataBits = dataBits;
        this.stopBits = stopBits;
        this.parity = parity;
        this.readTimeoutMs = readTimeoutMs;
        this.writeTimeoutMs = writeTimeoutMs;
    }


    public synchronized void connect() throws SerialConnectionException {
        log.info("Attempting to open serial port [{}] at {} baud", portName, baudRate);

        port = SerialPort.getCommPort(portName);
        port.setComPortParameters(baudRate, dataBits, stopBits, parity);
        port.setComPortTimeouts(
                SerialPort.TIMEOUT_READ_SEMI_BLOCKING | SerialPort.TIMEOUT_WRITE_BLOCKING,
                readTimeoutMs,
                writeTimeoutMs
        );

        if (!port.openPort()) {
            throw new SerialConnectionException("Failed to open serial port: " + portName);
        }

        log.info("Serial port [{}] opened successfully. Beginning ELM327 initialization.", portName);

        try {
            for (String cmd : Elm327Commands.INIT_SEQUENCE) {
                String response = sendCommand(cmd);
                log.debug("INIT '{}' -> '{}'", cmd, response);
            }
        } catch (IOException e) {
            port.closePort();
            throw new SerialConnectionException("ELM327 initialization sequence failed on port " + portName, e);
        }

        log.info("ELM327 adapter initialized successfully on [{}]", portName);
    }

    public synchronized String sendCommand(String command) throws IOException {
        if (port == null || !port.isOpen()) {
            throw new IOException("Serial port is not open");
        }

        OutputStream out = port.getOutputStream();
        InputStream in = port.getInputStream();

        String framed = command + Elm327Commands.TERMINATOR;
        out.write(framed.getBytes(StandardCharsets.US_ASCII));
        out.flush();

        StringBuilder response = new StringBuilder();
        long deadline = System.currentTimeMillis() + readTimeoutMs;
        int b;

        while (System.currentTimeMillis() < deadline) {
            if (in.available() > 0) {
                b = in.read();
                if (b == -1) break;
                char c = (char) b;
                if (c == '>') {
                    // ELM327 prompt marks end-of-response
                    break;
                }
                if (c != '\r' && c != '\n') {
                    response.append(c);
                }
            } else {
                try {
                    Thread.sleep(2);
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    throw new IOException("Interrupted while awaiting serial response", ie);
                }
            }
        }

        if (response.isEmpty()) {
            throw new IOException("Timed out awaiting response to command: " + command);
        }

        return response.toString().trim();
    }

    public synchronized boolean isConnected() {
        return port != null && port.isOpen();
    }

    @Override
    public synchronized void close() {
        if (port != null && port.isOpen()) {
            log.info("Closing serial port [{}]", portName);
            port.closePort();
        }
    }

    public static class SerialConnectionException extends Exception {
        public SerialConnectionException(String message) {
            super(message);
        }

        public SerialConnectionException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}