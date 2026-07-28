# Source Brief — Owner Requirements (verbatim enumerations)

> This file preserves the **concrete lists** from the original owner brief so no requirement is lost
> in translation. It is the requirements input; [`conventions.md`](conventions.md) is the binding
> technical contract; `product-requirements.md` is the analysed output.
> Nothing here may be dropped without an explicit entry in `product-requirements.md` §"Out of scope".

---

## B1. Owner capabilities (the 16 things the system must let an owner do)

Manage guest house information · manage rooms and room types · check room availability ·
create and manage reservations · register guests · handle check-in and check-out ·
track deposits and payments · generate invoices and receipts · manage housekeeping ·
manage maintenance · track income and expenses · manage staff and permissions ·
view dashboards and reports · receive operational notifications · use the system on desktop and
mobile browsers · prepare the application for future PWA installation · run and test everything
locally.

Simple enough for a small guest house, structured to support multiple properties later.

## B2. Users

Primary: **Guest house owner**.
Also supported: Property manager · Receptionist · Accountant · Housekeeping staff · Maintenance staff.
Roles: Owner · Manager · Receptionist · Accountant · Housekeeping Staff · Maintenance Staff ·
Read-Only User.

## B3. Local-only constraints

Run frontend, backend and PostgreSQL locally · store uploaded files locally · local env vars ·
local test data · local email **simulation** · local browser notifications · localhost URLs.

Forbidden now (roadmap only): Docker · Docker Compose · Kubernetes · Nginx · GitHub Actions ·
GitLab CI · cloud databases · cloud storage · AWS · Azure · Google Cloud · DigitalOcean · VPS ·
production domains · SSL certificates · production monitoring · production backup services ·
production deployment scripts. Architecture must stay *ready* for them.

## B4. Local file storage

Directory `guesthouse-api/uploads/`. Uploads: guest profile images · passport images ·
identification documents · room images · expense receipts · maintenance photos ·
housekeeping photos · property logo. A **file-storage abstraction** must allow later swap to cloud.

## B5. Navigation modules (16, in this order)

1. Dashboard 2. Reservations 3. Calendar 4. Rooms 5. Guests 6. Check-In 7. In-House Guests
8. Check-Out 9. Payments 10. Housekeeping 11. Maintenance 12. Expenses 13. Staff 14. Reports
15. Notifications 16. Settings

Mobile bottom nav: Dashboard · Reservations · Calendar · Guests · More.

## B6. Authentication features

Login · logout · forgot password · reset password · change password · remember me ·
access token · refresh token · session expiration · account lockout · user profile · last login ·
login history · logout from all sessions.

Local password reset: generate token, **log the reset URL to the backend console**, optionally show
it in a local development email screen. Never present in a future production profile.

## B7. Owner onboarding steps (14)

1. Create owner account 2. Enter guest house information 3. Configure address 4. Configure timezone
5. Configure currency 6. Configure check-in time 7. Configure check-out time 8. Add room types
9. Add rooms 10. Configure taxes 11. Configure payment methods 12. Add staff 13. Review setup
14. Open dashboard. Show setup progress; optional steps skippable and completable later.

## B8. Property fields

Property name · property code · logo · cover image · description · phone number · email · website ·
country · province · city · address · postal code · latitude · longitude · check-in time ·
check-out time · currency · timezone · tax identification number · business registration number ·
invoice information · terms and conditions · cancellation policy · house rules · Wi-Fi name ·
Wi-Fi password · emergency contact · active status.

`property_id` must be present in business tables even though release 1 serves one property.

## B9. Room type

Examples: Single Room · Double Room · Twin Room · Family Room · Deluxe Room · Dormitory Room.

Fields: name · code · description · base price · maximum adults · maximum children · bed count ·
bed type · room size · amenities · images · extra-bed price · extra-person price · cleaning fee ·
default deposit · active status · sort order.

Amenities (seed set, custom allowed): air conditioning · fan · private bathroom · shared bathroom ·
television · refrigerator · Wi-Fi · hot water · balcony · kitchen · desk · wardrobe · parking ·
breakfast · towels · toiletries.

## B10. Room

Fields: room number · room name · room type · floor · building · maximum occupancy ·
operational status · housekeeping status · maintenance status · notes · images · active status.

Statuses named by the owner: Available · Reserved · Occupied · Dirty · Cleaning · Inspected ·
Out of Service · Under Maintenance · Blocked.

