package com.fitnessapp.gateway.filter;

import com.fitnessapp.gateway.security.JwtTokenProvider;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.List;

@Component
@Slf4j
public class JwtAuthenticationGatewayFilter implements GlobalFilter, Ordered {

    private final JwtTokenProvider jwtTokenProvider;

    // Paths that don't require authentication
    private static final List<String> PUBLIC_PATHS = List.of(
            "/api/auth/",
            "/api/health",
            "/api/nutrition/plans"
    );

    public JwtAuthenticationGatewayFilter(JwtTokenProvider jwtTokenProvider) {
        this.jwtTokenProvider = jwtTokenProvider;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        String path = request.getURI().getPath();

        // Skip authentication for public paths
        if (isPublicPath(path)) {
            return chain.filter(exchange);
        }

        // Skip OPTIONS requests
        if ("OPTIONS".equals(request.getMethod().name())) {
            return chain.filter(exchange);
        }

        String authHeader = request.getHeaders().getFirst("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
            return exchange.getResponse().setComplete();
        }

        String token = authHeader.substring(7);
        try {
            if (jwtTokenProvider.validateToken(token)) {
                String username = jwtTokenProvider.extractUsername(token);
                Long userId = jwtTokenProvider.extractUserId(token);
                // Add user email and userId as headers for downstream services
                ServerHttpRequest.Builder requestBuilder = request.mutate()
                        .header("X-User-Email", username);
                if (userId != null) {
                    requestBuilder.header("X-User-Id", String.valueOf(userId));
                }
                ServerHttpRequest modifiedRequest = requestBuilder.build();
                return chain.filter(exchange.mutate().request(modifiedRequest).build());
            }
        } catch (Exception e) {
            log.error("JWT validation failed: {}", e.getMessage());
        }

        exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
        return exchange.getResponse().setComplete();
    }

    private boolean isPublicPath(String path) {
        // GET /api/nutrition/plans and /api/nutrition/plans/{id} are public
        if (path.startsWith("/api/nutrition/plans") && !path.contains("enroll")) {
            return true;
        }
        return PUBLIC_PATHS.stream().anyMatch(path::startsWith);
    }

    @Override
    public int getOrder() {
        return -1;
    }
}

