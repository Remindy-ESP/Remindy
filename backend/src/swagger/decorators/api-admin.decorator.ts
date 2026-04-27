import { applyDecorators, Get, Post, Put, Patch, Delete } from '@nestjs/common';
import {
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiParam,
} from '@nestjs/swagger';

const AdminErrors = () =>
  applyDecorators(
    ApiUnauthorizedResponse({ description: 'Unauthorized — admin JWT required' }),
    ApiForbiddenResponse({ description: 'Forbidden — insufficient admin role' }),
  );

// ── Admin Auth (CSRF) ──────────────────────────────────────────────

export const ApiAdminCsrf = () =>
  applyDecorators(
    Get('csrf'),
    ApiOperation({ summary: 'Get a CSRF token for admin requests' }),
    ApiOkResponse({ description: 'CSRF token set in cookie and returned in body' }),
    AdminErrors(),
  );

export const ApiAdminAuthPing = () =>
  applyDecorators(
    Post('ping'),
    ApiOperation({ summary: 'Check admin auth token validity' }),
    ApiOkResponse({ description: 'Token is valid' }),
    AdminErrors(),
  );

// ── Admin Me ────────────────────────────────────────────────────────

export const ApiAdminMe = () =>
  applyDecorators(
    Get('me'),
    ApiOperation({ summary: 'Get current admin profile and permissions' }),
    ApiOkResponse({ description: 'Admin profile with role and permissions' }),
    AdminErrors(),
  );

export const ApiAdminPing = () =>
  applyDecorators(
    Post('ping'),
    ApiOperation({ summary: 'Admin heartbeat / token check' }),
    ApiOkResponse({ description: 'Pong' }),
    AdminErrors(),
  );

// ── Admin MFA ───────────────────────────────────────────────────────

export const ApiAdminMfaSetup = () =>
  applyDecorators(
    Post('setup'),
    ApiOperation({ summary: 'Initialize MFA setup — returns OTP auth URL and QR code' }),
    ApiOkResponse({ description: 'OTP auth URL and QR code data URL' }),
    AdminErrors(),
  );

export const ApiAdminMfaEnable = () =>
  applyDecorators(
    Post('enable'),
    ApiOperation({ summary: 'Enable MFA after confirming the setup code' }),
    ApiOkResponse({ description: 'MFA enabled — returns new access token with mfaVerified=true' }),
    AdminErrors(),
  );

export const ApiAdminMfaVerify = () =>
  applyDecorators(
    Post('verify'),
    ApiOperation({ summary: 'Verify MFA code — returns a fully authenticated access token' }),
    ApiOkResponse({ description: 'MFA verified — returns access token' }),
    AdminErrors(),
  );

// ── Admin Dashboard ─────────────────────────────────────────────────

export const ApiAdminDashboard = () =>
  applyDecorators(
    Get(),
    ApiOperation({ summary: 'Get aggregated admin KPIs overview' }),
    ApiOkResponse({ description: 'Dashboard KPIs' }),
    AdminErrors(),
  );

// ── Admin Audit ─────────────────────────────────────────────────────

export const ApiAdminAuditList = () =>
  applyDecorators(
    Get(),
    ApiOperation({ summary: 'List admin action audit logs' }),
    ApiOkResponse({ description: 'List of admin audit logs' }),
    AdminErrors(),
  );

// ── Admin Users ─────────────────────────────────────────────────────

export const ApiAdminUsersList = () =>
  applyDecorators(
    Get(),
    ApiOperation({ summary: 'List users with filters and pagination' }),
    ApiOkResponse({ description: 'Paginated user list' }),
    AdminErrors(),
  );

export const ApiAdminUsersGetById = () =>
  applyDecorators(
    Get(':id'),
    ApiOperation({ summary: 'Get user details by ID' }),
    ApiParam({ name: 'id', description: 'User UUID' }),
    ApiOkResponse({ description: 'User details' }),
    ApiNotFoundResponse({ description: 'User not found' }),
    AdminErrors(),
  );

export const ApiAdminUsersBan = () =>
  applyDecorators(
    Post(':id/ban'),
    ApiOperation({ summary: 'Ban a user account' }),
    ApiParam({ name: 'id', description: 'User UUID' }),
    ApiOkResponse({ description: 'User banned' }),
    AdminErrors(),
  );

export const ApiAdminUsersUnban = () =>
  applyDecorators(
    Post(':id/unban'),
    ApiOperation({ summary: 'Unban a user account' }),
    ApiParam({ name: 'id', description: 'User UUID' }),
    ApiOkResponse({ description: 'User unbanned' }),
    AdminErrors(),
  );

