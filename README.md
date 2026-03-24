# Terraria ARPG Marketplace API

Backend system for a Diablo-inspired ARPG item marketplace built for a **Terraria mod using tModLoader**.

This project demonstrates backend architecture concepts such as modular design, concurrency control, API integration, and game-client communication.

The system allows players to browse marketplace listings, purchase items securely, and retrieve their purchases directly inside the game through an in-game mailbox.

---

# Project Motivation

ARPG games such as Diablo rely heavily on item economies built around:

- item rarity
- procedural modifiers
- player trading
- item generation systems

This project explores how such a marketplace system could be implemented using a modern backend stack.

The goal is to design a **clean, modular, and scalable backend** capable of:

- listing marketplace items
- processing purchases safely
- logging transactions
- delivering purchased items to the game client

The project also includes a **simple web interface** for interacting with the marketplace, while the Terraria mod acts as an API client responsible only for retrieving purchased items.

---

# High-Level Architecture

The system follows a **modular monolith architecture using NestJS**, organized by business domains.

This approach provides:

- clear separation of responsibilities
- easier maintainability
- lower operational complexity
- flexibility for future evolution

The system consists of three main components:

### Backend API

NestJS application responsible for business logic, authentication, marketplace management, and order processing.

### Web Client

A simple web interface used to browse and interact with the marketplace.

### Game Client (Terraria Mod)

A tModLoader mod that consumes the API and retrieves purchased items through an in-game mailbox.

---

# Core Modules

## Auth Module

Handles authentication and authorization.

Responsibilities:

- user authentication
- JWT token generation
- protected route access

---

## Users Module

Manages user data and basic account information.

Responsibilities:

- user records
- purchase ownership

---

## Items Module

Defines **item templates** available in the game.

Each template includes:

- name
- item type
- keyword array used by the mod to construct the item
- thumbnail image

These templates are used by the marketplace to generate listings.

---

## Marketplace Module

Responsible for marketplace listings.

Handles:

- item availability
- listing price
- seller information
- listing status (`available` / `sold`)

---

## Orders Module

The **most critical module in the system**.

Responsible for processing item purchases and ensuring consistency when multiple users attempt to buy the same item simultaneously.

The system uses **optimistic concurrency control** to ensure that only one purchase can succeed.

---

## Transactions Module

Stores transaction history and sales data.

Each transaction records:

- buyer
- seller
- price
- timestamp
- item snapshot

Item snapshots ensure historical consistency even if the original item template changes later.

---

## Mailbox Module

Responsible for delivering purchased items to the game client.

Workflow:

1. Player opens the mailbox item inside Terraria
2. The mod sends a request to the API
3. The API returns items that have not yet been delivered
4. The mod constructs the items in the player's inventory

This approach keeps the game client lightweight and focused only on item retrieval.

---

# Purchase Flow

Simplified purchase process:

1. Authenticated user requests purchase
2. Backend validates item availability
3. Atomic update attempt marks item as sold
4. Order is created
5. Transaction is recorded
6. Item becomes available in the player's mailbox

This process prevents multiple users from purchasing the same listing.

---

# Pagination Strategy

Marketplace item listings use pagination to avoid returning large datasets.

The initial implementation uses **limit/offset pagination**, with the possibility of migrating to **cursor-based pagination** for improved performance in larger datasets.

Example:

```GET /marketplace?limit=20&page=2```

Future improvement:

```GET /marketplace?cursor=abc123&limit=20```


---

# Deployment

The API may be deployed to a cloud platform for demonstration purposes.

Possible options include:

- Railway
- Render
- Fly.io

Test credentials may be provided for recruiters to explore the API.

---

# Project Goals

This project was built to demonstrate knowledge in:

- backend architecture
- modular system design
- concurrency control
- API integration
- scalable backend development

---

# Future Improvements

Possible future enhancements include:

- cursor-based pagination
- caching layer (Redis)
- asynchronous job processing
- analytics for marketplace activity
- improved web UI
