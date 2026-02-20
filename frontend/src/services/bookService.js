// Mock data avec vraies couvertures d'Open Library
const MOCK_BOOKS = [
  {
    id: 1,
    title: "Le Seigneur des Anneaux",
    author: "J.R.R. Tolkien",
    cover: "https://covers.openlibrary.org/b/id/7878066-M.jpg",
    rating: 4.8,
    reviews: 245,
    category: "Fantasy",
    isNew: false,
    isBestseller: true,
    description: "L'épopée fantastique du Seigneur des Anneaux",
    formats: [
      { type: "ebook", price: 14.99, stock: 999, available: true },
      { type: "papier-neuf", price: 25.99, stock: 5, available: true },
      { type: "papier-occasion", price: 12.50, stock: 8, available: true }
    ]
  },
  {
    id: 2,
    title: "1984",
    author: "George Orwell",
    cover: "https://covers.openlibrary.org/b/id/7106-M.jpg",
    rating: 4.6,
    reviews: 512,
    category: "Dystopie",
    isNew: false,
    isBestseller: true,
    description: "Un roman dystopique incontournable",
    formats: [
      { type: "ebook", price: 12.99, stock: 999, available: true },
      { type: "papier-neuf", price: 18.50, stock: 15, available: true },
      { type: "papier-occasion", price: 8.99, stock: 12, available: true }
    ]
  },
  {
    id: 3,
    title: "Fondation",
    author: "Isaac Asimov",
    cover: "https://covers.openlibrary.org/b/id/54872-M.jpg",
    rating: 4.7,
    reviews: 187,
    category: "Science-Fiction",
    isNew: false,
    isBestseller: true,
    description: "La série Fondation de Asimov",
    formats: [
      { type: "ebook", price: 13.99, stock: 999, available: true },
      { type: "papier-neuf", price: 22.00, stock: 0, available: false },
      { type: "papier-occasion", price: 10.50, stock: 6, available: true }
    ]
  },
  {
    id: 4,
    title: "Dune",
    author: "Frank Herbert",
    cover: "https://covers.openlibrary.org/b/id/7741-M.jpg",
    rating: 4.9,
    reviews: 678,
    category: "Science-Fiction",
    isNew: false,
    isBestseller: true,
    description: "Un chef-d'œuvre de la science-fiction",
    formats: [
      { type: "ebook", price: 15.99, stock: 999, available: true },
      { type: "papier-neuf", price: 29.99, stock: 3, available: true },
      { type: "papier-occasion", price: 14.99, stock: 2, available: true }
    ]
  },
  {
    id: 5,
    title: "Le Hobbit",
    author: "J.R.R. Tolkien",
    cover: "https://covers.openlibrary.org/b/id/6005249-M.jpg",
    rating: 4.7,
    reviews: 423,
    category: "Fantasy",
    isNew: false,
    isBestseller: false,
    description: "L'aventure du hobbit Bilbo",
    formats: [
      { type: "ebook", price: 11.99, stock: 999, available: true },
      { type: "papier-neuf", price: 16.99, stock: 8, available: true },
      { type: "papier-occasion", price: 7.50, stock: 5, available: true }
    ]
  },
  {
    id: 6,
    title: "Les Misérables",
    author: "Victor Hugo",
    cover: "https://covers.openlibrary.org/b/id/7913-M.jpg",
    rating: 4.5,
    reviews: 334,
    category: "Classique",
    isNew: false,
    isBestseller: false,
    description: "Le roman épique de Victor Hugo",
    formats: [
      { type: "ebook", price: 14.99, stock: 999, available: true },
      { type: "papier-neuf", price: 24.50, stock: 6, available: true },
      { type: "papier-occasion", price: 11.99, stock: 10, available: true }
    ]
  },
  {
    id: 7,
    title: "Neuromancien",
    author: "William Gibson",
    cover: "https://covers.openlibrary.org/b/id/27771-M.jpg",
    rating: 4.4,
    reviews: 156,
    category: "Science-Fiction",
    isNew: false,
    isBestseller: false,
    description: "Le premier roman cyberpunk",
    formats: [
      { type: "ebook", price: 19.99, stock: 50, available: true },
      { type: "papier-neuf", price: 23.99, stock: 4, available: true },
      { type: "papier-occasion", price: 9.99, stock: 3, available: true }
    ]
  },
  {
    id: 8,
    title: "Sapiens",
    author: "Yuval Noah Harari",
    cover: "https://covers.openlibrary.org/b/id/8262969-M.jpg",
    rating: 4.6,
    reviews: 892,
    category: "Non-Fiction",
    isNew: true,
    isBestseller: true,
    description: "Histoire de l'humanité",
    formats: [
      { type: "ebook", price: 16.99, stock: 999, available: true },
      { type: "papier-neuf", price: 26.00, stock: 4, available: true },
      { type: "papier-occasion", price: 13.50, stock: 7, available: true }
    ]
  },
  {
    id: 9,
    title: "Atomic Habits",
    author: "James Clear",
    cover: "https://covers.openlibrary.org/b/id/8840159-M.jpg",
    rating: 4.8,
    reviews: 1200,
    category: "Développement Personnel",
    isNew: false,
    isBestseller: true,
    description: "Les petits changements qui changent tout",
    formats: [
      { type: "ebook", price: 13.99, stock: 999, available: true },
      { type: "papier-neuf", price: 21.00, stock: 0, available: false },
      { type: "papier-occasion", price: 10.50, stock: 9, available: true }
    ]
  },
  {
    id: 10,
    title: "Clean Code",
    author: "Robert C. Martin",
    cover: "https://covers.openlibrary.org/b/id/7143-M.jpg",
    rating: 4.7,
    reviews: 567,
    category: "Informatique",
    isNew: false,
    isBestseller: false,
    description: "Guide pour écrire un code propre",
    formats: [
      { type: "ebook", price: 24.99, stock: 999, available: true },
      { type: "papier-neuf", price: 35.00, stock: 2, available: true },
      { type: "papier-occasion", price: 18.00, stock: 1, available: true }
    ]
  },
  {
    id: 11,
    title: "Le Monde de Narnia",
    author: "C.S. Lewis",
    cover: "https://covers.openlibrary.org/b/id/7945-M.jpg",
    rating: 4.3,
    reviews: 89,
    category: "Contes",
    isNew: true,
    isBestseller: false,
    description: "L'univers fantastique de Narnia",
    formats: [
      { type: "ebook", price: 10.99, stock: 999, available: true },
      { type: "papier-neuf", price: 14.99, stock: 10, available: true },
      { type: "papier-occasion", price: 6.50, stock: 8, available: true }
    ]
  },
  {
    id: 12,
    title: "Harry Potter à l'école des sorciers",
    author: "J.K. Rowling",
    cover: "https://covers.openlibrary.org/b/id/7778-M.jpg",
    rating: 4.8,
    reviews: 456,
    category: "Fantasy",
    isNew: false,
    isBestseller: false,
    description: "L'aventure magique de Harry Potter",
    formats: [
      { type: "ebook", price: 15.99, stock: 999, available: true },
      { type: "papier-neuf", price: 27.50, stock: 0, available: false },
      { type: "papier-occasion", price: 12.99, stock: 11, available: true }
    ]
  }
];

