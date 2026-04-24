import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Preview, Text, Section, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "Bookee"

interface OrganizerAlertProps {
  organizerName?: string
  activityTitle?: string
  participantName?: string
  date?: string
  time?: string
  filledSlots?: number
  maxSlots?: number
  manageUrl?: string
}

const OrganizerAlertEmail = ({
  organizerName, activityTitle, participantName, date, time,
  filledSlots, maxSlots, manageUrl,
}: OrganizerAlertProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>New booking on {activityTitle || 'your activity'}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>🎉 New Booking</Heading>
        <Text style={text}>
          {organizerName ? `Hi ${organizerName},` : 'Hi,'} you have a new participant!
        </Text>
        <Section style={detailsBox}>
          {activityTitle && <Text style={detailRow}>🏷️ <strong>{activityTitle}</strong></Text>}
          {participantName && <Text style={detailRow}>👤 {participantName}</Text>}
          {date && <Text style={detailRow}>📅 {date}</Text>}
          {time && <Text style={detailRow}>🕐 {time}</Text>}
          {typeof filledSlots === 'number' && typeof maxSlots === 'number' && (
            <Text style={detailRow}>📊 {filledSlots} / {maxSlots} slots filled</Text>
          )}
        </Section>
        {manageUrl && (
          <Button style={button} href={manageUrl}>
            Manage Activity
          </Button>
        )}
        <Hr style={hr} />
        <Text style={footer}>— The {SITE_NAME} Team</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: OrganizerAlertEmail,
  subject: (data: Record<string, any>) =>
    `New booking — ${data.activityTitle || 'Your Activity'}`,
  displayName: 'Organizer alert',
  previewData: {
    organizerName: 'Alex',
    activityTitle: 'Friday Night Badminton',
    participantName: 'Jane Doe',
    date: 'Friday, 18 Apr 2026',
    time: '7:00 PM – 9:00 PM',
    filledSlots: 7,
    maxSlots: 10,
    manageUrl: 'https://bookee-app.com/organizer/events/123',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'DM Sans', Arial, sans-serif" }
const container = { padding: '24px 28px', maxWidth: '560px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#1a3a2a', margin: '0 0 20px' }
const text = { fontSize: '14px', color: '#55636e', lineHeight: '1.6', margin: '0 0 20px' }
const detailsBox = {
  backgroundColor: '#fff8e6',
  borderRadius: '12px',
  padding: '16px 20px',
  margin: '0 0 20px',
}
const detailRow = { fontSize: '14px', color: '#1a3a2a', margin: '4px 0', lineHeight: '1.6' }
const hr = { borderColor: '#e5e7eb', margin: '24px 0 16px' }
const button = {
  backgroundColor: '#C47A00',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: 'bold' as const,
  borderRadius: '12px',
  padding: '12px 24px',
  textDecoration: 'none',
}
const footer = { fontSize: '12px', color: '#999', margin: 0 }