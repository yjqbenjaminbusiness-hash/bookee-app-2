import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Preview, Text, Section, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "Bookee"

interface BookingConfirmationProps {
  playerName?: string
  activityTitle?: string
  date?: string
  time?: string
  venue?: string
  amount?: string
  bookingId?: string
}

const BookingConfirmationEmail = ({
  playerName, activityTitle, date, time, venue, amount, bookingId,
}: BookingConfirmationProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your booking is confirmed — {activityTitle || 'Activity'}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Booking Confirmed ✅</Heading>
        <Text style={text}>
          {playerName ? `Hey ${playerName}, your` : 'Your'} spot has been confirmed!
        </Text>

        <Section style={detailsBox}>
          {activityTitle && <Text style={detailRow}>🏷️ <strong>{activityTitle}</strong></Text>}
          {date && <Text style={detailRow}>📅 {date}</Text>}
          {time && <Text style={detailRow}>🕐 {time}</Text>}
          {venue && <Text style={detailRow}>📍 {venue}</Text>}
          {amount && <Text style={detailRow}>💰 {amount}</Text>}
        </Section>

        {bookingId && (
          <>
            <Hr style={hr} />
            <Text style={refText}>Booking ref: {bookingId}</Text>
          </>
        )}

        <Button style={button} href="https://bookee-app.com/player/bookings">
          View My Bookings
        </Button>

        <Text style={footer}>See you there! — The {SITE_NAME} Team</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: BookingConfirmationEmail,
  subject: (data: Record<string, any>) =>
    `Booking Confirmed — ${data.activityTitle || 'Your Activity'}`,
  displayName: 'Booking confirmation',
  previewData: {
    playerName: 'Jane',
    activityTitle: 'Friday Night Badminton',
    date: 'Friday, 18 Apr 2026',
    time: '7:00 PM – 9:00 PM',
    venue: 'Sports Hub Court 3',
    amount: '$15.00',
    bookingId: 'BK-2026-0418',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'DM Sans', Arial, sans-serif" }
const container = { padding: '24px 28px', maxWidth: '560px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#1a3a2a', margin: '0 0 20px' }
const text = { fontSize: '14px', color: '#55636e', lineHeight: '1.6', margin: '0 0 20px' }
const detailsBox = {
  backgroundColor: '#f0faf4',
  borderRadius: '12px',
  padding: '16px 20px',
  margin: '0 0 20px',
}
const detailRow = { fontSize: '14px', color: '#1a3a2a', margin: '4px 0', lineHeight: '1.6' }
const hr = { borderColor: '#e5e7eb', margin: '16px 0' }
const refText = { fontSize: '12px', color: '#888', margin: '0 0 20px' }
const button = {
  backgroundColor: '#1A7A4A',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: 'bold' as const,
  borderRadius: '12px',
  padding: '12px 24px',
  textDecoration: 'none',
}
const footer = { fontSize: '12px', color: '#999', margin: '28px 0 0' }
