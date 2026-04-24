import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Preview, Text, Section,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "Bookee"

interface ActivityUpdateProps {
  recipientName?: string
  activityTitle?: string
  message?: string
  activityUrl?: string
}

const ActivityUpdateEmail = ({
  recipientName, activityTitle, message, activityUrl,
}: ActivityUpdateProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Update from {activityTitle || 'your activity'}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>📣 Activity Update</Heading>
        <Text style={text}>
          {recipientName ? `Hey ${recipientName},` : 'Hi there,'}
        </Text>
        <Text style={text}>
          The organizer of <strong>{activityTitle || 'your activity'}</strong> just posted an update:
        </Text>
        <Section style={messageBox}>
          <Text style={messageText}>{message || ''}</Text>
        </Section>
        {activityUrl && (
          <Button style={button} href={activityUrl}>
            View Activity
          </Button>
        )}
        <Text style={footer}>— The {SITE_NAME} Team</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: ActivityUpdateEmail,
  subject: (data: Record<string, any>) =>
    `Update — ${data.activityTitle || 'Your Activity'}`,
  displayName: 'Activity update',
  previewData: {
    recipientName: 'Jane',
    activityTitle: 'Friday Night Badminton',
    message: 'Court has been moved to Court 5. See you there!',
    activityUrl: 'https://bookee-app.com/player/events/123',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'DM Sans', Arial, sans-serif" }
const container = { padding: '24px 28px', maxWidth: '560px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#1a3a2a', margin: '0 0 20px' }
const text = { fontSize: '14px', color: '#55636e', lineHeight: '1.6', margin: '0 0 16px' }
const messageBox = {
  backgroundColor: '#f0faf4',
  borderLeft: '3px solid #1A7A4A',
  borderRadius: '8px',
  padding: '14px 18px',
  margin: '0 0 24px',
}
const messageText = { fontSize: '15px', color: '#1a3a2a', lineHeight: '1.6', margin: 0 }
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