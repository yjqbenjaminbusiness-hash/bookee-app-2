import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Hr, Section,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "Bookee"

interface FeedbackEmailProps {
  category?: string
  message?: string
  userId?: string
  userEmail?: string
  userName?: string
  pageContext?: string
  timestamp?: string
}

const FeedbackEmail = ({ category, message, userId, userEmail, userName, pageContext, timestamp }: FeedbackEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>New feedback from {userName || 'a user'} — {SITE_NAME}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>📬 New Feedback</Heading>

        {category && (
          <Section style={fieldSection}>
            <Text style={label}>Category</Text>
            <Text style={value}>{category}</Text>
          </Section>
        )}

        <Section style={fieldSection}>
          <Text style={label}>Message</Text>
          <Text style={value}>{message || '(No message provided)'}</Text>
        </Section>

        <Hr style={hr} />

        <Section style={fieldSection}>
          <Text style={label}>User Info</Text>
          <Text style={value}>
            {userName ? `Name: ${userName}` : 'Anonymous user'}
            {userEmail ? ` • Email: ${userEmail}` : ''}
            {userId ? ` • ID: ${userId}` : ''}
          </Text>
        </Section>

        {pageContext && (
          <Section style={fieldSection}>
            <Text style={label}>Page</Text>
            <Text style={value}>{pageContext}</Text>
          </Section>
        )}

        {timestamp && (
          <Section style={fieldSection}>
            <Text style={label}>Submitted</Text>
            <Text style={value}>{timestamp}</Text>
          </Section>
        )}

        <Text style={footer}>This feedback was submitted via {SITE_NAME}.</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: FeedbackEmail,
  subject: (data: Record<string, any>) => `[Feedback] ${data.category || 'General'} — ${SITE_NAME}`,
  displayName: 'User feedback',
  to: 'yjqbenjaminbusiness@gmail.com',
  previewData: {
    category: 'Bug',
    message: 'The booking page is not loading correctly on mobile.',
    userId: 'abc-123',
    userEmail: 'jane@example.com',
    userName: 'Jane',
    pageContext: '/player/dashboard',
    timestamp: '2026-04-06T12:00:00Z',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'DM Sans', Arial, sans-serif" }
const container = { padding: '24px 28px', maxWidth: '560px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#1a3a2a', margin: '0 0 24px' }
const fieldSection = { marginBottom: '12px' }
const label = { fontSize: '11px', fontWeight: 'bold' as const, color: '#888', textTransform: 'uppercase' as const, letterSpacing: '0.5px', margin: '0 0 2px' }
const value = { fontSize: '14px', color: '#222', lineHeight: '1.5', margin: '0' }
const hr = { borderColor: '#e5e7eb', margin: '16px 0' }
const footer = { fontSize: '12px', color: '#999', margin: '24px 0 0' }