export const ApiAdminUsersVerifyEmail = () =>
  applyDecorators(
    Post(':id/verify-email'),
    ApiOperation({ summary: 'Force verify a user email address' }),
    ApiParam({ name: 'id', description: 'User UUID' }),
    ApiOkResponse({ description: 'Email verified' }),
    AdminErrors(),
  );

export const ApiAdminUsersForceMfa = () =>
  applyDecorators(
    Post(':id/force-mfa'),
    ApiOperation({ summary: 'Force MFA enrollment for a user' }),
    ApiParam({ name: 'id', description: 'User UUID' }),
    ApiOkResponse({ description: 'MFA forced' }),
    AdminErrors(),
  );

export const ApiAdminUsersRevokeSessions = () =>
  applyDecorators(
    Post(':id/revoke-sessions'),
    ApiOperation({ summary: 'Revoke all active sessions for a user' }),
    ApiParam({ name: 'id', description: 'User UUID' }),
    ApiOkResponse({ description: 'Sessions revoked' }),
    AdminErrors(),
  );

export const ApiAdminUsersResetPassword = () =>
  applyDecorators(
    Post(':id/reset-password'),
    ApiOperation({ summary: 'Trigger a password reset for a user' }),
    ApiParam({ name: 'id', description: 'User UUID' }),
    ApiOkResponse({ description: 'Password reset email sent' }),
    AdminErrors(),
  );

// ── Admin RBAC ──────────────────────────────────────────────────────

export const ApiAdminRbacList = () =>
  applyDecorators(
    Get(),
    ApiOperation({ summary: 'List all roles with their permissions' }),
    ApiOkResponse({ description: 'List of roles' }),
    AdminErrors(),
  );

export const ApiAdminRbacCreate = () =>
  applyDecorators(
    Post(),
    ApiOperation({ summary: 'Create a new role' }),
    ApiCreatedResponse({ description: 'Role created' }),
    AdminErrors(),
  );

export const ApiAdminRbacUpdate = () =>
  applyDecorators(
    Put(':id'),
    ApiOperation({ summary: 'Update a role label/description' }),
    ApiParam({ name: 'id', description: 'Role ID' }),
    ApiOkResponse({ description: 'Role updated' }),
    AdminErrors(),
  );

export const ApiAdminRbacDelete = () =>
  applyDecorators(
    Delete(':id'),
    ApiOperation({ summary: 'Delete a role (forbidden on system roles)' }),
    ApiParam({ name: 'id', description: 'Role ID' }),
    ApiOkResponse({ description: 'Role deleted' }),
    AdminErrors(),
  );

export const ApiAdminRbacAddPermission = () =>
  applyDecorators(
    Post(':id/permissions'),
    ApiOperation({ summary: 'Add a permission to a role' }),
    ApiParam({ name: 'id', description: 'Role ID' }),
    ApiOkResponse({ description: 'Permission added' }),
    AdminErrors(),
  );

export const ApiAdminRbacRemovePermission = () =>
  applyDecorators(
    Delete(':id/permissions'),
    ApiOperation({ summary: 'Remove a permission from a role' }),
    ApiParam({ name: 'id', description: 'Role ID' }),
    ApiOkResponse({ description: 'Permission removed' }),
    AdminErrors(),
  );

// ── Admin Tickets ───────────────────────────────────────────────────

export const ApiAdminTicketsList = () =>
  applyDecorators(
    Get(),
    ApiOperation({ summary: 'List all support tickets' }),
    ApiOkResponse({ description: 'List of support tickets' }),
    AdminErrors(),
  );

export const ApiAdminTicketsGetById = () =>
  applyDecorators(
    Get(':id'),
    ApiOperation({ summary: 'Get support ticket details' }),
    ApiParam({ name: 'id', description: 'Ticket UUID' }),
    ApiOkResponse({ description: 'Ticket details' }),
    ApiNotFoundResponse({ description: 'Ticket not found' }),
    AdminErrors(),
  );

export const ApiAdminTicketsReply = () =>
  applyDecorators(
    Post(':id/reply'),
    ApiOperation({ summary: 'Reply to a support ticket' }),
    ApiParam({ name: 'id', description: 'Ticket UUID' }),
    ApiOkResponse({ description: 'Reply added' }),
    AdminErrors(),
  );

// ── Admin RGPD ──────────────────────────────────────────────────────

export const ApiAdminRgpdRequestExport = () =>
  applyDecorators(
    Post('exports/:userId'),
    ApiOperation({ summary: 'Request a RGPD data export for a user' }),
    ApiParam({ name: 'userId', description: 'User UUID' }),
    ApiOkResponse({ description: 'Export requested' }),
    AdminErrors(),
  );

export const ApiAdminRgpdListExports = () =>
  applyDecorators(
    Get('exports'),
    ApiOperation({ summary: 'List RGPD export requests' }),
    ApiOkResponse({ description: 'List of RGPD exports' }),
    AdminErrors(),
  );

