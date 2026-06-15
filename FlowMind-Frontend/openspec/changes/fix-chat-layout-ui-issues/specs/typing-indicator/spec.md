## ADDED Requirements

### Requirement: Typing indicator while waiting for response

Feature: Typing indicator
Rule: While the AI response is being generated, a WhatsApp-style animated three-dots indicator is shown to provide feedback that the system is working.

#### Scenario: Typing indicator shown during response
- **GIVEN** the user has sent a message that is displayed optimistically
- **WHEN** the system is waiting for the AI response
- **THEN** a three-dot typing animation is displayed below the user's message

#### Scenario: Typing indicator hidden on response received
- **GIVEN** the typing indicator is visible
- **WHEN** the AI response is received and displayed
- **THEN** the typing indicator is removed

#### Scenario: Typing indicator hidden on error
- **GIVEN** the typing indicator is visible
- **WHEN** the API returns an error
- **THEN** the typing indicator is removed
- **AND** an error message is displayed

#### Scenario: Typing indicator uses WhatsApp-style animation
- **GIVEN** the typing indicator is visible
- **WHEN** the user observes the indicator
- **THEN** it shows three dots that animate sequentially with a bounce effect