Features: create · edit · deactivate · bulk-create rooms · bulk-update room status · block room ·
unblock room · transfer guest to another room · view room history · view room calendar ·
view room status board. Room numbers unique within a property.

## B11. Availability engine

Inputs: check-in date · check-out date · adults · children · number of rooms · room type ·
amenities · price range.

Must consider: confirmed reservations · pending reservations (per configuration) · checked-in
guests · room blocks · maintenance periods · out-of-service rooms · room capacity · arrival and
departure dates · cancelled reservations · no-show reservations.

Prevent double bookings with backend validation **and** database transactions. Never trust the
frontend result.

## B12. Reservation

Sources: Walk-in · Phone · Website · Facebook · Telegram · WhatsApp · Agoda · Booking.com ·
Airbnb · Travel agent · Corporate · Other.

Statuses: Draft · Pending · Confirmed · Checked In · Checked Out · Cancelled · No Show ·
Waiting List.

Fields: reservation number · property · main guest · room type · assigned room · arrival date ·
departure date · number of nights · adults · children · rate per night · discount · tax ·
service charge · additional fees · deposit required · deposit paid · total amount · paid amount ·
remaining balance · reservation source · external booking reference · special requests ·
internal notes · expected arrival time · expected departure time · payment status ·
reservation status · created by · created date · updated date.

Features: create · edit · copy · extend stay · shorten stay · assign room · change room ·
change room type · add multiple rooms · add additional guests · add charges · add notes ·
upload documents · cancel · mark no-show · print confirmation · generate confirmation PDF ·
view reservation history. Auto-generated number `RSV-2026-000001`.

## B13. Reservation calendar

Views: daily · weekly · monthly · room timeline. Timeline = rooms vertical, dates horizontal,
reservation bars, guest names, reservation status, payment status, room blocks, maintenance blocks.

Features: click reservation to open details · filter by room type · filter by status · Today button ·
previous/next navigation · colour-coded status · drag reservation to another room · resize
reservation to change stay dates.

Before accepting a drag/resize: validate availability · recalculate price · show confirmation
dialog · save through backend transaction · log the change.

## B14. Guest

Fields: guest number · first name · last name · full name · gender · date of birth · nationality ·
phone number · email · address · city · country · identification type · identification number ·
passport number · passport expiry date · visa number · visa expiry date · company · tax number ·
preferred language · notes · tags · VIP status · blacklist status · emergency contact ·
profile photo · identification images.

Features: create · edit · search · detect potential duplicates · merge duplicates ·
view stay history · view reservation history · view payment history · view outstanding balance ·
add preferences · add internal notes · mark as VIP · add to blacklist · upload documents ·
anonymize guest information · deactivate guest profile.

Preferences: preferred room type · preferred floor · bed preference · smoking preference ·
food restrictions · accessibility requirements. Sensitive info gated by permission.

## B15. Check-in workflow (12 steps)

1. Find reservation 2. Confirm guest information 3. Add accompanying guests 4. Upload or verify
identification 5. Confirm room 6. Confirm arrival and departure dates 7. Review charges
8. Collect deposit or payment 9. Accept house rules 10. Capture signature 11. Record key number
12. Complete check-in.

Features: reservation check-in · walk-in check-in · early check-in · group check-in ·
partial group check-in · add accompanying guests · record vehicle plate · add check-in notes ·
print guest registration form · print receipt.

Blocked when: room occupied · room blocked · room under maintenance · room out of service ·
room dirty (unless authorized override) · required deposit rules unsatisfied.

Every override records: reason · authorized user · timestamp · audit log.

## B16. In-house guest management

Display: guest name · room · check-in date · planned check-out date · remaining nights · balance ·
payment status · housekeeping status · special requests.

Actions: add charge · record payment · extend stay · shorten stay · change room · add guest ·
remove guest · add note · request cleaning · report maintenance · print folio · check out.

## B17. Room change workflow (11 steps)

1. Select current stay 2. Select transfer date 3. Select new room 4. Check availability
5. Calculate price difference 6. Confirm additional charge or credit 7. Update reservation
8. Update current room status 9. Update new room status 10. Create housekeeping task for old room
11. Record transfer history. Must be one database transaction; never leave a guest in two rooms.

## B18. Stay extension workflow (10 steps)

