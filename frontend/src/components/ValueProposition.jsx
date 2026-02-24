import '../styles/ValueProposition.css';

function ValueProposition() {
  const features = [
    { icon: '🚀', title: 'Livraison Rapide', desc: 'En 24h chez vous' },
    { icon: '🔒', title: 'Paiement Sécurisé', desc: '100% protégé' },
    { icon: '💬', title: 'Support 24/7', desc: 'À votre écoute' },
    { icon: '🔄', title: 'Retours Gratuits', desc: '30 jours pour changer d\'avis' }
  ];

  return (
    <section className="value-proposition">
      {features.map((feature, index) => (
        <div key={index} className="value-card">
          <div className="icon">{feature.icon}</div>
          <h3>{feature.title}</h3>
          <p>{feature.desc}</p>
        </div>
      ))}
    </section>
  );
}

export default ValueProposition;