// Service pour récupérer et filtrer les livres
export const bookService = {
  // Récupérer tous les livres avec filtres et tri
  getBooks: async (filters = {}, sort = 'popular') => {
    // Simuler un délai réseau
    await new Promise(resolve => setTimeout(resolve, 300));

    let filtered = [...MOCK_BOOKS];

    // Filtrer par format - un livre apparaît s'il a au moins un format demandé
    if (filters.format && filters.format.length > 0) {
      filtered = filtered.filter(book =>
        book.formats && book.formats.some(fmt => filters.format.includes(fmt.type))
      );
    }

    // Filtrer par disponibilité - un livre est disponible s'il a au moins un format disponible
    if (filters.availability !== null && filters.availability !== undefined) {
      filtered = filtered.filter(book => {
        if (filters.availability === true) {
          return book.formats && book.formats.some(fmt => fmt.available);
        } else {
          return !book.formats || !book.formats.some(fmt => fmt.available);
        }
      });
    }

    // Filtrer par catégorie
    if (filters.category && filters.category.length > 0) {
      filtered = filtered.filter(book => filters.category.includes(book.category));
    }

    // Filtrer par prix - utiliser le prix minimum disponible
    if (filters.priceRange) {
      filtered = filtered.filter(book => {
        const minPrice = book.formats && book.formats.length > 0
          ? Math.min(...book.formats.map(f => f.price))
          : 0;
        return minPrice >= filters.priceRange[0] && minPrice <= filters.priceRange[1];
      });
    }

    // Trier
    filtered.sort((a, b) => {
      const getMinPrice = (book) => {
        if (book.formats && book.formats.length > 0) {
          return Math.min(...book.formats.map(f => f.price));
        }
        return 0;
      };

      switch (sort) {
        case 'price-asc':
          return getMinPrice(a) - getMinPrice(b);
        case 'price-desc':
          return getMinPrice(b) - getMinPrice(a);
        case 'newest':
          return b.isNew - a.isNew;
        case 'rating':
          return b.rating - a.rating;
        case 'popular':
        default:
          return b.reviews - a.reviews;
      }
    });

    return filtered;
  },

  // Rechercher des livres
  searchBooks: async (query) => {
    await new Promise(resolve => setTimeout(resolve, 200));

    if (!query.trim()) return MOCK_BOOKS;

    const lowerQuery = query.toLowerCase();
    return MOCK_BOOKS.filter(book =>
      book.title.toLowerCase().includes(lowerQuery) ||
      book.author.toLowerCase().includes(lowerQuery) ||
      book.category.toLowerCase().includes(lowerQuery)
    );
  },

  // Récupérer un livre par ID
  getBook: async (id) => {
    await new Promise(resolve => setTimeout(resolve, 100));
    return MOCK_BOOKS.find(book => book.id === id);
  },

  // Créer une alerte de disponibilité
  createAlert: async (bookId, email) => {
    await new Promise(resolve => setTimeout(resolve, 200));
    return { success: true, message: `Alerte créée pour ${email}` };
  },

  // Ajouter au panier (sera complété avec le contexte panier)
  addToCart: async (bookId, quantity = 1) => {
    await new Promise(resolve => setTimeout(resolve, 150));
    return { success: true, message: 'Livre ajouté au panier' };
  },

  // Obtenir les bornes de prix (min et max) à partir des formats
  getPriceRange: async () => {
    await new Promise(resolve => setTimeout(resolve, 50));
    const prices = MOCK_BOOKS.flatMap(book =>
      (book.formats || []).map(f => typeof f.price === 'number' ? f.price : NaN)
    ).filter(p => !isNaN(p));
    const min = prices.length ? Math.min(...prices) : 0;
    const max = prices.length ? Math.max(...prices) : 100;
    return [min, max];
  }
};
