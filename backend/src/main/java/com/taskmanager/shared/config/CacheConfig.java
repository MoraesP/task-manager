package com.taskmanager.shared.config;

import java.util.concurrent.TimeUnit;

import org.springframework.cache.CacheManager;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.github.benmanes.caffeine.cache.Caffeine;

/**
 * The only cache in the system is the per-project report (ADR 0006). TTL is a
 * safety net; the report service evicts explicitly on every task write.
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
