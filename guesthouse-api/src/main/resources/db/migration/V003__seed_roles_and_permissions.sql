-- =============================================================================
--  V003 — Seed Roles, Permissions, Role-Permission Links, and Demo Accounts
-- =============================================================================

-- Seed Roles
INSERT INTO roles (id, name, description, is_system) VALUES
    ('11111111-1111-1111-1111-111111111111', 'OWNER', 'Full property ownership access', true),
    ('22222222-2222-2222-2222-222222222222', 'MANAGER', 'General management access', true),
    ('33333333-3333-3333-3333-333333333333', 'RECEPTIONIST', 'Front desk operational access', true),
    ('44444444-4444-4444-4444-444444444444', 'ACCOUNTANT', 'Financial and accounting access', true),
    ('55555555-5555-5555-5555-555555555555', 'HOUSEKEEPING', 'Housekeeping task management', true),
    ('66666666-6666-6666-6666-666666666666', 'MAINTENANCE', 'Maintenance and repairs', true),
    ('77777777-7777-7777-7777-777777777777', 'READONLY', 'Read-only view access', true);

-- Seed Permissions Catalogue (from conventions.md §8)
INSERT INTO permissions (module, permission_key, description) VALUES
    ('dashboard', 'dashboard:view', 'View dashboard operational overview'),
    ('property', 'property:view', 'View property details'),
    ('property', 'property:edit', 'Edit property configuration'),
    ('settings', 'settings:view', 'View system settings'),
    ('settings', 'settings:edit', 'Edit system settings'),
    ('onboarding', 'onboarding:manage', 'Manage onboarding process'),
    ('staff', 'staff:view', 'View staff directory'),
    ('staff', 'staff:create', 'Create staff account'),
    ('staff', 'staff:edit', 'Edit staff account'),
    ('staff', 'staff:deactivate', 'Deactivate staff account'),
    ('staff', 'staff:reset_password', 'Reset staff password'),
    ('role', 'role:view', 'View role permissions'),
    ('role', 'role:manage', 'Manage custom roles'),
    ('room_type', 'room_type:view', 'View room types'),
    ('room_type', 'room_type:create', 'Create room type'),
    ('room_type', 'room_type:edit', 'Edit room type'),
    ('room_type', 'room_type:delete', 'Delete room type'),
    ('amenity', 'amenity:view', 'View amenities'),
    ('amenity', 'amenity:manage', 'Manage amenities'),
    ('room', 'room:view', 'View rooms'),
    ('room', 'room:create', 'Create room'),
    ('room', 'room:edit', 'Edit room'),
    ('room', 'room:delete', 'Delete room'),
    ('room', 'room:change_status', 'Change room operational status'),
    ('room', 'room:block', 'Block room from availability'),
    ('room', 'room:unblock', 'Unblock room'),
    ('rate', 'rate:view', 'View rate plans'),
    ('rate', 'rate:manage', 'Manage rate plans'),
    ('availability', 'availability:view', 'View availability calendar'),
    ('reservation', 'reservation:view', 'View reservations'),
    ('reservation', 'reservation:create', 'Create reservation'),
    ('reservation', 'reservation:edit', 'Edit reservation'),
    ('reservation', 'reservation:cancel', 'Cancel reservation'),
    ('reservation', 'reservation:no_show', 'Mark reservation no-show'),
    ('reservation', 'reservation:assign_room', 'Assign room to reservation'),
    ('reservation', 'reservation:change_room', 'Change reservation room'),
    ('reservation', 'reservation:extend', 'Extend reservation stay'),
    ('reservation', 'reservation:add_charge', 'Add folio charge'),
    ('reservation', 'reservation:override_availability', 'Override availability block'),
    ('guest', 'guest:view', 'View guest directory'),
    ('guest', 'guest:create', 'Create guest profile'),
    ('guest', 'guest:edit', 'Edit guest profile'),
    ('guest', 'guest:delete', 'Delete guest profile'),
    ('guest', 'guest:view_documents', 'View guest identity documents'),
    ('guest', 'guest:upload_documents', 'Upload guest documents'),
    ('guest', 'guest:merge', 'Merge duplicate guest profiles'),
    ('guest', 'guest:anonymize', 'Anonymize guest profile'),
    ('guest', 'guest:blacklist', 'Blacklist guest'),
    ('checkin', 'checkin:view', 'View check-in schedule'),
    ('checkin', 'checkin:perform', 'Perform check-in'),
    ('checkin', 'checkin:override', 'Override check-in requirement'),
    ('checkout', 'checkout:view', 'View check-out schedule'),
    ('checkout', 'checkout:perform', 'Perform check-out'),
    ('checkout', 'checkout:override_balance', 'Override check-out balance block'),
    ('service', 'service:view', 'View service catalogue'),
    ('service', 'service:manage', 'Manage service catalogue'),
    ('payment', 'payment:view', 'View payment transactions'),
    ('payment', 'payment:create', 'Process payment'),
    ('payment', 'payment:void', 'Void payment'),
    ('payment', 'payment:adjust', 'Adjust payment'),
    ('refund', 'refund:view', 'View refunds'),
    ('refund', 'refund:create', 'Process refund'),
    ('invoice', 'invoice:view', 'View invoices'),
    ('invoice', 'invoice:create', 'Issue invoice'),
    ('invoice', 'invoice:void', 'Void invoice'),
    ('invoice', 'invoice:reissue', 'Reissue invoice'),
    ('housekeeping', 'housekeeping:view', 'View assigned housekeeping tasks'),
    ('housekeeping', 'housekeeping:view_all', 'View all housekeeping tasks'),
    ('housekeeping', 'housekeeping:create', 'Create housekeeping task'),
    ('housekeeping', 'housekeeping:assign', 'Assign housekeeping task'),
    ('housekeeping', 'housekeeping:update', 'Update housekeeping task'),
    ('housekeeping', 'housekeeping:inspect', 'Inspect completed room cleaning'),
    ('maintenance', 'maintenance:view', 'View assigned maintenance issues'),
    ('maintenance', 'maintenance:view_all', 'View all maintenance issues'),
    ('maintenance', 'maintenance:create', 'Report maintenance issue'),
    ('maintenance', 'maintenance:assign', 'Assign maintenance work order'),
    ('maintenance', 'maintenance:update', 'Update maintenance status'),
    ('maintenance', 'maintenance:complete', 'Mark maintenance complete'),
    ('expense', 'expense:view', 'View operational expenses'),
    ('expense', 'expense:create', 'Create expense'),
    ('expense', 'expense:edit', 'Edit expense'),
    ('expense', 'expense:approve', 'Approve expense'),
    ('expense', 'expense:delete', 'Delete expense'),
    ('report', 'report:view', 'View reports'),
    ('report', 'report:export', 'Export reports'),
    ('notification', 'notification:view', 'View notifications'),
    ('notification', 'notification:manage', 'Manage notification settings'),
    ('audit', 'audit:view', 'View audit logs'),
    ('file', 'file:upload', 'Upload files'),
    ('file', 'file:download', 'Download files'),
    ('file', 'file:delete', 'Delete files'),
    ('dev', 'dev:reset_data', 'Reset development test data');

