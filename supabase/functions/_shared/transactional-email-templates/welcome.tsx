import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Preview, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "Bookee"

interface WelcomeEmailProps {
  name?: string
}

const WelcomeEmail = ({ name }: WelcomeEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Welcome to Bookee — let's get you booked!</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>
          {name ? `Welcome, ${name}! 🎉` : 'Welcome to Bookee! 🎉'}
        </Heading>
        <Text style={text}>
          You're all set! {SITE_NAME} makes it easy to discover activities, join
          groups, and book your favourite sports sessions.
        </Text>
        <Text style={text}>Here's what you can do next:</Text>
        <Text style={text}>
          🔍 <strong>Browse activities</strong> — find games near you{'\n'}
          👥 <strong>Join a group</strong> — play with regulars{'\n'}
          📅 <strong>Book a slot</strong> — secure your spot in seconds
        </Text>
        <Button style={button} href="https://bookee-app.com/player/events">
          Explore Activities
        </Button>
        <Text style={footer}>Happy playing! — The {SITE_NAME} Team</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: WelcomeEmail,
  subject: 'Welcome to Bookee! 🎉',
  displayName: 'Welcome email',
  previewData: { name: 'Jane' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'DM Sans', Arial, sans-serif" }
const container = { padding: '24px 28px', maxWidth: '560px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#1a3a2a', margin: '0 0 24px' }
const text = { fontSize: '14px', color: '#55636e', lineHeight: '1.6', margin: '0 0 20px', whiteSpace: 'pre-line' as const }
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
