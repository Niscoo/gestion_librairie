Implémente un diagramme d’état pour une commande dans une application e-commerce (livres physiques et ebooks).

États :
Panier → Commande validée → Paiement en attente →

Si paiement confirmé → Payée

Si paiement refusé → Annulée

Après "Payée" :

Si livre physique → En préparation → Expédiée → Livrée

Si ebook → Accès ebook activé

Transitions supplémentaires :

Annulation immédiate possible avant expédition

Retour accepté possible après livraison

Remboursement après annulation ou retour accepté

Implémente cela sous forme de machine à états (state machine) avec gestion propre des transitions et validation des états autorisés.