export const ApiAdminRgpdDeleteUserData = () =>
  applyDecorators(
    Post('delete/:userId'),
    ApiOperation({ summary: 'Anonymize/delete RGPD user data' }),
    ApiParam({ name: 'userId', description: 'User UUID' }),
    ApiOkResponse({ description: 'User data anonymized' }),
    AdminErrors(),
  );

// ── Admin Security ──────────────────────────────────────────────────

export const ApiAdminSecurityGetLogs = () =>
  applyDecorators(
    Get('logs'),
    ApiOperation({ summary: 'List security logs with filters' }),
    ApiOkResponse({ description: 'Security logs' }),
    AdminErrors(),
  );

export const ApiAdminSecurityGetSuspicious = () =>
  applyDecorators(
    Get('logs/suspicious'),
    ApiOperation({ summary: 'Get suspicious events only' }),
    ApiOkResponse({ description: 'Suspicious security events' }),
    AdminErrors(),
  );

export const ApiAdminSecurityGetBlockedIps = () =>
  applyDecorators(
    Get('blocked-ips'),
    ApiOperation({ summary: 'List blocked IPs (active by default)' }),
    ApiOkResponse({ description: 'List of blocked IPs' }),
    AdminErrors(),
  );

export const ApiAdminSecurityBlockIp = () =>
  applyDecorators(
    Post('blocked-ips'),
    ApiOperation({ summary: 'Block an IP — super_admin only' }),
    ApiOkResponse({ description: 'IP blocked' }),
    AdminErrors(),
  );

export const ApiAdminSecurityUnblockIp = () =>
  applyDecorators(
    Delete('blocked-ips/:id'),
    ApiOperation({ summary: 'Unblock an IP — super_admin only' }),
    ApiParam({ name: 'id', description: 'Blocked IP record UUID' }),
    ApiOkResponse({ description: 'IP unblocked' }),
    AdminErrors(),
  );

export const ApiAdminSecurityGetIpActivity = () =>
  applyDecorators(
    Get('ip-activity/:ip'),
    ApiOperation({ summary: 'Get recent activity for a given IP' }),
    ApiParam({ name: 'ip', description: 'IP address' }),
    ApiOkResponse({ description: 'IP activity log' }),
    AdminErrors(),
  );

export const ApiAdminSecurityGetPolicy = () =>
  applyDecorators(
    Get('policy'),
    ApiOperation({ summary: 'Get current security policy' }),
    ApiOkResponse({ description: 'Security policy' }),
    AdminErrors(),
  );

export const ApiAdminSecurityUpdatePolicy = () =>
  applyDecorators(
    Patch('policy'),
    ApiOperation({ summary: 'Update the security policy — super_admin only' }),
    ApiOkResponse({ description: 'Policy updated' }),
    AdminErrors(),
  );

export const ApiAdminSecurityGetStats = () =>
  applyDecorators(
    Get('stats'),
    ApiOperation({ summary: 'Get security KPIs for the dashboard' }),
    ApiOkResponse({ description: 'Security statistics' }),
    AdminErrors(),
  );

// ── Admin Cloud ─────────────────────────────────────────────────────

export const ApiAdminCloudListSubscriptions = () =>
  applyDecorators(
    Get('subscriptions'),
    ApiOperation({ summary: 'List all subscriptions (admin view)' }),
    ApiOkResponse({ description: 'List of subscriptions' }),
    AdminErrors(),
  );

export const ApiAdminCloudUpdateSharedSubscription = () =>
  applyDecorators(
    Put('shared-subscriptions/:id'),
    ApiOperation({ summary: 'Update a shared subscription' }),
    ApiParam({ name: 'id', description: 'Subscription UUID' }),
    ApiOkResponse({ description: 'Subscription updated' }),
    AdminErrors(),
  );

export const ApiAdminCloudListDocuments = () =>
  applyDecorators(
    Get('documents'),
    ApiOperation({ summary: 'List all documents (admin view)' }),
    ApiOkResponse({ description: 'List of documents' }),
    AdminErrors(),
  );

export const ApiAdminCloudReprocessOcr = () =>
  applyDecorators(
    Post('documents/:id/reprocess-ocr'),
    ApiOperation({ summary: 'Reprocess OCR for a document (admin)' }),
    ApiParam({ name: 'id', description: 'Document UUID' }),
    ApiOkResponse({ description: 'OCR reprocessing triggered' }),
    AdminErrors(),
  );

// ── Admin Super ─────────────────────────────────────────────────────

export const ApiAdminSuperPing = () =>
  applyDecorators(
    Post('ping'),
    ApiOperation({ summary: 'Ping endpoint — super_admin scope only' }),
    ApiOkResponse({ description: 'Pong' }),
  );
