@startuml
autonumber

actor User as U
participant Client as FE
participant "Express App" as APP
participant ProductAPI as API
participant Redis as CACHE
participant ProductController as CTL
participant GetCategoryStatsUseCase as UC
participant PrismaCategoryRepository as REPO
database "MySQL (Prisma)" as DB

U -> FE: Xem thong ke danh muc
FE -> APP: GET /api/products/categories/stats?non_empty_only=true|false
APP -> API: getCategoryStats(req)

API -> API: parse nonEmptyOnly
API -> CACHE: GET home:categories:stats:{nonEmptyOnly}

alt Cache hit
CACHE --> API: cached response
API --> FE: 200 Success (cached)
else Cache miss
CACHE --> API: null
API -> CTL: getCategoryStats({nonEmptyOnly})
CTL -> UC: execute(query)

UC -> REPO: findAllWithProductCount()
REPO -> DB: SELECT categories + \_count(products where product.isDeleted=false)
DB --> REPO: category rows + direct counts

REPO -> REPO: build childrenByParentId, directCountsById
REPO -> REPO: DFS aggregate count cho cay danh muc
REPO --> UC: Category[] with aggregated productCount

alt nonEmptyOnly = true
UC -> UC: filter category.hasProducts()
else nonEmptyOnly = false
UC -> UC: keep all categories
end

UC -> UC: map Category -> CategoryStatsResult[]
UC --> CTL: CategoryStatsResult[]
CTL --> API: CategoryStatsResult[]

API -> API: ResponseFormatter.success(...)
API -> CACHE: SETEX home:categories:stats:{nonEmptyOnly} (ttl=600)
CACHE --> API: ok
API --> FE: 200 Success
end

@enduml
