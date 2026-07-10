# Database Schema

Entity-relationship diagrams for the pland PostgreSQL database, generated from [`prisma/schema.prisma`](../prisma/schema.prisma).

Prisma creates implicit join tables for many-to-many relations (e.g. `_ProductCategories`, `_DiscountAssignedUsers`).

---

## Users & Auth

```mermaid
erDiagram
    User {
        int id PK
        string phone UK
        string secret
        Role role
        boolean isVip
        boolean isActive
        bigint totalSpent
        int ordersCount
    }

    Address {
        int id PK
        int userId FK
        string city
        string postal
        string address
        boolean isDefault
    }

    User ||--o{ Address : has
```

---

## Catalog

```mermaid
erDiagram
    Category {
        int id PK
        string slug UK
        int parentId FK
        Gender gender
        boolean isActive
    }

    Tag {
        int id PK
        string slug UK
        string title
    }

    Occasion {
        int id PK
        string slug UK
        string title
        boolean isActive
    }

    Product {
        int id PK
        string code UK
        string slug UK
        string title
        float weight
        int karat
        int stock
        bigint priceCache
        ProductStatus status
    }

    GoldPrice {
        int id PK
        bigint price
        datetime createdAt
    }

    Campaign {
        int id PK
        string slug UK
        string title
        boolean isActive
    }

    Category ||--o| Category : "parent / children"
    Category }o--o{ Product : "ProductCategories"
    Tag }o--o{ Product : "ProductTags"
    Occasion }o--o{ Product : "ProductOccasions"
    Campaign }o--o{ Product : "CampaignProducts"
```

---

## Cart & Wishlist

```mermaid
erDiagram
    User {
        int id PK
    }

    Cart {
        int id PK
        int userId FK UK
        int giftBagId FK
        int discountCodeId FK
    }

    CartItem {
        int id PK
        int cartId FK
        int productId FK
        int quantity
    }

    WishlistItem {
        int id PK
        int userId FK
        int productId FK
    }

    Product {
        int id PK
    }

    GiftBag {
        int id PK
        GiftBagType type
        string title
        bigint price
        int stock
    }

    DiscountCode {
        int id PK
        string code UK
        DiscountType type
        DiscountTarget target
    }

    User ||--o| Cart : owns
    Cart ||--o{ CartItem : contains
    CartItem }o--|| Product : references
    Cart }o--o| GiftBag : "optional bag"
    Cart }o--o| DiscountCode : "applied code"

    User ||--o{ WishlistItem : saves
    WishlistItem }o--|| Product : references
```

---

## Orders & Payments

```mermaid
erDiagram
    User {
        int id PK
    }

    Order {
        int id PK
        string orderNumber UK
        int userId FK
        OrderStatus status
        bigint itemsTotal
        bigint total
        int deliverySlotId FK
        int giftBagId FK
        int discountCodeId FK
    }

    OrderItem {
        int id PK
        int orderId FK
        int productId FK
        string title
        float weight
        bigint price
        int quantity
    }

    DeliverySlot {
        int id PK
        datetime date
        string fromHour
        string toHour
        int capacity
        boolean isActive
    }

    Transaction {
        int id PK
        int orderId FK UK
        PaymentMethod method
        PaymentStatus status
        bigint amount
    }

    Invoice {
        int id PK
        int orderId FK UK
        string invoiceNumber UK
        bigint total
    }

    InvoiceItem {
        int id PK
        int invoiceId FK
        string title
        float weight
        bigint total
    }

    GiftBag {
        int id PK
    }

    DiscountCode {
        int id PK
    }

    Product {
        int id PK
    }

    User ||--o{ Order : places
    Order ||--o{ OrderItem : contains
    OrderItem }o--o| Product : "snapshot ref"
    Order }o--o| DeliverySlot : "scheduled in"
    Order }o--o| GiftBag : "gift bag snapshot"
    Order }o--o| DiscountCode : "discount applied"
    Order ||--o| Transaction : "payment"
    Order ||--o| Invoice : "billing"
    Invoice ||--o{ InvoiceItem : lines
```

---

## Reviews & Discounts

```mermaid
erDiagram
    User {
        int id PK
    }

    Product {
        int id PK
    }

    Order {
        int id PK
    }

    Review {
        int id PK
        int userId FK
        int productId FK
        int orderId FK UK
        int rating
        ReviewStatus status
    }

    DiscountCode {
        int id PK
        string code UK
        DiscountType type
        int usageLimit
        boolean isActive
    }

    CouponUsage {
        int id PK
        int codeId FK
        int userId FK
        int orderId
    }

    User ||--o{ Review : writes
    Product ||--o{ Review : receives
    Order ||--o| Review : "optional review"

    User }o--o{ DiscountCode : "assigned users"
    DiscountCode ||--o{ CouponUsage : tracked
    User ||--o{ CouponUsage : redeems
    DiscountCode ||--o{ Order : "used on orders"
```

