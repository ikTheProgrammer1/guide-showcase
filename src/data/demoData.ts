import type {
  AccessibilitySettings,
  Appointment,
  Bill,
  InsurancePolicy,
  RescheduleSlot,
} from '../types';

export const originalAppointment: Appointment = {
  id: 'appointment_robert_2026_09_10',
  provider: 'Dr. Maya Chen',
  specialty: 'Primary Care',
  date: '2026-09-10',
  dateLabel: 'September 10, 2026',
  time: '2:30 PM',
  status: 'Confirmed',
};

export const rescheduleSlots: RescheduleSlot[] = [
  {
    id: 'slot_2026_09_11_0900',
    date: '2026-09-11',
    dateLabel: 'September 11, 2026',
    dayLabel: 'Friday, September 11',
    time: '9:00 AM',
  },
  {
    id: 'slot_2026_09_12_1130',
    date: '2026-09-12',
    dateLabel: 'September 12, 2026',
    dayLabel: 'Saturday, September 12',
    time: '11:30 AM',
  },
  {
    id: 'slot_2026_09_14_1500',
    date: '2026-09-14',
    dateLabel: 'September 14, 2026',
    dayLabel: 'Monday, September 14',
    time: '3:00 PM',
  },
];

export const demoBill: Bill = {
  id: 'bill_office_visit_2026_08_20',
  label: 'Office Visit',
  providerCharge: 160,
  insurancePaid: 120,
  patientResponsibility: 40,
  status: 'Amount due',
};

export const demoInsurance: InsurancePolicy = {
  carrier: 'Harbor Health Plan',
  plan: 'Everyday Choice',
  memberId: 'HHP •••• 4821',
  status: 'Active',
};

export const defaultAccessibility: AccessibilitySettings = {
  textScale: 100,
  contrast: 'standard',
  density: 'standard',
  controlSize: 'standard',
  spacing: 'standard',
  emphasizeInteractive: false,
  readAloud: false,
};
