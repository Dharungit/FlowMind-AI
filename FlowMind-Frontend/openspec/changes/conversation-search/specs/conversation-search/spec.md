## ADDED Requirements

### Requirement: Search conversations by text query
Feature: Conversation search
  Rule: The search modal provides an interface for searching conversations by content

  #### Scenario: User opens the search modal from the sidebar
  - **GIVEN** the sidebar is visible
  - **WHEN** the user clicks the search button below the "New Chat" button
  - **THEN** a search modal opens
  - **AND** the input field is focused
  - **AND** the placeholder text reads "Search chats"

  #### Scenario: Initial blank state before any input
  - **GIVEN** the search modal is open
  - **AND** the user has not typed anything
  - **THEN** the results area shows a search icon with the text "Search your conversations"
  - **AND** no API call is made

  #### Scenario: Debounced search fires after typing
  - **GIVEN** the search modal is open
  - **WHEN** the user types "prisma" in the search input
  - **THEN** a loading skeleton is displayed while the request is in flight
  - **AND** the API is called with query parameter `q=prisma`
  - **AND** the API is not called until 300ms after the user stops typing

  #### Scenario: Minimum query length before search
  - **GIVEN** the search modal is open
  - **WHEN** the user types "a" in the search input
  - **THEN** no API call is made
  - **AND** the results area remains in the initial blank state

  #### Scenario: Results are displayed after successful search
  - **GIVEN** the search modal is open
  - **AND** the user has typed "prisma"
  - **WHEN** the API returns matching results
  - **THEN** the total result count is shown at the top of the results area
  - **AND** each result shows the conversation title in semibold text
  - **AND** each result shows the matched text below the title
  - **AND** each result is clickable with a hover highlight effect

  #### Scenario: No results found
  - **GIVEN** the search modal is open
  - **AND** the user has typed a query
  - **WHEN** the API returns an empty results array
  - **THEN** a message icon is displayed
  - **AND** the text "No results found" is shown
  - **AND** a hint to try different keywords is displayed

  #### Scenario: API error during search
  - **GIVEN** the search modal is open
  - **AND** the user has typed a query
  - **WHEN** the API request fails
  - **THEN** a sonner toast with the message "Search failed. Please try again." is shown
  - **AND** error text in red is displayed in the results area

  #### Scenario: Clear button clears input and resets to blank state
  - **GIVEN** the search modal is open
  - **AND** the user has typed "prisma" in the search input
  - **WHEN** the user clicks the clear (X) button on the right side of the input
  - **THEN** the input value is cleared
  - **AND** the results area returns to the initial blank state
  - **AND** no API call is made

  #### Scenario: Clicking a result navigates to the conversation
  - **GIVEN** the search modal is open
  - **AND** search results are displayed
  - **WHEN** the user clicks on a result
  - **THEN** the browser navigates to `/c/{conversation_id}`
  - **AND** the conversation is set as active
  - **AND** the search modal closes

  #### Scenario: Date is shown on result hover
  - **GIVEN** the search modal is open
  - **AND** search results are displayed
  - **WHEN** the user hovers over a result
  - **THEN** the updated date is shown on the right side of the title row
  - **AND** the date format is "Today" for today, "Yesterday" for yesterday, or "June 12" for older dates
  - **AND** the date has no background and does not overlap the title text

  #### Scenario: Scrollable results for long result lists
  - **GIVEN** the search modal is open
  - **AND** the API returns more results than fit in the visible area
  - **WHEN** the user scrolls within the results area
  - **THEN** the input field remains fixed at the top of the modal
  - **AND** the results scroll independently

## MODIFIED Requirements

*(none)*

## REMOVED Requirements

*(none)*