---

## CMS & Blog

```mermaid
erDiagram
    User {
        int id PK
    }

    BlogCategory {
        int id PK
        string slug UK
        string title
    }

    BlogTag {
        int id PK
        string slug UK
        string title
    }

    BlogPost {
        int id PK
        string slug UK
        string title
        PostStatus status
        int authorId FK
        int categoryId FK
    }

    Banner {
        int id PK
        string image
        BannerPosition position
        boolean isActive
    }

    Faq {
        int id PK
        string question
        string answer
        boolean isActive
    }

    TrustBadge {
        int id PK
        string title
        string image
        boolean isActive
    }

    StaticPage {
        int id PK
        string slug UK
        string title
        boolean isActive
    }

    User ||--o{ BlogPost : authors
    BlogCategory ||--o{ BlogPost : groups
    BlogTag }o--o{ BlogPost : "BlogPostTags"
```

---

## System & Logs

Standalone tables with no foreign-key relations defined in Prisma:

```mermaid
erDiagram
    SmsMessage {
        int id PK
        string phone
        SmsType type
        SmsStatus status
        int relatedId
    }

    AuditLog {
        int id PK
        int actorId
        Role actorRole
        AuditAction action
        string entity
        string entityId
        json changes
    }

    Setting {
        string key PK
        string value
    }

    GoldPrice {
        int id PK
        bigint price
        datetime createdAt
    }
```

`AuditLog.actorId` and `SmsMessage.relatedId` are stored as plain integers (no FK constraints).

---

## Full overview

High-level map of all related tables:

```mermaid
erDiagram
    User ||--o{ Address : has
    User ||--o| Cart : owns
    User ||--o{ Order : places
    User ||--o{ WishlistItem : saves
    User ||--o{ Review : writes
    User ||--o{ CouponUsage : redeems
    User }o--o{ DiscountCode : assigned
    User ||--o{ BlogPost : authors

    Category ||--o| Category : parent
    Category }o--o{ Product : categories
    Tag }o--o{ Product : tags
    Occasion }o--o{ Product : occasions
    Campaign }o--o{ Product : campaigns

    Cart ||--o{ CartItem : items
    CartItem }o--|| Product : product
    Cart }o--o| GiftBag : bag
    Cart }o--o| DiscountCode : discount
    WishlistItem }o--|| Product : product

    Order ||--o{ OrderItem : items
    OrderItem }o--o| Product : product
    Order }o--o| DeliverySlot : slot
    Order }o--o| GiftBag : bag
    Order }o--o| DiscountCode : discount
    Order ||--o| Transaction : payment
    Order ||--o| Invoice : invoice
    Order ||--o| Review : review
    Invoice ||--o{ InvoiceItem : lines

    Product ||--o{ Review : reviews
    DiscountCode ||--o{ CouponUsage : usages
    BlogCategory ||--o{ BlogPost : posts
    BlogTag }o--o{ BlogPost : tags
```

---

## Enums

| Enum | Values |
|------|--------|
| `Role` | USER, ADMIN |
| `Gender` | MALE, FEMALE, KIDS, UNISEX |
| `ProductStatus` | DRAFT, AVAILABLE, UNAVAILABLE, RESERVED, SOLD, INACTIVE |
| `OrderStatus` | PENDING, PAID, PROCESSING, SHIPPED, DELIVERED, COMPLETED, CANCELED, FAILED |
| `PaymentMethod` | ONLINE, MANUAL |
| `PaymentStatus` | PENDING, PAID, REJECTED, REFUNDED |
| `ShippingMethod` | COURIER, POST, TIPAX |
| `GiftBagType` | NORMAL, WOODEN, VIP, OCCASION |
| `DiscountType` | PERCENT, FIXED |
| `DiscountTarget` | ALL, VIP, INACTIVE, SPECIFIC |
| `BannerPosition` | HOME_SLIDER, AD_BANNER |
| `ReviewStatus` | PENDING, APPROVED, REJECTED |
| `PostStatus` | DRAFT, PUBLISHED |
| `SmsType` | OTP, ORDER, PAYMENT, SHIPPING, DELIVERY, DISCOUNT, PROMO |
| `SmsStatus` | PENDING, SENT, FAILED |
| `AuditAction` | CREATE, UPDATE, DELETE, STATUS_CHANGE, LOGIN, LOGOUT |