-- Link OWNER to ALL permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT '11111111-1111-1111-1111-111111111111', id FROM permissions;

-- Link MANAGER to core operational & staff permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT '22222222-2222-2222-2222-222222222222', id FROM permissions
WHERE permission_key NOT IN ('dev:reset_data', 'onboarding:manage');

-- Link RECEPTIONIST to front desk & guest permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT '33333333-3333-3333-3333-333333333333', id FROM permissions
WHERE module IN ('dashboard', 'reservation', 'guest', 'checkin', 'checkout', 'service', 'payment', 'refund', 'invoice', 'availability', 'room', 'housekeeping', 'maintenance')
  AND permission_key NOT LIKE '%:delete' AND permission_key NOT LIKE '%:void' AND permission_key NOT LIKE '%:manage';

-- Seed Default Property
INSERT INTO properties (id, name, code, description, timezone, currency) VALUES
    ('a0000000-0000-0000-0000-000000000001', 'Sot Samban Guest House', 'SSGH', 'Local family-operated guest house', 'Asia/Phnom_Penh', 'USD');

-- Seed Demo Users (Password: password123 -> $2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xD0m1bC.I8H9p8.K)
INSERT INTO users (id, property_id, email, password_hash, display_name, phone, preferred_language, theme, status) VALUES
    ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'owner@sotsamban.local', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xD0m1bC.I8H9p8.K', 'Sot Samban (Owner)', '+85512345678', 'en', 'system', 'ACTIVE'),
    ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'manager@sotsamban.local', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xD0m1bC.I8H9p8.K', 'Channa Manager', '+85512345679', 'en', 'system', 'ACTIVE'),
    ('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'receptionist@sotsamban.local', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xD0m1bC.I8H9p8.K', 'Bopha Receptionist', '+85512345680', 'en', 'system', 'ACTIVE');

-- Assign User Roles
INSERT INTO user_roles (user_id, role_id) VALUES
    ('b0000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111'),
    ('b0000000-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222'),
    ('b0000000-0000-0000-0000-000000000003', '33333333-3333-3333-3333-333333333333');