1. Select new departure date 2. Check room availability 3. Recalculate room charges
4. Recalculate taxes and service charges 5. Show price difference 6. Collect additional deposit when
required 7. Confirm extension 8. Update reservation 9. Update housekeeping schedule 10. Record
history.

## B19. Check-out workflow (18 steps)

1. Open in-house guest 2. Review stay information 3. Review room charges 4. Review additional
services 5. Review discounts 6. Review taxes 7. Review payments 8. Calculate balance 9. Record
final payment or refund 10. Return deposit 11. Record key return 12. Record room condition
13. Add checkout note 14. Generate invoice 15. Generate receipt 16. Complete checkout 17. Mark room
dirty 18. Create housekeeping task.

Variants: normal · early · late · partial · group · express checkout · deposit refund ·
deposit deduction · outstanding balance with authorization.

After checkout: reservation = Checked Out · room = Dirty · housekeeping task created · final folio
locked · financial transactions recorded · audit log created.

## B20. Pricing & rates

Base room rate · seasonal price · weekend price · holiday price · date-specific price ·
long-stay discount · weekly rate · monthly rate · extra-person charge · extra-bed charge ·
child pricing · corporate rate · travel agent rate · promotional rate · last-minute rate ·
manual price override · minimum stay · maximum stay · closed to arrival · closed to departure ·
stop-sell date.

Rate calendar with bulk updates by: room type · date range · day of week · fixed price ·
fixed increase · percentage increase · percentage decrease. Record rate-change history.

## B21. Additional services

Breakfast · laundry · airport pickup · motorbike rental · extra bed · minibar · food · drinks ·
late checkout · early check-in · tour package · damage charge · key replacement.

Fields: name · category · description · price · cost · taxable · unit · active status ·
inventory tracking status. Chargeable to: reservation · guest stay · room · direct sale.

## B22. Payments

Methods: cash · credit card · debit card · bank transfer · QR payment · mobile payment ·
travel agent credit · corporate credit · other.

Statuses: Unpaid · Partially Paid · Paid · Overpaid · Pending · Failed · Refunded ·
Partially Refunded · Voided.

Fields: payment number · reservation · guest · property · amount · currency · payment method ·
transaction reference · payment date · received by · notes · attachment · status.

Features: record deposit · record full payment · record partial payment · split payment ·
refund payment · void payment · add adjustment · print receipt · generate receipt PDF ·
view payment history · daily cashier summary.

Rules: `BigDecimal` only · completed payments never permanently deleted · refunds reference an
original payment · void and refund require permission · financial operations in transactions ·
important actions audited.

## B23. Documents

Reservation confirmation · guest registration form · deposit receipt · payment receipt · invoice ·
tax invoice · guest folio · refund receipt · checkout statement.

Features: automatic document number · property logo · guest details · reservation details ·
room details · itemized charges · taxes · service charges · discounts · payment summary ·
outstanding balance · terms · signature area · print · PDF generation · local file download ·
reissue · void with reason. PDFs generated locally, no external service.

## B24. Housekeeping

Statuses: Clean · Dirty · Cleaning · Inspected · Do Not Disturb · Cleaning Requested ·
Out of Service.

Task fields: task number · room · task type · assigned staff · priority · status · scheduled date ·
started time · completed time · inspected by · notes · photos · supplies used.

Task types: checkout cleaning · stay-over cleaning · deep cleaning · linen change ·
room inspection · guest request · public area cleaning.

Features: daily task list · assign · reassign · start · complete · add notes ·
upload before/after photos · report damage · report missing items · inspect room ·
bulk assign · update room status. Housekeeping staff see only assigned tasks unless permitted more.

## B25. Maintenance

Issue fields: issue number · property · room · category · description · priority · status ·
reported by · assigned to · reported date · started date · completed date · estimated cost ·
actual cost · notes · photos · vendor.

Statuses: Reported · Assigned · In Progress · Waiting for Parts · Completed · Cancelled.
Priorities: Low · Medium · High · Urgent.

Features: report issue · assign · block room · add photos · add notes · record estimated cost ·
record actual cost · complete · unblock room · view history.

## B26. Expenses

Categories: electricity · water · internet · rent · salary · supplies · cleaning · maintenance ·
food · transportation · marketing · commission · tax · insurance · other.

Fields: expense number · category · description · amount · currency · expense date · vendor ·
payment method · reference number · property · attachment · created by · approval status · notes.

