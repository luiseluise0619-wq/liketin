# Database ERD

The schema is defined in [`backend/prisma/schema.prisma`](../backend/prisma/schema.prisma).
Distance-based recommendation is computed in the application layer (Haversine);
for production scale, move it to PostGIS or a Redis geospatial index
(`user:locations`, already populated on location update).

```mermaid
erDiagram
    User ||--o{ UserPhoto : has
    User ||--o{ UserInterest : has
    User ||--|| UserSettings : has
    User ||--o{ Verification : has
    User ||--o{ Swipe : "gives (swiper)"
    User ||--o{ Swipe : "receives (swiped)"
    User ||--o{ Match : "user1"
    User ||--o{ Match : "user2"
    User ||--o{ Message : "sends"
    User ||--o{ Message : "receives"
    User ||--o{ Report : "reporter"
    User ||--o{ Report : "reported"
    User ||--o{ Block : "blocker"
    User ||--o{ Block : "blocked"
    User ||--o{ Notification : has
    User ||--o{ Story : posts
    User ||--o{ Boost : has
    Match ||--o{ Message : contains

    User {
        uuid id PK
        string email UK
        string phone_number UK
        string password_hash
        string name
        datetime birth_date
        enum gender
        enum interested_in
        json location
        enum status
        enum premium_type
        int daily_likes_count
        int super_likes_count
        boolean is_admin
    }
    UserPhoto {
        uuid id PK
        uuid user_id FK
        string url
        int order
        boolean is_main
        float ai_score
    }
    Swipe {
        uuid id PK
        uuid swiper_id FK
        uuid swiped_id FK
        enum type
        datetime created_at
    }
    Match {
        uuid id PK
        uuid user1_id FK
        uuid user2_id FK
        enum status
        datetime matched_at
    }
    Message {
        uuid id PK
        uuid match_id FK
        uuid sender_id FK
        uuid receiver_id FK
        string content
        enum type
        enum status
        datetime read_at
    }
    Report {
        uuid id PK
        uuid reporter_id FK
        uuid reported_id FK
        enum reason
        string status
    }
    Block {
        uuid id PK
        uuid blocker_id FK
        uuid blocked_id FK
    }
```

## Key constraints & indexes

| Table | Unique | Indexes |
|-------|--------|---------|
| users | email, phone_number | (gender, interested_in), status, premium_type, last_active_at, created_at |
| swipes | (swiper_id, swiped_id) | swiper_id, swiped_id, created_at |
| matches | (user1_id, user2_id) | user1_id, user2_id, status |
| messages | — | match_id, sender_id, receiver_id, created_at |
| blocks | (blocker_id, blocked_id) | blocker_id |
| user_interests | (user_id, name) | user_id |

`matches` always stores the canonical ordered pair `(min(id), max(id))` so the
unique constraint prevents duplicate matches regardless of who liked first.
