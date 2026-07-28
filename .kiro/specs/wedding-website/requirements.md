# Requirements Document

## Introduction

The Wedding Website is an elegant, dark-themed single web application that welcomes invited guests with a personalized experience. Guests arrive through text-message links that carry their identity and an access code as query parameters. Upon arrival, the site persists that identity locally so the guest sees a personalized invitation and can navigate freely across a landing page, a photo gallery, and a gift registry without losing personalization. The visual style is modern and dark with purple and lavender accents, built on Next.js with shadcn/ui, Tailwind CSS, lucide-react icons, and framer-motion animation.

## Glossary

- **Wedding_Site**: The complete client-side web application comprising the landing page, gallery, and registry.
- **Landing_Page**: The primary entry view that displays the personalized invitation and the RSVP call-to-action.
- **Gallery**: The view that displays a collection of wedding photos.
- **Registry**: The view that displays gift registry items or links to external registries.
- **Guest_Session**: The stored record of a guest's identity and access code, persisted in browser local storage.
- **Guest_Identifier**: The value supplied via the `guest` query parameter that identifies an invited guest.
- **Access_Code**: The value supplied via the `code` query parameter that authorizes personalized access.
- **RSVP_CTA**: The call-to-action control on the Landing_Page that lets a guest begin or open the RSVP action.
- **Local_Storage**: The browser `localStorage` mechanism used to persist the Guest_Session.
- **Personalized_Invitation**: The invitation content that includes the guest's name derived from the Guest_Identifier.

## Requirements

### Requirement 1: Guest Access via Link Parameters

**User Story:** As an invited guest, I want to open a texted link that carries my name and access code, so that the site recognizes me without a manual login.

#### Acceptance Criteria

1. WHEN the Wedding_Site loads with a non-empty `guest` query parameter (1 to 256 characters) and a non-empty `code` query parameter (1 to 256 characters), THE Wedding_Site SHALL read both values from the URL and complete reading within 1 second of the initial page render.
2. WHEN the Wedding_Site reads a Guest_Identifier and an Access_Code from the URL, THE Wedding_Site SHALL persist both values as a Guest_Session in Local_Storage before rendering the personalized view.
3. IF the Wedding_Site loads with a `guest` query parameter or a `code` query parameter whose value is empty or exceeds 256 characters, THEN THE Wedding_Site SHALL treat the guest as unauthorized and display the non-personalized view described in Requirement 2.
4. IF the Wedding_Site loads with a `code` query parameter that is not present in the set of valid Access_Codes, THEN THE Wedding_Site SHALL treat the guest as unauthorized and display the non-personalized view described in Requirement 2, and SHALL NOT persist a Guest_Session in Local_Storage.
5. IF the Wedding_Site loads without a `guest` query parameter or without a `code` query parameter, THEN THE Wedding_Site SHALL attempt to load an existing Guest_Session from Local_Storage.
6. IF the Wedding_Site attempts to load an existing Guest_Session from Local_Storage and no Guest_Session is present, THEN THE Wedding_Site SHALL treat the guest as unauthorized and display the non-personalized view described in Requirement 2.

### Requirement 2: Session Persistence Across Navigation

**User Story:** As an invited guest, I want my identity to persist as I move between pages, so that navigation does not break my personalized experience.

#### Acceptance Criteria

1. WHILE a Guest_Session exists in Local_Storage, THE Wedding_Site SHALL apply the stored Guest_Identifier and Access_Code to every view without requiring the query parameters again.
2. WHEN a guest navigates from one view to another view within the Wedding_Site, THE Wedding_Site SHALL retain the active Guest_Session.
3. WHEN the Wedding_Site loads with valid query parameters, where valid query parameters means both a `guest` query parameter and a `code` query parameter are present and each contains a non-empty value, that differ from an existing Guest_Session, THE Wedding_Site SHALL replace the stored Guest_Session with the new values.
4. WHEN the Wedding_Site loads with valid query parameters that match the Guest_Identifier and Access_Code of an existing Guest_Session, THE Wedding_Site SHALL retain the existing Guest_Session unchanged.
5. IF the Wedding_Site loads with partial query parameters, where only one of the `guest` query parameter or the `code` query parameter is present with a non-empty value, THEN THE Wedding_Site SHALL ignore the partial query parameters and retain any existing Guest_Session, or otherwise display a non-personalized view that omits the Personalized_Invitation.
6. IF no Guest_Session exists in Local_Storage and no valid query parameters are present, THEN THE Wedding_Site SHALL display a non-personalized view that omits the Personalized_Invitation.
7. IF a Guest_Session exists in Local_Storage but is malformed or cannot be parsed, THEN THE Wedding_Site SHALL discard the malformed Guest_Session, treat the guest as having no active Guest_Session, and display a non-personalized view that omits the Personalized_Invitation.