Features: add · edit · submit for approval · approve · reject · upload receipt ·
recurring expense · filter · export · expense report · compare income and expenses.

## B27. Staff

Fields: staff number · full name · phone number · email · role · department · job title · address ·
start date · employment status · emergency contact · profile image · user account status.

Departments: Management · Front Desk · Housekeeping · Accounting · Maintenance · Security.

Features: add · edit · assign role · assign permissions · activate account · deactivate account ·
reset password · view activity · assign tasks. **Payroll is out of scope** (roadmap).

## B28. Dashboard

Summary cards: total rooms · available rooms · occupied rooms · reserved rooms · dirty rooms ·
out-of-service rooms · occupancy rate · today's arrivals · today's departures · in-house guests ·
outstanding payments · today's revenue · monthly revenue · monthly expenses.

Charts: revenue trend · occupancy trend · reservation source breakdown · room type performance ·
payment method breakdown · income versus expenses · cancellation rate · average daily rate ·
revenue per available room.

Widgets: today's arrivals · today's departures · upcoming reservations · current guests ·
rooms needing cleaning · open maintenance issues · outstanding balances · recent payments ·
recent activity · notifications. Date filters supported.

## B29. Reports

Operational: reservation · arrival · departure · in-house guest · room occupancy ·
room availability · cancellation · no-show · housekeeping · maintenance.

Financial: daily revenue · monthly revenue · revenue by room type · revenue by reservation source ·
payment · deposit · refund · outstanding balance · expense · profit and loss summary · tax ·
cashier summary · daily closing.

Guest: guest history · returning guests · VIP guests · guest nationality · guest country ·
blacklisted guests.

Metrics: Occupancy Rate · Average Daily Rate · Revenue Per Available Room ·
Average Length of Stay · Cancellation Rate · No-Show Rate · Repeat Guest Rate · Booking Lead Time.

Filters: date range · room type · reservation source · payment method · status · staff · property.
Local exports: CSV · Excel · PDF · Print. No cloud reporting tools.

## B30. Notifications

Events: new reservation · reservation cancelled · guest arriving today · guest checking out today ·
payment overdue · room cleaning completed · maintenance issue reported · room blocked ·
low room availability · expense awaiting approval · task assigned · stay extended · failed payment.

Implement locally: in-app notifications · browser notifications · local PWA notifications where
supported. Provider interfaces only for SMS/email/FCM/third-party push.

## B31. PWA

Web manifest · application name · icons · theme colour · splash-screen configuration ·
installable metadata · service worker · offline fallback page · basic application-shell cache ·
local network-status indicator · update notification. Test on `http://localhost:3000`.

Offline-readable: recently loaded dashboard data · recently loaded reservations · today's arrivals ·
today's departures · room statuses · local drafts · queued housekeeping updates.

Display clearly: Online · Offline · Unsynced changes · Syncing · Sync success · Sync failed.

**Never offline:** final payments · refunds · payment voids · final checkout · other sensitive
financial operations — these require a confirmed backend connection.

## B32. Search & filters

Global search: reservation number · guest name · phone number · email · room number ·
invoice number · payment number.

Every major list page: search · filters · sorting · pagination · date range · column visibility ·
saved filters · clear filters · export · mobile card view · desktop table view.

## B33. Settings sections

**Property** — profile · address · contact details · logo · check-in time · check-out time ·
house rules · Wi-Fi information.
**Rooms** — room types · rooms · amenities · bed types · room statuses.
**Reservations** — sources · cancellation policy · deposit rules · no-show rules · default status ·
booking limits.
**Pricing** — rate plans · taxes · service charges · discounts · seasonal prices · promotions.
**Payments** — payment methods · currency · receipt configuration · refund rules.
**Documents** — number formats · invoice template · receipt template · terms · footer · signature.
**Staff and Security** — users · roles · permissions · password policy · session settings.
**Notifications** — preferences · alert rules · in-app · browser.
**Localization** — language · currency · timezone · date format · time format · number format.
**Local Development** (only visible in the `local` profile) — file upload directory ·
local test email viewer · seed-data reset · local database information · development logs.

## B34. Languages

Initial: English, Khmer. Prepared: Korean, Vietnamese, Chinese, Thai. Nothing hard-coded.
Translate: navigation · buttons · forms · validation · statuses · tables · notifications · reports ·
documents. Language switchable from the user profile.

## B35. Database tables required

