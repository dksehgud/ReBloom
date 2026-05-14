package com.ssafy.rebloom.auth_service.auth.security;

import com.ssafy.rebloom.auth_service.auth.constants.Constants;
import jakarta.servlet.http.HttpServletRequest;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.web.DefaultOAuth2AuthorizationRequestResolver;
import org.springframework.security.oauth2.client.web.OAuth2AuthorizationRequestResolver;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest;
import org.springframework.security.oauth2.core.endpoint.OAuth2ParameterNames;
import org.springframework.stereotype.Component;

@Component
public class GatewayAwareOAuth2AuthorizationRequestResolver
    implements OAuth2AuthorizationRequestResolver {

    private static final String AUTHORIZATION_REQUEST_BASE_URI = "/oauth2/authorization";
    private static final String SUCCESS_REDIRECT_URI_PARAM = "redirect_uri";
    private static final String CALLBACK_PATH = "/oauth/callback";

    private final DefaultOAuth2AuthorizationRequestResolver delegate;

    @Value("${oauth2.gateway-prefix:/auth}")
    private String gatewayPrefix;

    @Value("${oauth2.allowed-success-redirect-origins:http://localhost:5174,http://10.0.2.2:5174}")
    private String allowedSuccessRedirectOrigins;

    public GatewayAwareOAuth2AuthorizationRequestResolver(
        ClientRegistrationRepository clientRegistrationRepository
    ) {
        this.delegate = new DefaultOAuth2AuthorizationRequestResolver(
            clientRegistrationRepository,
            AUTHORIZATION_REQUEST_BASE_URI
        );
    }

    @Override
    public OAuth2AuthorizationRequest resolve(HttpServletRequest request) {
        return customize(delegate.resolve(request), request);
    }

    @Override
    public OAuth2AuthorizationRequest resolve(HttpServletRequest request, String clientRegistrationId) {
        return customize(delegate.resolve(request, clientRegistrationId), request);
    }

    private OAuth2AuthorizationRequest customize(
        OAuth2AuthorizationRequest authorizationRequest,
        HttpServletRequest request
    ) {
        if (authorizationRequest == null) {
            return null;
        }

        saveSuccessRedirectUri(request);

        String registrationId = resolveRegistrationId(authorizationRequest, request);
        String redirectUri = resolveGatewayBaseUrl(request)
            + normalizePath(gatewayPrefix)
            + "/login/oauth2/code/"
            + registrationId;

        return OAuth2AuthorizationRequest
            .from(authorizationRequest)
            .redirectUri(redirectUri)
            .build();
    }

    private void saveSuccessRedirectUri(HttpServletRequest request) {
        String successRedirectUri = request.getParameter(SUCCESS_REDIRECT_URI_PARAM);

        if (successRedirectUri != null && isAllowedSuccessRedirectUri(successRedirectUri)) {
            request.getSession(true).setAttribute(
                Constants.OAUTH2_SUCCESS_REDIRECT_URI_SESSION_ATTRIBUTE,
                successRedirectUri
            );
        }
    }

    private boolean isAllowedSuccessRedirectUri(String successRedirectUri) {
        try {
            URI uri = new URI(successRedirectUri);

            if (!"http".equals(uri.getScheme()) && !"https".equals(uri.getScheme())) {
                return false;
            }

            if (!CALLBACK_PATH.equals(uri.getPath())) {
                return false;
            }

            String origin = uri.getScheme() + "://" + uri.getHost()
                + (uri.getPort() == -1 ? "" : ":" + uri.getPort());

            return allowedSuccessRedirectOriginSet().contains(origin);
        } catch (URISyntaxException e) {
            return false;
        }
    }

    private Set<String> allowedSuccessRedirectOriginSet() {
        return Arrays.stream(allowedSuccessRedirectOrigins.split(","))
            .map(String::trim)
            .filter(origin -> !origin.isBlank())
            .collect(Collectors.toSet());
    }

    private String resolveRegistrationId(
        OAuth2AuthorizationRequest authorizationRequest,
        HttpServletRequest request
    ) {
        Object registrationId = authorizationRequest
            .getAttributes()
            .get(OAuth2ParameterNames.REGISTRATION_ID);

        if (registrationId != null) {
            return registrationId.toString();
        }

        String requestUri = request.getRequestURI();
        return requestUri.substring(requestUri.lastIndexOf('/') + 1);
    }

    private String resolveGatewayBaseUrl(HttpServletRequest request) {
        String scheme = firstHeaderValue(request, "X-Forwarded-Proto", request.getScheme());
        String host = firstHeaderValue(request, "X-Forwarded-Host", request.getHeader("Host"));

        if (host == null || host.isBlank()) {
            host = request.getServerName()
                + (isDefaultPort(scheme, request.getServerPort()) ? "" : ":" + request.getServerPort());
        }

        return scheme + "://" + host;
    }

    private String firstHeaderValue(HttpServletRequest request, String headerName, String fallback) {
        String value = request.getHeader(headerName);

        if (value == null || value.isBlank()) {
            return fallback;
        }

        return value.split(",")[0].trim();
    }

    private boolean isDefaultPort(String scheme, int port) {
        return ("http".equals(scheme) && port == 80)
            || ("https".equals(scheme) && port == 443);
    }

    private String normalizePath(String path) {
        if (path == null || path.isBlank() || "/".equals(path)) {
            return "";
        }

        return path.startsWith("/") ? path : "/" + path;
    }
}
