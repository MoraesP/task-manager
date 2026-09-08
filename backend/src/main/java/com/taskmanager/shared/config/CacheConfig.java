package com.taskmanager.shared.config;

import java.util.concurrent.TimeUnit;

import org.springframework.cache.CacheManager;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.github.benmanes.caffeine.cache.Caffeine;

/**
 * O único cache do sistema é o relatório por projeto (ADR 0006). O TTL é uma
 * rede de segurança; o serviço de relatório faz a evicção explícita a cada
 * escrita de tarefa.
 */
@Configuration
public class CacheConfig {

    public static final String PROJECT_REPORT_CACHE = "projectReport";

    @Bean
    CacheManager cacheManager(AppProperties properties) {
        CaffeineCacheManager manager = new CaffeineCacheManager(PROJECT_REPORT_CACHE);
        manager.setCaffeine(Caffeine.newBuilder()
                .expireAfterWrite(properties.report().cacheTtl().toSeconds(), TimeUnit.SECONDS)
                .maximumSize(1_000));
        return manager;
    }
}