properties · property_settings · users · roles · permissions · user_roles · role_permissions ·
staff · room_types · rooms · amenities · room_type_amenities · room_status_history · rate_plans ·
rate_calendar · guests · guest_documents · guest_preferences · reservations · reservation_rooms ·
reservation_guests · reservation_status_history · reservation_charges · room_blocks · check_ins ·
check_outs · services · service_categories · payments · payment_allocations · refunds · invoices ·
invoice_items · receipts · housekeeping_tasks · housekeeping_task_history · maintenance_issues ·
maintenance_history · expense_categories · expenses · notifications · notification_preferences ·
attachments · audit_logs · login_history · refresh_tokens · document_sequences · system_settings ·
sync_queue.

Common fields: id · property_id · created_at · created_by · updated_at · updated_by · deleted_at ·
version.

Required constraints: room number unique per property · reservation number unique ·
invoice number unique · payment number unique · staff email unique for active accounts ·
active reservations must not overlap for the same room · check-out date after check-in date ·
monetary values not negative unless explicitly permitted · refund total not exceeding refundable
payment balance.

## B36. The 25 core business rules

1. A room cannot have overlapping active reservations.
2. Cancelled reservations must stop blocking room availability.
3. Checked-in reservations block the assigned room.
4. Blocked rooms cannot be reserved.
5. Maintenance rooms cannot be reserved.
6. Check-in cannot happen before the allowed date without authorization.
7. Check-in cannot happen when the room is occupied.
8. A dirty room cannot be assigned without authorized override.
9. Checkout marks the room dirty.
10. Checkout creates a housekeeping task.
11. Reservation totals must be calculated on the backend.
12. Payment totals must be calculated on the backend.
13. Completed payments cannot be permanently deleted.
14. Refunds must reference original payments.
15. Financial records should use reversal, refund, or void operations.
16. Room transfer operations must use database transactions.
17. Reservation changes must use optimistic locking.
18. Currency calculations must use decimal-safe types.
19. Dates must use the property timezone.
20. Database timestamps should be stored consistently.
21. Sensitive guest data requires permission.
22. Every important business action must be audited.
23. Staff can access only authorized modules and properties.
24. Deleted master records should normally use soft deletion.
25. Financial documents should remain immutable after finalization.

## B37. Audit log

Record: login · logout · failed login · password change · user creation · user deactivation ·
role change · permission change · reservation creation · reservation update ·
reservation cancellation · check-in · check-out · room change · stay extension · payment creation ·
payment void · refund · invoice issue · expense creation · expense approval · room block ·
room unblock · maintenance completion · guest information update · settings change · report export.

Fields: user · action · module · entity type · entity ID · previous value · new value · IP address ·
user agent · timestamp · property · reason.

## B38. Error cases to handle

Room no longer available · reservation changed by another user · guest already exists ·
payment failed · invalid refund amount · invalid date range · file upload failed · file too large ·
unsupported file type · permission denied · session expired · database connection failed ·
backend unavailable · internet connection lost · sync conflict · checkout balance unpaid.

UI treatments: inline validation · toast messages · error alerts · retry buttons · error pages ·
confirmation dialogs · conflict-resolution dialogs. Never show raw stack traces.

## B39. Testing scope

Backend: unit · repository · service · controller · security · integration · Flyway migration tests.
Local test DB `guesthouse_test_db`. **No Testcontainers initially** (Docker excluded).

Frontend: component · form validation · hook · permission · API client · responsive layout tests.

E2E (Playwright), 24 scenarios: 1 login · 2 owner onboarding · 3 property setup · 4 room type
creation · 5 room creation · 6 reservation creation · 7 double-booking prevention · 8 walk-in
check-in · 9 reservation check-in · 10 add guest charge · 11 record deposit · 12 record partial
payment · 13 extend stay · 14 change room · 15 checkout · 16 invoice generation · 17 housekeeping
completion · 18 maintenance block · 19 expense creation · 20 role permission restriction ·
21 offline draft · 22 session expiration · 23 local PDF download · 24 report export.

## B40. Seed data

One guest house · 6 room types · 20 rooms · 7 user roles · 10 staff users · 50 guests ·
30 reservations · sample payments · sample invoices · sample expenses · sample housekeeping tasks ·
sample maintenance issues · sample notifications.

