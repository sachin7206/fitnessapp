# Migration Guide: MongoDB to MySQL & Maven to Gradle

**Date**: February 26, 2026  
**Changes**: Database migration from MongoDB to MySQL, Build tool migration from Maven to Gradle

---

## 🔄 What Changed

### Database Migration: MongoDB → MySQL
- **From**: MongoDB (NoSQL document database)
- **To**: MySQL (Relational SQL database)
- **Reason**: More structured data, better for relational queries, widely available

### Build Tool Migration: Maven → Gradle
- **From**: Maven (pom.xml)
- **To**: Gradle (build.gradle)
- **Reason**: Faster builds, more flexible, modern tooling

---

## 📊 Database Schema Changes

### User Data Structure

**Before (MongoDB - Document)**:
```json
{
  "_id": "ObjectId()",
  "email": "user@example.com",
  "profile": {
    "firstName": "John",
    "healthConditions": ["diabetes"]
  }
}
```

**After (MySQL - Tables)**:
```sql
-- Main users table
CREATE TABLE users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) UNIQUE,
  first_name VARCHAR(100),
  ...
);

-- Related data in separate tables
CREATE TABLE user_health_conditions (
  user_id BIGINT,
  condition_name VARCHAR(100)
);
```

---

## 🔧 Setup Instructions

### Prerequisites

1. **Install MySQL**:
```bash
brew install mysql
brew services start mysql

# Secure installation (set root password)
mysql_secure_installation
```

2. **Java 17** (already installed)
```bash
java -version  # Should show 17+
```

3. **Gradle** (wrapper included, but optionally install):
```bash
brew install gradle  # Optional
```

### Database Setup

1. **Start MySQL**:
```bash
brew services start mysql
```

2. **Create Database** (auto-created by app, but you can do manually):
```bash
mysql -u root -p
CREATE DATABASE fitnessapp;
EXIT;
```

3. **Configure Database Connection**:

Edit `backend/src/main/resources/application.properties`:
```properties
# Update these if needed
spring.datasource.url=jdbc:mysql://localhost:3306/fitnessapp?createDatabaseIfNotExist=true
spring.datasource.username=root
spring.datasource.password=your_mysql_password_here
```

### Build & Run

1. **Navigate to backend**:
```bash
cd backend
```

2. **Run with Gradle**:
```bash
./gradlew bootRun
```

That's it! The app will:
- Connect to MySQL
- Auto-create tables (via JPA/Hibernate)
- Seed sample exercise data

---

## 📝 Code Changes Summary

### Models (Entities)

**Before (MongoDB)**:
```java
@Document(collection = "users")
public class User {
    @Id
    private String id;  // MongoDB ObjectId
    
    @Indexed(unique = true)
    private String email;
}
```

**After (MySQL/JPA)**:
```java
@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;  // Auto-increment Long
    
    @Column(unique = true)
    private String email;
}
```

### Repositories

**Before (MongoDB)**:
```java
public interface UserRepository extends MongoRepository<User, String> {
    // String ID type
}
```

**After (MySQL/JPA)**:
```java
public interface UserRepository extends JpaRepository<User, Long> {
    // Long ID type
}
```

### Build Configuration

**Before (Maven - pom.xml)**:
```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-mongodb</artifactId>
</dependency>
```

**After (Gradle - build.gradle)**:
```groovy
dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-data-jpa'
    runtimeOnly 'com.mysql:mysql-connector-j'
}
```

---

## 🎯 Key Differences

### Data Modeling

| Aspect | MongoDB | MySQL |
|--------|---------|-------|
| **Structure** | Flexible documents | Fixed schema tables |
| **Relationships** | Embedded documents | Foreign keys & joins |
| **ID Type** | ObjectId (String) | Long (Auto-increment) |
| **Arrays** | Native support | Separate junction tables |
| **Maps** | Native support | Element collections |

### Query Differences

**MongoDB**:
```java
// Find by nested field
userRepository.findByProfileFirstName("John");
```

**MySQL/JPA**:
```java
// Same query, JPA handles the join
userRepository.findByProfileFirstName("John");
```

### Build Tool Differences

| Feature | Maven | Gradle |
|---------|-------|--------|
| **Config File** | pom.xml | build.gradle |
| **Build Speed** | Slower | Faster (incremental) |
| **Syntax** | XML | Groovy DSL |
| **Wrapper Command** | ./mvnw | ./gradlew |
| **Run Command** | spring-boot:run | bootRun |

