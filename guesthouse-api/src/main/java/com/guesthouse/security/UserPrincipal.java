package com.guesthouse.security;

import com.guesthouse.entity.Permission;
import com.guesthouse.entity.Role;
import com.guesthouse.entity.User;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.*;

public class UserPrincipal implements UserDetails {

    private final UUID id;
    private final UUID propertyId;
    private final String email;
    private final String password;
    private final String displayName;
    private final String status;
    private final Collection<? extends GrantedAuthority> authorities;

    public UserPrincipal(UUID id, UUID propertyId, String email, String password, String displayName, String status, Collection<? extends GrantedAuthority> authorities) {
        this.id = id;
        this.propertyId = propertyId;
        this.email = email;
        this.password = password;
        this.displayName = displayName;
        this.status = status;
        this.authorities = authorities;
    }

    public static UserPrincipal create(User user) {
        Set<GrantedAuthority> authorities = new HashSet<>();

        // Role authorities (ROLE_OWNER, etc.)
        for (Role role : user.getRoles()) {
            authorities.add(new SimpleGrantedAuthority("ROLE_" + role.getName()));
            // Permission authorities (booking:cancel, etc.)
            for (Permission permission : role.getPermissions()) {
                authorities.add(new SimpleGrantedAuthority(permission.getPermissionKey()));
            }
        }

        return new UserPrincipal(
                user.getId(),
                user.getPropertyId(),
                user.getEmail(),
                user.getPasswordHash(),
                user.getDisplayName(),
                user.getStatus(),
                authorities
        );
    }

    public UUID getId() {
        return id;
    }

    public UUID getPropertyId() {
        return propertyId;
    }

    public String getDisplayName() {
        return displayName;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return !"LOCKED".equalsIgnoreCase(status);
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return "ACTIVE".equalsIgnoreCase(status);
    }
}