Demo accounts for: Owner · Manager · Receptionist · Accountant · Housekeeping · Maintenance ·
Read-only. Credentials documented as **local-development only**. Safe local reset required.

## B41. Local data reset

Local-only reset (Maven profile / dev-only endpoint / local SQL script / CommandLineRunner) that:
works only in the `local` profile · requires confirmation · never exists in a future production
profile · recreates seed data · clears local uploaded test files when selected.

## B42. Performance

Fast page loading · pagination · indexed queries · lazy loading · image optimization ·
server-side filtering · query caching · reduced API calls · efficient dashboard queries ·
database connection pooling. Never load all reservations / guests / payments / expenses /
audit logs — paginated APIs only.

## B43. Required documentation files

```
README.md
docs/product-requirements.md      docs/architecture.md         docs/database-design.md
docs/er-diagram.md                docs/api-design.md           docs/permission-matrix.md
docs/local-setup.md               docs/local-database-setup.md docs/frontend-setup.md
docs/backend-setup.md             docs/testing-guide.md        docs/pwa-guide.md
docs/troubleshooting.md           docs/future-deployment-roadmap.md
```

Mermaid diagrams required for: system architecture · ER diagram · reservation workflow ·
check-in workflow · room-change workflow · checkout workflow · payment workflow ·
housekeeping workflow · local PWA synchronization workflow.

## B44. Development phases

1. Planning and architecture 2. Local project setup 3. Authentication and authorization
4. Property and settings 5. Rooms and rates 6. Guests and reservations 7. Front desk
8. Payments and documents 9. Operations 10. Expenses and reports 11. PWA and mobile
12. Testing and local stabilization. **No deployment phase.**

Per phase: explain the goal · list files to create · list files to modify · implement backend ·
implement frontend · add Flyway migrations · add validation · add permission checks · add tests ·
give exact local run commands · give acceptance criteria · verify before moving on.

## B45. Design requirements

Clean · professional · friendly · simple · premium · mobile-first · easy for non-technical owners.

Use: neutral page backgrounds · white cards · rounded corners · clear spacing ·
strong visual hierarchy · status badges · simple charts · large touch-friendly actions ·
responsive tables · mobile card layouts · loading skeletons · helpful empty states ·
clear error states · confirmation dialogs · toast notifications.

Support: light mode · dark mode · desktop sidebar · tablet collapsible sidebar · mobile drawer ·
mobile bottom navigation · keyboard navigation · accessible forms · high contrast ·
proper focus states. **Not** a visually complicated ERP-style interface.

## B46. Per-page and per-form UX contract

Every page: page title · page description · main action · search · filters · loading state ·
empty state · error state · pagination · responsive mobile design.

Every form: labels · required indicators · placeholders · validation · cancel button · save button ·
loading state · success message · unsaved changes warning.

Every destructive operation: confirmation dialog · impact explanation · reason input when required ·
permission check · audit log.

Every financial operation: amount summary · payment method · confirmation ·
permission validation · backend calculation · transaction handling · audit log.

## B47. The 35 final success criteria

The local system succeeds when the owner can: 1 install required local software · 2 create the
PostgreSQL database · 3 start the Spring Boot backend · 4 start the Next.js frontend · 5 open
`http://localhost:3000` · 6 log in with a local demo account · 7 configure guest house information ·
8 create room types · 9 create rooms · 10 configure rates · 11 search room availability ·
12 create a reservation · 13 register a guest · 14 collect a deposit · 15 check in the guest ·
16 add additional charges · 17 extend the stay · 18 change the room · 19 record payments ·
20 check out the guest · 21 generate an invoice · 22 download a receipt locally · 23 create a
housekeeping task · 24 mark the room clean · 25 report a maintenance issue · 26 record an expense ·
27 view dashboard metrics · 28 generate local reports · 29 manage staff roles and permissions ·
30 test the responsive mobile view · 31 test the PWA locally · 32 run backend tests · 33 run
frontend tests · 34 run end-to-end tests · 35 reset local demo data.

## B48. Future roadmap (document only, never implement now)

Docker · Docker Compose · Nginx · HTTPS · production domain · CI/CD · cloud deployment ·
VPS deployment · cloud database · cloud file storage · automated cloud backup · real email
provider · SMS notifications · external push notification provider · online booking portal ·
Agoda integration · Booking.com integration · Airbnb integration · online payment gateway ·
multi-property billing · subscription plans · production monitoring · Kubernetes · payroll.
