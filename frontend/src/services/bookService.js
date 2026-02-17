// Mock data avec vraies couvertures d'Open Library
const MOCK_BOOKS = [
  {
    id: 1,
    title: "Le Seigneur des Anneaux",
    author: "J.R.R. Tolkien",
    price: 25.99,
    format: "papier",
    available: true,
    stock: 5,
    cover: "https://covers.openlibrary.org/b/id/7878066-M.jpg",
    rating: 4.8,
    reviews: 245,
    category: "Fantasy",
    isNew: false,
    isBestseller: true,
    description: "L'épopée fantastique du Seigneur des Anneaux"
  },
  {
    id: 2,
    title: "1984",
    author: "George Orwell",
    price: 18.50,
    format: "ebook",
    available: true,
    stock: 100,
    cover: "https://covers.openlibrary.org/b/id/7106-M.jpg",
    rating: 4.6,
    reviews: 512,
    category: "Dystopie",
    isNew: false,
    isBestseller: true,
    description: "Un roman dystopique incontournable"
  },
  {
    id: 3,
    title: "Fondation",
    author: "Isaac Asimov",
    price: 22.00,
    format: "papier",
    available: false,
    stock: 0,
    cover: "https://covers.openlibrary.org/b/id/54872-M.jpg",
    rating: 4.7,
    reviews: 187,
    category: "Science-Fiction",
    isNew: false,
    isBestseller: true,
    description: "La série Fondation de Asimov"
  },
  {
    id: 4,
    title: "Dune",
    author: "Frank Herbert",
    price: 29.99,
    format: "papier",
    available: true,
    stock: 3,
    cover: "https://covers.openlibrary.org/b/id/7741-M.jpg",
    rating: 4.9,
    reviews: 678,
    category: "Science-Fiction",
    isNew: false,
    isBestseller: true,
    description: "Un chef-d'œuvre de la science-fiction"
  },
  {
    id: 5,
    title: "Le Hobbit",
    author: "J.R.R. Tolkien",
    price: 16.99,
    format: "papier",
    available: true,
    stock: 8,
    cover: "https://covers.openlibrary.org/b/id/6005249-M.jpg",
    rating: 4.7,
    reviews: 423,
    category: "Fantasy",
    isNew: false,
    isBestseller: false,
    description: "L'aventure du hobbit Bilbo"
  },
  {
    id: 6,
    title: "Les Misérables",
    author: "Victor Hugo",
    price: 24.50,
    format: "papier",
    available: true,
    stock: 6,
    cover: "https://covers.openlibrary.org/b/id/7913-M.jpg",
    rating: 4.5,
    reviews: 334,
    category: "Classique",
    isNew: false,
    isBestseller: false,
    description: "Le roman épique de Victor Hugo"
  },
  {
    id: 7,
    title: "Neuromancien",
    author: "William Gibson",
    price: 19.99,
    format: "ebook",
    available: true,
    stock: 50,
    cover: "https://covers.openlibrary.org/b/id/27771-M.jpg",
    rating: 4.4,
    reviews: 156,
    category: "Science-Fiction",
    isNew: false,
    isBestseller: false,
    description: "Le premier roman cyberpunk"
  },
  {
    id: 8,
    title: "Sapiens",
    author: "Yuval Noah Harari",
    price: 26.00,
    format: "papier",
    available: true,
    stock: 4,
    cover: "https://covers.openlibrary.org/b/id/8262969-M.jpg",
    rating: 4.6,
    reviews: 892,
    category: "Non-Fiction",
    isNew: true,
    isBestseller: true,
    description: "Histoire de l'humanité"
  },
  {
    id: 9,
    title: "Atomic Habits",
    author: "James Clear",
    price: 21.00,
    format: "papier",
    available: false,
    stock: 0,
    cover: "https://covers.openlibrary.org/b/id/8840159-M.jpg",
    rating: 4.8,
    reviews: 1200,
    category: "Développement Personnel",
    isNew: false,
    isBestseller: true,
    description: "Les petits changements qui changent tout"
  },
  {
    id: 10,
    title: "Clean Code",
    author: "Robert C. Martin",
    price: 35.00,
    format: "papier",
    available: true,
    stock: 2,
    cover: "https://covers.openlibrary.org/b/id/7143-M.jpg",
    rating: 4.7,
    reviews: 567,
    category: "Informatique",
    isNew: false,
    isBestseller: false,
    description: "Guide pour écrire un code propre"
  },
  {
    id: 11,
    title: "Le Monde de Narnia",
    author: "C.S. Lewis",
    price: 14.99,
    format: "papier",
    available: true,
    stock: 10,
    cover: "https://covers.openlibrary.org/b/id/7945-M.jpg",
    rating: 4.3,
    reviews: 89,
    category: "Contes",
    isNew: true,
    isBestseller: false,
    description: "L'univers fantastique de Narnia"
  },
  {
    id: 12,
    title: "Harry Potter à l'école des sorciers",
    author: "J.K. Rowling",
    price: 27.50,
    format: "papier",
    available: false,
    stock: 0,
    cover: "https://covers.openlibrary.org/b/id/7778-M.jpg",
    rating: 4.8,
    reviews: 456,
    category: "Fantasy",
    isNew: false,
    isBestseller: false,
    description: "L'aventure magique de Harry Potter"
  }
];

// Service pour récupérer et filtrer les livres
export const bookService = {
  // Récupérer tous les livres avec filtres et tri
  getBooks: async (filters = {}, sort = 'popular') => {
    // Simuler un délai réseau
    await new Promise(resolve => setTimeout(resolve, 300));

    let filtered = [...MOCK_BOOKS];

    // Filtrer par format
    if (filters.format && filters.format.length > 0) {
      filtered = filtered.filter(book => filters.format.includes(book.format));
    }

    // Filtrer par disponibilité
    if (filters.availability !== null && filters.availability !== undefined) {
      filtered = filtered.filter(book => book.available === filters.availability);
    }

    // Filtrer par catégorie
    if (filters.category && filters.category.length > 0) {
      filtered = filtered.filter(book => filters.category.includes(book.category));
    }

    // Filtrer par prix
    if (filters.priceRange) {
      filtered = filtered.filter(book =>
        book.price >= filters.priceRange[0] && book.price <= filters.priceRange[1]
      );
    }

    // Trier
    filtered.sort((a, b) => {
      switch (sort) {
        case 'price-asc':
          return a.price - b.price;
        case 'price-desc':
          return b.price - a.price;
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
  }
};
