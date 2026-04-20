# Home Team Campaign Structure

## Muc tieu

- Home section `Team` hien thi theo campaign co quan ly thu tu.
- Moi campaign dan den collection slug + query de loc san pham theo gu.
- Co the A/B test va track hieu qua theo campaign id.

## API de xuat

- Endpoint: `GET /api/common/home-team-campaigns/active`
- Response:

```json
{
  "success": true,
  "data": {
    "teamCards": [
      {
        "id": "team-jean-bat-tu",
        "title": "TEAM \"BAT TU\" (JEAN CAC LOAI)",
        "description": "Denim nguyen ban, jean sam mau va item de phoi.",
        "imageUrl": "https://...",
        "collectionSlug": "jean",
        "query": "jean denim straight fit",
        "sortOrder": 1,
        "isActive": true
      }
    ],
    "highlights": [
      {
        "id": "work-fit",
        "title": "Di lam",
        "subtitle": "Work Fit",
        "description": "Smart casual gon gang.",
        "imageUrl": "https://...",
        "ctaLabel": "Xem do di lam",
        "collectionSlug": "ao-so-mi",
        "query": "office smart casual",
        "sortOrder": 1,
        "isActive": true
      }
    ],
    "gallery": [
      {
        "id": "gallery-01",
        "imageUrl": "https://...",
        "collectionSlug": "jean",
        "query": "jean denim straight fit",
        "sortOrder": 1,
        "isActive": true
      }
    ]
  }
}
```

## Tracking de xuat

- `home_team_impression`: khi card vao viewport.
- `home_team_click`: khi user click card/highlight/gallery.
- Payload nen co: `campaignId`, `source` (`card` | `highlight` | `gallery`), `collectionSlug`, `query`.

## Trang thai hien tai

- Frontend da co mock data co cau truc tuong duong trong `client-next/lib/home-team-campaigns.ts`.
- `Team section` da dung cau truc nay va dieu huong sang collection voi query `q`.
- Collection page da doc `q` tu URL va gui len API san pham.
