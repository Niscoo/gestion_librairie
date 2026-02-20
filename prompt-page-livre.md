# PROMPT D'ARCHITECTURE ET DESIGN : PAGE "DÉTAILS DU LIVRE"

**Rôle demandé :** Agis en tant qu'Expert UX/UI et Développeur Senior spécialisé dans le e-commerce culturel (livres). 

**Mission :** Concevoir et structurer la page "Détails du Livre" (Product Detail Page) pour une nouvelle librairie en ligne. La page doit maximiser la conversion, offrir une expérience de lecture immersive dès la visite, et surpasser les standards de l'industrie.

---

## 1. Contexte et Objectifs
* **Produit :** Un livre physique ou numérique.
* **Cible :** Lecteurs passionnés, acheteurs de cadeaux, étudiants.
* **Objectif Principal :** Ajout au panier immédiat.
* **Objectif Secondaire :** Vente croisée (Cross-selling) et engagement (Avis, Inscription Newsletter).

---

## 2. Structure Visuelle et Contenu (Wireframe)

### 2.1. Above the Fold (Zone visible sans scroller)
* **Fil d'Ariane (Breadcrumb) :** Accueil > Genre > Sous-genre > Titre du livre.
* **Bloc Image (Gauche) :** * Couverture en haute définition.
  * Badges flottants dynamiques (ex: "Coup de ❤️ du libraire", "Prix Goncourt", "Meilleure vente").
  * Option "Feuilleter l'extrait" (bouton superposé à l'image).
* **Bloc Informations Central (Milieu) :**
  * **Titre (H1) :** Titre de l'œuvre.
  * **Sous-titre :** Nom de la série et Tome (cliquable pour voir toute la série).
  * **Auteur(s) :** Nom cliquable (H2 ou balise forte).
  * **Avis :** Étoiles cliquables amenant vers la section commentaires.
  * **Formats & Prix :** Boutons radio ou tuiles cliquables pour choisir le format (Poche : 8,90€ | Broché : 22,00€ | Ebook : 14,99€).
* **Bloc d'Action (Droite / Sticky sur Mobile) :**
  * Prix affiché en grand.
  * Statut du stock dynamique (ex: "En stock - Expédié sous 24h" en vert, ou "Plus que 2 exemplaires" en orange).
  * Sélecteur de quantité.
  * Bouton "Ajouter au Panier" (Call To Action principal, couleur contrastée).
  * Bouton "Ajouter à la liste d'envies" (icône cœur).

### 2.2. Below the Fold (En scrollant)
* **Section "Le Mot du Libraire" (Différenciateur fort) :** Un encart mis en valeur avec une courte critique rédigée par l'équipe, incluant la photo d'avatar du libraire.
* **Section "Résumé" :** Texte complet avec bouton "Lire la suite" pour ne pas surcharger la page.
* **Section "Caractéristiques Techniques" (Tableau épuré) :** * Éditeur, Collection, Date de parution.
  * EAN / ISBN.
  * Nombre de pages, Dimensions, Poids.
* **Section "À propos de l'Auteur" :**
  * Photo, courte biographie.
  * Carrousel de ses autres ouvrages.
* **Section Recommandations (Cross-selling) :**
  * "Les lecteurs ont aussi aimé..." (Algorithmique).
  * "Dans la même collection..." (Thématique).
* **Section "Avis Lecteurs" :**
  * Répartition des notes (barres de progression 5 à 1 étoile).
  * Filtres (Avis avec spoilers cachés, Achats vérifiés).

---

## 3. Spécifications Techniques & UI
* **Design System :** Utiliser des couleurs douces (fond blanc cassé/crème pour rappeler le papier) et une typographie à empattement (Serif) pour les titres afin d'évoquer la littérature, associée à une police Sans-Serif pour les textes courants.
* **Accessibilité (a11y) :** Contrastes validés WCAG, balises `alt` sur toutes les images.
* **Mobile First :** Le bloc "Ajouter au panier" doit rester accroché en bas de l'écran (Sticky Bottom) sur smartphone.
* **SEO :** Implémentation du balisage Schema.org/Book et Schema.org/Product.

---

**Livrable attendu :** Rédige le code HTML sémantique et les classes CSS (utiliser Tailwind CSS de préférence) pour construire la maquette de cette page.