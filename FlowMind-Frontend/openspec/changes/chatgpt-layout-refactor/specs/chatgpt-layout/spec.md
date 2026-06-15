## ADDED Requirements

### Requirement: Viewport Scroll Prevention
The browser viewport must never scroll. All content scroll zones are explicitly delegated to child containers.

#### Scenario: Page body does not scroll
- **GIVEN** the application is loaded
- **WHEN** content exceeds the viewport height
- **THEN** the `<html>` and `<body>` elements must not scroll
- **AND** `overflow` on `<html>` and `<body>` must be `hidden`

#### Scenario: Only designated containers scroll
- **GIVEN** the application is rendered
- **WHEN** any scrollable area (sidebar or message list) is scrolled
- **THEN** the browser window must not scroll
- **AND** no other container besides the sidebar's ConversationList and the chat panel's MessageList may scroll

### Requirement: Sidebar Scroll Isolation
The sidebar must scroll independently from the chat area.

#### Scenario: Sidebar scrolls independently
- **GIVEN** the sidebar has a long conversation list
- **WHEN** the user scrolls within the sidebar
- **THEN** the chat message area must remain stationary
- **AND** only the conversation list inside the sidebar scrolls

#### Scenario: Sidebar height fills viewport
- **GIVEN** the sidebar is open
- **WHEN** the page is rendered
- **THEN** the sidebar must be exactly `100vh` tall
- **AND** the sidebar must not scroll as a whole — only its conversation list scrolls internally

#### Scenario: New Chat button stays visible
- **GIVEN** the sidebar is open
- **WHEN** the conversation list is scrolled
- **THEN** the "New Chat" button at the top must remain visible and not scroll away

### Requirement: Chat Panel Fixed Header
The header must remain fixed at the top of the chat panel.

#### Scenario: Header stays at top
- **GIVEN** the chat panel is rendered
- **WHEN** messages are scrolled
- **THEN** the header must remain at the top of the viewport
- **AND** the header must not scroll with messages

### Requirement: Message List Scroll
Only the message list scrolls within the chat panel. Scrolling messages must not affect the input, header, or sidebar.

#### Scenario: Messages scroll independently
- **GIVEN** the conversation has many messages
- **WHEN** the user scrolls through messages
- **THEN** only the message list scrolls
- **AND** the input must remain visible and stationary at the bottom
- **AND** the header must remain visible and stationary at the top
- **AND** the sidebar must not move

#### Scenario: Auto-scroll to bottom
- **GIVEN** the user is viewing recent messages (at the bottom of the message list)
- **WHEN** a new message arrives
- **THEN** the message list must auto-scroll to show the new message

#### Scenario: Manual scroll position is preserved
- **GIVEN** the user has scrolled up to view earlier messages
- **WHEN** a new message arrives
- **THEN** the scroll position must not jump to the bottom
- **AND** a "scroll to bottom" button must appear

### Requirement: Chat Input Pinned at Bottom
The chat input must remain visible at all times, pinned to the bottom of the chat panel.

#### Scenario: Input stays at bottom with long messages
- **GIVEN** the conversation has many messages
- **WHEN** messages fill the viewport
- **THEN** the input must remain visible at the bottom
- **AND** the input must not scroll with messages

#### Scenario: Input styling
- **GIVEN** the chat input is rendered
- **THEN** it must be horizontally centered with a max width
- **AND** it must have a rounded container with a subtle top border or shadow to separate it from messages
- **AND** the send button must be inside the input container

### Requirement: Responsive Sidebar
The sidebar must be always visible on desktop and collapsible as an overlay drawer on mobile.

#### Scenario: Desktop sidebar visible
- **GIVEN** the viewport width is 768px or greater
- **WHEN** the user opens the sidebar
- **THEN** the sidebar must appear at the left side of the viewport
- **AND** the sidebar content must not overflow into the message area

#### Scenario: Mobile sidebar as drawer
- **GIVEN** the viewport width is less than 768px
- **WHEN** the user opens the sidebar
- **THEN** the sidebar must appear as a fixed overlay drawer
- **AND** a backdrop overlay must cover the chat area
- **AND** the chat area must remain visible behind the backdrop

#### Scenario: No horizontal scroll
- **GIVEN** the application is rendered at any viewport width
- **WHEN** the sidebar is open or closed
- **THEN** no horizontal scrollbar must appear