### Requirement 3: Personalized Landing Page

**User Story:** As an invited guest, I want a landing page that greets me by name with a warm invitation, so that I feel personally welcomed.

#### Acceptance Criteria

1. WHEN the Landing_Page renders with an active Guest_Session and a guest name is successfully derived from the Guest_Identifier, THE Landing_Page SHALL display a Personalized_Invitation that includes the guest's name.
2. WHEN the Landing_Page renders, THE Landing_Page SHALL display an RSVP_CTA that is operable via both pointer and keyboard input.
3. WHEN a guest activates the RSVP_CTA, THE Landing_Page SHALL initiate the RSVP action within 1 second of activation.
4. IF the Landing_Page renders without an active Guest_Session, THEN THE Landing_Page SHALL display a generic welcome that omits a guest name and SHALL display the RSVP_CTA.
5. IF the Landing_Page renders with an active Guest_Session but no guest name can be derived from the Guest_Identifier, THEN THE Landing_Page SHALL display a generic welcome that omits a guest name and SHALL display the RSVP_CTA.

### Requirement 4: Photo Gallery

**User Story:** As an invited guest, I want to view a gallery of the couple's photos, so that I can share in their memories.

#### Acceptance Criteria

1. WHEN the Gallery renders, THE Gallery SHALL display the collection of configured wedding photos, up to a maximum of 200 photos.
2. WHEN the Gallery renders and zero photos are configured, THE Gallery SHALL display an empty-state message indicating that no photos are available.
3. IF a photo fails to load within 10 seconds, THEN THE Gallery SHALL display a placeholder in place of that photo while preserving the display of all successfully loaded photos.
4. WHEN the Gallery renders on a viewport width of 640 pixels or less, THE Gallery SHALL arrange photos in a single-column layout.
5. WHEN the Gallery renders on a viewport width greater than 640 pixels, THE Gallery SHALL arrange photos in a grid layout of two or more columns.

### Requirement 5: Gift Registry

**User Story:** As an invited guest, I want to see the couple's gift registry, so that I can choose a gift.

#### Acceptance Criteria

1. WHEN the Registry renders and at least one registry item is configured, THE Registry SHALL display every configured registry item in the order in which the items are configured.
2. WHEN the Registry renders and no registry items are configured, THE Registry SHALL display a message indicating that no registry items are available.
3. WHEN a guest activates a registry item that links to an external destination, THE Registry SHALL open that destination in a new browser tab while preserving the current Registry tab.

### Requirement 6: Site Navigation

**User Story:** As an invited guest, I want to move between the landing page, gallery, and registry, so that I can explore the whole site.

#### Acceptance Criteria

1. WHILE any view is active, THE Wedding_Site SHALL display navigation controls that link to the Landing_Page, the Gallery, and the Registry.
2. WHEN a guest activates a navigation control, THE Wedding_Site SHALL display the corresponding view within 1 second.
3. WHILE a view is active, THE Wedding_Site SHALL visually distinguish the navigation control for the active view from the navigation controls for the inactive views.
4. IF the corresponding view fails to load after a guest activates a navigation control, THEN THE Wedding_Site SHALL display an error message indicating the requested view is unavailable and SHALL retain the currently displayed view.

### Requirement 7: Elegant Dark Visual Theme

**User Story:** As the couple, I want an elegant dark theme with purple and lavender accents, so that the site reflects the tone of our wedding.

#### Acceptance Criteria

1. THE Wedding_Site SHALL render all views using a dark background palette with purple and lavender accent colors, where all body text and accent-colored text maintain a minimum contrast ratio of 4.5:1 against their background.
2. THE Wedding_Site SHALL apply a single consistent typographic and color theme, using identical font families and the same accent color values, across the Landing_Page, the Gallery, and the Registry.
3. WHEN a guest opens or transitions between views, THE Wedding_Site SHALL apply animated transitions to view content that begin within 100 milliseconds of the transition trigger and complete within 1000 milliseconds.
4. IF the guest's system indicates a reduced-motion preference, THEN THE Wedding_Site SHALL render view transitions by displaying target content without motion animation.
5. WHEN the Wedding_Site renders on a viewport width of 640 pixels or less, THE Wedding_Site SHALL present all views in a single-column layout with no horizontal scrolling of page content.
