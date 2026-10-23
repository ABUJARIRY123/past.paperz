// src/constants/roles.js

// Role = permission / plan level (stored in profiles.role)
export const ROLES = {
  FREE: 'free',
  MEMBER: 'member',
  PREMIUM: 'premium',
  SYSADMIN: 'sysadmin',
};

export const DASHBOARD_BY_ROLE = {
  free: '/dashboard',
  member: '/memberdashboard',
  premium: '/premiumdashboard',
  sysadmin: '/sysadmin',
};

// User type = who the person is (stored in profiles.user_type)
// `value` must match the Postgres enum `user_type` exactly.
export const USER_TYPES = [
  { value: 'teacher',        label: 'Teacher',        hint: 'I teach students',             needsOrganisation: true, organisationLabel: 'School name' },
  { value: 'parent',         label: 'Parent',         hint: 'I support my children',        needsOrganisation: true, organisationLabel: 'School name' },
  { value: 'student',        label: 'Student',        hint: 'I am learning',                needsOrganisation: true, organisationLabel: 'School name' },
  { value: 'school',         label: 'School',         hint: 'I represent a school',         needsOrganisation: true, organisationLabel: 'School name' },
  { value: 'tuition_center', label: 'Tuition center', hint: 'I run a tuition center',       needsOrganisation: true, organisationLabel: 'Tuition center name' },
  { value: 'consultancy',    label: 'Consultancy',    hint: 'I advise schools or families', needsOrganisation: true, organisationLabel: 'Consultancy name' },
];

export const USER_TYPE_LABEL = Object.fromEntries(USER_TYPES.map((t) => [t.value, t.label]));