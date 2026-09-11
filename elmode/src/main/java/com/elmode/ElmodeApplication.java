package com.elmode;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class ElmodeApplication {
	public static void main(String[] args) {
		SpringApplication.run(ElmodeApplication.class, args);
	}
}