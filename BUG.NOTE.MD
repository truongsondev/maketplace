# Feature Context Notes

- Product detail recommendation shelf now needs to blend two sources: AI similarity and same-category fallback.
- Cart recommendation shelf now needs to blend AI/cart-affinity candidates with same-category fallback from items currently in cart.
- Recommendation UI should keep contextual titles visible and show why an item is being suggested, instead of rendering a generic shelf with no explanation.
- Clean architecture reference for this work remains `server/src/module/auth` and the existing recommendation module wiring under `server/src/module/recommendation`.
