## ADDED Requirements

### Requirement: Sidebar Display

The system SHALL display a conversation sidebar on desktop viewports (>= 768px width) as a persistent panel with a fixed width of 280px alongside the main chat area.

#### Scenario: Desktop sidebar visible by default
- **GIVEN** the user is authenticated and on a desktop viewport
- **WHEN** the page loads
- **THEN** the sidebar SHALL be visible at 280px width
- **AND** the main chat area SHALL be positioned to the right of the sidebar

#### Scenario: Desktop sidebar collapse
- **GIVEN** the user is on a desktop viewport with the sidebar visible
- **WHEN** the user clicks the hamburger toggle in the header
- **THEN** the sidebar SHALL collapse with a slide animation
- **AND** the chat area SHALL expand to fill the full viewport width

#### Scenario: Desktop sidebar expand
- **GIVEN** the user is on a desktop viewport with the sidebar collapsed
- **WHEN** the user clicks the hamburger toggle in the header
- **THEN** the sidebar SHALL expand with a slide animation to 280px
- **AND** the chat area SHALL shift to the right of the sidebar

---

### Requirement: Mobile Sidebar Overlay

The system SHALL display the conversation sidebar as a full-height overlay drawer on mobile viewports (< 768px width), triggered by the hamburger toggle.

#### Scenario: Mobile sidebar opens
- **GIVEN** the user is on a mobile viewport with the sidebar hidden
- **WHEN** the user clicks the hamburger toggle
- **THEN** the sidebar SHALL slide in from the left edge as a fixed overlay
- **AND** a semi-transparent backdrop SHALL appear behind the sidebar

#### Scenario: Mobile sidebar closes via hamburger
- **GIVEN** the user is on a mobile viewport with the sidebar open
- **WHEN** the user clicks the hamburger toggle
- **THEN** the sidebar SHALL slide out to the left
- **AND** the backdrop SHALL fade out

#### Scenario: Mobile sidebar closes via backdrop tap
- **GIVEN** the user is on a mobile viewport with the sidebar open
- **WHEN** the user taps the backdrop area outside the sidebar
- **THEN** the sidebar SHALL close and slide out
- **AND** the backdrop SHALL disappear

#### Scenario: Mobile sidebar closes via Escape key
- **GIVEN** the user is on a mobile viewport with the sidebar open
- **WHEN** the user presses the Escape key
- **THEN** the sidebar SHALL close

---

### Requirement: New Chat Button

The system SHALL display a "New Chat" button in a dedicated top section of the sidebar, visually separated from the conversation list.

#### Scenario: New Chat button visible
- **GIVEN** the user is authenticated and the sidebar is open
- **WHEN** the sidebar renders
- **THEN** a "New Chat" button SHALL be displayed at the top of the sidebar
- **AND** the button SHALL include a plus icon and the text "New Chat"

#### Scenario: New Chat clears active conversation
- **GIVEN** the user has an active conversation displayed in the chat area
- **WHEN** the user clicks the "New Chat" button
- **THEN** the message thread SHALL be cleared
- **AND** no new conversation entry SHALL appear in the sidebar until a message is sent

#### Scenario: New Chat after active conversation
- **GIVEN** the user clicked "New Chat" and the message thread was cleared
- **WHEN** the user sends their first message
- **THEN** a new conversation entry SHALL be created in the sidebar with the title "New Conversation"

---

### Requirement: Conversation List

The system SHALL display a scrollable list of the user's conversations, each showing the conversation title and a relative timestamp.

#### Scenario: Conversations displayed
- **GIVEN** the user has existing conversations
- **WHEN** the sidebar renders the conversation list
- **THEN** each conversation SHALL display its title and relative timestamp
- **AND** conversations SHALL be ordered by most recently updated first

#### Scenario: Active conversation highlighted
- **GIVEN** the user has selected a conversation
- **WHEN** the conversation list renders
- **THEN** the selected conversation item SHALL have a distinct active background color
- **AND** the selected conversation title SHALL use medium font weight

#### Scenario: Empty conversation list
- **GIVEN** the user has no conversations
- **WHEN** the sidebar renders
- **THEN** an empty state message SHALL be displayed
- **AND** the message SHALL include an icon and instructional text

#### Scenario: Conversation list scrolls independently
- **GIVEN** the user has more conversations than fit in the sidebar viewport
- **WHEN** the sidebar renders
- **THEN** the conversation list SHALL be scrollable
- **AND** the "New Chat" button SHALL remain fixed at the top

---

### Requirement: Conversation Actions

The system SHALL provide rename and delete actions for each conversation in the sidebar.

#### Scenario: Action icons revealed on hover
- **GIVEN** a conversation item is displayed in the sidebar
- **WHEN** the user hovers over the item
- **THEN** edit and delete action icons SHALL appear on the item
- **AND** the item background SHALL change to the hover state

#### Scenario: Inline rename
- **GIVEN** the user hovers over a conversation item and clicks the edit icon
- **WHEN** the rename action is triggered
- **THEN** the title SHALL become an editable text input
- **AND** the input SHALL be auto-focused

#### Scenario: Confirm rename
- **GIVEN** the user has edited the conversation title in the inline input
- **WHEN** the user presses Enter
- **THEN** the new title SHALL be saved
- **AND** the inline input SHALL revert to the display title

#### Scenario: Cancel rename
- **GIVEN** the user has opened the inline rename input
- **WHEN** the user presses Escape or clicks outside the input
- **THEN** the rename SHALL be cancelled
- **AND** the original title SHALL be restored

#### Scenario: Delete with confirmation
- **GIVEN** the user hovers over a conversation item and clicks the delete icon
- **WHEN** the delete action is triggered
- **THEN** a confirmation dialog SHALL appear

#### Scenario: Confirm delete
- **GIVEN** the delete confirmation dialog is open
- **WHEN** the user clicks the "Delete" button
- **THEN** the conversation SHALL be removed from the list
- **AND** if the deleted conversation was active, the chat area SHALL be cleared

#### Scenario: Cancel delete
- **GIVEN** the delete confirmation dialog is open
- **WHEN** the user clicks "Cancel" or presses Escape
- **THEN** the dialog SHALL close
- **AND** the conversation SHALL remain in the list

---

### Requirement: Animation

The system SHALL animate sidebar open/close transitions and respect the user's reduced motion preference.

#### Scenario: Sidebar transition with animation
- **GIVEN** the user has not set a reduced motion preference
- **WHEN** the sidebar opens or closes
- **THEN** the transition SHALL animate with a 300ms ease slide

#### Scenario: Reduced motion preference respected
- **GIVEN** the user has set `prefers-reduced-motion: reduce`
- **WHEN** the sidebar opens or closes
- **THEN** the transition SHALL be instant with no animation
