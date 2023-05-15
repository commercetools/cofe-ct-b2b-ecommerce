export const fragmentCategories = `
  fragment Categories on Category {
    id
    name(locale: $locale)
    slug(locale: $locale)
    ancestors {
      id
    }
    orderHint
    parent {
      id
    }
  }
`;
