// Trainer Tickets page — renders the shared TicketManagement component.
// Access is gated inside the component by PermissionGuard:
// the user needs either `manage_queries` OR `respond_queries`.
// A trainer with only `respond_queries` is server-side scoped to tickets
// assigned to them; with `manage_queries` they see all.
export { default } from '@/components/TicketManagement';