---

## ✅ Migration Checklist

### Database Migration
- [x] Install MySQL
- [x] Start MySQL service
- [x] Update application.properties with MySQL config
- [x] Convert models from @Document to @Entity
- [x] Change ID types from String to Long
- [x] Convert MongoRepository to JpaRepository
- [x] Update embedded objects to @Embeddable
- [x] Convert arrays to @ElementCollection

### Build Tool Migration  
- [x] Create build.gradle file
- [x] Add Spring Data JPA dependency
- [x] Add MySQL connector dependency
- [x] Create Gradle wrapper files
- [x] Update run commands in documentation
- [x] Update setup scripts

### Testing
- [ ] Test user registration
- [ ] Test user login
- [ ] Test profile update
- [ ] Test health metrics
- [ ] Test goals setting
- [ ] Verify exercise library loads
- [ ] Check all API endpoints work

---

## 🔍 Troubleshooting

### MySQL Connection Issues

**Problem**: "Access denied for user 'root'@'localhost'"
```bash
# Solution: Reset MySQL password
mysql.server stop
mysqld_safe --skip-grant-tables &
mysql -u root
ALTER USER 'root'@'localhost' IDENTIFIED BY 'new_password';
FLUSH PRIVILEGES;
```

**Problem**: "Database 'fitnessapp' doesn't exist"
```bash
# Solution: Database is auto-created, but you can create manually
mysql -u root -p
CREATE DATABASE fitnessapp;
```

### Gradle Issues

**Problem**: "gradlew: command not found"
```bash
# Solution: Make it executable
chmod +x gradlew
```

**Problem**: "Could not resolve dependencies"
```bash
# Solution: Clear Gradle cache
./gradlew clean --refresh-dependencies
```

### JPA/Hibernate Issues

**Problem**: "Table doesn't exist"
```properties
# Solution: Ensure auto-DDL is enabled in application.properties
spring.jpa.hibernate.ddl-auto=update
```

---

## 📚 Updated Commands Reference

### Before (MongoDB + Maven)
```bash
# Start database
brew services start mongodb-community@7.0

# Run backend
cd backend
./mvnw spring-boot:run

# Test connection
mongosh
```

### After (MySQL + Gradle)
```bash
# Start database
brew services start mysql

# Run backend
cd backend
./gradlew bootRun

# Test connection
mysql -u root -p
```

---

## 🎓 Learning Resources

### MySQL
- Official Docs: https://dev.mysql.com/doc/
- Spring Data JPA: https://spring.io/projects/spring-data-jpa

### Gradle
- Official Docs: https://docs.gradle.org/
- Spring Boot with Gradle: https://spring.io/guides/gs/gradle/

---

## 💡 Benefits of This Migration

### MySQL Benefits
✅ **ACID Compliance**: Guaranteed data consistency  
✅ **Better Joins**: Efficient relational queries  
✅ **Mature Ecosystem**: Wide tool support  
✅ **Easier Deployment**: Available on most hosting  
✅ **Structured Schema**: Better data integrity  

### Gradle Benefits
✅ **Faster Builds**: Incremental compilation  
✅ **Better Performance**: Build caching  
✅ **More Flexible**: Easier customization  
✅ **Modern Tooling**: Better IDE support  
✅ **Cleaner Syntax**: Groovy DSL vs XML  

---

## 🔄 Data Preservation

**Note**: This migration changes the database technology. If you had existing data in MongoDB, you'll need to:

1. Export from MongoDB:
```bash
mongoexport --db=fitnessapp --collection=users --out=users.json
```

2. Convert JSON to SQL (manual process or script)

3. Import to MySQL:
```bash
mysql -u root -p fitnessapp < users.sql
```

For this Month 1 foundation, we're starting fresh with MySQL, so no data migration needed.

---

## ✨ Next Steps

1. **Test the new setup**:
   ```bash
   cd backend
   ./gradlew bootRun
   ```

2. **Verify tables created**:
   ```bash
   mysql -u root -p fitnessapp
   SHOW TABLES;
   DESCRIBE users;
   ```

3. **Test API endpoints** (see docs/API_TESTING.md)

4. **Continue with Phase 2 development**!

---

**Migration Complete!** 🎉

Your fitness platform now runs on MySQL + Gradle, providing better structure, performance, and compatibility for future growth.

