import { API_ENDPOINTS } from '../config/api.js';

// Service pour récupérer et filtrer les livres depuis l'API backend
export const bookService = {
  // Convertir les données du backend au format frontend
  transformBackendBook: (backendBook) => {
    return {
      id: backendBook.isbn,
      title: backendBook.titre,
      author: backendBook.auteur,
      cover: `https://covers.openlibrary.org/b/isbn/${backendBook.isbn}-M.jpg`,
      rating: 4.5,
      reviews: 0,
      category: 'Général',
      isNew: false,
      isBestseller: false,
      description: backendBook.resume || 'Aucune description disponible',
      formats: [
        {
          type: 'papier-neuf',
          price: backendBook.prix,
          stock: backendBook.stock,
          available: backendBook.stock > 0
        }
      ]
    };
  },

  // Récupérer tous les livres depuis l'API
  getBooks: async (filters = {}, sort = 'popular') => {
    try {
      const response = await fetch(API_ENDPOINTS.books);
      if (!response.ok) throw new Error('Erreur lors de la récupération des livres');

      const result = await response.json();
      const backendBooks = result.data || result; // Support both paginated and direct responses
      let filtered = backendBooks.map(book => bookService.transformBackendBook(book));

      // Filtrer par disponibilité
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

      // Filtrer par prix
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
          case 'rating':
            return b.rating - a.rating;
          case 'popular':
          default:
            return b.reviews - a.reviews;
        }
      });

      return filtered;
    } catch (error) {
      console.error('Erreur getBooks:', error);
      return [];
    }
  },

  // Rechercher des livres
  searchBooks: async (query) => {
    try {
      const response = await fetch(API_ENDPOINTS.books);
      if (!response.ok) throw new Error('Erreur lors de la recherche');

      const result = await response.json();
      const backendBooks = result.data || result; // Support both paginated and direct responses
      const books = backendBooks.map(book => bookService.transformBackendBook(book));

      if (!query.trim()) return books;

      const lowerQuery = query.toLowerCase();
      return books.filter(book =>
        book.title.toLowerCase().includes(lowerQuery) ||
        book.author.toLowerCase().includes(lowerQuery)
      );
    } catch (error) {
      console.error('Erreur searchBooks:', error);
      return [];
    }
  },

  // Récupérer un livre par ISBN
  getBook: async (isbn) => {
    try {
      const response = await fetch(API_ENDPOINTS.books);
      if (!response.ok) throw new Error('Erreur lors de la récupération du livre');

      const result = await response.json();
      const backendBooks = result.data || result; // Support both paginated and direct responses
      const book = backendBooks.find(b => b.isbn === isbn);
      return book ? bookService.transformBackendBook(book) : null;
    } catch (error) {
      console.error('Erreur getBook:', error);
      return null;
    }
  },

  // Créer une alerte de disponibilité
  createAlert: async (bookId, email) => {
    try {
      return { success: true, message: `Alerte créée pour ${email}` };
    } catch (error) {
      console.error('Erreur createAlert:', error);
      return { success: false, message: 'Erreur lors de la création de l\'alerte' };
    }
  },

  // Ajouter au panier
  addToCart: async (bookId, quantity = 1) => {
    try {
      return { success: true, message: 'Livre ajouté au panier' };
    } catch (error) {
      console.error('Erreur addToCart:', error);
      return { success: false, message: 'Erreur lors de l\'ajout au panier' };
    }
  },

  // Obtenir les bornes de prix
  getPriceRange: async () => {
    try {
      const response = await fetch(API_ENDPOINTS.books);
      if (!response.ok) throw new Error('Erreur');

      const result = await response.json();
      const backendBooks = result.data || result; // Support both paginated and direct responses
      const prices = backendBooks.map(b => b.prix).filter(p => !isNaN(p));
      const min = prices.length ? Math.min(...prices) : 0;
      const max = prices.length ? Math.max(...prices) : 100;
      return [min, max];
    } catch (error) {
      console.error('Erreur getPriceRange:', error);
      return [0, 100];
    }
  }
};
