# User Service — Database Architecture

## Database: `fitnessapp_users`

### ER Diagram

```mermaid
erDiagram
    users {
        bigint id PK
        varchar(255) email UK "NOT NULL"
        varchar(255) password "NOT NULL, BCrypt"
        varchar(100) name "NOT NULL"
        varchar(100) first_name
        varchar(100) last_name
        int age
        varchar(20) gender "MALE|FEMALE|OTHER"
        varchar(20) phone
        varchar(10) language "default: en"
        varchar(20) region "NORTH|SOUTH|EAST|WEST"
        varchar(500) avatar_url
        double height
        double current_weight
        double target_weight
        varchar(20) activity_level "SEDENTARY|LIGHT|MODERATE|ACTIVE|VERY_ACTIVE"
        varchar(20) diet_type "VEGETARIAN|NON_VEGETARIAN|VEGAN|EGGETARIAN"
        timestamp created_at
        timestamp updated_at
    }

    user_roles {
        bigint user_id FK
        varchar(50) role "USER|ADMIN"
    }

    user_goals {
        bigint user_id FK
        varchar(50) goal "WEIGHT_LOSS|MUSCLE_GAIN|STAY_FIT|FLEXIBILITY|ENDURANCE"
    }

    user_health_conditions {
        bigint user_id FK
        varchar(255) condition
    }

    user_dietary_preferences {
        bigint user_id FK
        varchar(255) preference
    }

    users ||--o{ user_roles : "has"
    users ||--o{ user_goals : "has"
    users ||--o{ user_health_conditions : "has"
    users ||--o{ user_dietary_preferences : "has"
```

### Table Details

#### `users` (Primary Table)
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT | PK, AUTO_INCREMENT | Primary key |
| email | VARCHAR(255) | UNIQUE, NOT NULL | User email (login identifier) |
| password | VARCHAR(255) | NOT NULL | BCrypt hashed password |
| name | VARCHAR(100) | NOT NULL | Display name |
| first_name | VARCHAR(100) | | Profile first name |
| last_name | VARCHAR(100) | | Profile last name |
| age | INT | | User age |
| gender | VARCHAR(20) | | MALE, FEMALE, OTHER |
| phone | VARCHAR(20) | | Phone number |
| language | VARCHAR(10) | DEFAULT 'en' | i18n language code |
| region | VARCHAR(20) | | NORTH, SOUTH, EAST, WEST |
| avatar_url | VARCHAR(500) | | Profile picture URL |
| height | DOUBLE | | Height in cm |
| current_weight | DOUBLE | | Current weight in kg |
| target_weight | DOUBLE | | Target weight in kg |
| activity_level | VARCHAR(20) | | Activity level enum |
| diet_type | VARCHAR(20) | | Dietary preference |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | |
| updated_at | TIMESTAMP | ON UPDATE CURRENT_TIMESTAMP | |

#### `user_roles` (ElementCollection)
| Column | Type | Constraints |
|--------|------|-------------|
| user_id | BIGINT | FK → users.id |
| role | VARCHAR(50) | USER, ADMIN |

#### `user_goals` (ElementCollection)
| Column | Type | Constraints |
|--------|------|-------------|
| user_id | BIGINT | FK → users.id |
| goal | VARCHAR(50) | Goal enum value |

#### `user_health_conditions` (ElementCollection)
| Column | Type | Constraints |
|--------|------|-------------|
| user_id | BIGINT | FK → users.id |
| condition | VARCHAR(255) | Free text or predefined |

#### `user_dietary_preferences` (ElementCollection)
| Column | Type | Constraints |
|--------|------|-------------|
| user_id | BIGINT | FK → users.id |
| preference | VARCHAR(255) | Dietary preference |

### Indexes
- `uk_users_email` — UNIQUE on `email`
- Primary key on `id`

### Liquibase Migrations
- `db/changelog/db.changelog-master.yaml` → includes changes
- Initial schema created by JPA `hibernate.ddl-auto=update`
- Future migrations managed via Liquibase changesets

